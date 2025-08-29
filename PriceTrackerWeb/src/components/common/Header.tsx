import React from "react";

const Header: React.FC = () => {
  return (
    <header
      id="app-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#282c34",
        color: "white",
        padding: "20px 30px",
        display: "flex",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Fiyat Takip Sistemi</h1>
    </header>
  );
};

export default Header;