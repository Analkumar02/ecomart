import React, { useState, useEffect, useRef } from "react";
import { useImagePath } from "../context/ImagePathContext";
import { useStore } from "../context/StoreContext";
import { Icon } from "@iconify/react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import { Navigation, EffectFade, Autoplay } from "swiper/modules";
import { Link, useNavigate } from "react-router-dom";
import { getProducts, getCollections } from "../utils/shopify";

const Header = () => {
  const imageBase = useImagePath();
  const { cart, wishlist } = useStore();
  // DEBUG: Log cart items to verify originalPrice
  useEffect(() => {
    if (cart && cart.length > 0) {
      // eslint-disable-next-line no-console
      console.log("Cart items:", cart);
    }
  }, [cart]);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [cartHoverTimeout, setCartHoverTimeout] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const bottomHeaderRef = useRef(null);

  const [allCollections, setAllCollections] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const cartDropdownRef = useRef(null);
  const navigate = useNavigate();

  // Calculate total cart items
  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  useEffect(() => {
    const fetchProductsAndCollections = async () => {
      try {
        const [products, collections] = await Promise.all([
          getProducts(),
          getCollections(),
        ]);
        setAllProducts(products);
        setAllCollections(collections);
      } catch (error) {
        console.error("Failed to fetch products and collections:", error);
        // Set empty arrays to prevent further errors
        setAllProducts([]);
        setAllCollections([]);
      }
    };

    fetchProductsAndCollections();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts([]);
      setFilteredCollections([]);
      setShowSuggestions(false);
      return;
    }
    const term = searchTerm.toLowerCase();

    // Filter products
    const matchingProducts = allProducts.filter((p) =>
      p.title.toLowerCase().includes(term)
    );

    // Filter collections
    const matchingCollections = allCollections.filter((c) =>
      c.title.toLowerCase().includes(term)
    );

    setFilteredProducts(matchingProducts.slice(0, 3)); // Show 3 products
    setFilteredCollections(matchingCollections.slice(0, 2)); // Show 2 collections
    setShowSuggestions(true); // Show suggestions even when no matches (for "no results" message)
  }, [searchTerm, allProducts, allCollections]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target)
      ) {
        setMobileSearchOpen(false);
      }
      if (
        cartDropdownRef.current &&
        !cartDropdownRef.current.contains(e.target)
      ) {
        setShowCartDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle scroll detection for sticky header
  useEffect(() => {
    let bottomHeaderOffset = 0;
    let mobileHeaderOffset = 0;

    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const bottomHeader = bottomHeaderRef.current;
      const mobileHeader = document.querySelector(".header-mob");
      const isDesktop = window.innerWidth >= 992;

      if (isDesktop) {
        // Desktop header logic
        if (bottomHeader && bottomHeaderOffset === 0) {
          bottomHeaderOffset = bottomHeader.offsetTop;
        }

        if (bottomHeader) {
          if (scrollTop >= bottomHeaderOffset) {
            setIsScrolled(true);
            bottomHeader.classList.add("fixed-sticky");
            // Add padding to body to prevent content jump
            document.body.style.paddingTop = bottomHeader.offsetHeight + "px";
          } else {
            setIsScrolled(false);
            bottomHeader.classList.remove("fixed-sticky");
            // Remove padding from body
            document.body.style.paddingTop = "0px";
          }
        }
      } else {
        // Mobile header logic
        if (mobileHeader && mobileHeaderOffset === 0) {
          mobileHeaderOffset = mobileHeader.offsetTop;
        }

        if (mobileHeader) {
          if (scrollTop >= mobileHeaderOffset) {
            mobileHeader.classList.add("fixed-sticky-mobile");
            // Add padding to body to prevent content jump
            document.body.style.paddingTop = mobileHeader.offsetHeight + "px";
          } else {
            mobileHeader.classList.remove("fixed-sticky-mobile");
            // Remove padding from body
            document.body.style.paddingTop = "0px";
          }
        }
      }
    };

    // Calculate initial offsets
    if (bottomHeaderRef.current) {
      bottomHeaderOffset = bottomHeaderRef.current.offsetTop;
    }

    const mobileHeader = document.querySelector(".header-mob");
    if (mobileHeader) {
      mobileHeaderOffset = mobileHeader.offsetTop;
    }

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll); // Handle window resize

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      // Clear cart hover timeout if it exists
      if (cartHoverTimeout) {
        clearTimeout(cartHoverTimeout);
      }
    };
  }, [cartHoverTimeout]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSuggestionClick = (handle, type = "product") => {
    setSearchTerm("");
    setShowSuggestions(false);
    if (type === "collection") {
      navigate(`/collections/${handle}`);
    } else {
      navigate(`/product/${handle}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && filteredProducts.length > 0) {
      navigate(`/product/${filteredProducts[0].handle}`);
      setSearchTerm("");
      setShowSuggestions(false);
      setMobileSearchOpen(false);
    }
  };

  const handleMobileSearchToggle = () => {
    setMobileSearchOpen(!mobileSearchOpen);
    if (!mobileSearchOpen) {
      setShowSuggestions(false);
    }
  };

  // Handle cart dropdown hover behavior
  const handleCartMouseEnter = () => {
    if (cartHoverTimeout) {
      clearTimeout(cartHoverTimeout);
      setCartHoverTimeout(null);
    }
    setShowCartDropdown(true);
  };

  const handleCartMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowCartDropdown(false);
    }, 300); // 300ms delay before hiding
    setCartHoverTimeout(timeout);
  };

  // Handle cart click to toggle dropdown
  const handleCartClick = () => {
    setShowCartDropdown(!showCartDropdown);
  };

  return (
    <header className="main-header">
      <div className="header-dt d-none d-lg-block">
        <div className="topbar">
          <div className="container-xxl">
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
                    effect={"fade"}
                    fadeEffect={{
                      crossFade: true,
                    }}
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    modules={[Navigation, EffectFade, Autoplay]}
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
          <div className="container-xxl">
            <div className="mid-header-box">
              <Link to="/" className="header-logo-dt img-fluid">
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
                    <Icon
                      icon="mingcute:search-line"
                      width="17"
                      height="17"
                      style={{ marginRight: 4 }}
                    />
                    Search
                  </button>
                </form>
                {showSuggestions && (
                  <div className="search-suggestions">
                    {filteredProducts.length > 0 ||
                    filteredCollections.length > 0 ? (
                      <>
                        {/* Collections */}
                        {filteredCollections.map((collection) => (
                          <div
                            className="suggestion-item collection-item"
                            key={`collection-${collection.id}`}
                            onClick={() =>
                              handleSuggestionClick(
                                collection.handle,
                                "collection"
                              )
                            }
                          >
                            <img
                              src={
                                collection.image?.src ||
                                `${imageBase}placeholder.png`
                              }
                              alt={collection.title}
                              className="suggestion-thumb"
                            />
                            <div className="suggestion-info">
                              <div className="suggestion-title">
                                <Icon
                                  icon="material-symbols:folder-outline"
                                  width="14"
                                  height="14"
                                  style={{
                                    marginRight: "6px",
                                    color: "#34690f",
                                  }}
                                />
                                {collection.title}
                              </div>
                              <div className="suggestion-category">
                                Collection
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Products */}
                        {filteredProducts.map((product) => (
                          <div
                            className="suggestion-item"
                            key={product.id}
                            onClick={() =>
                              handleSuggestionClick(product.handle)
                            }
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
                                  product.variants.edges[0].node
                                    .compareAtPrice &&
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
                        ))}
                      </>
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
                            No products or collections found
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
                <div
                  className="icon-badge-box cart-dropdown-container"
                  ref={cartDropdownRef}
                >
                  <div
                    className="icon-link cart-icon"
                    onMouseEnter={handleCartMouseEnter}
                    onMouseLeave={handleCartMouseLeave}
                    onClick={handleCartClick}
                    style={{ cursor: "pointer" }}
                  >
                    <Icon icon="mage:basket" width="24" height="24" />
                    {getTotalCartItems() > 0 && (
                      <span className="icon-badge cart-badge">
                        {getTotalCartItems()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`bottom-header${isScrolled ? " scrolled" : ""}`}
          ref={bottomHeaderRef}
        >
          <div className="container-xxl">
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
              <a href="tel:+919999912345" className="help-contact">
                <div className="phone-icon">
                  <Icon
                    icon="mage:phone-call"
                    width="40"
                    height="40"
                    style={{ color: "#fff" }}
                  />
                </div>
                <div className="contact-text">
                  <span className="help-text">Need Help? Call Us</span>
                  <span className="phone-number">+91 99999 12345</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="header-mob d-block d-lg-none">
        <div className="container-xxl">
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
                <button
                  className="icon-link"
                  onClick={handleMobileSearchToggle}
                  aria-label="Toggle search"
                >
                  <Icon icon="mingcute:search-line" width="20" height="20" />
                </button>
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
                  {getTotalCartItems() > 0 && (
                    <span className="icon-badge cart-badge">
                      {getTotalCartItems()}
                    </span>
                  )}
                </Link>
              </div>
              <div className="icon-badge-box">
                <button
                  className="icon-link menu-toggle-btn"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Icon
                    icon="bitcoin-icons:menu-filled"
                    width="20"
                    height="20"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div
          className={`mobile-search-bar${mobileSearchOpen ? " open" : ""}`}
          ref={mobileSearchRef}
        >
          <div className="container-xxl">
            <div className="mobile-search-box">
              <form onSubmit={handleSubmit} autoComplete="off">
                <input
                  type="text"
                  className="mobile-search-input"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={() => {
                    if (searchTerm.trim() !== "") setShowSuggestions(true);
                  }}
                />
                <button type="submit" className="mobile-search-btn">
                  <Icon icon="mingcute:search-line" width="18" height="18" />
                </button>
              </form>
              {showSuggestions && (
                <div className="mobile-search-suggestions">
                  {filteredProducts.length > 0 ||
                  filteredCollections.length > 0 ? (
                    <>
                      {/* Collections */}
                      {filteredCollections.map((collection) => (
                        <div
                          className="suggestion-item collection-item"
                          key={`mobile-collection-${collection.id}`}
                          onClick={() =>
                            handleSuggestionClick(
                              collection.handle,
                              "collection"
                            )
                          }
                        >
                          <img
                            src={
                              collection.image?.src ||
                              `${imageBase}placeholder.png`
                            }
                            alt={collection.title}
                            className="suggestion-thumb"
                          />
                          <div className="suggestion-info">
                            <div className="suggestion-title">
                              <Icon
                                icon="material-symbols:folder-outline"
                                width="12"
                                height="12"
                                style={{ marginRight: "4px", color: "#34690f" }}
                              />
                              {collection.title}
                            </div>
                            <div className="suggestion-category">
                              Collection
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Products */}
                      {filteredProducts.map((product) => (
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
                      ))}
                    </>
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
                          No products or collections found
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
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`mobile-menu-drawer${mobileMenuOpen ? " open" : ""}`}>
        <div className="mobile-menu-header">
          <h3 className="menu-title">Menu</h3>
          <button
            className="close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <Icon icon="ic:round-close" width="20" height="20" />
          </button>
        </div>
        {/* Mobile Menu Search Bar removed as requested */}
        <nav className="mobile-menu-nav">
          <Link
            to="/"
            className="mobile-menu-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/shop"
            className="mobile-menu-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Shop
          </Link>
          <Link
            to="/fresh-fruits"
            className="mobile-menu-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon
              icon="healthicons:fruits-outline"
              width="16"
              height="16"
              style={{ marginRight: "6px" }}
            />
            Fresh Fruits
          </Link>
          <Link
            to="/beverage"
            className="mobile-menu-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon
              icon="arcticons:bottle-jump"
              width="16"
              height="16"
              style={{ marginRight: "6px" }}
            />
            Beverage
          </Link>
          <Link
            to="/contact"
            className="mobile-menu-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </Link>
        </nav>
        <div className="mobile-menu-contact">
          <div>EcoMart Grocery Store</div>
          <div>
            <a href="/">
              <Icon icon="ep:location" width="14" height="14" />
              Eco Space, New Town, AA II
            </a>
          </div>
          <div>
            <a href="tel:+919876543210">
              <Icon icon="mage:phone-call" width="14" height="14" />
              +91 9876543210
            </a>
          </div>
          <div>
            <a href="mailto:support@ecomart.com">
              <Icon icon="nimbus:mail" width="14" height="14" />
              support@ecomart.com
            </a>
          </div>
          <div className="mobile-menu-social">
            <Icon icon="ri:facebook-fill" width="20" height="20" />
            <Icon icon="prime:twitter" width="20" height="20" />
            <Icon icon="ri:instagram-line" width="20" height="20" />
            <Icon
              icon="streamline-logos:thread-logo-logo-solid"
              width="20"
              height="20"
            />
            <Icon icon="ic:round-whatsapp" width="20" height="20" />
          </div>
        </div>
      </div>
      {/* Overlay */}

      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
