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

  // Fetch all Shopify data once when the app loads
  useEffect(() => {
    const fetchShopifyData = async () => {
      if (dataFetched) return; // Prevent duplicate calls

      try {
        setLoading(true);
        console.log("StoreContext: Fetching Shopify data...");

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
          getProductsByCollection("trending"),
          getProductsByCollection("smart-cart"),
        ]);

        setProducts(fetchedProducts || []);
        setCollections(fetchedCollections || []);
        setNewProducts(fetchedNewProducts || []);
        setTrendingProducts(fetchedTrendingProducts || []);
        setSmartCartProducts(fetchedSmartCartProducts || []);
        setDataFetched(true);

        console.log("StoreContext: Shopify data fetched successfully", {
          products: fetchedProducts?.length || 0,
          collections: fetchedCollections?.length || 0,
          newProducts: fetchedNewProducts?.length || 0,
          trendingProducts: fetchedTrendingProducts?.length || 0,
          smartCartProducts: fetchedSmartCartProducts?.length || 0,
        });
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
      console.log("StoreContext received cartUpdated event:", event.detail);
      const { cart: updatedCart } = event.detail;
      setCart(updatedCart);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    console.log("StoreContext: Event listener added for cartUpdated");

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
      console.log("StoreContext: Event listener removed for cartUpdated");
    };
  }, []);

  // Example add/remove functions (replace with your logic)
  const addToCart = (item) => {
    const updatedCart = [...cart, item];
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

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
          action: "added",
          item: notificationItem,
        },
      })
    );
  };

  const removeFromCart = (id, variant = null) => {
    const itemToRemove = cart.find((item) => {
      if (variant !== null) {
        return (
          item.id === id &&
          (item.variant || "default") === (variant || "default")
        );
      }
      return item.id === id;
    });

    const updatedCart = cart.filter((item) => {
      // If variant is specified, match both id and variant
      if (variant !== null) {
        return !(
          item.id === id &&
          (item.variant || "default") === (variant || "default")
        );
      }
      // Otherwise just match id (legacy behavior)
      return item.id !== id;
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

  const addToWishlist = (item) => {
    const updatedWishlist = [...wishlist, item];
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
  };

  const removeFromWishlist = (id) => {
    const updatedWishlist = wishlist.filter((i) => i.id !== id);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
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
