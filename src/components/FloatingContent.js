import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useStore } from "../context/StoreContext";

const FloatingContent = () => {
  const { cart } = useStore();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [showAddToCartPopup, setShowAddToCartPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(""); // 'added' or 'removed'
  const [affectedProduct, setAffectedProduct] = useState(null);
  const isInitialMount = useRef(true);
  const prevCartItems = useRef([]);
  const popupTimeoutRef = useRef(null);

  // Calculate total items and subtotal
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price || 0);
      const quantity = item.quantity || 1;
      return total + price * quantity;
    }, 0);
  };

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Show scroll to top button after 300px scroll
      setShowScrollTop(scrollTop > 300);

      // Show floating cart after some scroll and when cart has items
      setIsCartVisible(scrollTop > 100 && cart.length > 0);
    };

    window.addEventListener("scroll", handleScroll);

    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [cart.length]);

  // Detect when items are added or removed from cart
  useEffect(() => {
    // Skip the first render (initial mount) to prevent popup on page refresh
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCartItems.current = [...cart];
      return;
    }

    // Helper function to create unique key for product + variant combination
    const getCartItemKey = (item) => {
      return `${item.id}_${item.variant || "default"}`;
    };

    // Create maps for easier comparison
    const prevItemsMap = new Map();
    prevCartItems.current.forEach((item) => {
      prevItemsMap.set(getCartItemKey(item), item);
    });

    const currentItemsMap = new Map();
    cart.forEach((item) => {
      currentItemsMap.set(getCartItemKey(item), item);
    });

    // Check for newly added products (including variants)
    const newlyAddedProducts = cart.filter((currentItem) => {
      const key = getCartItemKey(currentItem);
      const prevItem = prevItemsMap.get(key);
      return !prevItem || (prevItem.quantity === 0 && currentItem.quantity > 0);
    });

    // Check for removed products (including variants)
    const removedProducts = prevCartItems.current.filter((prevItem) => {
      const key = getCartItemKey(prevItem);
      const currentItem = currentItemsMap.get(key);
      return (
        !currentItem ||
        (prevItem.quantity > 0 && (!currentItem || currentItem.quantity === 0))
      );
    });

    // Clear any existing timeout
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = null;
    }

    if (newlyAddedProducts.length > 0) {
      // Show popup for newly added product
      setAffectedProduct(newlyAddedProducts[0]);
      setPopupAction("added");
      setShowAddToCartPopup(true);

      // Set timeout to hide popup after 2 seconds
      popupTimeoutRef.current = setTimeout(() => {
        setShowAddToCartPopup(false);
        setAffectedProduct(null);
        popupTimeoutRef.current = null;
      }, 2000);
    } else if (removedProducts.length > 0) {
      // Show popup for removed product
      setAffectedProduct(removedProducts[0]);
      setPopupAction("removed");
      setShowAddToCartPopup(true);

      // Set timeout to hide popup after 2 seconds
      popupTimeoutRef.current = setTimeout(() => {
        setShowAddToCartPopup(false);
        setAffectedProduct(null);
        popupTimeoutRef.current = null;
      }, 2000);
    }

    // Update previous cart items
    prevCartItems.current = [...cart];
  }, [cart]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="floating-content">
      {/* Floating Cart */}
      {isCartVisible && (
        <div className="floating-cart">
          <Link to="/cart" className="floating-cart-link">
            <div className="cart-icon">
              <Icon icon="mage:basket" width="24" height="24" />
            </div>
            <div className="cart-details">
              <div className="cart-items">
                {getTotalItems()} Item{getTotalItems() !== 1 ? "s" : ""}
              </div>
              <div className="cart-subtotal">${getSubtotal().toFixed(2)}</div>
            </div>
          </Link>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          className="scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <Icon
            icon="material-symbols:keyboard-arrow-up"
            width="24"
            height="24"
          />
          <span className="scroll-text">Back To Top</span>
        </button>
      )}

      {/* Add to Cart Popup */}
      {showAddToCartPopup && affectedProduct && (
        <div className="add-to-cart-popup" data-action={popupAction}>
          <div className="popup-content">
            <div className="product-thumbnail">
              <img
                src={
                  affectedProduct.image ||
                  affectedProduct.thumbnail ||
                  "/assets/images/placeholder.jpg"
                }
                alt={affectedProduct.title}
                onError={(e) => {
                  e.target.src = "/assets/images/placeholder.jpg";
                }}
              />
            </div>
            <div className="popup-details">
              <div className="popup-icon">
                <Icon
                  icon={
                    popupAction === "added"
                      ? "material-symbols:check-circle"
                      : "material-symbols:remove-circle"
                  }
                  width="20"
                  height="20"
                />
              </div>
              <div className="popup-text">
                <div className="popup-message">
                  {popupAction === "added"
                    ? "Added to Cart!"
                    : "Removed from Cart!"}
                </div>
                <div className="product-name">{affectedProduct.title}</div>
                {affectedProduct.variant && (
                  <div className="product-variant">
                    {affectedProduct.variant}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingContent;
