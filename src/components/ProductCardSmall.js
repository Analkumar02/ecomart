import React from "react";
import SmartCartCollection from "./ProductCardSmall/SmartCartCollection";
import TrendingCollection from "./ProductCardSmall/TrendingCollection";
import NewCollection from "./ProductCardSmall/NewCollection";

const ProductCardSmall = ({
  excludeProductId,
  collectionType = "smart-cart",
}) => {
  // Render the appropriate collection component based on collectionType
  switch (collectionType) {
    case "smart-cart":
      return <SmartCartCollection excludeProductId={excludeProductId} />;
    case "trending":
      return <TrendingCollection excludeProductId={excludeProductId} />;
    case "new":
      return <NewCollection excludeProductId={excludeProductId} />;
    default:
      return <SmartCartCollection excludeProductId={excludeProductId} />;
  }
};

export default ProductCardSmall;
