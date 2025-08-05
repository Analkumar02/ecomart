import React, { useState, useEffect, useCallback, useRef } from "react";
import { useImagePath } from "../context/ImagePathContext";
import { Icon } from "@iconify/react";

const FloatingContent = () => {
  const [notifications, setNotifications] = useState([]);
  // Track timeouts for each notification by ID
  const notificationTimeouts = useRef({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const imageBase = useImagePath();

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notificationTimeouts.current[id]) {
      clearTimeout(notificationTimeouts.current[id]);
      delete notificationTimeouts.current[id];
    }
  }, []);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const handleCartUpdated = (event) => {
      const { action, item } = event.detail;

      if (action && item) {
        const notification = {
          id: Date.now() + Math.random(),
          type: action, // 'added' or 'removed'
          item: item,
          timestamp: Date.now(),
          category: "cart",
        };

        setNotifications((prev) => [...prev, notification]);

        // Remove notification after 2 seconds
        const timeoutId = setTimeout(() => {
          removeNotification(notification.id);
        }, 2000);
        notificationTimeouts.current[notification.id] = timeoutId;
      }
    };

    const handleWishlistUpdated = (event) => {
      const { action, item } = event.detail;

      if (action && item) {
        // Debug logging removed to reduce console spam

        const notification = {
          id: Date.now() + Math.random(),
          type: action, // 'added' or 'removed'
          item: item,
          timestamp: Date.now(),
          category: "wishlist",
        };

        setNotifications((prev) => [...prev, notification]);

        // Remove notification after 2 seconds
        const timeoutId = setTimeout(() => {
          removeNotification(notification.id);
        }, 2000);
        notificationTimeouts.current[notification.id] = timeoutId;
      }
    };

    window.addEventListener("cartNotification", handleCartUpdated);
    window.addEventListener("wishlistNotification", handleWishlistUpdated);

    return () => {
      window.removeEventListener("cartNotification", handleCartUpdated);
      window.removeEventListener("wishlistNotification", handleWishlistUpdated);
    };
  }, [removeNotification]);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(notificationTimeouts.current).forEach(clearTimeout);
      notificationTimeouts.current = {};
    };
  }, []);

  const getActionText = (type, category) => {
    if (category === "wishlist") {
      return type === "added" ? "Added to Wishlist" : "Removed from Wishlist";
    }
    return type === "added" ? "Added to Cart" : "Removed from Cart";
  };

  const getActionIcon = (type, category) => {
    if (category === "wishlist") {
      return type === "added" ? "mdi:heart-plus" : "mdi:heart-minus";
    }
    return type === "added" ? "mdi:cart-plus" : "mdi:cart-minus";
  };

  const getActionClass = (type, category) => {
    const baseClass =
      type === "added"
        ? "floating-notification--success"
        : "floating-notification--warning";

    if (category === "wishlist") {
      return `${baseClass} floating-notification--wishlist`;
    }
    return baseClass;
  };

  return (
    <>
      <div className="floating-notifications">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`floating-notification ${getActionClass(
              notification.type,
              notification.category
            )}`}
          >
            <div className="floating-notification__content">
              <div className="floating-notification__image">
                <img
                  src={notification.item.image || `${imageBase}/pr-img.webp`}
                  alt={notification.item.title}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = `${imageBase}/pr-img.webp`;
                  }}
                />
              </div>
              <div className="floating-notification__details">
                <div className="floating-notification__header">
                  <Icon
                    icon={getActionIcon(
                      notification.type,
                      notification.category
                    )}
                    width="16"
                    height="16"
                    className="floating-notification__icon"
                  />
                  <span className="floating-notification__action">
                    {getActionText(notification.type, notification.category)}
                  </span>
                </div>
                <div className="floating-notification__title">
                  {notification.item.title}
                </div>
                {notification.item.variant &&
                  notification.item.variant !== "Default Title" && (
                    <div className="floating-notification__variant">
                      Variant: {notification.item.variant}
                    </div>
                  )}
                {notification.category === "cart" && (
                  <div className="floating-notification__quantity">
                    Qty: {notification.item.quantity || 1}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          className="scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <Icon icon="mdi:chevron-up" width="24" height="24" />
        </button>
      )}
    </>
  );
};

export default FloatingContent;
