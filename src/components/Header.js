import React, { useState, useEffect, useRef } from "react";
import { useImagePath } from "../context/ImagePathContext";
import { useStore } from "../context/StoreContext";
import { Icon } from "@iconify/react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import { Navigation, Autoplay } from "swiper/modules";
import { Link, useNavigate } from "react-router-dom";
import { getProducts } from "../utils/shopify";

const Header = () => {
  const imageBase = useImagePath();
  const { cart, wishlist } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = await getProducts();
        setAllProducts(products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        // Set empty array to prevent further errors
        setAllProducts([]);
        // Optionally add user notification here if needed
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts([]);
      setShowSuggestions(false);
      return;
    }
    const term = searchTerm.toLowerCase();
    const matches = allProducts.filter((p) =>
      p.title.toLowerCase().includes(term)
    );
    setFilteredProducts(matches.slice(0, 4));
    setShowSuggestions(true); // Show suggestions even when no matches (for "no results" message)
  }, [searchTerm, allProducts]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSuggestionClick = (handle) => {
    setSearchTerm("");
    setShowSuggestions(false);
    navigate(`/product/${handle}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && filteredProducts.length > 0) {
      navigate(`/product/${filteredProducts[0].handle}`);
      setSearchTerm("");
      setShowSuggestions(false);
    }
  };

  return (
    <header className="main-header">
      <div className="header-dt d-none d-lg-block">
        <div className="topbar">
          <div className="container-xl">
            <div className="row">
              <div className="col-lg-6">
                <div className="topbar-left">
                  <a href="/">
                    <Icon
                      icon="weui:location-outlined"
                      width="14"
                      height="14"
                    />
                    Eco Space, New Town, AA II
                  </a>
                  <a href="mailto:support@ecomart.com">
                    <Icon icon="nimbus:mail" width="14" height="14" />
                    support@ecomart.com
                  </a>
                </div>
              </div>
              <div className="col-lg-6">
                <div className="topbar-right">
                  <Swiper
                    navigation={true}
                    loop={true}
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    modules={[Navigation, Autoplay]}
                    className="topbar-swiper"
                  >
                    <SwiperSlide>
                      Free Shipping on Orders Above ₹499!
                    </SwiperSlide>
                    <SwiperSlide>
                      Shop Smart, Eat Fresh – Only at Ecomart!
                    </SwiperSlide>
                    <SwiperSlide>
                      Organic | Affordable | Delivered to Your Door
                    </SwiperSlide>
                  </Swiper>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mid-header">
          <div className="container-xl">
            <div className="mid-header-box">
              <Link to="/" className="header-logo-dt">
                <img
                  src={`${imageBase}logo.png`}
                  srcSet={`
                  ${imageBase}logo.png 1x,
                  ${imageBase}logo@2x.png 2x,
                  ${imageBase}logo@3x.png 3x
                `}
                  alt="Ecomart Logo"
                />
              </Link>
              <div className="search-box" ref={searchBoxRef}>
                <form onSubmit={handleSubmit} autoComplete="off">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Type Your Products ..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => {
                      if (searchTerm.trim() !== "") setShowSuggestions(true);
                    }}
                  />
                  <button type="submit" className="search-btn">
                    Search{" "}
                    <Icon
                      icon="mingcute:search-line"
                      width="17"
                      height="17"
                      style={{ marginLeft: 4 }}
                    />
                  </button>
                </form>
                {showSuggestions && (
                  <div className="search-suggestions">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <div
                          className="suggestion-item"
                          key={product.id}
                          onClick={() => handleSuggestionClick(product.handle)}
                        >
                          <img
                            src={
                              product.images &&
                              product.images.edges &&
                              product.images.edges[0]
                                ? product.images.edges[0].node.src
                                : `${imageBase}placeholder.png`
                            }
                            alt={product.title}
                            className="suggestion-thumb"
                          />
                          <div className="suggestion-info">
                            <div className="suggestion-title">
                              {product.title}
                            </div>
                            <div className="suggestion-prices">
                              {product.variants &&
                              product.variants.edges &&
                              product.variants.edges[0] ? (
                                product.variants.edges[0].node.compareAtPrice &&
                                product.variants.edges[0].node.compareAtPrice
                                  .amount !==
                                  product.variants.edges[0].node.price
                                    .amount ? (
                                  <>
                                    <span className="suggestion-price-discounted">
                                      $
                                      {parseFloat(
                                        product.variants.edges[0].node.price
                                          .amount
                                      ).toFixed(2)}
                                    </span>
                                    <span className="suggestion-price-original">
                                      $
                                      {parseFloat(
                                        product.variants.edges[0].node
                                          .compareAtPrice.amount
                                      ).toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="suggestion-price">
                                    $
                                    {parseFloat(
                                      product.variants.edges[0].node.price
                                        .amount
                                    ).toFixed(2)}
                                  </span>
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-results">
                        <div className="no-results-icon">
                          <Icon
                            icon="healthicons:sad-outline"
                            width="32"
                            height="32"
                          />
                        </div>
                        <div className="no-results-text">
                          <div className="no-results-title">
                            No products found
                          </div>
                          <div className="no-results-subtitle">
                            Try searching with different keywords
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="header-icons">
                <div className="icon-badge-box">
                  <Link to="/" className="icon-link">
                    <Icon icon="basil:user-outline" width="24" height="24" />
                  </Link>
                </div>

                <div className="icon-badge-box">
                  <Link to="/wishlist" className="icon-link">
                    <Icon icon="solar:heart-linear" width="24" height="24" />
                    {wishlist.length > 0 && (
                      <span className="icon-badge wishlist-badge">
                        {wishlist.length}
                      </span>
                    )}
                  </Link>
                </div>
                <div className="icon-badge-box">
                  <Link to="/cart" className="icon-link">
                    <Icon icon="mage:basket" width="24" height="24" />
                    {cart.length > 0 && (
                      <span className="icon-badge cart-badge">
                        {cart.length}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bottom-header">
          <div className="container-xl">
            <div className="bottom-header-content">
              <div className="menu-links">
                <Link to="/" className="menu-link">
                  Home
                </Link>
                <Link to="/shop" className="menu-link">
                  Shop
                </Link>
                <Link to="/fresh-fruits" className="menu-link">
                  <Icon
                    icon="healthicons:fruits-outline"
                    width="16"
                    height="16"
                    style={{ marginRight: "6px" }}
                  />
                  Fresh Fruits
                </Link>
                <Link to="/beverage" className="menu-link">
                  <Icon
                    icon="arcticons:bottle-jump"
                    width="16"
                    height="16"
                    style={{ marginRight: "6px" }}
                  />
                  Beverage
                </Link>
                <Link to="/contact" className="menu-link">
                  Contact
                </Link>
              </div>
              <div className="help-contact">
                <div className="phone-icon">
                  <Icon
                    icon="solar:phone-bold"
                    width="18"
                    height="18"
                    style={{ color: "#fff" }}
                  />
                </div>
                <div className="contact-text">
                  <span className="help-text">Need Help? Call Us</span>
                  <span className="phone-number">+91 99999 12345</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="header-mob d-block d-lg-none">
        <div className="container-xl">
          <div className="header-mob-box">
            <Link to="/" className="header-logo-mob">
              <img
                src={`${imageBase}logo.png`}
                srcSet={`
                  ${imageBase}logo.png 1x,
                  ${imageBase}logo@2x.png 2x,
                  ${imageBase}logo@3x.png 3x
                `}
                alt="Ecomart Logo"
              />
            </Link>
            <div className="header-icons">
              <div className="icon-badge-box">
                <Link to="/" className="icon-link">
                  <Icon icon="basil:user-outline" width="20" height="20" />
                </Link>
              </div>

              <div className="icon-badge-box">
                <Link to="/wishlist" className="icon-link">
                  <Icon icon="solar:heart-linear" width="20" height="20" />
                  {wishlist.length > 0 && (
                    <span className="icon-badge wishlist-badge">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
              </div>
              <div className="icon-badge-box">
                <Link to="/cart" className="icon-link">
                  <Icon icon="mage:basket" width="20" height="20" />
                  {cart.length > 0 && (
                    <span className="icon-badge cart-badge">{cart.length}</span>
                  )}
                </Link>
              </div>
              <div className="icon-badge-box">
                <Link className="icon-link">
                  <Icon
                    icon="bitcoin-icons:menu-filled"
                    width="20"
                    height="20"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
