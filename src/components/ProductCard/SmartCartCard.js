import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useImagePath } from "../../context/ImagePathContext";
import { useStore } from "../../context/StoreContext";
import { getProductsByCollection } from "../../utils/shopify";

const SmartCartCard = ({ onProductLoad }) => {
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityBox, setShowQuantityBox] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  // Removed showRemoveModal state
  const imageBase = useImagePath();
  const { toggleWishlist, isInWishlist } = useStore();

  useEffect(() => {
    const handleCartUpdated = (e) => {
      if (!product || !selectedVariant) return;
      const updatedCart = e.detail?.cart || [];
      const existingItem = updatedCart.find(
        (item) =>
          item.productId === product.id && item.variantId === selectedVariant.id
      );
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
    const fetchSmartCartProduct = async () => {
      try {
        setLoading(true);
        // Fetch products from smart-cart collection
        const products = await getProductsByCollection("smart-cart");

        if (products && products.length > 0) {
          // Get the first product (highest priced due to sorting in query)
          const fetchedProduct = products[0];
          setProduct(fetchedProduct);
          // Call the onProductLoad callback with the product ID
          if (onProductLoad && fetchedProduct.id) {
            onProductLoad(fetchedProduct.id);
          }
          // Set the first variant as default selected variant
          if (fetchedProduct.variants.edges.length > 0) {
            setSelectedVariant(fetchedProduct.variants.edges[0].node);
          }
        }
      } catch (error) {
        console.error("Error fetching Smart Cart products:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSmartCartProduct();
  }, [onProductLoad]);

  // Check if product is already in cart when component loads or variant changes
  useEffect(() => {
    if (product && selectedVariant) {
      const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItem = existingCart.find(
        (item) =>
          item.productId === product.id && item.variantId === selectedVariant.id
      );

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

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    // Show quantity box and add to cart immediately
    setShowQuantityBox(true);
    addToCart();
  };

  const handleWishlistToggle = () => {
    if (!product) return;

    const wishlistItem = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      image: product.images?.edges?.[0]?.node?.src || null,
      price:
        selectedVariant?.price?.amount ||
        product.variants?.edges?.[0]?.node?.price?.amount,
      compareAtPrice:
        selectedVariant?.compareAtPrice?.amount ||
        product.variants?.edges?.[0]?.node?.compareAtPrice?.amount,
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

  // Removed modal handlers

  const updateCartQuantity = (newQuantity) => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const itemIndex = existingCart.findIndex(
      (item) =>
        item.productId === product.id && item.variantId === selectedVariant.id
    );

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity = newQuantity;
      localStorage.setItem("cart", JSON.stringify(existingCart));

      // Dispatch cart updated event with total items count
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
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      variant: selectedVariant.title,
      price: selectedVariant.price.amount,
      image: getCurrentImage(),
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
    setIsInCart(true);

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
      <div className="product-card">
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
      <div className="product-card">
        <div className="category">No Products Found</div>
        <div
          style={{
            height: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          No products available in Smart Cart collection
        </div>
      </div>
    );
  }

  return (
    <div className={`product-card ${showQuantityBox ? "show-qty" : ""}`}>
      <div className="category">
        {product.productType ||
          product.tags.find((tag) => tag.includes("category")) ||
          "Smart Cart Product"}
      </div>
      <Link to={`/product/${product.handle}`}>
        <img
          className="img-fluid"
          src={getCurrentImage()}
          alt={product.title}
        />
      </Link>
      <div className="variant-box">
        {product.variants.edges.slice(0, 2).map((variant, index) => (
          <div
            key={variant.node.id}
            className={`variant ${
              selectedVariant?.id === variant.node.id ? "active" : ""
            }`}
            onClick={() => handleVariantSelect(variant.node)}
            style={{ cursor: "pointer" }}
          >
            {variant.node.title}
          </div>
        ))}
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
        className={`wishlist-btn ${
          product && isInWishlist(product.id) ? "wl-active" : ""
        }`}
        onClick={() => handleWishlistToggle()}
      >
        <Icon icon="solar:heart-linear" height="16" width="16" />
      </div>

      <div className="add-cart-btn" onClick={handleAddToCart}>
        <Icon icon="ic:baseline-plus" height="18" width="18" />
      </div>

      <div className={`qty-box ${showQuantityBox ? "show" : ""}`}>
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
      </div>

      {/* Confirmation modal removed: now only notification is shown on removal */}
    </div>
  );
};

export default SmartCartCard;
