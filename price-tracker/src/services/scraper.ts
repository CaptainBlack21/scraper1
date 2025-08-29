import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";
import http from "http";
import https from "https";

export type ScrapeOptions = {
  etag?: string;
  lastModified?: string;
  maxRetries?: number;
  delayMsBeforeRequest?: number;
};

export type ScrapeResult = {
  title?: string;
  price?: number;
  currency?: string;
  rawPriceText?: string;
  etag?: string | null;
  lastModified?: string | null;
  notModified?: boolean;
};

export class AntiBotError extends Error {
  constructor(message = "Anti-bot sayfası tespit edildi") {
    super(message);
    this.name = "AntiBotError";
  }
}

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

const client: AxiosInstance = axios.create({
  timeout: 15000,
  httpAgent,
  httpsAgent,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
  },
  maxRedirects: 5,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, tries: number) {
  let lastErr: any;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (err?.name === "AntiBotError") throw err;
      const retryAfter = Number(err?.response?.headers?.["retry-after"]) || 0;
      const backoff =
        (retryAfter > 0 ? retryAfter * 1000 : Math.min(30000, 800 * Math.pow(2, i))) +
        Math.floor(Math.random() * 500);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

function parsePriceSmart(text: string): number | null {
  let s = text.replace(/\s+/g, " ").trim();
  s = s.replace(/[^\d.,\-]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let decimalSep: "." | "," | null = null;
  if (lastComma === -1 && lastDot === -1) decimalSep = null;
  else if (lastComma > lastDot) decimalSep = ",";
  else decimalSep = ".";
  if (decimalSep === ",") {
    s = s.replace(/\./g, "");
    s = s.replace(",", ".");
  } else if (decimalSep === ".") {
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function looksLikeAntiBot(html: string): boolean {
  const low = html.slice(0, 4000).toLowerCase();
  return (
    low.includes("robot check") ||
    low.includes("to discuss automated access") ||
    low.includes("captcha") ||
    low.includes("/errors/validatecaptcha") ||
    low.includes("enter the characters you see below")
  );
}

function extractPriceAndCurrency($: cheerio.CheerioAPI): {
  priceText?: string;
  currency?: string;
} {
  const candidates = [
    "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
    "#corePrice_feature_div .a-price .a-offscreen",
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    ".a-price .a-offscreen",
    ".a-price .a-price-whole",
  ];
  for (const sel of candidates) {
    const el = $(sel).first();
    if (el && el.length) {
      let text = el.text().trim();
      if (!text && sel.includes(".a-price-whole")) {
        const whole = $(".a-price .a-price-whole").first().text().trim();
        const frac = $(".a-price .a-price-fraction").first().text().trim();
        text = whole + (frac ? "," + frac : "");
      }
      if (text) {
        const currencyMatch = text.match(/(TL|₺|USD|\$|EUR|€|GBP|£)/i);
        const currency = currencyMatch?.[0]?.toUpperCase()?.replace("₺", "TL") ?? undefined;
        return { priceText: text, currency };
      }
    }
  }
  return {};
}

export async function scrapeAmazonProduct(
  url: string,
  opts: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const { etag, lastModified, maxRetries = 3, delayMsBeforeRequest = 0 } = opts;

  const doRequest = async () => {
    if (delayMsBeforeRequest > 0) await sleep(delayMsBeforeRequest);

    const headers: Record<string, string> = {};
    if (etag) headers["If-None-Match"] = etag;
    if (lastModified) headers["If-Modified-Since"] = lastModified;

    const res = await client.get<string>(url, {
      headers,
      responseType: "text",
      validateStatus: () => true,
    });

    if (res.status === 304) {
      return {
        notModified: true,
        etag: res.headers["etag"] ?? null,
        lastModified: res.headers["last-modified"] ?? null,
      } as ScrapeResult;
    }

    if ([429, 500, 502, 503, 504].includes(res.status)) {
      const err: any = new Error(`HTTP ${res.status}`);
      err.response = res;
      throw err;
    }

    const html = res.data || "";
    if (res.status === 200 && (looksLikeAntiBot(html) || html.length < 800)) {
      throw new AntiBotError();
    }
    if (res.status !== 200) throw new Error(`Beklenmeyen durum: HTTP ${res.status}`);

    const $ = cheerio.load(html);
    const title =
      $("#productTitle").text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim();

    const { priceText, currency } = extractPriceAndCurrency($);
    if (!priceText) throw new Error("Fiyat bulunamadı (selector'lar uyumsuz).");

    const price = parsePriceSmart(priceText);
    if (price == null || !Number.isFinite(price))
      throw new Error(`Fiyat sayıya dönüştürülemedi: "${priceText}"`);

    return {
      title,
      price,
      currency,
      rawPriceText: priceText,
      etag: res.headers["etag"] ?? null,
      lastModified: res.headers["last-modified"] ?? null,
      notModified: false,
    } as ScrapeResult;
  };

  return await withRetry(doRequest, maxRetries);
}