import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const ThankYou = () => {
  const [orderData, setOrderData] = useState(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [shopifyOrderNumber, setShopifyOrderNumber] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order data from localStorage
    const guestUserId = localStorage.getItem("guestUserId");
    const lastOrderNumber = localStorage.getItem("lastOrderNumber");
    const lastShopifyOrderNumber = localStorage.getItem(
      "lastShopifyOrderNumber"
    );

    if (guestUserId) {
      const storedOrderData = localStorage.getItem(`orderData_${guestUserId}`);
      if (storedOrderData) {
        setOrderData(JSON.parse(storedOrderData));
      }
    }

    if (lastOrderNumber) {
      setOrderNumber(lastOrderNumber);
    }

    if (lastShopifyOrderNumber) {
      setShopifyOrderNumber(lastShopifyOrderNumber);
    }

    setLoading(false);

    // Optional: Clean up order data after a delay (uncomment if you want to clear data)
    // This helps prevent users from refreshing and seeing old order data
    setTimeout(() => {
      if (guestUserId) {
        localStorage.removeItem(`orderData_${guestUserId}`);
      }
      localStorage.removeItem("lastOrderNumber");
      localStorage.removeItem("lastShopifyOrderNumber");
      localStorage.removeItem("lastShopifyOrderId");
      localStorage.removeItem("guestUserId");
    }, 300000); // Clean up after 5 minutes (300000ms)
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!orderData) {
    return (
      <div className="thank-you-page">
        <div className="container-xxl">
          <div className="row">
            <div className="col-md-12">
              <div className="thankyou-message">
                No order data found. Please place an order first.
              </div>
              <Link to="/shop" className="btn btn-primary">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate subtotal from cart
  const subtotal = orderData.cart.reduce((total, item) => {
    const price = parseFloat(item.price?.amount || item.price || 0);
    const quantity = item.quantity || 1;
    return total + price * quantity;
  }, 0);

  // Get shipping cost
  const shippingCost = subtotal >= 500 ? 0 : 20;
  const handlingFee = 10;

  // Calculate coupon discount if any
  const couponDiscount =
    orderData.total - (subtotal + shippingCost + handlingFee);
  const hasCouponDiscount = Math.abs(couponDiscount) > 0.01;
  return (
    <div className="thank-you-page">
      <div className="breadcrumb">
        <div className="container-xxl">
          <div className="row">
            <div className="breadcrumb-content">
              <Link to="/"> Home</Link> / <Link to="/checkout"> checkout</Link>{" "}
              /
              <Link to={"/thankyou"} className="active">
                Order received
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="thank-you-content">
        <div className="container-xxl">
          <div className="row">
            <div className="col-md-12">
              <div className="thankyou-message">
                Thank you. Your order has been received
              </div>
              <div className="order-info">
                <div className="order-number">
                  Order number:{" "}
                  <span>{shopifyOrderNumber || orderNumber || "N/A"}</span>
                </div>
                {shopifyOrderNumber &&
                  orderNumber &&
                  shopifyOrderNumber !== orderNumber && (
                    <div className="order-number">
                      Local order number: <span>{orderNumber}</span>
                    </div>
                  )}
                <div className="order-date">
                  Date: <span>{formatDate(orderData.timestamp)}</span>
                </div>
                <div className="order-total">
                  Total: <span>₹{orderData.total.toFixed(2)}</span>
                </div>
                <div className="payment-method">
                  Payment method: <span>Cash on delivery</span>
                </div>
              </div>
              <div className="user-alert">Pay with cash upon delivery.</div>
              {orderData.orderNotes && (
                <div className="order-notes">
                  <div className="title">Order Notes</div>
                  <div className="notes-content">{orderData.orderNotes}</div>
                </div>
              )}
              <div className="oreder-details">
                <div className="title">Order details</div>
                <div className="order-details-table">
                  <table className="table table-bordered border-custom">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          {orderData.cart.map((item, index) => (
                            <div key={index}>
                              {item.title} <b>x {item.quantity}</b>
                              {index < orderData.cart.length - 1 && (
                                <>
                                  <br />
                                  <br />
                                </>
                              )}
                            </div>
                          ))}
                        </td>
                        <td>₹{subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="label">Subtotal:</td>
                        <td>₹{subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="label">Shipping:</td>
                        <td>
                          {shippingCost === 0
                            ? "Free"
                            : `₹${shippingCost.toFixed(2)}`}
                        </td>
                      </tr>
                      <tr>
                        <td className="label">Handling Fee:</td>
                        <td>₹{handlingFee.toFixed(2)}</td>
                      </tr>
                      {hasCouponDiscount && (
                        <tr>
                          <td className="label">Coupon Discount:</td>
                          <td>-₹{Math.abs(couponDiscount).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="label">Payment method:</td>
                        <td>Cash on delivery</td>
                      </tr>
                      <tr>
                        <td className="total">Total:</td>
                        <td className="total">₹{orderData.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 col-12">
              <div className="billing-info">
                <div className="title">Billing Information</div>
                <div className="info">
                  <div className="name">
                    {orderData.billing.firstName} {orderData.billing.lastName}
                  </div>
                  <div className="email">{orderData.billing.email}</div>
                  <div className="address">
                    {orderData.billing.streetAddress},<br />
                    {orderData.billing.townCity}, {orderData.billing.state} –{" "}
                    {orderData.billing.pinCode}
                    <br />
                    {orderData.billing.country}
                  </div>
                  <div className="phone">{orderData.billing.phone}</div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 col-12">
              <div className="shipping-info">
                <div className="title">Shipping Information</div>
                <div className="info">
                  <div className="name">
                    {orderData.shipping.firstName} {orderData.shipping.lastName}
                  </div>
                  <div className="email">{orderData.shipping.email}</div>
                  <div className="address">
                    {orderData.shipping.streetAddress},<br />
                    {orderData.shipping.townCity}, {orderData.shipping.state} –{" "}
                    {orderData.shipping.pinCode}
                    <br />
                    {orderData.shipping.country}
                  </div>
                  <div className="phone">{orderData.shipping.phone}</div>
                </div>
              </div>
            </div>
          </div>
          <div
            className="continue-shopping"
            style={{ marginTop: "30px", textAlign: "center" }}
          >
            <Link to="/" className="home-btn">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
