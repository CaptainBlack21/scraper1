import React from "react";
import type { IProduct } from "../../types/Product";
import { Link } from "react-router-dom";

interface Props {
  product: IProduct;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const hasAlarm = typeof product.alarmPrice === "number" && !Number.isNaN(product.alarmPrice as number);
  const alarmHit = hasAlarm && product.currentPrice <= (product.alarmPrice as number);

  const formatTL = (n?: number | null) =>
    typeof n === "number" && !Number.isNaN(n) ? `${n.toLocaleString("tr-TR")} TL` : "—";

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 15,
        width: 200, // sabit genişlik, grid ile uyumlu
        height: 200,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        transition: "transform 0.2s, box-shadow 0.2s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        outline: alarmHit ? "2px solid #28a745" : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
    >
      {/* Alarm rozeti */}
      {alarmHit && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "#28a745",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Alarm!
        </span>
      )}

      <div
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        <h3 style={{ fontSize: "1rem", marginBottom: 10, color: "#007bff" }}>
          <Link
            to={`/product/${product._id}`}
            style={{ textDecoration: "none", color: "#007bff" }}
            title={product.title}
          >
            {product.title}
          </Link>
        </h3>
      </div>

      <p style={{ margin: "5px 0", fontWeight: "bold", color: "#555" }}>
        Fiyat: {formatTL(product.currentPrice)}
      </p>

      <p style={{ margin: "5px 0", color: "#777" }}>
        Alarm Fiyatı: {formatTL(product.alarmPrice as number | null)}
      </p>

      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: "auto",
          color: "#007bff",
          fontSize: "0.9rem",
          textDecoration: "underline",
          wordBreak: "break-word",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        Ürünü Gör
      </a>
    </div>
  );
};

export default ProductCard;