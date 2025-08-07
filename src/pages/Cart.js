import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useStore } from "../context/StoreContext";
import { useImagePath } from "../context/ImagePathContext";

const Cart = () => {
  const { cart, removeFromCart, addToCart, clearCart } = useStore();
  const [quantities, setQuantities] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isMobileCartExpanded, setIsMobileCartExpanded] = useState(true);
  const imageBase = useImagePath();

  // Shipping configuration
  const FREE_SHIPPING_THRESHOLD = 500;
  const SHIPPING_RATE = 20;

  // Available coupons
  const availableCoupons = [
    {
      id: "FLAT100",
      title: "Flat ₹100 Off",
      description: "Get flat ₹100 off on your order",
      type: "flat",
      value: 100,
      minAmount: 0,
      icon: "💰",
    },
    {
      id: "SAVE20",
      title: "20% Off",
      description: "Get 20% off on orders above ₹1000",
      type: "percentage",
      value: 20,
      minAmount: 1000,
      icon: "🎉",
    },
  ];

  // Initialize quantities for all cart items
  useEffect(() => {
    if (cart && Array.isArray(cart)) {
      const initialQuantities = {};
      cart.forEach((item) => {
        const key = `${item.id}-${item.variant || "Default Title"}`;
        initialQuantities[key] = item.quantity || 1;
      });
      setQuantities(initialQuantities);
    }
  }, [cart]);

  // Load applied coupon from localStorage
  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon");
    const savedDiscount = localStorage.getItem("couponDiscount");

    if (savedCoupon && savedDiscount) {
      setAppliedCoupon(JSON.parse(savedCoupon));
      setCouponDiscount(parseFloat(savedDiscount));
    }
  }, []);

  // Calculate totals
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price?.amount || item.price || 0);
      const quantity = item.quantity || 1;
      return total + price * quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const total = subtotal + shippingCost - couponDiscount;
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  );

  const handleQuantityChange = (productId, variant, newQuantity) => {
    if (newQuantity < 1) return;

    const key = `${productId}-${variant || "Default Title"}`;
    setQuantities((prev) => ({
      ...prev,
      [key]: newQuantity,
    }));

    // Update cart with new quantity
    const updatedItem = cart.find(
      (item) =>
        item.id === productId &&
        (item.variant || "Default Title") === (variant || "Default Title")
    );

    if (updatedItem) {
      addToCart({
        ...updatedItem,
        quantity: newQuantity,
      });
    }
  };

  const handleRemoveFromCart = (productId, variant = null) => {
    removeFromCart(productId, variant);
  };

  const handleClearAll = () => {
    clearCart();
  };

  const applyCoupon = () => {
    // Simple coupon logic - you can expand this
    const validCoupons = {
      SAVE10: 10,
      WELCOME20: 20,
      DISCOUNT50: 50,
    };

    if (validCoupons[couponCode.toUpperCase()]) {
      setCouponDiscount(validCoupons[couponCode.toUpperCase()]);
    } else {
      setCouponDiscount(0);
      // You could show an error message here
    }
  };

  // Apply new coupon function
  const applyNewCoupon = (coupon) => {
    const currentSubtotal = calculateSubtotal();

    if (coupon.minAmount > 0 && currentSubtotal < coupon.minAmount) {
      alert(
        `Minimum order amount of ₹${coupon.minAmount} required for this coupon`
      );
      return;
    }

    let discount = 0;
    if (coupon.type === "flat") {
      discount = coupon.value;
    } else if (coupon.type === "percentage") {
      discount = (currentSubtotal * coupon.value) / 100;
    }

    setAppliedCoupon(coupon);
    setCouponDiscount(discount);

    // Save coupon data to localStorage for checkout page
    localStorage.setItem("appliedCoupon", JSON.stringify(coupon));
    localStorage.setItem("couponDiscount", discount.toString());
  };

  // Remove coupon function
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);

    // Remove coupon data from localStorage
    localStorage.removeItem("appliedCoupon");
    localStorage.removeItem("couponDiscount");
  };

  return (
    <div className="cart-page">
      <div className="breadcrumb">
        <div className="container-xxl">
          <div className="row">
            <div className="breadcrumb-content">
              <Link to="/"> Home</Link> /
              <Link to={"/cart"} className="active">
                Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="cart-info">
        <div className="container-xxl">
          <div className="row">
            {!cart || cart.length === 0 ? (
              // Empty cart layout - full width
              <div className="col-12">
                <div className="empty-cart">
                  <div className="empty-content">
                    <Icon icon="mdi:cart-outline" width="64" height="64" />
                    <h3>Your cart is empty</h3>
                    <p>Add some products to your cart</p>
                    <Link to="/shop" className="continue-shopping-btn">
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              // Cart with items layout
              <>
                <div className="col-lg-8 col-md-12">
                  <div className="cart-box">
                    <div className="cart-progress">
                      <div className="text-area">
                        <Icon
                          icon={
                            remainingForFreeShipping > 0
                              ? "icon-park-outline:shopping-cart"
                              : "mdi:check-circle"
                          }
                          width="18"
                          height="18"
                        />
                        <p>
                          {remainingForFreeShipping > 0 ? (
                            <>
                              Add<span> ₹{remainingForFreeShipping} </span>to
                              cart and get free shipping!
                            </>
                          ) : (
                            "You've earned free shipping!"
                          )}
                        </p>
                      </div>
                      <div className="progressbar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              (subtotal / FREE_SHIPPING_THRESHOLD) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Coupon Section */}
                    <div className="coupon-section">
                      <div className="coupon-header">
                        <Icon
                          icon="mdi:ticket-percent"
                          width="20"
                          height="20"
                        />
                        <h6>Available Coupons</h6>
                      </div>

                      {!appliedCoupon ? (
                        <div className="available-coupons">
                          {availableCoupons.map((coupon) => {
                            const isEligible =
                              calculateSubtotal() >= coupon.minAmount;
                            return (
                              <div
                                key={coupon.id}
                                className={`coupon-card ${
                                  !isEligible ? "disabled" : ""
                                }`}
                              >
                                <div className="coupon-icon">{coupon.icon}</div>
                                <div className="coupon-details">
                                  <h6>{coupon.title}</h6>
                                  <p>{coupon.description}</p>
                                  {coupon.minAmount > 0 && (
                                    <small>
                                      Min. order: ₹{coupon.minAmount}
                                    </small>
                                  )}
                                </div>
                                <button
                                  className={`apply-btn ${
                                    !isEligible ? "disabled" : ""
                                  }`}
                                  onClick={() => applyNewCoupon(coupon)}
                                  disabled={!isEligible}
                                >
                                  Apply
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="applied-coupon">
                          <div className="coupon-card applied">
                            <div className="coupon-icon">
                              {appliedCoupon.icon}
                            </div>
                            <div className="coupon-details">
                              <h6>{appliedCoupon.title}</h6>
                              <p>Coupon applied successfully!</p>
                              <span className="discount-amount">
                                -
                                {appliedCoupon.type === "percentage"
                                  ? `${
                                      appliedCoupon.value
                                    }% (₹${couponDiscount.toFixed(2)})`
                                  : `₹${couponDiscount.toFixed(2)}`}
                              </span>
                            </div>
                            <button
                              className="remove-btn"
                              onClick={removeCoupon}
                            >
                              <Icon icon="mdi:close" width="16" height="16" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="cart-content">
                      <div className="cart-table-wrapper">
                        <table className="cart-table-desktop">
                          <thead>
                            <tr>
                              <th className="product-col">Product</th>
                              <th className="price-col">Price</th>
                              <th className="quantity-col">Quantity</th>
                              <th className="subtotal-col">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cart?.map((item) => {
                              const key = `${item.id}-${
                                item.variant || "Default Title"
                              }`;
                              const currentQuantity =
                                quantities[key] || item.quantity || 1;
                              const price = parseFloat(
                                item.price?.amount || item.price || 0
                              );
                              const itemSubtotal = price * currentQuantity;

                              return (
                                <tr key={key} className="cart-item">
                                  <td className="product-cell">
                                    <button
                                      className="remove-btn"
                                      onClick={() =>
                                        handleRemoveFromCart(
                                          item.id,
                                          item.variant
                                        )
                                      }
                                      aria-label="Remove from cart"
                                    >
                                      <Icon
                                        icon="mdi:close"
                                        width="16"
                                        height="16"
                                      />
                                    </button>
                                    <div className="product-info">
                                      <div className="product-image">
                                        <img
                                          src={
                                            item.image ||
                                            `${imageBase}/pr-img.webp`
                                          }
                                          alt={item.title}
                                          loading="lazy"
                                          onError={(e) => {
                                            e.target.src = `${imageBase}/pr-img.webp`;
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
                                        {item.variant &&
                                          item.variant !== "Default Title" && (
                                            <span className="product-variant">
                                              {item.variant}
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="price-cell">
                                    <div className="price-info">
                                      {item.compareAtPrice?.amount &&
                                        parseFloat(item.compareAtPrice.amount) >
                                          0 &&
                                        parseFloat(item.compareAtPrice.amount) >
                                          price && (
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
                                          parseFloat(
                                            item.compareAtPrice.amount
                                          ) > 0 &&
                                          parseFloat(
                                            item.compareAtPrice.amount
                                          ) > price
                                            ? "sale-price"
                                            : "current-price"
                                        }
                                      >
                                        ₹{price.toFixed(0)}
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
                                            item.variant,
                                            currentQuantity - 1
                                          )
                                        }
                                        disabled={currentQuantity <= 1}
                                      >
                                        <Icon
                                          icon="mdi:minus"
                                          width="16"
                                          height="16"
                                        />
                                      </button>
                                      <span className="qty-display">
                                        {currentQuantity}
                                      </span>
                                      <button
                                        className="qty-btn plus"
                                        onClick={() =>
                                          handleQuantityChange(
                                            item.id,
                                            item.variant,
                                            currentQuantity + 1
                                          )
                                        }
                                      >
                                        <Icon
                                          icon="mdi:plus"
                                          width="16"
                                          height="16"
                                        />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="subtotal-cell">
                                    <span className="subtotal-amount">
                                      ₹{itemSubtotal.toFixed(0)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="cart-items-mobile d-block d-md-none">
                          <div
                            className="mobile-cart-header"
                            onClick={() =>
                              setIsMobileCartExpanded(!isMobileCartExpanded)
                            }
                          >
                            <div className="header-content">
                              <div className="header-left">
                                <div className="cart-icon">
                                  <Icon
                                    icon="mdi:shopping"
                                    width="20"
                                    height="20"
                                  />
                                </div>
                                <div className="header-text">
                                  <h6>Your Cart</h6>
                                  <span className="item-count">
                                    {cart?.length || 0}{" "}
                                    {cart?.length === 1 ? "item" : "items"}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`toggle-icon ${
                                  isMobileCartExpanded ? "expanded" : ""
                                }`}
                              >
                                <Icon
                                  icon="mdi:chevron-down"
                                  width="18"
                                  height="18"
                                />
                              </div>
                            </div>
                          </div>
                          {isMobileCartExpanded && (
                            <div className="mobile-cart-items">
                              {cart?.map((item) => {
                                const key = `${item.id}-${
                                  item.variant || "Default Title"
                                }`;
                                const currentQuantity =
                                  quantities[key] || item.quantity || 1;
                                const price = parseFloat(
                                  item.price?.amount || item.price || 0
                                );
                                const itemSubtotal = price * currentQuantity;

                                return (
                                  <div key={key} className="cart-item">
                                    <div className="item-main">
                                      <div className="product-thumb">
                                        <img
                                          src={
                                            item.image ||
                                            `${imageBase}/pr-img.webp`
                                          }
                                          alt={item.title}
                                          loading="lazy"
                                          onError={(e) => {
                                            e.target.src = `${imageBase}/pr-img.webp`;
                                          }}
                                        />
                                      </div>
                                      <div className="item-details">
                                        <div className="product-info">
                                          <Link
                                            to={`/product/${item.handle}`}
                                            className="product-title"
                                          >
                                            {item.title}
                                          </Link>
                                          {item.variant &&
                                            item.variant !==
                                              "Default Title" && (
                                              <span className="product-variant">
                                                {item.variant}
                                              </span>
                                            )}
                                          <div className="subtotal">
                                            Subtotal: ₹{itemSubtotal.toFixed(0)}
                                          </div>
                                        </div>
                                        <div className="quantity-controls">
                                          <button
                                            className="qty-btn minus"
                                            onClick={() =>
                                              handleQuantityChange(
                                                item.id,
                                                item.variant,
                                                currentQuantity - 1
                                              )
                                            }
                                            disabled={currentQuantity <= 1}
                                          >
                                            <Icon
                                              icon="mdi:minus"
                                              width="14"
                                              height="14"
                                            />
                                          </button>
                                          <span className="qty-display">
                                            {currentQuantity}
                                          </span>
                                          <button
                                            className="qty-btn plus"
                                            onClick={() =>
                                              handleQuantityChange(
                                                item.id,
                                                item.variant,
                                                currentQuantity + 1
                                              )
                                            }
                                          >
                                            <Icon
                                              icon="mdi:plus"
                                              width="14"
                                              height="14"
                                            />
                                          </button>
                                        </div>
                                      </div>
                                      <button
                                        className="remove-btn"
                                        onClick={() =>
                                          handleRemoveFromCart(
                                            item.id,
                                            item.variant
                                          )
                                        }
                                        aria-label="Remove from cart"
                                      >
                                        <Icon
                                          icon="mdi:close"
                                          width="16"
                                          height="16"
                                        />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Coupon Section */}
                      <div className="coupon-section">
                        <div className="coupon-input-group">
                          <input
                            type="text"
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="coupon-input"
                          />
                          <button
                            className="apply-coupon-btn"
                            onClick={applyCoupon}
                          >
                            Apply coupon
                          </button>
                        </div>

                        <button
                          className="clear-all-btn"
                          onClick={handleClearAll}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4 col-md-4 col-sm-12 co-12">
                  <div className="cart-total">
                    <div className="cart-total-header">
                      <h5>Cart total</h5>
                      <div className="divider1">
                        <span className="green-line"></span>
                        <span className="gray-line"></span>
                      </div>
                    </div>
                    <div className="cart-total-body">
                      <div className="subtotal">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toFixed(0)}</span>
                      </div>
                      <div className="line"></div>
                      <div className="shipping">
                        <span>Shipping</span>
                        <span>
                          {shippingCost === 0 ? "Free" : `₹${shippingCost}`}
                        </span>
                      </div>
                      {couponDiscount > 0 && (
                        <>
                          <div className="line"></div>
                          <div className="discount">
                            <span>Coupon ({appliedCoupon?.title})</span>
                            <span className="discount-amount">
                              -₹{couponDiscount.toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="line"></div>
                    </div>
                    <div className="cart-total-footer">
                      <span>Total</span>
                      <span className="total-amount">₹{total.toFixed(0)}</span>
                    </div>
                    <Link to={"/checkout"} className="checkout-btn">
                      Proceed to checkout
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
