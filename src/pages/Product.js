import { Link, useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useImagePath } from "../context/ImagePathContext";
import { useStore } from "../context/StoreContext";
import { getProductByHandle } from "../utils/shopify";
import { useState, useEffect } from "react";
import ShopProductCard from "../components/ShopProductCard";

// Responsive Tab Section Component
function TabSection({ description, additionalInfo }) {
  const [activeTab, setActiveTab] = useState("description");

  // Helper function to parse and extract content from Shopify metafield JSON
  const parseMetafieldContent = (rawValue) => {
    if (!rawValue) return "";

    try {
      // Parse the JSON string
      const parsed = JSON.parse(rawValue);

      // Extract text content from the JSON structure
      const extractText = (node) => {
        if (node.type === "text") {
          return node.value;
        }
        if (node.type === "paragraph" && node.children) {
          return node.children.map(extractText).join("");
        }
        if (node.children) {
          return node.children.map(extractText).join("");
        }
        return "";
      };

      // Handle different JSON structures
      if (parsed.children) {
        return parsed.children.map(extractText).join("\n\n");
      } else if (parsed.type === "root" && parsed.children) {
        return parsed.children.map(extractText).join("\n\n");
      } else {
        return extractText(parsed);
      }
    } catch (error) {
      console.warn("Error parsing metafield content:", error);
      // If parsing fails, return the raw value
      return rawValue;
    }
  };

  const parsedDescription = parseMetafieldContent(description);
  const parsedAdditionalInfo = parseMetafieldContent(additionalInfo);

  return (
    <div className="responsive-tabs">
      <div className="tab-header">
        <button
          className={`tab-button ${
            activeTab === "description" ? "active" : ""
          }`}
          onClick={() => setActiveTab("description")}
        >
          Description
        </button>
        <button
          className={`tab-button ${activeTab === "additional" ? "active" : ""}`}
          onClick={() => setActiveTab("additional")}
        >
          Additional Information
        </button>
      </div>
      <div className="tab-content">
        {activeTab === "description" && (
          <div className="tab-panel description-panel">
            {parsedDescription ? (
              <div style={{ whiteSpace: "pre-wrap" }}>{parsedDescription}</div>
            ) : (
              <p>No description available.</p>
            )}
          </div>
        )}
        {activeTab === "additional" && (
          <div className="tab-panel additional-panel">
            {parsedAdditionalInfo ? (
              <div style={{ whiteSpace: "pre-wrap" }}>
                {parsedAdditionalInfo}
              </div>
            ) : (
              <p>No additional information available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const Product = () => {
  const { handle } = useParams();
  const imageBase = useImagePath();
  const {
    addToCart,
    removeFromCart,
    toggleWishlist,
    isInWishlist,
    isInCart,
    getCartItem,
    smartCartProducts,
  } = useStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductByHandle(handle);
        setProduct(productData);
        if (productData?.variants?.edges?.length > 0) {
          setSelectedVariant(productData.variants.edges[0].node);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (handle) {
      fetchProduct();
    }
  }, [handle]);

  // Set up related products from the same category/collection or random products
  useEffect(() => {
    if (product && smartCartProducts && smartCartProducts.length > 0) {
      // Get products from the same collection or random products
      let relatedProductsList = [];

      // Try to get products from the same collection first
      if (product.collections?.edges?.length > 0) {
        const productCollections = product.collections.edges.map(
          (edge) => edge.node.handle
        );
        relatedProductsList = smartCartProducts.filter(
          (p) =>
            p.id !== product.id && // Exclude current product
            p.collections?.edges?.some((edge) =>
              productCollections.includes(edge.node.handle)
            )
        );
      }

      // If we don't have enough related products, add random ones
      if (relatedProductsList.length < 8) {
        const remainingProducts = smartCartProducts.filter(
          (p) =>
            p.id !== product.id &&
            !relatedProductsList.some((rp) => rp.id === p.id)
        );

        // Shuffle and take remaining needed products
        const shuffled = remainingProducts.sort(() => 0.5 - Math.random());
        relatedProductsList = [
          ...relatedProductsList,
          ...shuffled.slice(0, 8 - relatedProductsList.length),
        ];
      }

      setRelatedProducts(relatedProductsList.slice(0, 8)); // Limit to 8 products
    }
  }, [product, smartCartProducts]);

  // Update quantity based on cart item when variant changes
  useEffect(() => {
    if (product && selectedVariant) {
      const cartItem = getCartItem(product.id, selectedVariant.title);
      if (cartItem) {
        setQuantity(cartItem.quantity);
      } else {
        setQuantity(1);
      }
    }
  }, [product, selectedVariant, getCartItem]);

  // Listen for cart updates from other components
  useEffect(() => {
    const handleCartUpdate = () => {
      if (product && selectedVariant) {
        const cartItem = getCartItem(product.id, selectedVariant.title);
        if (cartItem) {
          setQuantity(cartItem.quantity);
        } else {
          setQuantity(1);
        }
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [product, selectedVariant, getCartItem]);

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (showRemoveModal && event.key === "Escape") {
        setShowRemoveModal(false);
      }
    };

    if (showRemoveModal) {
      document.addEventListener("keydown", handleKeyPress);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "unset";
    };
  }, [showRemoveModal]);

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;

    // If user tries to decrease quantity to 0 and product is in cart, show confirmation
    if (newQuantity === 0 && productInCart) {
      setShowRemoveModal(true);
      return;
    }

    // For products not in cart, don't allow quantity below 1
    if (!productInCart && newQuantity < 1) {
      return;
    }

    // Allow quantity change
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleRemoveFromCart = () => {
    if (product && selectedVariant) {
      removeFromCart(product.id, selectedVariant.title);
      setQuantity(1); // Reset to default quantity
      setShowRemoveModal(false);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
  };

  const handleModalOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowRemoveModal(false);
    }
  };

  const handleAddToCart = () => {
    if (product && selectedVariant) {
      const currentCartItem = getCartItem(product.id, selectedVariant.title);
      // Only update cart if quantity has changed or item is not in cart
      if (!currentCartItem || currentCartItem.quantity !== quantity) {
        const cartItem = {
          productId: product.id, // Use productId for consistency with ShopProductCard
          variantId: selectedVariant.id, // Use variantId for consistency with ShopProductCard
          id: product.id, // Keep id for backward compatibility
          title: product.title,
          variant: selectedVariant.title,
          price: selectedVariant.price.amount,
          compareAtPrice: selectedVariant.compareAtPrice, // Add compareAtPrice for sale display
          image:
            selectedVariant.image?.src || product.images?.edges[0]?.node?.src,
          quantity: quantity,
          handle: product.handle,
        };
        addToCart(cartItem);
      }
      // else do nothing (no update needed)
    }
  };

  const handleToggleWishlist = () => {
    if (product) {
      const wishlistItem = {
        id: product.id,
        title: product.title,
        price: {
          amount: selectedVariant?.price?.amount || 0,
        },
        compareAtPrice: selectedVariant?.compareAtPrice?.amount
          ? {
              amount: selectedVariant?.compareAtPrice?.amount,
            }
          : null,
        image:
          selectedVariant?.image?.src || product.images?.edges[0]?.node?.src,
        handle: product.handle,
      };
      toggleWishlist(wishlistItem);
    }
  };

  const calculateSavings = () => {
    if (selectedVariant?.compareAtPrice && selectedVariant?.price) {
      const originalPrice = parseFloat(selectedVariant.compareAtPrice.amount);
      const salePrice = parseFloat(selectedVariant.price.amount);
      const savings = originalPrice - salePrice;
      const percentage = Math.round((savings / originalPrice) * 100);
      return { amount: savings, percentage };
    }
    return null;
  };

  const getProductImages = () => {
    if (!product) return [];

    let images = [];

    // If product has variants and selected variant has an image, use it first
    if (selectedVariant?.image?.src) {
      images.push({
        src: selectedVariant.image.src,
        altText: selectedVariant.image.altText || product.title,
      });
    }

    // Add other product images
    if (product.images?.edges) {
      const otherImages = product.images.edges
        .map((edge) => edge.node)
        .filter((img) => img.src !== selectedVariant?.image?.src);
      images = [...images, ...otherImages];
    }

    return images;
  };

  const getProductCollection = () => {
    if (!product?.collections?.edges?.length) return null;

    // Get the first collection that's not an excluded one
    const excludedHandles = ["smart-cart", "trending-products", "new"];
    const validCollection = product.collections.edges.find(
      (edge) => !excludedHandles.includes(edge.node.handle)
    );

    return validCollection
      ? validCollection.node
      : product.collections.edges[0].node;
  };

  if (loading) {
    return (
      <div className="product-page">
        <div className="container-xxl">
          <div className="loading-state">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-page">
        <div className="container-xxl">
          <div className="error-state">Product not found</div>
        </div>
      </div>
    );
  }

  const savings = calculateSavings();
  const productImages = getProductImages();
  const productCollection = getProductCollection();

  // Check if current product variant is in cart
  const productInCart =
    product && selectedVariant
      ? isInCart(product.id, selectedVariant.title)
      : false;

  return (
    <div className="product-page">
      <div className="breadcrumb">
        <div className="container-xxl">
          <div className="row">
            <div className="breadcrumb-content">
              <Link to="/"> Home</Link> /
              {productCollection ? (
                <Link
                  to={`/shop?category=${productCollection.handle}`}
                  className="active"
                >
                  {productCollection.title}
                </Link>
              ) : (
                <span className="active">Product</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="product-details">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-6 col-md-12 col-sm-12 col-12">
              <div className="product-gallery">
                {productImages.length > 0 && (
                  <>
                    <div className="gallery-container">
                      {productImages.length > 1 && (
                        <Swiper
                          modules={[Thumbs]}
                          onSwiper={setThumbsSwiper}
                          direction="vertical"
                          slidesPerView="auto"
                          spaceBetween={10}
                          watchSlidesProgress={true}
                          className="thumbs-swiper"
                        >
                          {productImages.map((image, index) => (
                            <SwiperSlide key={index}>
                              <img
                                src={image.src}
                                alt={image.altText || product.title}
                                className="product-thumb-image"
                                loading="lazy"
                              />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      )}
                      <Swiper
                        modules={[Thumbs]}
                        thumbs={{ swiper: thumbsSwiper }}
                        spaceBetween={20}
                        slidesPerView={1}
                        centeredSlides={true}
                        className="main-swiper"
                      >
                        {productImages.map((image, index) => (
                          <SwiperSlide key={index}>
                            <img
                              src={image.src}
                              alt={image.altText || product.title}
                              className="product-main-image"
                              loading="lazy"
                            />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-sm-12 col-12">
              <div className="product-info">
                <h2 className="product-title">{product.title}</h2>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <Icon
                      key={i}
                      icon="material-symbols:star"
                      width="14"
                      height="14"
                    />
                  ))}
                </div>
                <div className="shipping-message">
                  <Icon
                    icon="healthicons:fruits-outline"
                    width="16"
                    height="16"
                  />
                  <span>Shipping within 2 hours | </span>Speedy and reliable
                  parcel delivery!
                </div>
                <div className="price-box">
                  {selectedVariant?.compareAtPrice && (
                    <div className="org-price">
                      MRP:{" "}
                      <s>
                        ₹
                        {parseFloat(
                          selectedVariant.compareAtPrice.amount
                        ).toFixed(0)}
                      </s>
                    </div>
                  )}
                  <div className="sale-price">
                    Price: ₹
                    {selectedVariant
                      ? parseFloat(selectedVariant.price.amount).toFixed(0)
                      : "0"}
                  </div>
                  {savings && (
                    <p>
                      <span className="savings">
                        You Save: {savings.percentage}% OFF
                      </span>
                      <br />
                      (inclusive of all taxes)
                    </p>
                  )}
                </div>

                {/* Variant Selection */}
                {product.variants?.edges?.length > 1 && (
                  <div className="variant-selection">
                    <h4>Select Variant:</h4>
                    <div className="variant-options">
                      {product.variants.edges.map((variant) => (
                        <button
                          key={variant.node.id}
                          className={`variant-option ${
                            selectedVariant?.id === variant.node.id
                              ? "active"
                              : ""
                          }`}
                          onClick={() => setSelectedVariant(variant.node)}
                        >
                          {variant.node.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="cart-opt">
                  <div className="qty-big-box">
                    <input
                      type="number"
                      value={quantity}
                      readOnly
                      className="qty-input"
                    />
                    <div className="qty-buttons">
                      <button
                        className="qty-btn plus"
                        onClick={() => handleQuantityChange(1)}
                      >
                        <Icon icon="ic:round-plus" />
                      </button>
                      <button
                        className="qty-btn minus"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={!productInCart && quantity <= 1}
                      >
                        <Icon icon="ic:round-minus" />
                      </button>
                    </div>
                  </div>
                  <button
                    className="add-to-cart"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant?.availableForSale}
                  >
                    <Icon icon="mage:basket" width="24" height="24" />
                    {!selectedVariant?.availableForSale
                      ? "Out of Stock"
                      : productInCart
                      ? "Update Cart"
                      : "Add to Cart"}
                  </button>
                  {productInCart && (
                    <Link to="/cart" className="view-cart-btn">
                      <Icon icon="solar:cart-3-bold" width="24" height="24" />
                      View Cart
                    </Link>
                  )}
                </div>
                <button
                  className={`wishlist ${
                    isInWishlist(product.id) ? "active" : ""
                  }`}
                  onClick={handleToggleWishlist}
                >
                  <Icon
                    icon={
                      isInWishlist(product.id)
                        ? "solar:heart-bold"
                        : "solar:heart-linear"
                    }
                    width="28"
                    height="28"
                  />
                  {isInWishlist(product.id)
                    ? "Remove from Wishlist"
                    : "Add to Wishlist"}
                </button>
                <div className="imp-info">
                  <div className="text-area">
                    <Icon icon="ion:card-outline" width="16" height="16" />
                    <span>Payment:</span> 5% discount on card and UPI payments
                  </div>
                  <div className="gray-border"></div>
                  <div className="text-area">
                    <Icon
                      icon="hugeicons:return-request"
                      width="16"
                      height="16"
                    />
                    <span>Return:</span> 1 Day Returns if you change your mind
                  </div>
                  <div className="gray-border"></div>
                  <div className="text-area">
                    <Icon
                      icon="carbon:delivery-parcel"
                      width="16"
                      height="16"
                    />
                    <span>Delivery:</span> Free delivery on all orders over ₹500
                  </div>
                </div>
                <div className="secure-checkout">
                  <p>Guaranteed Safe Checkout</p>
                  <img
                    src={`${imageBase}/payment.webp`}
                    srcSet={`${imageBase}/payment@2x.webp 2x, ${imageBase}/payment@3x.webp 3x`}
                    alt="Payment Methods"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="product-additional-details">
        <div className="container-xxl">
          <TabSection
            description={product?.metafield?.value || ""}
            additionalInfo={product?.additionalInfoMetafield?.value || ""}
          />
        </div>
      </div>
      <div className="related-products">
        <div className="container-xxl">
          <div className="row">
            <div className="col-12">
              <div className="related-area-header mb-4">
                <h5>Related Products</h5>
                <div className="divider1">
                  <span className="green-line"></span>
                  <span className="gray-line"></span>
                </div>
              </div>
              {relatedProducts.length > 0 && (
                <Swiper
                  modules={[Navigation, Autoplay]}
                  spaceBetween={20}
                  loop={true}
                  centeredSlides={false}
                  watchOverflow={true}
                  autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                  }}
                  navigation={{
                    nextEl: ".swiper-button-next-related",
                    prevEl: ".swiper-button-prev-related",
                  }}
                  breakpoints={{
                    320: {
                      slidesPerView: 2,
                      spaceBetween: 10,
                      slidesPerGroup: 1,
                    },
                    768: {
                      slidesPerView: 3,
                      spaceBetween: 15,
                      slidesPerGroup: 1,
                    },
                    1024: {
                      slidesPerView: 4,
                      spaceBetween: 20,
                      slidesPerGroup: 1,
                    },
                  }}
                  speed={600}
                  className="related-products-swiper"
                >
                  {relatedProducts.map((product) => (
                    <SwiperSlide key={product.id}>
                      <ShopProductCard productData={product} />
                    </SwiperSlide>
                  ))}

                  {/* Navigation arrows */}
                  <div className="swiper-button-prev-related">
                    <Icon icon="ep:arrow-left" width="24" height="24" />
                  </div>
                  <div className="swiper-button-next-related">
                    <Icon icon="ep:arrow-right" width="24" height="24" />
                  </div>
                </Swiper>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Remove from Cart Confirmation Modal */}
      {showRemoveModal && (
        <div className="modal-overlay" onClick={handleModalOverlayClick}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Remove from Cart</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to remove this product from your cart?
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCancelRemove}>
                No, Keep it
              </button>
              <button className="btn-confirm" onClick={handleRemoveFromCart}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
