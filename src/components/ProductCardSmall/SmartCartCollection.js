import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useImagePath } from "../../context/ImagePathContext";
import { getProductsByCollection } from "../../utils/shopify";

const SmartCartCollection = ({ excludeProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productStates, setProductStates] = useState({});
  const [maxProducts, setMaxProducts] = useState(8);
  const imageBase = useImagePath();

  // Function to determine max products based on screen size
  const getMaxProducts = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 480) {
        return 4; // Mobile: 4 products in 1 column
      } else if (window.innerWidth <= 768) {
        return 4; // Tablet: 4 products in 2x2 grid
      }
    }
    return 8; // Desktop: 8 products in 2x4 grid
  };

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const newMaxProducts = getMaxProducts();
      if (newMaxProducts !== maxProducts) {
        setMaxProducts(newMaxProducts);
      }
    };

    // Set initial value
    setMaxProducts(getMaxProducts());

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [maxProducts]);

  useEffect(() => {
    const handleCartUpdated = (e) => {
      const updatedCart = e.detail?.cart || [];

      // Update states for all products based on cart
      setProductStates((prevStates) => {
        const newStates = { ...prevStates };

        products.forEach((product) => {
          const selectedVariant = product?.variants?.edges?.[0]?.node;
          if (product && selectedVariant) {
            const existingItem = updatedCart.find(
              (item) =>
                item.productId === product.id &&
                item.variantId === selectedVariant.id
            );

            if (existingItem) {
              newStates[product.id] = {
                ...newStates[product.id],
                isInCart: true,
                showQuantityBox: true,
                quantity: existingItem.quantity,
              };
            } else {
              newStates[product.id] = {
                ...newStates[product.id],
                isInCart: false,
                showQuantityBox: false,
                quantity: 1,
              };
            }
          }
        });

        return newStates;
      });
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => window.removeEventListener("cartUpdated", handleCartUpdated);
  }, [products]);

  useEffect(() => {
    const fetchSmartCartProducts = async () => {
      try {
        setLoading(true);
        // Fetch products from smart-cart collection
        const allProducts = await getProductsByCollection("smart-cart");

        if (allProducts && allProducts.length > 0) {
          // Filter out the excluded product (the one shown in main ProductCard)
          let filteredProducts = allProducts;
          if (excludeProductId) {
            filteredProducts = allProducts.filter(
              (product) => product.id !== excludeProductId
            );
          }

          // Group products by product type
          const productsByType = {};
          filteredProducts.forEach((product) => {
            const productType = product.productType || "Other";
            if (!productsByType[productType]) {
              productsByType[productType] = [];
            }
            productsByType[productType].push(product);
          });

          // Select 1 product from each type, responsive count
          const selectedProducts = [];
          const productTypes = Object.keys(productsByType);

          // Shuffle the product types to get variety
          const shuffledTypes = productTypes.sort(() => 0.5 - Math.random());

          // Take up to maxProducts types and select 1 random product from each type
          shuffledTypes.slice(0, maxProducts).forEach((type) => {
            const productsOfType = productsByType[type];
            // Select a random product from this type
            const randomProduct =
              productsOfType[Math.floor(Math.random() * productsOfType.length)];
            selectedProducts.push(randomProduct);
          });

          setProducts(selectedProducts);

          // Initialize states for each product
          const initialStates = {};
          selectedProducts.forEach((product) => {
            const selectedVariant = product?.variants?.edges?.[0]?.node;
            if (product && selectedVariant) {
              // Check if product is already in cart
              const existingCart = JSON.parse(
                localStorage.getItem("cart") || "[]"
              );
              const existingItem = existingCart.find(
                (item) =>
                  item.productId === product.id &&
                  item.variantId === selectedVariant.id
              );

              initialStates[product.id] = {
                quantity: existingItem ? existingItem.quantity : 1,
                showQuantityBox: !!existingItem,
                isInCart: !!existingItem,
                selectedVariant: selectedVariant,
              };
            }
          });
          setProductStates(initialStates);
        }
      } catch (error) {
        console.error("Error fetching SmartCart products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSmartCartProducts();
  }, [excludeProductId, maxProducts]);

  const getCurrentImage = (product) => {
    if (product?.images?.edges?.[0]?.node?.src) {
      return product.images.edges[0].node.src;
    }
    return `${imageBase}/pr-img.png`;
  };

  const getCurrentPrice = (product) => {
    if (product?.variants?.edges?.[0]?.node) {
      return product.variants.edges[0].node;
    }
    return { price: { amount: "0" }, compareAtPrice: null };
  };

  // Helper functions for each product
  const getProductState = (productId) => {
    return (
      productStates[productId] || {
        quantity: 1,
        showQuantityBox: false,
        isInCart: false,
        selectedVariant: null,
      }
    );
  };

  const updateProductState = (productId, updates) => {
    setProductStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        ...updates,
      },
    }));
  };

  const handleAddToCart = (product) => {
    const productState = getProductState(product.id);
    const selectedVariant = product?.variants?.edges?.[0]?.node;

    if (!selectedVariant) return;

    // Show quantity box and add to cart immediately
    updateProductState(product.id, { showQuantityBox: true });
    addToCart(product, selectedVariant, productState.quantity);
  };

  const handleQuantityIncrease = (product) => {
    const productState = getProductState(product.id);
    const newQuantity = productState.quantity + 1;
    updateProductState(product.id, { quantity: newQuantity });

    if (productState.isInCart) {
      updateCartQuantity(product, newQuantity);
    }
  };

  const handleQuantityDecrease = (product) => {
    const productState = getProductState(product.id);
    if (productState.quantity > 1) {
      const newQuantity = productState.quantity - 1;
      updateProductState(product.id, { quantity: newQuantity });

      if (productState.isInCart) {
        updateCartQuantity(product, newQuantity);
      }
    }
  };

  const updateCartQuantity = (product, newQuantity) => {
    const selectedVariant = product?.variants?.edges?.[0]?.node;
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const itemIndex = existingCart.findIndex(
      (item) =>
        item.productId === product.id && item.variantId === selectedVariant.id
    );

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity = newQuantity;
      localStorage.setItem("cart", JSON.stringify(existingCart));

      // Dispatch cart updated event
      const cartUpdatedEvent = new CustomEvent("cartUpdated", {
        detail: {
          cart: existingCart,
          totalItems: existingCart.reduce(
            (total, item) => total + item.quantity,
            0
          ),
        },
      });
      window.dispatchEvent(cartUpdatedEvent);
    }
  };

  const addToCart = (product, selectedVariant, quantity) => {
    const cartItem = {
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      variant: selectedVariant.title,
      price: selectedVariant.price.amount,
      image: getCurrentImage(product),
      quantity: quantity,
    };

    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check if item already exists in cart
    const existingItemIndex = existingCart.findIndex(
      (item) =>
        item.productId === cartItem.productId &&
        item.variantId === cartItem.variantId
    );

    if (existingItemIndex > -1) {
      // Update quantity of existing item
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      existingCart.push(cartItem);
    }

    // Save updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(existingCart));

    // Update component state
    updateProductState(product.id, { isInCart: true });

    // Dispatch custom event to update cart count in header
    const cartUpdatedEvent = new CustomEvent("cartUpdated", {
      detail: {
        cart: existingCart,
        totalItems: existingCart.reduce(
          (total, item) => total + item.quantity,
          0
        ),
      },
    });
    window.dispatchEvent(cartUpdatedEvent);

    // Dispatch notification event
    const notificationItem = {
      title: product.title,
      variant:
        selectedVariant.title !== "Default Title"
          ? selectedVariant.title
          : null,
      image: getCurrentImage(product),
      quantity: quantity,
    };

    window.dispatchEvent(
      new CustomEvent("cartNotification", {
        detail: {
          action: "added",
          item: notificationItem,
        },
      })
    );
  };

  if (loading) {
    return (
      <div className="product-card-small-grid">
        {[...Array(maxProducts)].map((_, index) => (
          <div key={index} className="product-card-small loading">
            <div className="loading-placeholder"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!products.length) {
    return <div className="no-products">No products available</div>;
  }

  return (
    <div className="product-card-small-grid">
      {products.map((product) => {
        const productState = getProductState(product.id);
        return (
          <div
            key={product.id}
            className={`product-card-small ${
              productState.showQuantityBox ? "show-qty" : ""
            }`}
          >
            <Link to={`/product/${product.handle}`}>
              <img
                src={getCurrentImage(product)}
                alt={product.title}
                onError={(e) => {
                  e.target.src = `${imageBase}/pr-img.png`;
                }}
              />
            </Link>

            <div className="product-info">
              <div className="category">
                {product.productType ||
                  product.tags?.find((tag) => tag.includes("category")) ||
                  "Featured Product"}
              </div>

              <div className="price-box">
                {getCurrentPrice(product).compareAtPrice && (
                  <div className="org-price">
                    ₹
                    {parseFloat(
                      getCurrentPrice(product).compareAtPrice.amount
                    ).toFixed(0)}
                  </div>
                )}
                <div className="sale-price">
                  ₹
                  {parseFloat(getCurrentPrice(product).price.amount).toFixed(0)}
                </div>
              </div>

              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    icon="material-symbols:star"
                    width="12"
                    height="12"
                  />
                ))}
              </div>

              <Link to={`/product/${product.handle}`} className="pr-title">
                {product.title}
                {getCurrentPrice(product).title &&
                  getCurrentPrice(product).title !== "Default Title" &&
                  `, ${getCurrentPrice(product).title}`}
              </Link>
            </div>

            <div className="wishlist-btn">
              <Icon icon="solar:heart-linear" height="16" width="16" />
            </div>

            <div
              className="add-cart-btn"
              onClick={() => handleAddToCart(product)}
            >
              <Icon icon="ic:baseline-plus" height="18" width="18" />
            </div>

            <div
              className={`qty-box ${
                productState.showQuantityBox ? "show" : ""
              }`}
            >
              <div className="qty-controls">
                <button
                  className="qty-btn qty-decrease"
                  onClick={() => handleQuantityDecrease(product)}
                  disabled={productState.quantity <= 1}
                >
                  <Icon icon="ic:baseline-minus" height="18" width="18" />
                </button>
                <span className="qty-display">{productState.quantity}</span>
                <button
                  className="qty-btn qty-increase"
                  onClick={() => handleQuantityIncrease(product)}
                >
                  <Icon icon="ic:baseline-plus" height="18" width="18" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SmartCartCollection;
