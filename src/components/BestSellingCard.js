import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useImagePath } from "../context/ImagePathContext";
import { useStore } from "../context/StoreContext";

const BestSellingCard = () => {
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showQuantityBox, setShowQuantityBox] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  // Removed showRemoveModal state (modal replaced by notification)
  const imageBase = useImagePath();
  const { smartCartProducts, dataFetched } = useStore();

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
    const fetchBestSellingProduct = async () => {
      if (!dataFetched) return;

      try {
        setLoading(true);
        // Use products from context
        const products = smartCartProducts;

        if (products && products.length > 0) {
          // Filter products that have variants (more than just "Default Title")
          const productsWithVariants = products.filter((product) => {
            const variants = product.variants.edges;
            // Check if product has multiple variants OR if the single variant is not "Default Title"
            return (
              variants.length > 1 ||
              (variants.length === 1 &&
                variants[0].node.title !== "Default Title")
            );
          });

          if (productsWithVariants.length > 0) {
            // Get a random product from products with variants
            const randomIndex = Math.floor(
              Math.random() * productsWithVariants.length
            );
            const fetchedProduct = productsWithVariants[randomIndex];
            setProduct(fetchedProduct);

            // Set the first variant as default selected variant
            if (fetchedProduct.variants.edges.length > 0) {
              setSelectedVariant(fetchedProduct.variants.edges[0].node);
            }
          } else {
            // No products with variants found, show fallback message
            setProduct(null);
          }
        }
      } catch (error) {
        console.error("Error fetching Best Selling product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellingProduct();
  }, [dataFetched, smartCartProducts]);

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
      // Remove directly and show notification
      removeFromCart();
    }
  };

  const removeFromCart = () => {
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
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

    // Dispatch notification event for removal
    const notificationItem = {
      title: product.title,
      variant:
        selectedVariant && selectedVariant.title !== "Default Title"
          ? selectedVariant.title
          : null,
      image: getCurrentImage(),
      quantity: quantity,
    };
    window.dispatchEvent(
      new CustomEvent("cartNotification", {
        detail: {
          action: "removed",
          item: notificationItem,
        },
      })
    );
  };

  // Removed modal handlers (not needed)

  const updateCartQuantity = (newQuantity) => {
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

    // Get existing cart from localStorage
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

  const getProductImages = () => {
    if (product?.images?.edges && product.images.edges.length > 0) {
      return product.images.edges.map((edge) => edge.node.src);
    }
    return [`${imageBase}/pr-img.png`];
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
        <div className="category">No Variant Products Found</div>
        <div
          style={{
            height: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            color: "#666",
            fontSize: "14px",
            padding: "20px",
          }}
        >
          No products with variants available in this collection
        </div>
      </div>
    );
  }

  return (
    <div className={`product-card ${showQuantityBox ? "show-qty" : ""}`}>
      <div className="category">
        {product.productType ||
          product.tags?.find((tag) => tag.includes("category")) ||
          "Best Selling"}
      </div>

      {/* Swiper Image Slider */}
      <div className="best-slider">
        <Swiper
          modules={[Pagination]}
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active",
          }}
          spaceBetween={0}
          slidesPerView={1}
          className="product-image-swiper"
        >
          {getProductImages().map((imageSrc, index) => (
            <SwiperSlide key={index}>
              <Link to={`/product/${product.handle}`}>
                <img
                  className="img-fluid"
                  src={imageSrc}
                  alt={`${product.title} - View ${index + 1}`}
                  onError={(e) => {
                    e.target.src = `${imageBase}/pr-img.png`;
                  }}
                />
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

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

      <div className="wishlist-btn">
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

      {/* No modal: notification will show via FloatingContent */}
    </div>
  );
};

export default BestSellingCard;
