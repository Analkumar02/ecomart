import React from "react";
import SmartCartCollection from "./ProductCardSmall/SmartCartCollection";
import TrendingCollection from "./ProductCardSmall/TrendingCollection";
import NewCollection from "./ProductCardSmall/NewCollection";

const ProductCardSmall = ({
  excludeProductIds = [],
  collectionType = "smart-cart",
}) => {
  // Render the appropriate collection component based on collectionType
  switch (collectionType) {
    case "smart-cart":
      return <SmartCartCollection excludeProductIds={excludeProductIds} />;
    case "trending":
      return <TrendingCollection excludeProductIds={excludeProductIds} />;
    case "new":
      return <NewCollection excludeProductIds={excludeProductIds} />;
    default:
      return <SmartCartCollection excludeProductIds={excludeProductIds} />;
  }
};

export default ProductCardSmall;
