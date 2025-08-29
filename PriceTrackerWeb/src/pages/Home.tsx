import React, { useState } from "react";
import ProductActions from "../components/products/ProductActions";
import ProductList from "../components/products/ProductList";
import ProductSearch from "../components/products/ProductSearch";

const Home: React.FC = () => {
  const [refresh, setRefresh] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      style={{
        width: "100%",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <ProductActions onRefresh={() => setRefresh((prev) => prev + 1)} />
      <ProductSearch onSearch={setSearchQuery} />
      <ProductList key={refresh} searchQuery={searchQuery} />
    </div>
  );
};

export default Home;
