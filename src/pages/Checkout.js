import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useStore } from "../context/StoreContext";
import { useState, useEffect } from "react";

const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_RATE = 20;
const HANDLING_FEE = 10; // Handling fee INR 10

const Checkout = () => {
  const { cart, clearCart } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    streetAddress: "",
    townCity: "",
    pinCode: "",
    state: "",
    country: "India",
    phone: "",
    email: "",
    shipToDifferent: false,
    orderNotes: "",
    // Shipping fields
    shippingFirstName: "",
    shippingLastName: "",
    shippingStreetAddress: "",
    shippingTownCity: "",
    shippingPinCode: "",
    shippingState: "",
    shippingCountry: "India",
    shippingPhone: "",
    shippingEmail: "",
  });
  const [errors, setErrors] = useState({});
  const [isValidated, setIsValidated] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [agreementChecked, setAgreementChecked] = useState(false);

  // Load applied coupon from localStorage on component mount
  useEffect(() => {
    const savedCoupon = localStorage.getItem("appliedCoupon");
    const savedDiscount = localStorage.getItem("couponDiscount");

    if (savedCoupon && savedDiscount) {
      setAppliedCoupon(JSON.parse(savedCoupon));
      setCouponDiscount(parseFloat(savedDiscount));
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Billing validation
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.streetAddress.trim())
      newErrors.streetAddress = "Street address is required";
    if (!formData.townCity.trim()) newErrors.townCity = "Town/City is required";
    if (!formData.pinCode.trim()) {
      newErrors.pinCode = "Pin code is required";
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Pin code must be 6 digits";
    }
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Agreement validation
    if (!agreementChecked) {
      newErrors.agreement = "You must agree to the terms and conditions";
    }

    // Shipping validation (only if shipping to different address)
    if (formData.shipToDifferent) {
      if (!formData.shippingFirstName.trim())
        newErrors.shippingFirstName = "Shipping first name is required";
      if (!formData.shippingLastName.trim())
        newErrors.shippingLastName = "Shipping last name is required";
      if (!formData.shippingStreetAddress.trim())
        newErrors.shippingStreetAddress = "Shipping street address is required";
      if (!formData.shippingTownCity.trim())
        newErrors.shippingTownCity = "Shipping town/city is required";
      if (!formData.shippingPinCode.trim()) {
        newErrors.shippingPinCode = "Shipping pin code is required";
      } else if (!/^\d{6}$/.test(formData.shippingPinCode)) {
        newErrors.shippingPinCode = "Shipping pin code must be 6 digits";
      }
      if (!formData.shippingState.trim())
        newErrors.shippingState = "Shipping state is required";
      if (!formData.shippingPhone.trim()) {
        newErrors.shippingPhone = "Shipping phone is required";
      } else if (!/^\d{10}$/.test(formData.shippingPhone)) {
        newErrors.shippingPhone = "Shipping phone must be 10 digits";
      }
      if (!formData.shippingEmail.trim()) {
        newErrors.shippingEmail = "Shipping email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.shippingEmail)) {
        newErrors.shippingEmail = "Shipping email is invalid";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle agreement checkbox separately
  const handleAgreementChange = (e) => {
    setAgreementChecked(e.target.checked);

    // Clear agreement error when checked
    if (e.target.checked && errors.agreement) {
      setErrors((prev) => ({
        ...prev,
        agreement: "",
      }));
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    localStorage.removeItem("appliedCoupon");
    localStorage.removeItem("couponDiscount");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsValidated(true);
    if (validateForm()) {
      // Prepare data for submission
      const orderData = {
        billing: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          streetAddress: formData.streetAddress,
          townCity: formData.townCity,
          pinCode: formData.pinCode,
          state: formData.state,
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
        },
        shipping: formData.shipToDifferent
          ? {
              firstName: formData.shippingFirstName,
              lastName: formData.shippingLastName,
              streetAddress: formData.shippingStreetAddress,
              townCity: formData.shippingTownCity,
              pinCode: formData.shippingPinCode,
              state: formData.shippingState,
              country: formData.shippingCountry,
              phone: formData.shippingPhone,
              email: formData.shippingEmail,
            }
          : {
              firstName: formData.firstName,
              lastName: formData.lastName,
              streetAddress: formData.streetAddress,
              townCity: formData.townCity,
              pinCode: formData.pinCode,
              state: formData.state,
              country: formData.country,
              phone: formData.phone,
              email: formData.email,
            },
        orderNotes: formData.orderNotes,
        cart,
        total,
        shipToDifferent: formData.shipToDifferent,
        timestamp: new Date().toISOString(),
      };

      // Save to localStorage with guest user identifier
      const guestUserId =
        localStorage.getItem("guestUserId") || `guest_${Date.now()}`;
      localStorage.setItem("guestUserId", guestUserId);
      localStorage.setItem(
        `orderData_${guestUserId}`,
        JSON.stringify(orderData)
      );

      // Generate order number
      const orderNumber = `ECM${Date.now().toString().slice(-8)}`;
      localStorage.setItem("lastOrderNumber", orderNumber);

      console.log("Form is valid:", orderData);

      // Clear cart, coupon data, and navigate to thank you page
      clearCart();
      localStorage.removeItem("appliedCoupon");
      localStorage.removeItem("couponDiscount");
      navigate("/thankyou");
    }
  };

  // Calculate totals with handling fee
  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price?.amount || item.price || 0);
      const quantity = item.quantity || 1;
      return total + price * quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const handlingFee = HANDLING_FEE;
  const total = subtotal + shippingCost + handlingFee - couponDiscount;
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  );

  return (
    <div className="checkout-page">
      <div className="breadcrumb">
        <div className="container-xxl">
          <div className="row">
            <div className="breadcrumb-content">
              <Link to="/"> Home</Link> /
              <Link to="/checkout" className="active">
                checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="checkout-area">
        <div className="container-xxl">
          <form
            onSubmit={handleSubmit}
            className={`needs-validation ${isValidated ? "was-validated" : ""}`}
            noValidate
          >
            <div className="row">
              <div className="col-lg-8 col-md-12 col-sm-12">
                <div className="checkout-form-area">
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
                            Add<span> ₹{remainingForFreeShipping} </span>to cart
                            and get free shipping!
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

                  <div className="checkout-form">
                    <div className="form-header">
                      <h5>Billing details</h5>
                      <div className="divider1">
                        <span className="green-line"></span>
                        <span className="gray-line"></span>
                      </div>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="firstName" className="form-label">
                          First name *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.firstName
                              ? "is-invalid"
                              : formData.firstName && isValidated
                              ? "is-valid"
                              : ""
                          }`}
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.firstName && (
                          <div className="invalid-feedback">
                            {errors.firstName}
                          </div>
                        )}
                        {formData.firstName &&
                          !errors.firstName &&
                          isValidated && (
                            <div className="valid-feedback">Looks good!</div>
                          )}
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="lastName" className="form-label">
                          Last name *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.lastName
                              ? "is-invalid"
                              : formData.lastName && isValidated
                              ? "is-valid"
                              : ""
                          }`}
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.lastName && (
                          <div className="invalid-feedback">
                            {errors.lastName}
                          </div>
                        )}
                        {formData.lastName &&
                          !errors.lastName &&
                          isValidated && (
                            <div className="valid-feedback">Looks good!</div>
                          )}
                      </div>
                      <div className="col-12">
                        <label htmlFor="streetAddress" className="form-label">
                          Street address *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.streetAddress
                              ? "is-invalid"
                              : formData.streetAddress && isValidated
                              ? "is-valid"
                              : ""
                          }`}
                          id="streetAddress"
                          name="streetAddress"
                          value={formData.streetAddress}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.streetAddress && (
                          <div className="invalid-feedback">
                            {errors.streetAddress}
                          </div>
                        )}
                        {formData.streetAddress &&
                          !errors.streetAddress &&
                          isValidated && (
                            <div className="valid-feedback">Looks good!</div>
                          )}
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="townCity" className="form-label">
                          Town / City *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.townCity
                              ? "is-invalid"
                              : formData.townCity && isValidated
                              ? "is-valid"
                              : ""
                          }`}
                          id="townCity"
                          name="townCity"
                          value={formData.townCity}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.townCity && (
                          <div className="invalid-feedback">
                            {errors.townCity}
                          </div>
                        )}
                        {formData.townCity &&
                          !errors.townCity &&
                          isValidated && (
                            <div className="valid-feedback">Looks good!</div>
                          )}
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="pinCode" className="form-label">
                          Pin Code *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors.pinCode
                              ? "is-invalid"
                              : formData.pinCode && isValidated
                              ? "is-valid"
                              : ""
                          }`}
                          id="pinCode"
                          name="pinCode"
                          value={formData.pinCode}
                          onChange={handleInputChange}
                          maxLength="6"
                          required
                        />
                        {errors.pinCode && (
                          <div className="invalid-feedback">
                            {errors.pinCode}
                          </div>
                        )}
                        {formData.pinCode && !errors.pinCode && isValidated && (
                          <div className="valid-feedback">Looks good!</div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="state" className="form-label">
                          State *
                        </label>
                        <select
                          className={`form-select ${
                            errors.state
                              ? "is-invalid"
                              : formData.state && isValidated
                              ? "is-valid"
                              : ""
                          }`}
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select State</option>
                          <option value="west-bengal">West Bengal</option>
                          <option value="maharashtra">Maharashtra</option>
                          <option value="kerala">Kerala</option>
                          <option value="tamil-nadu">Tamil Nadu</option>
                          <option value="karnataka">Karnataka</option>
                        </select>
                        {errors.state && (
                          <div className="invalid-feedback">{errors.state}</div>
                        )}
                        {formData.state && !errors.state && isValidated && (
                          <div className="valid-feedback">Looks good!</div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="country" className="form-label">
                          Country / Region *
                        </label>
                        <select
                          className="form-select"
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          disabled
                        >
                          <option value="India">India</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="phone" className="form-label">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          className={`form-control ${
                            errors.phone
                              ? "is-invalid"
                              : formData.phone && isValidated
                              ? "is-valid"
                              : ""
                          }`}
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          maxLength="10"
                          required
                        />
                        {errors.phone && (
                          <div className="invalid-feedback">{errors.phone}</div>
                        )}
                        {formData.phone && !errors.phone && isValidated && (
                          <div className="valid-feedback">Looks good!</div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="email" className="form-label">
                          Email address *
                        </label>
                        <input
                          type="email"
                          className={`form-control ${
                            errors.email
                              ? "is-invalid"
                              : formData.email && isValidated
                              ? "is-valid"
                              : ""
                          }`}
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                        {formData.email && !errors.email && isValidated && (
                          <div className="valid-feedback">Looks good!</div>
                        )}
                      </div>
                      <div className="col-12">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="shipToDifferent"
                            name="shipToDifferent"
                            checked={formData.shipToDifferent}
                            onChange={handleInputChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="shipToDifferent"
                          >
                            Ship to a different address?
                          </label>
                        </div>

                        {/* Shipping Form */}
                        <div
                          className={`shipping-form ${
                            formData.shipToDifferent ? "show" : ""
                          }`}
                        >
                          <div className="shipping-form-content">
                            <div className="form-header">
                              <h5>Shipping details</h5>
                              <div className="divider1">
                                <span className="green-line"></span>
                                <span className="gray-line"></span>
                              </div>
                            </div>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <label
                                  htmlFor="shippingFirstName"
                                  className="form-label"
                                >
                                  First name *
                                </label>
                                <input
                                  type="text"
                                  className={`form-control ${
                                    errors.shippingFirstName
                                      ? "is-invalid"
                                      : formData.shippingFirstName &&
                                        isValidated
                                      ? "is-valid"
                                      : ""
                                  }`}
                                  id="shippingFirstName"
                                  name="shippingFirstName"
                                  value={formData.shippingFirstName}
                                  onChange={handleInputChange}
                                  required={formData.shipToDifferent}
                                />
                                {errors.shippingFirstName && (
                                  <div className="invalid-feedback">
                                    {errors.shippingFirstName}
                                  </div>
                                )}
                                {formData.shippingFirstName &&
                                  !errors.shippingFirstName &&
                                  isValidated && (
                                    <div className="valid-feedback">
                                      Looks good!
                                    </div>
                                  )}
                              </div>
                              <div className="col-md-6">
                                <label
                                  htmlFor="shippingLastName"
                                  className="form-label"
                                >
                                  Last name *
                                </label>
                                <input
                                  type="text"
                                  className={`form-control ${
                                    errors.shippingLastName
                                      ? "is-invalid"
                                      : formData.shippingLastName && isValidated
                                      ? "is-valid"
                                      : ""
                                  }`}
                                  id="shippingLastName"
                                  name="shippingLastName"
                                  value={formData.shippingLastName}
                                  onChange={handleInputChange}
                                  required={formData.shipToDifferent}
                                />
                                {errors.shippingLastName && (
                                  <div className="invalid-feedback">
                                    {errors.shippingLastName}
                                  </div>
                                )}
                                {formData.shippingLastName &&
                                  !errors.shippingLastName &&
                                  isValidated && (
                                    <div className="valid-feedback">
                                      Looks good!
                                    </div>
                                  )}
                              </div>
                              <div className="col-12">
                                <label
                                  htmlFor="shippingStreetAddress"
                                  className="form-label"
                                >
                                  Street address *
                                </label>
                                <input
                                  type="text"
                                  className={`form-control ${
                                    errors.shippingStreetAddress
                                      ? "is-invalid"
                                      : formData.shippingStreetAddress &&
                                        isValidated
                                      ? "is-valid"
                                      : ""
                                  }`}
                                  id="shippingStreetAddress"
                                  name="shippingStreetAddress"
                                  value={formData.shippingStreetAddress}
                                  onChange={handleInputChange}
                                  required={formData.shipToDifferent}
                                />
                                {errors.shippingStreetAddress && (
                                  <div className="invalid-feedback">
                                    {errors.shippingStreetAddress}
                                  </div>
                                )}
                                {formData.shippingStreetAddress &&
                                  !errors.shippingStreetAddress &&
                                  isValidated && (
                                    <div className="valid-feedback">
                                      Looks good!
                                    </div>
                                  )}
                              </div>
                              <div className="col-md-6">
                                <label
                                  htmlFor="shippingTownCity"
                                  className="form-label"
                                >
                                  Town / City *
                                </label>
                                <input
                                  type="text"
                                  className={`form-control ${
                                    errors.shippingTownCity
                                      ? "is-invalid"
                                      : formData.shippingTownCity && isValidated
                                      ? "is-valid"
                                      : ""
                                  }`}
                                  id="shippingTownCity"
                                  name="shippingTownCity"
                                  value={formData.shippingTownCity}
                                  onChange={handleInputChange}
                                  required={formData.shipToDifferent}
                                />
                                {errors.shippingTownCity && (
                                  <div className="invalid-feedback">
                                    {errors.shippingTownCity}
                                  </div>
                                )}
                                {formData.shippingTownCity &&
                                  !errors.shippingTownCity &&
                                  isValidated && (
                                    <div className="valid-feedback">
                                      Looks good!
                                    </div>
                                  )}
                              </div>
                              <div className="col-md-6">
                                <label
                                  htmlFor="shippingPinCode"
                                  className="form-label"
                                >
                                  Pin Code *
                                </label>
                                <input
                                  type="text"
                                  className={`form-control ${
                                    errors.shippingPinCode
                                      ? "is-invalid"
                                      : formData.shippingPinCode && isValidated
                                      ? "is-valid"
                                      : ""
                                  }`}
                                  id="shippingPinCode"
                                  name="shippingPinCode"
                                  value={formData.shippingPinCode}
                                  onChange={handleInputChange}
                                  maxLength="6"
                                  required={formData.shipToDifferent}
                                />
                                {errors.shippingPinCode && (
                                  <div className="invalid-feedback">
                                    {errors.shippingPinCode}
                                  </div>
                                )}
                                {formData.shippingPinCode &&
                                  !errors.shippingPinCode &&
                                  isValidated && (
                                    <div className="valid-feedback">
                                      Looks good!
                                    </div>
                                  )}
                              </div>
                              <div className="col-md-6">
                                <label
                                  htmlFor="shippingState"
                                  className="form-label"
                                >
                                  State *
                                </label>
                                <select
                                  className={`form-select ${
                                    errors.shippingState
                                      ? "is-invalid"
                                      : formData.shippingState && isValidated
                                      ? "is-valid"
                                      : ""
                                  }`}
                                  id="shippingState"
                                  name="shippingState"
                                  value={formData.shippingState}
                                  onChange={handleInputChange}
                                  required={formData.shipToDifferent}
                                >
                                  <option value="">Select State</option>
                                  <option value="west-bengal">
                                    West Bengal
                                  </option>
                                  <option value="maharashtra">
                                    Maharashtra
                                  </option>
                                  <option value="kerala">Kerala</option>
                                  <option value="tamil-nadu">Tamil Nadu</option>
                                  <option value="karnataka">Karnataka</option>
                                </select>
                                {errors.shippingState && (
                                  <div className="invalid-feedback">
                                    {errors.shippingState}
                                  </div>
                                )}
                                {formData.shippingState &&
                                  !errors.shippingState &&
                                  isValidated && (
                                    <div className="valid-feedback">
                                      Looks good!
                                    </div>
                                  )}
                              </div>
                              <div className="col-md-6">
                                <label
                                  htmlFor="shippingCountry"
                                  className="form-label"
                                >
                                  Country / Region *
                                </label>
                                <select
                                  className="form-select"
                                  id="shippingCountry"
                                  name="shippingCountry"
                                  value={formData.shippingCountry}
                                  onChange={handleInputChange}
                                  disabled
                                >
                                  <option value="India">India</option>
                                </select>
                              </div>
                              <div className="col-md-6">
                                <label
                                  htmlFor="shippingPhone"
                                  className="form-label"
                                >
                                  Phone *
                                </label>
                                <input
                                  type="tel"
                                  className={`form-control ${
                                    errors.shippingPhone
                                      ? "is-invalid"
                                      : formData.shippingPhone && isValidated
                                      ? "is-valid"
                                      : ""
                                  }`}
                                  id="shippingPhone"
                                  name="shippingPhone"
                                  value={formData.shippingPhone}
                                  onChange={handleInputChange}
                                  maxLength="10"
                                  required={formData.shipToDifferent}
                                />
                                {errors.shippingPhone && (
                                  <div className="invalid-feedback">
                                    {errors.shippingPhone}
                                  </div>
                                )}
                                {formData.shippingPhone &&
                                  !errors.shippingPhone &&
                                  isValidated && (
                                    <div className="valid-feedback">
                                      Looks good!
                                    </div>
                                  )}
                              </div>
                              <div className="col-md-6">
                                <label
                                  htmlFor="shippingEmail"
                                  className="form-label"
                                >
                                  Email address *
                                </label>
                                <input
                                  type="email"
                                  className={`form-control ${
                                    errors.shippingEmail
                                      ? "is-invalid"
                                      : formData.shippingEmail && isValidated
                                      ? "is-valid"
                                      : ""
                                  }`}
                                  id="shippingEmail"
                                  name="shippingEmail"
                                  value={formData.shippingEmail}
                                  onChange={handleInputChange}
                                  required={formData.shipToDifferent}
                                />
                                {errors.shippingEmail && (
                                  <div className="invalid-feedback">
                                    {errors.shippingEmail}
                                  </div>
                                )}
                                {formData.shippingEmail &&
                                  !errors.shippingEmail &&
                                  isValidated && (
                                    <div className="valid-feedback">
                                      Looks good!
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <label htmlFor="orderNotes" className="form-label">
                          Order notes (optional)
                        </label>
                        <textarea
                          className="form-control"
                          id="orderNotes"
                          name="orderNotes"
                          rows="4"
                          placeholder="Notes about your order, e.g. special notes for delivery."
                          value={formData.orderNotes}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-12 col-sm-12">
                <div className="order-total">
                  <div className="order-total-header">
                    <h5>Your Order</h5>
                    <div className="divider1">
                      <span className="green-line"></span>
                      <span className="gray-line"></span>
                    </div>
                  </div>
                  <div className="order-total-body">
                    <div className="subtotal">
                      <span>Product</span>
                      <span>Subtotal</span>
                    </div>
                    <div className="line"></div>
                    <div className="order-items">
                      {cart.map((item, index) => {
                        const price = parseFloat(
                          item.price?.amount || item.price || 0
                        );
                        const quantity = item.quantity || 1;
                        const itemTotal = price * quantity;
                        return (
                          <div key={index} className="item">
                            <span>
                              {item.title} <b>x {quantity}</b>
                            </span>
                            <span>₹{itemTotal.toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="line"></div>
                    <div className="order-subtotal">
                      <span>Items total</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="line"></div>
                    <div className="order-charges">
                      <div className="charges">
                        <span>Shipping</span>
                        <span>
                          {shippingCost === 0
                            ? "Free"
                            : `₹${shippingCost.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="charges">
                        <span>Handling charges</span>
                        <span>₹{handlingFee.toFixed(2)}</span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="charges">
                          <span>
                            Coupon ({appliedCoupon?.title})
                            <button
                              type="button"
                              className="remove-coupon-btn"
                              onClick={removeCoupon}
                              title="Remove coupon"
                            >
                              Remove
                            </button>
                          </span>
                          <span className="discount">
                            -₹{couponDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="line"></div>
                    <div className="order-total-footer">
                      <span>Total</span>
                      <span className="total-amount">₹{total.toFixed(2)}</span>
                    </div>
                    <div className="payment-opt">
                      <div className="option">
                        <input
                          type="radio"
                          id="cod"
                          name="payment"
                          value="cod"
                          defaultChecked
                        />
                        <label htmlFor="cod">Cash on delivery</label>
                      </div>
                      <p>Pay with cash upon delivery.</p>
                    </div>
                    <div className="checkout-text">
                      Your personal data will be used to process your order,
                      support your experience throughout this website, and for
                      other purposes described in our{" "}
                      <Link to="/">privacy policy</Link>.
                    </div>
                    <div className="agreement-wrapper">
                      <div className="agreement">
                        <input
                          type="checkbox"
                          id="agreement"
                          checked={agreementChecked}
                          onChange={handleAgreementChange}
                          required
                          className={errors.agreement ? "is-invalid" : ""}
                        />
                        <label htmlFor="agreement">
                          I have read and agree to the website{" "}
                          <Link to="/">terms and conditions</Link>.
                        </label>
                      </div>
                      {errors.agreement && (
                        <div className="invalid-feedback">
                          {errors.agreement}
                        </div>
                      )}
                    </div>
                    <Link to="/cart" className="back-to-cart">
                      Back to cart
                    </Link>
                    <button type="submit" className="checkout-btn">
                      Place order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
