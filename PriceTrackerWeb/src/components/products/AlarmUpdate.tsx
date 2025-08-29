import React, { useState } from "react";

interface Props {
  currentAlarm: number;
  onSave: (newPrice: number) => void;
  onCancel: () => void;
}

const AlarmUpdate: React.FC<Props> = ({ currentAlarm, onSave, onCancel }) => {
  const [value, setValue] = useState(currentAlarm);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffffff",
          padding: 20,
          borderRadius: 12,
          minWidth: 300,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ marginBottom: 10,backgroundColor:"#ffffffff"}}>Alarm Fiyatını Güncelle</h3>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(parseFloat(e.target.value))}
          style={{
            width: "100%",
            padding: 8,
            marginBottom: 15,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 12px",
              marginRight: 10,
              borderRadius: 6,
              border: "1px solid #ccc",
              backgroundColor: "#f0f0f0ff",
              cursor: "pointer",
            }}
          >
            İptal
          </button>
          <button
            onClick={() => onSave(value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmUpdate;