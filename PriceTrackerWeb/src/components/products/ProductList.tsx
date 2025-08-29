import React, { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { useFetchProducts } from "../../hooks/useFetchProducts";
import { searchProducts } from "../../api/productApi";

interface Props {
  searchQuery?: string;
}

const ProductList: React.FC<Props> = ({ searchQuery }) => {
  const { products, loading, setProducts, fetchProducts } = useFetchProducts();
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    const run = async () => {
      if (searchQuery && searchQuery.trim()) {
        try {
          const res = await searchProducts(searchQuery.trim(), 1, 50);
          setProducts(res.items);
          setTotal(res.total); // ✅ toplam arama sonucu
        } catch (e) {
          console.error("Arama hatası:", e);
          setProducts([]);
          setTotal(0);
        }
      } else {
        fetchProducts();
        setTotal(null); // ✅ normal liste için sıfırlıyoruz
        interval = setInterval(fetchProducts, 30 * 60 * 1000);
      }
    };

    run();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [searchQuery, fetchProducts, setProducts]);

  if (loading) return <p>Yükleniyor...</p>;
  if (!products.length) return <p>Ürün bulunamadı.</p>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* ✅ Bilgi satırı */}
      <div style={{ fontSize: 12, color: "#6b7280" }}>
        {searchQuery && searchQuery.trim()
          ? `Toplam ${total ?? products.length} sonuç bulundu.`
          : `Toplam ${products.length} ürün listeleniyor.`}
      </div>

      {/* Ürün kartları */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "flex-start",
        }}
      >
        {products.map((p) => (
          <div key={p._id} style={{ flex: "0 0 200px" }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
