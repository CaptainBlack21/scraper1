import "dotenv/config";
import mongoose from "mongoose";
import { startPriceWatcher } from "./jobs/priceWatcher";

async function main() {
  const uri = process.env.MONGO_URI as string;
  if (!uri) throw new Error("MONGO_URI eksik");

  await mongoose.connect(uri);
  console.log("🗄️ MongoDB bağlı (worker).");

  startPriceWatcher(); // her dakika shard çalışan job
  console.log("🚀 Price watcher başladı.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});