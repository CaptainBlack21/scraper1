import dotenv from "dotenv";
import path from "path";

// .env'i her zaman çalışma klasöründen (exe'nin yanından) yükle
dotenv.config({ path: path.join(process.cwd(), ".env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { exec } from "node:child_process";

// 👉 Worker'ı aynı süreçte başlatmak için EKLE
import { startPriceWatcher } from "./jobs/priceWatcher";

import productRoutes from "./routes/productRoutes";

const PORT = Number(process.env.PORT) || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || `http://127.0.0.1:${PORT}`;

// --- MONGO_URI doğrulama ---
const MONGO_URI_RAW = process.env.MONGO_URI?.trim();
if (!MONGO_URI_RAW) {
  console.error("❌ MONGO_URI .env içinde tanımlı değil veya boş!");
  process.exit(1);
}
if (!/^mongodb(\+srv)?:\/\//i.test(MONGO_URI_RAW)) {
  console.error("❌ MONGO_URI 'mongodb://' veya 'mongodb+srv://' ile başlamalı!");
  process.exit(1);
}
const MONGO_URI: string = MONGO_URI_RAW;
// ---------------------------

const app = express();

// --- CORS (Electron için gevşek, dev için kısıtlı) ---
const isElectron = (process.env.ELECTRON_APP ?? "").toString() === "1";
const corsOptions: cors.CorsOptions = isElectron
  ? { origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }
  : { origin: CORS_ORIGIN, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] };

app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // preflight

// API
app.use("/products", productRoutes);

// Sağlık kontrolü
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// === Frontend (public) yolu ===
const isPkg = (process as any).pkg !== undefined;
const publicDir = isPkg
  ? path.join(process.cwd(), "public")        // exe'nin yanındaki public/
  : path.join(__dirname, "../public");       // dev/build: dist/../public

app.use(express.static(publicDir));

// ✅ SPA fallback: Express 5 uyumlu → tüm bilinmeyen yolları index.html'e yönlendir
app.use(express.static(publicDir));
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Windows'ta varsayılan tarayıcıyı aç
function openBrowser(url: string) {
  try {
    exec(`start "" "${url}"`);
  } catch {}
}

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 } as any);
    console.log("✅ MongoDB Connected");

    // 👉 Worker'ı aynı süreçte başlat (her dakika fiyat izleme)
    if ((process.env.RUN_WORKER ?? "true").toLowerCase() !== "false") {
      startPriceWatcher();
      console.log("🚀 Price watcher başladı.");
    }

    app.listen(PORT, () => {
      const url = `http://127.0.0.1:${PORT}`;
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Open: ${url}`);

      // Electron içinde çalışıyorsak tarayıcı açma
      const autoOpen = (process.env.AUTO_OPEN ?? "true").toLowerCase() !== "false";
      if (!process.env.ELECTRON_APP && autoOpen) {
        openBrowser(url);
      }
    });
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
    process.exit(1);
  }
}

start();

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});
