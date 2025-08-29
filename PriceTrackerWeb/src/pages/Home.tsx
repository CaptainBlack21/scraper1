import React, { useState } from "react";
import ProductActions from "../components/products/ProductActions";
import ProductList from "../components/products/ProductList";

const Home: React.FC = () => {
  const [refresh, setRefresh] = useState(0);

  return (
    <div
      style={{
        width: "100%",      // parent full width
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <ProductActions onRefresh={() => setRefresh((prev) => prev + 1)} />
      <ProductList key={refresh} />
    </div>
  );
};

export default Home;
