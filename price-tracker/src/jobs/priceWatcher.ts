import cron from "node-cron";
import nodemailer from "nodemailer";
import Product from "../models/Product";
import { scrapeAmazonProduct, AntiBotError } from "../services/scraper";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (a: number, b: number) => a + Math.floor(Math.random() * (b - a));

// ENV
const TARGET_RPS = Number(process.env.TARGET_RPS || "0.5"); // istek/sn
const perRequestMs = Math.max(200, Math.floor(1000 / TARGET_RPS));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendAlarmEmail(title: string, price: number) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_TO,
    subject: `🔔 Fiyat Alarmı: ${title}`,
    text: `${title} alarm fiyatına düştü. Şu an: ${price} TL`,
  });
}

export function startPriceWatcher() {
  // her dakika
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const minute = now.getMinutes();
    console.log(`⏱️ ${now.toISOString()} | dakika shard=${minute}`);

    const candidates = await Product.find({
      shardMinute: minute,
      $or: [{ cooldownUntil: null }, { cooldownUntil: { $lte: now } }],
    });

    candidates.sort(() => Math.random() - 0.5);
    console.log(`🎯 Bu dakika işlenecek: ${candidates.length}`);

    for (const product of candidates) {
      const t0 = Date.now();
      try {
        const res = await scrapeAmazonProduct(product.url, {
          etag: product.lastEtag || undefined,
          lastModified: product.lastModified || undefined,
        });

        if (res.notModified) {
          product.lastEtag = res.etag ?? product.lastEtag;
          product.lastModified = res.lastModified ?? product.lastModified;
          product.lastCheckedAt = new Date();
          await product.save();
        } else if (typeof res.price === "number") {
          if (res.price !== product.currentPrice) {
            product.currentPrice = res.price;
            product.priceHistory = product.priceHistory || [];
            product.priceHistory.push({ price: res.price, date: new Date() });
            if (product.priceHistory.length > 4) product.priceHistory.shift();

            if (product.alarmPrice > 0 && res.price <= product.alarmPrice) {
              try { await sendAlarmEmail(product.title ?? "Ürün", res.price); }
              catch (e: any) { console.error("📧 Mail hatası:", e?.message || e); }
            }
            console.log(`✅ ${product.title} → ${res.price}`);
          }

          product.lastEtag = res.etag ?? product.lastEtag;
          product.lastModified = res.lastModified ?? product.lastModified;
          product.lastCheckedAt = new Date();
          await product.save();
        }
      } catch (e: any) {
        if (e?.name === "AntiBotError") {
          const mins = 10 + Math.floor(Math.random() * 20);
          product.cooldownUntil = new Date(Date.now() + mins * 60 * 1000);
          await product.save();
          console.warn(`🧊 Anti-bot: ${product.title} → ${mins} dk cooldown`);
        } else {
          console.error(`❌ ${product.title} hata:`, e?.message || e);
        }
      } finally {
        const elapsed = Date.now() - t0;
        const wait = Math.max(0, perRequestMs - elapsed) + jitter(80, 420);
        await sleep(wait);
      }
    }

    console.log("✅ Dakikalık parti bitti.");
  });
}