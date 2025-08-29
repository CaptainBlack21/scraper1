import type { IProduct } from "../types/Product";
import { api } from "../http";

const API_URL = "/products";

export const getProducts = async (): Promise<IProduct[]> => {
  const res = await api.get(API_URL);
  return res.data;
};

export const addProduct = async (url: string): Promise<IProduct> => {
  const res = await api.post(API_URL, { url });
  return res.data;
};

export const deleteProduct = async (id: string) => {
  await api.delete(`${API_URL}/${id}`);
};

export const updateAlarm = async (id: string, alarmPrice: number) => {
  const res = await api.put(`${API_URL}/${id}/alarm`, { alarmPrice });
  return res.data;
};

// 🔍 Yeni: Ürün arama
export type SearchResponse = {
  items: IProduct[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore?: boolean;
};

export const searchProducts = async (
  q: string,
  page = 1,
  limit = 20
): Promise<SearchResponse> => {
  const res = await api.get(`${API_URL}/search`, {
    params: { q, page, limit },
  });
  return res.data;
};
