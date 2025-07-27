import React, { useEffect, useState } from "react";
import { getProducts } from "../utils/shopify";

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="shop-page">
      <h2>Shop</h2>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id}>
            <img
              src={product.images.edges[0]?.node.src}
              alt={product.images.edges[0]?.node.altText || product.title}
              width={200}
            />
            <h3>{product.title}</h3>
            <p>{product.description}</p>
            <strong>
              {product.variants.edges[0].node.price.amount}{" "}
              {product.variants.edges[0].node.price.currencyCode}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Shop;
