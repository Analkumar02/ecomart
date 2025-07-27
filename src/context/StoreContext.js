import React, { createContext, useContext, useState } from "react";

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Example add/remove functions (replace with your logic)
  const addToCart = (item) => setCart((prev) => [...prev, item]);
  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i.id !== id));
  const addToWishlist = (item) => setWishlist((prev) => [...prev, item]);
  const removeFromWishlist = (id) =>
    setWishlist((prev) => prev.filter((i) => i.id !== id));

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
