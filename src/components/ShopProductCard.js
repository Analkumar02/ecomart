import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useImagePath } from "../context/ImagePathContext";
import { useStore } from "../context/StoreContext";

const ShopProductCard = ({ productData }) => {
  const [product, setProduct] = useState(productData || null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(!productData);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityBox, setShowQuantityBox] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  // Removed showRemoveModal state
  const imageBase = useImagePath();
  const { smartCartProducts, dataFetched, toggleWishlist, isInWishlist } =
    useStore();

  useEffect(() => {
    const handleCartUpdated = (e) => {
      if (!product || !selectedVariant) return;
      const updatedCart = e.detail?.cart || [];
      const existingItem = updatedCart.find((item) => {
        // Check both formats: new format (id/variant) and old format (productId/variantId)
        const matchesNewFormat =
          item.id === product.id &&
          (item.variant || "Default Title") ===
            (selectedVariant.title || "Default Title");

        const matchesOldFormat =
          item.productId === product.id &&
          item.variantId === selectedVariant.id;

        return matchesNewFormat || matchesOldFormat;
      });
      if (existingItem) {
        setIsInCart(true);
        setShowQuantityBox(true);
        setQuantity(existingItem.quantity);
      } else {
        setIsInCart(false);
        setShowQuantityBox(false);
        setQuantity(1);
      }
    };
    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => window.removeEventListener("cartUpdated", handleCartUpdated);
  }, [product, selectedVariant]);

  useEffect(() => {
    if (!productData && dataFetched) {
      const fetchRandomProduct = async () => {
        try {
          setLoading(true);
          const products = smartCartProducts;

          if (products && products.length > 0) {
            const randomIndex = Math.floor(Math.random() * products.length);
            const fetchedProduct = products[randomIndex];
            setProduct(fetchedProduct);

            if (
              fetchedProduct &&
              fetchedProduct.variants &&
              fetchedProduct.variants.edges &&
              Array.isArray(fetchedProduct.variants.edges) &&
              fetchedProduct.variants.edges.length > 0
            ) {
              setSelectedVariant(fetchedProduct.variants.edges[0].node);
            }
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          setProduct(null);
        } finally {
          setLoading(false);
        }
      };

      fetchRandomProduct();
    } else {
      setProduct(productData);
      if (
        productData &&
        productData.variants &&
        productData.variants.edges &&
        Array.isArray(productData.variants.edges) &&
        productData.variants.edges.length > 0
      ) {
        setSelectedVariant(productData.variants.edges[0].node);
      }
    }
  }, [productData, dataFetched, smartCartProducts]);

  // Check if product is already in cart when component loads or variant changes
  useEffect(() => {
    if (product && selectedVariant) {
      const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItem = existingCart.find((item) => {
        // Check both formats: new format (id/variant) and old format (productId/variantId)
        const matchesNewFormat =
          item.id === product.id &&
          (item.variant || "Default Title") ===
            (selectedVariant.title || "Default Title");

        const matchesOldFormat =
          item.productId === product.id &&
          item.variantId === selectedVariant.id;

        return matchesNewFormat || matchesOldFormat;
      });

      if (existingItem) {
        setIsInCart(true);
        setShowQuantityBox(true);
        setQuantity(existingItem.quantity);
      } else {
        setIsInCart(false);
        setShowQuantityBox(false);
        setQuantity(1);
      }
    }
  }, [product, selectedVariant]);

  // Listen for cart updates from other components and sync state
  useEffect(() => {
    const handleCartUpdate = (e) => {
      if (!product || !selectedVariant) return;
      const updatedCart = e.detail?.cart || [];
      const existingItem = updatedCart.find((item) => {
        // Check both formats: new format (id/variant) and old format (productId/variantId)
        const matchesNewFormat =
          item.id === product.id &&
          (item.variant || "Default Title") ===
            (selectedVariant.title || "Default Title");

        const matchesOldFormat =
          item.productId === product.id &&
          item.variantId === selectedVariant.id;

        return matchesNewFormat || matchesOldFormat;
      });
      if (existingItem) {
        setIsInCart(true);
        setShowQuantityBox(true);
        setQuantity(existingItem.quantity);
      } else {
        setIsInCart(false);
        setShowQuantityBox(false);
        setQuantity(1);
      }
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [product, selectedVariant]);

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };

  // Utility to detect touch devices (mobile/tablet)
  const isTouchDevice = () =>
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    try {
      if (isTouchDevice()) {
        // On mobile/tablet, add to cart immediately
        addToCart();
      } else {
        // On desktop, show quantity box if not already shown, else add to cart
        if (!showQuantityBox) {
          setShowQuantityBox(true);
        } else {
          addToCart();
        }
      }
      // Let the cart event listeners handle state updates
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleWishlistToggle = () => {
    if (!product) return;

    // Debug logging to see what image data we have

    const wishlistItem = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      image: getCurrentImage(),
      price: selectedVariant?.price || product.priceRange?.minVariantPrice,
      compareAtPrice:
        selectedVariant?.compareAtPrice ||
        product.compareAtPriceRange?.minVariantPrice,
    };

    toggleWishlist(wishlistItem);
  };
  const handleQuantityIncrease = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    if (isInCart) {
      updateCartQuantity(newQuantity);
    }
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      if (isInCart) {
        updateCartQuantity(newQuantity);
      }
    } else if (quantity === 1 && isInCart) {
      // Directly remove from cart and show notification
      removeFromCart();
    }
  };

  const removeFromCart = () => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const updatedCart = existingCart.filter((item) => {
      // Check both formats: new format (id/variant) and old format (productId/variantId)
      const matchesNewFormat =
        item.id === product.id &&
        (item.variant || "Default Title") ===
          (selectedVariant.title || "Default Title");

      const matchesOldFormat =
        item.productId === product.id && item.variantId === selectedVariant.id;

      return !(matchesNewFormat || matchesOldFormat);
    });

    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // Reset component state
    setIsInCart(false);
    setShowQuantityBox(false);
    setQuantity(1);

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

    // Show notification (standardized for FloatingContent)
    window.dispatchEvent(
      new CustomEvent("cartNotification", {
        detail: {
          action: "removed",
          item: {
            title: product.title,
            variant:
              selectedVariant && selectedVariant.title !== "Default Title"
                ? selectedVariant.title
                : null,
            image: getCurrentImage(),
            quantity: quantity,
          },
        },
      })
    );
  };

  // Removed modal handlers

  const updateCartQuantity = (newQuantity) => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const itemIndex = existingCart.findIndex((item) => {
      // Check both formats: new format (id/variant) and old format (productId/variantId)
      const matchesNewFormat =
        item.id === product.id &&
        (item.variant || "Default Title") ===
          (selectedVariant.title || "Default Title");

      const matchesOldFormat =
        item.productId === product.id && item.variantId === selectedVariant.id;

      return matchesNewFormat || matchesOldFormat;
    });

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity = newQuantity;
      localStorage.setItem("cart", JSON.stringify(existingCart));

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

  const addToCart = () => {
    const cartItem = {
      productId: product.id, // Keep for backward compatibility
      variantId: selectedVariant.id, // Keep for backward compatibility
      id: product.id, // Primary identifier used by StoreContext.addToCart
      title: product.title,
      variant: selectedVariant.title, // Primary variant identifier used by StoreContext.addToCart
      price: selectedVariant.price.amount,
      image: getCurrentImage(),
      quantity: quantity,
      handle: product.handle, // Add handle for consistency with Product page
    };

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check if item already exists in cart using same logic as StoreContext
    const existingItemIndex = existingCart.findIndex(
      (item) =>
        item.id === cartItem.id &&
        (item.variant || "Default Title") ===
          (cartItem.variant || "Default Title")
    );

    if (existingItemIndex > -1) {
      existingCart[existingItemIndex].quantity += quantity;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem("cart", JSON.stringify(existingCart));
    setIsInCart(true);
    setShowQuantityBox(true);

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

    const notificationItem = {
      title: product.title,
      variant:
        selectedVariant.title !== "Default Title"
          ? selectedVariant.title
          : null,
      image: getCurrentImage(),
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

  const getCurrentImage = () => {
    if (selectedVariant && selectedVariant.image) {
      return selectedVariant.image.src;
    }
    return product?.images.edges[0]?.node.src || `${imageBase}/pr-img.png`;
  };

  const getCurrentPrice = () => {
    if (selectedVariant) {
      return {
        price: selectedVariant.price,
        compareAtPrice: selectedVariant.compareAtPrice,
      };
    }
    return {
      price: product?.variants.edges[0]?.node.price,
      compareAtPrice: product?.variants.edges[0]?.node.compareAtPrice,
    };
  };

  if (loading) {
    return (
      <div className="shop-product-card">
        <div className="category">Loading...</div>
        <div
          style={{
            height: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Loading product...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="shop-product-card">
        <div className="category">No Products Found</div>
        <div
          style={{
            height: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          No products available
        </div>
      </div>
    );
  }

  // Get category: productType, then tag with 'category', then fallback
  const getCategory = () => {
    if (product.productType && product.productType.trim() !== "")
      return product.productType;
    if (product.tags && Array.isArray(product.tags)) {
      const catTag = product.tags.find((tag) =>
        tag.toLowerCase().includes("category")
      );
      if (catTag) return catTag;
    }
    return "Shop";
  };

  return (
    <div className={`shop-product-card ${showQuantityBox ? "show-qty" : ""}`}>
      <div className="category">{getCategory()}</div>

      <Link to={`/product/${product.handle}`}>
        <img
          className="img-fluid"
          src={getCurrentImage()}
          alt={product.title}
          onError={(e) => {
            e.target.src = `${imageBase}/pr-img.png`;
          }}
        />
      </Link>

      <div className="variant-box">
        {product.variants &&
        product.variants.edges &&
        Array.isArray(product.variants.edges) &&
        product.variants.edges.length > 0 ? (
          product.variants.edges.slice(0, 2).map((variant, index) => (
            <div
              key={variant.node.id}
              className={`variant ${
                selectedVariant?.id === variant.node.id ? "active" : ""
              }`}
              onClick={() => handleVariantSelect(variant.node)}
              style={{ cursor: "pointer" }}
            >
              {variant.node.title === "Default Title"
                ? "Default"
                : variant.node.title}
            </div>
          ))
        ) : (
          <div className="variant">Default</div>
        )}
      </div>

      <div className="price-box">
        {getCurrentPrice().compareAtPrice && (
          <div className="org-price">
            ₹{parseFloat(getCurrentPrice().compareAtPrice.amount).toFixed(0)}
          </div>
        )}
        <div className="sale-price">
          ₹{parseFloat(getCurrentPrice().price.amount).toFixed(0)}
        </div>
      </div>

      <div className="stars">
        {[...Array(5)].map((_, i) => (
          <Icon key={i} icon="material-symbols:star" height="16" width="16" />
        ))}
      </div>

      <Link to={`/product/${product.handle}`} className="pr-title">
        {product.title}
        {selectedVariant?.title &&
          selectedVariant.title !== "Default Title" &&
          `, ${selectedVariant.title}`}
      </Link>

      <div
        className={`wishlist-btn ${isInWishlist(product) ? "wl-active" : ""}`}
        onClick={handleWishlistToggle}
      >
        <Icon icon="solar:heart-linear" height="16" width="16" />
      </div>

      {!showQuantityBox ? (
        <div className="add-to-cart" onClick={handleAddToCart}>
          <span>Add to cart</span>
          <Icon icon="ic:baseline-plus" height="18" width="18" />
        </div>
      ) : (
        <div className="qty-box">
          <div className="qty-controls">
            <button
              className="qty-btn qty-decrease"
              onClick={handleQuantityDecrease}
              disabled={!isInCart && quantity <= 1}
            >
              <Icon icon="ic:baseline-minus" height="18" width="18" />
            </button>
            <span className="qty-display">{quantity}</span>
            <button
              className="qty-btn qty-increase"
              onClick={handleQuantityIncrease}
            >
              <Icon icon="ic:baseline-plus" height="18" width="18" />
            </button>
          </div>
          <Link to="/cart" className="view-cart-btn">
            <Icon icon="mage:basket" height="16" width="16" />
            <span>View Cart</span>
          </Link>
        </div>
      )}

      {/* Confirmation modal removed: now only notification is shown on removal */}
    </div>
  );
};

export default ShopProductCard;
