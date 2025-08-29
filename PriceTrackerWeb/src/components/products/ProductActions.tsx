import React, { useState } from "react";
import { addProduct } from "../../api/productApi";

interface Props {
  onRefresh: () => void;
}

const ProductActions: React.FC<Props> = ({ onRefresh }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Lütfen geçerli bir URL giriniz");
      return;
    }
    try {
      await addProduct(url);
      setUrl("");
      setError("");
      onRefresh();
    } catch (err: any) {
      setError(err.response?.data?.error || "Ürün eklenirken hata oluştu");
    }
  };

  return (
    <div style={{ width: "100%", marginBottom: 20 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          flexWrap: "nowrap",
        }}
      >
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          placeholder="Amazon ürün URL'si"
          style={{
            flex: "1 1 0",     // boş alanı kaplasın
            minWidth: 150,
            maxWidth: "100%",
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#007bff",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Ekle
        </button>

        <button
          type="button"
          onClick={onRefresh}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#28a745",
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Yenile
        </button>
      </form>

      {error && (
        <span
          style={{
            color: "red",
            fontSize: 12,
            marginTop: 5,
            display: "block",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default ProductActions;
