import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useStore } from "../context/StoreContext";
import { useImagePath } from "../context/ImagePathContext";

const Wishlist = () => {
  const { wishlist, removeFromWishlist, addToCart } = useStore();
  const [quantities, setQuantities] = useState({});
  const imageBase = useImagePath();

  useEffect(() => {
    // Initialize quantities for all wishlist items
    if (wishlist && Array.isArray(wishlist)) {
      const initialQuantities = {};
      wishlist.forEach((item) => {
        initialQuantities[item.id] = 1;
        // Debug: Log the item structure to see what data we have
        console.log("Wishlist item:", {
          id: item.id,
          title: item.title,
          price: item.price,
          compareAtPrice: item.compareAtPrice,
          priceAmount: item.price?.amount,
          compareAtPriceAmount: item.compareAtPrice?.amount,
        });
      });
      setQuantities(initialQuantities);
    }
  }, [wishlist]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setQuantities((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }));
  };

  const handleAddToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      handle: item.handle,
      quantity: quantity,
    });
    // Remove from wishlist after adding to cart, but suppress notification
    removeFromWishlist(item.id, false);
  };

  const handleRemoveFromWishlist = (itemId) => {
    removeFromWishlist(itemId);
  };

  return (
    <div className="wishlist-page">
      <div className="breadcrumb">
        <div className="container-xxl">
          <div className="row">
            <div className="breadcrumb-content">
              <Link to="/"> Home</Link> /
              <Link to={"/wishlist"} className="active">
                Wishlist
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="wishlist-info">
        <div className="container-xxl">
          <div className="wishlist-table">
            {!wishlist || wishlist.length === 0 ? (
              <div className="empty-wishlist">
                <div className="empty-content">
                  <Icon icon="mdi:heart-outline" width="64" height="64" />
                  <h3>Your wishlist is empty</h3>
                  <p>Add products you love to your wishlist</p>
                  <Link to="/shop" className="continue-shopping-btn">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            ) : (
              <div className="wishlist-content">
                <div className="wishlist-header">
                  <h2>My Wishlist ({wishlist?.length || 0} items)</h2>
                </div>

                <div className="wishlist-table-wrapper">
                  <table className="wishlist-table-desktop">
                    <thead>
                      <tr>
                        <th className="product-col">Product</th>
                        <th className="price-col">Price</th>
                        <th className="quantity-col">Quantity</th>
                        <th className="action-col">Add to cart</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wishlist?.map((item) => (
                        <tr key={item.id} className="wishlist-item">
                          <td className="product-cell">
                            <button
                              className="remove-btn"
                              onClick={() => handleRemoveFromWishlist(item.id)}
                              aria-label="Remove from wishlist"
                            >
                              <Icon icon="mdi:close" width="16" height="16" />
                            </button>
                            <div className="product-info">
                              <div className="product-image">
                                <img
                                  src={item.image || `${imageBase}/pr-img.png`}
                                  alt={item.title}
                                  onError={(e) => {
                                    e.target.src = `${imageBase}/pr-img.png`;
                                  }}
                                />
                              </div>
                              <div className="product-details">
                                <Link
                                  to={`/product/${item.handle}`}
                                  className="product-title"
                                >
                                  {item.title}
                                </Link>
                              </div>
                            </div>
                          </td>
                          <td className="price-cell">
                            <div className="price-info">
                              {item.compareAtPrice?.amount &&
                                parseFloat(item.compareAtPrice.amount) > 0 &&
                                parseFloat(item.compareAtPrice.amount) >
                                  parseFloat(
                                    item.price?.amount || item.price || 0
                                  ) && (
                                  <span className="original-price">
                                    ₹
                                    {parseFloat(
                                      item.compareAtPrice.amount
                                    ).toFixed(0)}
                                  </span>
                                )}
                              <span
                                className={
                                  item.compareAtPrice?.amount &&
                                  parseFloat(item.compareAtPrice.amount) > 0 &&
                                  parseFloat(item.compareAtPrice.amount) >
                                    parseFloat(
                                      item.price?.amount || item.price || 0
                                    )
                                    ? "sale-price"
                                    : "current-price"
                                }
                              >
                                ₹
                                {parseFloat(
                                  item.price?.amount || item.price || 0
                                ).toFixed(0)}
                              </span>
                            </div>
                          </td>
                          <td className="quantity-cell">
                            <div className="quantity-controls">
                              <button
                                className="qty-btn minus"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    (quantities[item.id] || 1) - 1
                                  )
                                }
                                disabled={(quantities[item.id] || 1) <= 1}
                              >
                                <Icon icon="mdi:minus" width="16" height="16" />
                              </button>
                              <span className="qty-display">
                                {quantities[item.id] || 1}
                              </span>
                              <button
                                className="qty-btn plus"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    (quantities[item.id] || 1) + 1
                                  )
                                }
                              >
                                <Icon icon="mdi:plus" width="16" height="16" />
                              </button>
                            </div>
                          </td>
                          <td className="action-cell">
                            <button
                              className="add-to-cart-btn"
                              onClick={() => handleAddToCart(item)}
                            >
                              <Icon icon="mage:basket" width="16" height="16" />
                              Add to cart
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Mobile Card View */}
                  <div className="wishlist-mobile">
                    {wishlist?.map((item) => (
                      <div key={item.id} className="wishlist-card">
                        <button
                          className="remove-btn-mobile"
                          onClick={() => handleRemoveFromWishlist(item.id)}
                          aria-label="Remove from wishlist"
                        >
                          <Icon icon="mdi:close" width="20" height="20" />
                        </button>

                        <div className="card-content">
                          <div className="product-section">
                            <div className="product-info">
                              <div className="product-image">
                                <img
                                  src={item.image || `${imageBase}/pr-img.png`}
                                  alt={item.title}
                                  onError={(e) => {
                                    e.target.src = `${imageBase}/pr-img.png`;
                                  }}
                                />
                              </div>
                              <div className="product-details">
                                <Link
                                  to={`/product/${item.handle}`}
                                  className="product-title"
                                >
                                  {item.title}
                                </Link>
                              </div>
                            </div>
                          </div>

                          <div
                            className="price-section"
                            data-label="Product Price:"
                          >
                            <div className="price-info">
                              {item.compareAtPrice?.amount &&
                                parseFloat(item.compareAtPrice.amount) > 0 &&
                                parseFloat(item.compareAtPrice.amount) >
                                  parseFloat(
                                    item.price?.amount || item.price || 0
                                  ) && (
                                  <span className="original-price">
                                    ₹
                                    {parseFloat(
                                      item.compareAtPrice.amount
                                    ).toFixed(0)}
                                  </span>
                                )}
                              <span
                                className={
                                  item.compareAtPrice?.amount &&
                                  parseFloat(item.compareAtPrice.amount) > 0 &&
                                  parseFloat(item.compareAtPrice.amount) >
                                    parseFloat(
                                      item.price?.amount || item.price || 0
                                    )
                                    ? "sale-price"
                                    : "current-price"
                                }
                              >
                                ₹
                                {parseFloat(
                                  item.price?.amount || item.price || 0
                                ).toFixed(0)}
                              </span>
                            </div>
                          </div>

                          <div
                            className="quantity-section"
                            data-label="Quantity:"
                          >
                            <div className="quantity-controls">
                              <button
                                className="qty-btn minus"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    (quantities[item.id] || 1) - 1
                                  )
                                }
                                disabled={(quantities[item.id] || 1) <= 1}
                              >
                                <Icon icon="mdi:minus" width="16" height="16" />
                              </button>
                              <span className="qty-display">
                                {quantities[item.id] || 1}
                              </span>
                              <button
                                className="qty-btn plus"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    (quantities[item.id] || 1) + 1
                                  )
                                }
                              >
                                <Icon icon="mdi:plus" width="16" height="16" />
                              </button>
                            </div>
                          </div>

                          <div className="action-section" data-label="Action:">
                            <button
                              className="add-to-cart-btn"
                              onClick={() => handleAddToCart(item)}
                            >
                              <Icon icon="mage:basket" width="16" height="16" />
                              Add to cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
