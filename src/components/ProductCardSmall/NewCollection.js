import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useImagePath } from "../../context/ImagePathContext";
import { useStore } from "../../context/StoreContext";

const NewCollection = ({ excludeProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productStates, setProductStates] = useState({});
  const [maxProducts, setMaxProducts] = useState(12);
  const imageBase = useImagePath();
  const { newProducts, dataFetched, toggleWishlist, isInWishlist } = useStore();

  // Function to determine max products based on screen size
  const getMaxProducts = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 768) {
        return 4; // Mobile/Tablet: 4 products
      }
    }
    return 8; // Desktop: 8 products
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
    const fetchNewProducts = async () => {
      if (!dataFetched) return;

      try {
        setLoading(true);
        // Use products from context
        const allProducts = newProducts;

        if (allProducts && allProducts.length > 0) {
          // Filter out the excluded product if provided
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

          // Select 1 product from each type, max 8 products
          const selectedProducts = [];
          const productTypes = Object.keys(productsByType);

          // Shuffle the product types to get variety
          const shuffledTypes = productTypes.sort(() => 0.5 - Math.random());

          // Take up to maxProducts types and select 1 random product from each type
          const typesToUse = shuffledTypes.slice(0, maxProducts);

          typesToUse.forEach((type) => {
            const productsOfType = productsByType[type];
            // Select a random product from this type
            const randomProduct =
              productsOfType[Math.floor(Math.random() * productsOfType.length)];
            selectedProducts.push(randomProduct);
          });

          // If we don't have enough product types, fill remaining slots with random products
          if (
            selectedProducts.length < maxProducts &&
            filteredProducts.length > selectedProducts.length
          ) {
            const remainingProducts = filteredProducts.filter(
              (product) =>
                !selectedProducts.some((selected) => selected.id === product.id)
            );

            // Shuffle and take remaining needed products
            const shuffledRemaining = remainingProducts.sort(
              () => 0.5 - Math.random()
            );
            const needed = maxProducts - selectedProducts.length;
            selectedProducts.push(...shuffledRemaining.slice(0, needed));
          }

          // Ensure we never exceed maxProducts
          const finalProducts = selectedProducts.slice(0, maxProducts);

          // Double-check: Remove any products that match the excludeProductId
          const cleanedProducts = excludeProductId
            ? finalProducts.filter((product) => product.id !== excludeProductId)
            : finalProducts;

          setProducts(cleanedProducts);

          // Initialize states for each product
          const initialStates = {};
          cleanedProducts.forEach((product) => {
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
        console.error("Error fetching New products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewProducts();
  }, [excludeProductId, maxProducts, dataFetched, newProducts]);

  const getCurrentImage = (product) => {
    if (product?.images?.edges?.[0]?.node?.src) {
      return product.images.edges[0].node.src;
    }
    return `${imageBase}/pr-img.webp`;
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

  const handleWishlistToggle = (product) => {
    if (!product) return;

    const selectedVariant = product?.variants?.edges?.[0]?.node;
    const wishlistItem = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      image: getCurrentImage(product),
      price: selectedVariant?.price || product.priceRange?.minVariantPrice,
      compareAtPrice:
        selectedVariant?.compareAtPrice ||
        product.compareAtPriceRange?.minVariantPrice,
    };

    toggleWishlist(wishlistItem);
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
    } else if (productState.quantity === 1 && productState.isInCart) {
      // Remove from cart when quantity would go to 0
      removeFromCart(product);
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

  const removeFromCart = (product) => {
    const selectedVariant = product?.variants?.edges?.[0]?.node;
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Find the item being removed for notification
    const itemToRemove = existingCart.find(
      (item) =>
        item.productId === product.id && item.variantId === selectedVariant.id
    );

    const updatedCart = existingCart.filter(
      (item) =>
        !(
          item.productId === product.id && item.variantId === selectedVariant.id
        )
    );

    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // Reset component state
    updateProductState(product.id, {
      isInCart: false,
      showQuantityBox: false,
      quantity: 1,
    });

    // Dispatch cart updated event
    const cartUpdatedEvent = new CustomEvent("cartUpdated", {
      detail: {
        cart: updatedCart,
        totalItems: updatedCart.reduce(
          (total, item) => total + item.quantity,
          0
        ),
      },
    });
    window.dispatchEvent(cartUpdatedEvent);

    // Dispatch notification event
    if (itemToRemove) {
      window.dispatchEvent(
        new CustomEvent("cartNotification", {
          detail: {
            action: "removed",
            item: {
              title: itemToRemove.title,
              variant:
                itemToRemove.variant !== "Default Title"
                  ? itemToRemove.variant
                  : null,
              image: itemToRemove.image,
              quantity: itemToRemove.quantity || 1,
            },
          },
        })
      );
    }
  };

  const addToCart = (product, selectedVariant, quantity) => {
    const cartItem = {
      productId: product.id,
      variantId: selectedVariant.id,
      id: product.id,
      title: product.title,
      variant: selectedVariant.title,
      price: selectedVariant.price.amount,
      compareAtPrice: selectedVariant.compareAtPrice
        ? {
            amount: selectedVariant.compareAtPrice.amount,
          }
        : null,
      image: getCurrentImage(product),
      quantity: quantity,
      handle: product.handle,
    }; // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check if item already exists in cart using same logic as StoreContext
    const existingItemIndex = existingCart.findIndex(
      (item) =>
        item.id === cartItem.id &&
        (item.variant || "Default Title") ===
          (cartItem.variant || "Default Title")
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

    // Notify StoreContext about external cart update
    window.dispatchEvent(new CustomEvent("externalCartUpdate"));

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
                loading="lazy"
                onError={(e) => {
                  e.target.src = `${imageBase}/pr-img.webp`;
                }}
              />
            </Link>

            <div className="product-info">
              <div className="category">
                {product.productType ||
                  product.tags?.find((tag) => tag.includes("category")) ||
                  "New Product"}
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

            <div
              className={`wishlist-btn ${
                isInWishlist(product) ? "wl-active" : ""
              }`}
              onClick={() => handleWishlistToggle(product)}
            >
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
                  disabled={
                    !productState.isInCart && productState.quantity <= 1
                  }
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

export default NewCollection;
