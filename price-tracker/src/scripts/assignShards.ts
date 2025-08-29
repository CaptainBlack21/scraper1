import "dotenv/config";
import mongoose from "mongoose";
import crypto from "crypto";
import Product from "../models/Product";

function shard60(key: string): number {
  const h = crypto.createHash("sha1").update(key).digest();
  const n = h.readUInt32BE(0);
  return n % 60;
}

const BATCH_SIZE = 1000;
const FORCE = process.argv.includes("--force");

function needsFix(doc: any) {
  const v = doc.shardMinute;
  if (FORCE) return true;
  if (v === null || v === undefined) return true;
  if (typeof v !== "number" || !Number.isFinite(v)) return true;
  if (v < 0 || v > 59) return true;
  return false;
}

async function audit() {
  const total = await Product.countDocuments({});
  const missing = await Product.countDocuments({
    $or: [
      { shardMinute: null },
      { shardMinute: { $exists: false } },
      { shardMinute: { $lt: 0 } },
      { shardMinute: { $gt: 59 } },
    ],
  });
  console.log(`📊 total=${total}, missing_or_invalid=${missing}, force=${FORCE}`);
}

async function main() {
  const uri = process.env.MONGO_URI as string;
  if (!uri) throw new Error("MONGO_URI eksik");
  console.log("🔌 MONGO_URI:", uri.replace(/:\/\/([^@]+)@/, "://***@")); // kullanıcıyı maskele

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 } as any);
  console.log("🗄️ MongoDB bağlı (assignShards).");

  await audit();

  const query = FORCE
    ? {} // hepsini yeniden hesapla
    : {
        $or: [
          { shardMinute: null },
          { shardMinute: { $exists: false } },
          { shardMinute: { $lt: 0 } },
          { shardMinute: { $gt: 59 } },
        ],
      };

  const cursor = Product.find(query, { _id: 1, url: 1, shardMinute: 1 })
    .lean()
    .cursor();

  let batch: any[] = [];
  let scanned = 0;
  let updated = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    scanned++;
    if (!needsFix(doc)) continue;

    const key = doc.url || String(doc._id);
    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { shardMinute: shard60(key) } },
      },
    });

    if (batch.length >= BATCH_SIZE) {
      const res = await Product.bulkWrite(batch, { ordered: false });
      updated += res.modifiedCount || 0;
      console.log(`📦 batch: scanned=${scanned}, updated(total)=${updated}`);
      batch = [];
    }
  }

  if (batch.length) {
    const res = await Product.bulkWrite(batch, { ordered: false });
    updated += res.modifiedCount || 0;
  }

  console.log(`✅ bitti: updated=${updated}, scanned=${scanned}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("❌ assignShards hata:", e);
  process.exit(1);
});
