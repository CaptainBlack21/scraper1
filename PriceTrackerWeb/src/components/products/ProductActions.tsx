import React, { useState } from "react";
import { addProduct } from "../../api/productApi";
import "../../FormStyles.css"; // ✅ css import

interface Props {
  onRefresh: () => void;
}

const ProductActions: React.FC<Props> = ({ onRefresh }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false); // ✅ focus state

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
      <form onSubmit={handleSubmit} className="form-bar">
        <input
          className="form-input"
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError("");
          }}
          placeholder={isFocused ? "" : "Amazon ürün URL'si"}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <button type="submit" className="form-button form-button--primary">
          ➕ Ekle
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="form-button form-button--success"
        >
          🔄 Yenile
        </button>
      </form>

      {error && (
        <span
          style={{
            color: "#dc2626",
            fontSize: 13,
            marginTop: 6,
            display: "block",
            fontWeight: 500,
          }}
        >
          ⚠ {error}
        </span>
      )}
    </div>
  );
};

export default ProductActions;
