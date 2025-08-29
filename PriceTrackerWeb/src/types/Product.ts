export interface IProduct {
  _id: string;
  url: string;
  title: string;
  currentPrice: number;
  priceHistory: { price: number; date: string }[];
  lastUpdated: string;
  alarmPrice: number;
}