import { useState, useEffect, useCallback } from "react";
import { getProducts } from "../api/productApi";
import type { IProduct } from "../types/Product";

export const useFetchProducts = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ useCallback: referans sabit kalır, dependency loop engellenir
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (e: any) {
      setError(e.message || "Ürünler alınamadı");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // dependency safe

  return { products, loading, error, fetchProducts };
};
