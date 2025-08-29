import express from "express";
import Product from "../models/Product";
import { scrapeAmazonProduct } from "../services/scraper";
import type { PipelineStage } from "mongoose"; // ✅ EKLE

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const router = express.Router();

/**
 * Yeni ürün ekle
 */
router.post("/", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL gerekli." });
    }

    // URL zaten var mı kontrol et
    const existing = await Product.findOne({ url });
    if (existing) {
      return res.status(400).json({ error: "Ürün zaten mevcut." });
    }

    // Scraper çalıştır
    const { title, price } = await scrapeAmazonProduct(url);

    if (!title) {
      return res.status(400).json({ error: "Başlık bulunamadı!" });
    }
    if (price == null) {
      return res.status(400).json({ error: "Fiyat bulunamadı!" });
    }

    // MongoDB'ye kaydet
    const product = new Product({
      url,
      title,
      currentPrice: price,
      priceHistory: [{ price, date: new Date() }],
    });

    await product.save();
    res.json(product);
  } catch (err: any) {
    // Hata tipine göre mesaj
    if (typeof err?.message === "string" && err.message.includes("Fiyat bulunamadı")) {
      res.status(400).json({ error: "Fiyat bulunamadı!" });
    } else {
      res.status(500).json({ error: "Ürün eklenirken bir hata oluştu." });
    }
  }
});

/**
 * Tüm ürünleri getir — alarmı vuranlar en üstte
 */
router.get("/", async (_req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $addFields: {
          alarmHit: {
            $and: [
              { $ne: [{ $ifNull: ["$alarmPrice", null] }, null] },
              { $lte: ["$currentPrice", "$alarmPrice"] },
            ],
          },
          alarmDiff: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $ifNull: ["$alarmPrice", null] }, null] },
                  { $lte: ["$currentPrice", "$alarmPrice"] },
                ],
              },
              { $subtract: ["$alarmPrice", "$currentPrice"] },
              0,
            ],
          },
        },
      },
      { $sort: { alarmHit: -1, alarmDiff: -1, updatedAt: -1, _id: -1 } },
      { $project: { alarmHit: 0, alarmDiff: 0 } },
    ]);

    res.json(products);
  } catch {
    res.status(500).json({ error: "Ürünler getirilirken bir hata oluştu." });
  }
});

/**
 * Ürün arama (sadece title üzerinden)
 * Alarmı vuranlar en üstte, sonra alarmDiff, updatedAt, _id
 * Örnek: GET /api/products/search?q=iphone&page=1&limit=20
 */
router.get("/search", async (req, res) => {
  try {
    const { q = "", page = "1", limit = "20" } = req.query as Record<string, string>;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    if (!q.trim()) {
      return res.status(400).json({ error: "Arama terimi (q) gerekli." });
    }

    const regex = new RegExp(escapeRegex(q.trim()), "i");

    const pipeline: PipelineStage[] = [
      { $match: { title: regex } },
      {
        $addFields: {
          alarmHit: {
            $and: [
              { $ne: [{ $ifNull: ["$alarmPrice", null] }, null] },
              { $lte: ["$currentPrice", "$alarmPrice"] },
            ],
          },
          alarmDiff: {
            $cond: [
              {
                $and: [
                  { $ne: [{ $ifNull: ["$alarmPrice", null] }, null] },
                  { $lte: ["$currentPrice", "$alarmPrice"] },
                ],
              },
              { $subtract: ["$alarmPrice", "$currentPrice"] },
              0,
            ],
          },
        },
      },
      // ⬇️ Literal -1 kullandık ki tip "number"e genişlemesin
      { $sort: { alarmHit: -1 as -1, alarmDiff: -1 as -1, updatedAt: -1 as -1, _id: -1 as -1 } },
      {
        $facet: {
          items: [
            { $skip: (p - 1) * l },
            { $limit: l },
            { $project: { alarmHit: 0, alarmDiff: 0 } },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const agg = await Product.aggregate(pipeline);
    const items = (agg[0]?.items as any[]) ?? [];
    const total = (agg[0]?.totalCount?.[0]?.count as number) ?? 0;

    res.json({
      items,
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l),
    });
  } catch (e) {
    res.status(500).json({ error: "Arama yapılırken bir hata oluştu." });
  }
});

/**
 * Ürün sil
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }
    res.json({ message: "Ürün silindi" });
  } catch {
    res.status(500).json({ error: "Ürün silinirken bir hata oluştu" });
  }
});

/**
 * Alarm güncelle
 */
router.put("/:id/alarm", async (req, res) => {
  try {
    const { alarmPrice } = req.body;

    if (alarmPrice == null || isNaN(Number(alarmPrice))) {
      return res.status(400).json({ error: "Geçerli bir alarmPrice gerekli." });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });

    product.alarmPrice = Number(alarmPrice);
    await product.save();

    res.json({ message: "Alarm fiyatı güncellendi", product });
  } catch {
    res.status(500).json({ error: "Alarm fiyatı güncellenemedi" });
  }
});

export default router;
