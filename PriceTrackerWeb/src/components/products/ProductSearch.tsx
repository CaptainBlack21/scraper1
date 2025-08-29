import React, { useState } from "react";
import "../../FormStyles.css"; // ✅ css import

interface Props {
  onSearch: (q: string) => void;
}

const ProductSearch: React.FC<Props> = ({ onSearch }) => {
  const [q, setQ] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(q.trim());
  };

  const handleClear = () => {
    setQ("");
    onSearch("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: 6,
        border: "2px solid #3b82f6",
        borderRadius: 50,
        background: "#f0f9ff",
        maxWidth: 500,
      }}
    >
      <input
        className="form-input" // ✅ ortak stil
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={isFocused ? "" : "Ürün ara…"}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Ürün arama"
      />
      {q && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            border: "none",
            background: "#e5e7eb",
            cursor: "pointer",
            fontSize: 14,
            color: "#374151",
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Temizle"
        >
          ✖
        </button>
      )}
      <button
        type="submit"
        style={{
          padding: "8px 16px",
          borderRadius: 50,
          border: "none",
          background: "linear-gradient(90deg, #3b82f6, #9333ea)",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: 14,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        Ara
      </button>
    </form>
  );
};

export default ProductSearch;
