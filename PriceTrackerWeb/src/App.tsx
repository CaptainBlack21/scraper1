import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom"; // ✅ sadece bunlar
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Header from "./components/common/Header";

const App: React.FC = () => {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = document.getElementById("app-header");
    if (header) setHeaderHeight(header.offsetHeight);
    const handleResize = () => header && setHeaderHeight(header.offsetHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <Header />
      <div style={{ padding: 20, paddingTop: headerHeight + 10 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </div>
    </>
  );
};

export default App;