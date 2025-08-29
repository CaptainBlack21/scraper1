import mongoose, { Schema, Document } from "mongoose";
import crypto from "crypto";

function shard60(key: string): number {
  const h = crypto.createHash("sha1").update(key).digest();
  const n = h.readUInt32BE(0); // ilk 4 bayttan pozitif 32-bit sayı
  return n % 60;
}

export interface PricePoint {
  price: number;
  date: Date;
}

export interface ProductDoc extends Document {
  title: string;
  url: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  alarmPrice: number;

  lastEtag?: string | null;
  lastModified?: string | null;
  shardMinute: number;           // 0..59
  cooldownUntil?: Date | null;
  lastCheckedAt?: Date | null;
}

const PricePointSchema = new Schema<PricePoint>(
  {
    price: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const ProductSchema = new Schema<ProductDoc>(
  {
    title: { type: String },
    url: { type: String, required: true, unique: true },
    currentPrice: { type: Number, default: 0 },
    priceHistory: { type: [PricePointSchema], default: [] },
    alarmPrice: { type: Number, default: 0 },

    lastEtag: { type: String, default: null },
    lastModified: { type: String, default: null },

    shardMinute: {
      type: Number,
      min: 0,
      max: 59,
      index: true,
      default: function (this: ProductDoc) {
        const key = this.url || String(this._id);
        return shard60(key);
      },
    },

    cooldownUntil: { type: Date, default: null },
    lastCheckedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// URL değişirse shard’ı deterministik olarak güncelle
ProductSchema.pre("save", function (next) {
  if (this.isModified("url")) {
    (this as any).shardMinute = shard60(this.url || String(this._id));
  }
  next();
});

// (Opsiyonel) shardMinute’ı API response’undan gizlemek istersen aç:
// ProductSchema.set("toJSON", {
//   transform(_doc, ret) {
//     // delete ret.shardMinute;
//     return ret;
//   },
// });

export default mongoose.models.Product ||
  mongoose.model<ProductDoc>("Product", ProductSchema);
