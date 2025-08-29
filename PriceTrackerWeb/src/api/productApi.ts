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