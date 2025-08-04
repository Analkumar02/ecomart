import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getProducts,
  getCollections,
  getProductsByCollection,
} from "../utils/shopify";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Shopify data state
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [smartCartProducts, setSmartCartProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const savedWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setCart(savedCart);
    setWishlist(savedWishlist);
  }, []);

  // Listen for external cart updates from component cards
  useEffect(() => {
    const handleExternalCartUpdate = () => {
      const updatedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCart(updatedCart);
    };

    // Listen for custom events from component cards
    window.addEventListener("externalCartUpdate", handleExternalCartUpdate);

    return () => {
      window.removeEventListener(
        "externalCartUpdate",
        handleExternalCartUpdate
      );
    };
  }, []);

  // Fetch all Shopify data once when the app loads
  useEffect(() => {
    const fetchShopifyData = async () => {
      if (dataFetched) return; // Prevent duplicate calls

      try {
        setLoading(true);
        // Removed console logging to reduce console spam

        // Fetch all data in parallel
        const [
          fetchedProducts,
          fetchedCollections,
          fetchedNewProducts,
          fetchedTrendingProducts,
          fetchedSmartCartProducts,
        ] = await Promise.all([
          getProducts(),
          getCollections(),
          getProductsByCollection("new"),
          getProductsByCollection("trending-products"),
          getProductsByCollection("smart-cart"),
        ]);

        setProducts(fetchedProducts || []);
        setCollections(fetchedCollections || []);
        setNewProducts(fetchedNewProducts || []);
        setTrendingProducts(fetchedTrendingProducts || []);
        setSmartCartProducts(fetchedSmartCartProducts || []);
        setDataFetched(true);

        // Removed success logging to reduce console spam
      } catch (error) {
        console.error("StoreContext: Error fetching Shopify data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopifyData();
  }, [dataFetched]);

  // Listen for cart updates from ProductCard
  useEffect(() => {
    const handleCartUpdate = (event) => {
      // Defensive check to ensure event.detail exists
      if (event.detail && event.detail.cart) {
        const { cart: updatedCart } = event.detail;
        setCart(updatedCart);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    // Removed event listener logging to reduce console spam

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      // Removed event listener logging to reduce console spam
    };
  }, []);

  // Example add/remove functions (replace with your logic)
  const addToCart = (item) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      (cartItem) =>
        cartItem.id === item.id &&
        (cartItem.variant || "Default Title") ===
          (item.variant || "Default Title")
    );

    let updatedCart;
    if (existingItemIndex !== -1) {
      // Update existing item quantity
      updatedCart = [...cart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: item.quantity,
      };
    } else {
      // Add new item to cart
      updatedCart = [...cart, item];
    }

    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // Dispatch cart updated event for components that need to sync
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: {
          cart: updatedCart,
        },
      })
    );

    // Dispatch notification event
    const notificationItem = {
      title: item.title,
      variant: item.variant !== "Default Title" ? item.variant : null,
      image: item.image,
      quantity: item.quantity || 1,
    };

    window.dispatchEvent(
      new CustomEvent("cartNotification", {
        detail: {
          action: existingItemIndex !== -1 ? "updated" : "added",
          item: notificationItem,
        },
      })
    );
  };

  // Check if product is in cart
  const isInCart = (productId, variantId = "Default Title") => {
    return cart.some((item) => {
      // Check both formats: new format (id/variant) and old format (productId/variantId)
      const matchesNewFormat =
        item.id === productId &&
        (item.variant || "Default Title") === (variantId || "Default Title");

      const matchesOldFormat =
        item.productId === productId &&
        (item.variantId === variantId ||
          (item.variantTitle || "Default Title") ===
            (variantId || "Default Title"));

      return matchesNewFormat || matchesOldFormat;
    });
  };

  // Get cart item
  const getCartItem = (productId, variantId = "Default Title") => {
    return cart.find((item) => {
      // Check both formats: new format (id/variant) and old format (productId/variantId)
      const matchesNewFormat =
        item.id === productId &&
        (item.variant || "Default Title") === (variantId || "Default Title");

      const matchesOldFormat =
        item.productId === productId &&
        (item.variantId === variantId ||
          (item.variantTitle || "Default Title") ===
            (variantId || "Default Title"));

      return matchesNewFormat || matchesOldFormat;
    });
  };

  const removeFromCart = (id, variant = null) => {
    const itemToRemove = cart.find((item) => {
      if (variant !== null) {
        // Check both formats
        const matchesNewFormat =
          item.id === id &&
          (item.variant || "default") === (variant || "default");

        const matchesOldFormat =
          item.productId === id &&
          (item.variantId === variant ||
            (item.variantTitle || "default") === (variant || "default"));

        return matchesNewFormat || matchesOldFormat;
      }
      return item.id === id || item.productId === id;
    });

    const updatedCart = cart.filter((item) => {
      // If variant is specified, match both id and variant
      if (variant !== null) {
        const matchesNewFormat =
          item.id === id &&
          (item.variant || "default") === (variant || "default");

        const matchesOldFormat =
          item.productId === id &&
          (item.variantId === variant ||
            (item.variantTitle || "default") === (variant || "default"));

        return !(matchesNewFormat || matchesOldFormat);
      }
      // Otherwise just match id (legacy behavior)
      return !(item.id === id || item.productId === id);
    });
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // Dispatch cart update event
    window.dispatchEvent(
      new CustomEvent("cartUpdated", {
        detail: { cart: updatedCart },
      })
    );

    // Dispatch notification event if item was found
    if (itemToRemove) {
      const notificationItem = {
        title: itemToRemove.title,
        variant:
          itemToRemove.variant !== "Default Title"
            ? itemToRemove.variant
            : null,
        image: itemToRemove.image,
        quantity: itemToRemove.quantity || 1,
      };

      window.dispatchEvent(
        new CustomEvent("cartNotification", {
          detail: {
            action: "removed",
            item: notificationItem,
          },
        })
      );
    }
  };

  // Helper function to extract image URL from various image formats
  const getImageUrl = (image) => {
    if (!image) return null;
    if (typeof image === "string") return image;
    if (image.url) return image.url;
    if (image.src) return image.src;
    if (image.originalSrc) return image.originalSrc;
    return null;
  };

  const addToWishlist = (item) => {
    // Check if item already exists in wishlist
    const existingItem = wishlist.find((w) => w.id === item.id);
    if (existingItem) {
      return; // Item already in wishlist, don't add again
    }

    const updatedWishlist = [...wishlist, item];
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    // Dispatch wishlist notification event
    window.dispatchEvent(
      new CustomEvent("wishlistNotification", {
        detail: {
          action: "added",
          item: {
            title: item.title,
            image: getImageUrl(item.image),
          },
        },
      })
    );
  };

  const removeFromWishlist = (id, showNotification = true) => {
    const itemToRemove = wishlist.find((item) => item.id === id);
    const updatedWishlist = wishlist.filter((i) => i.id !== id);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    // Dispatch wishlist notification event only if showNotification is true
    if (itemToRemove && showNotification) {
      window.dispatchEvent(
        new CustomEvent("wishlistNotification", {
          detail: {
            action: "removed",
            item: {
              title: itemToRemove.title,
              image: getImageUrl(itemToRemove.image),
            },
          },
        })
      );
    }
  };

  const toggleWishlist = (item) => {
    const existingItem = wishlist.find((w) => w.id === item.id);
    if (existingItem) {
      removeFromWishlist(item.id);
      return false; // Item was removed
    } else {
      addToWishlist(item);
      return true; // Item was added
    }
  };

  const isInWishlist = (productOrId) => {
    // Handle both product object and product ID
    const productId =
      typeof productOrId === "object" ? productOrId?.id : productOrId;
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        isInCart,
        getCartItem,
        // Shopify data
        products,
        collections,
        newProducts,
        trendingProducts,
        smartCartProducts,
        loading,
        dataFetched,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
