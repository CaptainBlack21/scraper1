import React, { useEffect } from "react";
import ProductCard from "./ProductCard";
import { useFetchProducts } from "../../hooks/useFetchProducts";

const ProductList: React.FC = () => {
  const { products, loading, fetchProducts } = useFetchProducts();

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchProducts]); // stale closure/lint uyarılarını önler

  if (loading) return <p>Yükleniyor...</p>;
  if (!products.length) return <p>Ürün bulunamadı.</p>;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "flex-start",
      }}
    >
      {products.map((p) => ( // reverse kaldırıldı: backend sıralamasını olduğu gibi göster
        <div key={p._id} style={{ flex: "0 0 200px" }}>
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
};

export default ProductList;