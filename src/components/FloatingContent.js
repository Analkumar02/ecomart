import React, { useState, useEffect, useCallback } from "react";
import { useImagePath } from "../context/ImagePathContext";
import { Icon } from "@iconify/react";

const FloatingContent = () => {
  const [notifications, setNotifications] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const imageBase = useImagePath();

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
        };

        setNotifications((prev) => [...prev, notification]);

        // Remove notification after 2 seconds
        const timeoutId = setTimeout(() => {
          removeNotification(notification.id);
        }, 2000);

        // Store timeout ID for cleanup if needed
        notification.timeoutId = timeoutId;
      }
    };

    window.addEventListener("cartNotification", handleCartUpdated);
    return () =>
      window.removeEventListener("cartNotification", handleCartUpdated);
  }, [removeNotification]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      notifications.forEach((notification) => {
        if (notification.timeoutId) {
          clearTimeout(notification.timeoutId);
        }
      });
    };
  }, [notifications]);

  const getActionText = (type) => {
    return type === "added" ? "Added to Cart" : "Removed from Cart";
  };

  const getActionIcon = (type) => {
    return type === "added" ? "mdi:cart-plus" : "mdi:cart-minus";
  };

  const getActionClass = (type) => {
    return type === "added"
      ? "floating-notification--success"
      : "floating-notification--warning";
  };

  return (
    <>
      <div className="floating-notifications">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`floating-notification ${getActionClass(
              notification.type
            )}`}
          >
            <div className="floating-notification__content">
              <div className="floating-notification__image">
                <img
                  src={notification.item.image || `${imageBase}/pr-img.png`}
                  alt={notification.item.title}
                  onError={(e) => {
                    e.target.src = `${imageBase}/pr-img.png`;
                  }}
                />
              </div>
              <div className="floating-notification__details">
                <div className="floating-notification__header">
                  <Icon
                    icon={getActionIcon(notification.type)}
                    width="16"
                    height="16"
                    className="floating-notification__icon"
                  />
                  <span className="floating-notification__action">
                    {getActionText(notification.type)}
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
                <div className="floating-notification__quantity">
                  Qty: {notification.item.quantity || 1}
                </div>
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
