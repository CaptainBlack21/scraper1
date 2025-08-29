import express from "express";
import Product from "../models/Product";
import { scrapeAmazonProduct } from "../services/scraper";

const router = express.Router();

// Yeni ürün ekle
router.post("/", async (req, res) => {
  try {
    const { url } = req.body;

    // URL zaten var mı kontrol et
    const existing = await Product.findOne({ url });
    if (existing) {
      return res.status(400).json({ error: "Ürün zaten mevcut." });
    }

    // Scraper çalıştır
    const { title, price } = await scrapeAmazonProduct(url);

    // MongoDB'ye kaydet
    const product = new Product({
      url,
      title,
      currentPrice: price,
      priceHistory: [{ price, date: new Date() }]
    });

    await product.save();
    res.json(product);
  } catch (err: any) {
    // Hata tipine göre mesaj
    if (err.message.includes("Fiyat bulunamadı")) {
      res.status(400).json({ error: "Fiyat bulunamadı!" });
    } else {
      res.status(500).json({ error: "Ürün eklenirken bir hata oluştu." });
    }
  }
});

// Tüm ürünleri getir — alarmı vuranlar en üstte
router.get("/", async (_req, res) => {
  const products = await Product.aggregate([
    {
      $addFields: {
        alarmHit: {
          $and: [
            { $ne: [{ $ifNull: ["$alarmPrice", null] }, null] },
            { $lte: ["$currentPrice", "$alarmPrice"] }
          ]
        },
        alarmDiff: {
          $cond: [
            {
              $and: [
                { $ne: [{ $ifNull: ["$alarmPrice", null] }, null] },
                { $lte: ["$currentPrice", "$alarmPrice"] }
              ]
            },
            { $subtract: ["$alarmPrice", "$currentPrice"] },
            0
          ]
        }
      }
    },
    { $sort: { alarmHit: -1, alarmDiff: -1, updatedAt: -1, _id: -1 } },
    { $project: { alarmHit: 0, alarmDiff: 0 } }
  ]);

  res.json(products);
});

// Ürün sil
router.delete("/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Ürün silindi" });
});

// Alarm güncelle
router.put("/:id/alarm", async (req, res) => {
  try {
    const { alarmPrice } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Ürün bulunamadı" });

    product.alarmPrice = alarmPrice;
    await product.save();

    res.json({ message: "Alarm fiyatı güncellendi", product });
  } catch (err) {
    res.status(500).json({ error: "Alarm fiyatı güncellenemedi" });
  }
});

export default router;
