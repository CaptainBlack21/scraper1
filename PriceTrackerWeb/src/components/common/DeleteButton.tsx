import React, { useState } from "react";

interface Props {
  onConfirm: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const DeleteButton: React.FC<Props> = ({ onConfirm, children, style }) => {
  const [showModal, setShowModal] = useState(false);

  // Sadece modalı aç
  const handleClick = () => {
    setShowModal(true);
  };

  const handleConfirm = () => {
    onConfirm();
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          border: "none",
          backgroundColor: "#dc3545",
          color: "#fff",
          cursor: "pointer",
          transition: "background-color 0.2s",
          ...style,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c82333")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc3545")}
      >
        {children || "Sil"}
      </button>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: 8,
              width: "300px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <p>Bu ürünü silmek istediğinize emin misiniz?</p>
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                justifyContent: "space-around",
              }}
            >
              <button
                onClick={handleConfirm}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: 6,
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Evet
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: 6,
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteButton;
