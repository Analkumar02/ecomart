import React from "react";
import SmartCartCard from "./ProductCard/SmartCartCard";
import TrendingCard from "./ProductCard/TrendingCard";
import NewCard from "./ProductCard/NewCard";

const ProductCard = ({
  collectionHandle = "smart-cart",
  collectionType = "smart-cart",
  onProductLoad,
}) => {
  // Use collectionType if provided, otherwise fall back to collectionHandle for backward compatibility
  const type = collectionType || collectionHandle;

  // Render the appropriate collection component based on type
  switch (type) {
    case "smart-cart":
      return <SmartCartCard onProductLoad={onProductLoad} />;
    case "trending":
      return <TrendingCard onProductLoad={onProductLoad} />;
    case "new":
      return <NewCard onProductLoad={onProductLoad} />;
    default:
      return <SmartCartCard onProductLoad={onProductLoad} />;
  }
};

export default ProductCard;
