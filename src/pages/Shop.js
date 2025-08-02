import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useImagePath } from "../context/ImagePathContext";
import { useStore } from "../context/StoreContext";
import { Icon } from "@iconify/react";
import ShopProductCard from "../components/ShopProductCard";
import { getProductsByCollection } from "../utils/shopify";

function Shop() {
  const imageBase = useImagePath();
  const {
    products: contextProducts,
    collections: contextCollections,
    newProducts: contextNewProducts,
    trendingProducts: contextTrendingProducts,
    smartCartProducts: contextSmartCartProducts,
    loading: contextLoading,
    dataFetched,
  } = useStore();

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for reference
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Price filter state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 }); // Current slider values
  const [appliedPriceRange, setAppliedPriceRange] = useState({
    min: 0,
    max: 1000,
  }); // Applied filter values
  const [appliedFilters, setAppliedFilters] = useState([]);

  // Category filter state
  const [collections, setCollections] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});

  // Product Status filter state
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    inStock: 0,
    onSale: 0,
  });

  // Sorting state
  const [sortBy, setSortBy] = useState("default");

  // Mobile filter state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    // Use data from context instead of making API calls
    if (dataFetched && contextProducts.length > 0) {
      setProducts(contextProducts);
      setAllProducts(contextProducts);

      // Calculate price range from actual products
      const prices = contextProducts.map((product) => {
        const firstVariant = product.variants.edges[0]?.node;
        return firstVariant ? parseFloat(firstVariant.price.amount) : 0;
      });

      const calculatedMinPrice = Math.floor(Math.min(...prices));
      const calculatedMaxPrice = Math.ceil(Math.max(...prices));

      setMinPrice(calculatedMinPrice);
      setMaxPrice(calculatedMaxPrice);
      setPriceRange({ min: calculatedMinPrice, max: calculatedMaxPrice });
      setAppliedPriceRange({
        min: calculatedMinPrice,
        max: calculatedMaxPrice,
      });
      setFilteredProducts(contextProducts);

      // Set collections
      if (contextCollections.length > 0) {
        // Filter out excluded collections
        const excludedHandles = ["new", "trending", "smart-cart"];
        const filteredCollections = contextCollections.filter(
          (collection) => !excludedHandles.includes(collection.handle)
        );

        setCollections(filteredCollections);

        // Calculate category counts
        const counts = {};
        filteredCollections.forEach((collection) => {
          // Count products that belong to this collection by checking productType or tags
          const count = contextProducts.filter((product) => {
            const productType = product.productType?.toLowerCase();
            const collectionTitle = collection.title.toLowerCase();

            // Match by product type or tags
            return (
              productType === collectionTitle ||
              product.tags.some((tag) =>
                tag.toLowerCase().includes(collectionTitle)
              )
            );
          }).length;

          if (count > 0) {
            counts[collection.handle] = count;
          }
        });

        setCategoryCounts(counts);
      }

      // Calculate status counts
      const inStockCount = contextProducts.filter((product) => {
        const firstVariant = product.variants.edges[0]?.node;
        return firstVariant && firstVariant.availableForSale;
      }).length;

      const onSaleCount = contextProducts.filter((product) => {
        const firstVariant = product.variants.edges[0]?.node;
        if (!firstVariant) return false;
        const originalPrice = parseFloat(
          firstVariant.compareAtPrice?.amount || firstVariant.price.amount
        );
        const currentPrice = parseFloat(firstVariant.price.amount);
        return originalPrice > currentPrice;
      }).length;

      setStatusCounts({
        inStock: inStockCount,
        onSale: onSaleCount,
      });

      setLoading(false);
    } else if (!contextLoading) {
      // If context finished loading but no data, show empty state
      setLoading(false);
    }
  }, [dataFetched, contextProducts, contextCollections, contextLoading]);

  // Close mobile filter on window resize (desktop view)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992 && isMobileFilterOpen) {
        setIsMobileFilterOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isMobileFilterOpen) {
        setIsMobileFilterOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileFilterOpen]);

  // Prevent body scroll when mobile filter is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileFilterOpen]);

  // Filter products based on applied price range, selected categories, and product status
  useEffect(() => {
    if (products.length > 0) {
      const filtered = products.filter((product) => {
        const firstVariant = product.variants.edges[0]?.node;
        if (!firstVariant) return false;

        // Price filter
        const productPrice = parseFloat(firstVariant.price.amount);
        const priceMatch =
          productPrice >= appliedPriceRange.min &&
          productPrice <= appliedPriceRange.max;

        // Category filter
        let categoryMatch = true;
        if (selectedCategories.length > 0) {
          categoryMatch = selectedCategories.some((categoryHandle) => {
            const collection = collections.find(
              (c) => c.handle === categoryHandle
            );
            if (!collection) return false;

            const productType = product.productType?.toLowerCase();
            const collectionTitle = collection.title.toLowerCase();

            return (
              productType === collectionTitle ||
              product.tags.some((tag) =>
                tag.toLowerCase().includes(collectionTitle)
              )
            );
          });
        }

        // Product status filter
        let statusMatch = true;
        if (selectedStatus.length > 0) {
          statusMatch = selectedStatus.some((status) => {
            if (status === "inStock") {
              return firstVariant.availableForSale;
            } else if (status === "onSale") {
              const originalPrice = parseFloat(
                firstVariant.compareAtPrice?.amount || firstVariant.price.amount
              );
              const currentPrice = parseFloat(firstVariant.price.amount);
              return originalPrice > currentPrice;
            }
            return false;
          });
        }

        return priceMatch && categoryMatch && statusMatch;
      });

      // Apply sorting
      const sorted = sortProducts(filtered, sortBy);
      setFilteredProducts(sorted);
      setCurrentPage(1); // Reset to first page when filters change
    }
  }, [
    products,
    appliedPriceRange,
    selectedCategories,
    selectedStatus,
    collections,
    sortBy,
  ]);

  // Sorting function
  const sortProducts = (products, sortType) => {
    const sortedProducts = [...products];

    console.log(`Sorting ${products.length} products by: ${sortType}`);

    switch (sortType) {
      case "price-low-high":
        return sortedProducts.sort((a, b) => {
          const priceA = parseFloat(
            a.variants.edges[0]?.node.price.amount || 0
          );
          const priceB = parseFloat(
            b.variants.edges[0]?.node.price.amount || 0
          );
          return priceA - priceB;
        });

      case "price-high-low":
        return sortedProducts.sort((a, b) => {
          const priceA = parseFloat(
            a.variants.edges[0]?.node.price.amount || 0
          );
          const priceB = parseFloat(
            b.variants.edges[0]?.node.price.amount || 0
          );
          return priceB - priceA;
        });

      case "name-a-z":
        return sortedProducts.sort((a, b) => a.title.localeCompare(b.title));

      case "name-z-a":
        return sortedProducts.sort((a, b) => b.title.localeCompare(a.title));

      case "new-arrival":
        // Products are already from the "new" collection, just sort by creation date
        console.log("Sorting new arrival products by creation date...");
        return sortedProducts.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA; // Newest first
        });

      case "trending":
        // Products are already from the "trending" collection, sort by creation date or popularity
        console.log("Sorting trending products...");
        return sortedProducts.sort((a, b) => {
          // Check if products have popularity indicators in tags
          const aTrending = a.tags.some(
            (tag) =>
              tag.toLowerCase().includes("bestseller") ||
              tag.toLowerCase().includes("popular") ||
              tag.toLowerCase().includes("hot")
          );
          const bTrending = b.tags.some(
            (tag) =>
              tag.toLowerCase().includes("bestseller") ||
              tag.toLowerCase().includes("popular") ||
              tag.toLowerCase().includes("hot")
          );

          // Prioritize products with extra trending indicators
          if (aTrending && !bTrending) return -1;
          if (!aTrending && bTrending) return 1;

          // Sort by creation date as fallback
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });

      case "smart-cart":
        // Products are already from the "smart-cart" collection, sort by availability and price
        console.log("Sorting smart cart products...");
        return sortedProducts.sort((a, b) => {
          // Sort by availability first
          const aAvailable = a.variants.edges[0]?.node.availableForSale;
          const bAvailable = b.variants.edges[0]?.node.availableForSale;

          if (aAvailable && !bAvailable) return -1;
          if (!aAvailable && bAvailable) return 1;

          // Then by price (lower price first for smart recommendations)
          const priceA = parseFloat(
            a.variants.edges[0]?.node.price.amount || 0
          );
          const priceB = parseFloat(
            b.variants.edges[0]?.node.price.amount || 0
          );
          return priceA - priceB;
        });

      case "featured":
        // Sort by tags containing "featured" or by rating
        return sortedProducts.sort((a, b) => {
          const aFeatured = a.tags.some(
            (tag) =>
              tag.toLowerCase().includes("featured") ||
              tag.toLowerCase().includes("spotlight") ||
              tag.toLowerCase().includes("highlight")
          );
          const bFeatured = b.tags.some(
            (tag) =>
              tag.toLowerCase().includes("featured") ||
              tag.toLowerCase().includes("spotlight") ||
              tag.toLowerCase().includes("highlight")
          );

          if (aFeatured && !bFeatured) return -1;
          if (!aFeatured && bFeatured) return 1;

          // Sort by creation date as fallback
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA;
        });

      case "on-sale":
        // Sort by discount percentage (highest discount first)
        return sortedProducts.sort((a, b) => {
          const getDiscount = (product) => {
            const variant = product.variants.edges[0]?.node;
            if (!variant) return 0;

            const originalPrice = parseFloat(
              variant.compareAtPrice?.amount || variant.price.amount
            );
            const currentPrice = parseFloat(variant.price.amount);

            if (originalPrice > currentPrice) {
              return ((originalPrice - currentPrice) / originalPrice) * 100;
            }
            return 0;
          };

          return getDiscount(b) - getDiscount(a);
        });

      case "availability":
        // Sort by availability (in stock first)
        return sortedProducts.sort((a, b) => {
          const aAvailable = a.variants.edges[0]?.node.availableForSale;
          const bAvailable = b.variants.edges[0]?.node.availableForSale;

          if (aAvailable && !bAvailable) return -1;
          if (!aAvailable && bAvailable) return 1;
          return 0;
        });

      default:
        return sortedProducts;
    }
  };

  // Handle sorting change
  const handleSortChange = async (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    setLoading(true);

    try {
      let productsToUse = [];

      // Use context data for specific collections or fetch if needed
      if (newSortBy === "new-arrival") {
        console.log("Using new products from context...");
        productsToUse =
          contextNewProducts.length > 0
            ? contextNewProducts
            : await getProductsByCollection("new");
      } else if (newSortBy === "trending") {
        console.log("Using trending products from context...");
        productsToUse =
          contextTrendingProducts.length > 0
            ? contextTrendingProducts
            : await getProductsByCollection("trending");
      } else if (newSortBy === "smart-cart") {
        console.log("Using smart cart products from context...");
        productsToUse =
          contextSmartCartProducts.length > 0
            ? contextSmartCartProducts
            : await getProductsByCollection("smart-cart");
      } else {
        // Use all products for other sorting options
        productsToUse = allProducts;
      }

      console.log(
        `Found ${productsToUse.length} products for sorting: ${newSortBy}`
      );

      // Update products state
      setProducts(productsToUse);

      // Reset filters when switching to collection-based sorting
      if (["new-arrival", "trending", "smart-cart"].includes(newSortBy)) {
        setSelectedCategories([]);
        setSelectedStatus([]);
        setAppliedFilters([]);
        setPriceRange({ min: minPrice, max: maxPrice });
        setAppliedPriceRange({ min: minPrice, max: maxPrice });
      }
    } catch (error) {
      console.error("Error fetching collection products:", error);
      // Fallback to all products
      setProducts(allProducts);
    } finally {
      setLoading(false);
    }
  };

  // Handle mobile filter toggle
  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
  };

  // Close mobile filter
  const closeMobileFilter = () => {
    setIsMobileFilterOpen(false);
  };

  // Handle price range change (apply filter)
  const handlePriceRangeChange = (min, max) => {
    // Apply the filter
    setAppliedPriceRange({ min, max });

    // Update applied filters
    const priceFilterIndex = appliedFilters.findIndex(
      (filter) => filter.type === "price"
    );
    const newPriceFilter = {
      type: "price",
      label: `₹${min} - ₹${max}`,
      value: { min, max },
    };

    if (priceFilterIndex >= 0) {
      const updatedFilters = [...appliedFilters];
      updatedFilters[priceFilterIndex] = newPriceFilter;
      setAppliedFilters(updatedFilters);
    } else {
      setAppliedFilters([...appliedFilters, newPriceFilter]);
    }
  };

  // Handle category selection
  const handleCategoryChange = (categoryHandle, isChecked) => {
    let updatedCategories;
    if (isChecked) {
      updatedCategories = [...selectedCategories, categoryHandle];
    } else {
      updatedCategories = selectedCategories.filter(
        (handle) => handle !== categoryHandle
      );
    }

    setSelectedCategories(updatedCategories);

    // Update applied filters
    const categoryFilters = updatedCategories.map((handle) => {
      const collection = collections.find((c) => c.handle === handle);
      return {
        type: "category",
        label: collection?.title || handle,
        value: handle,
      };
    });

    // Remove existing category filters and add new ones
    const nonCategoryFilters = appliedFilters.filter(
      (filter) => filter.type !== "category"
    );
    setAppliedFilters([...nonCategoryFilters, ...categoryFilters]);
  };

  // Handle product status selection
  const handleStatusChange = (status, isChecked) => {
    let updatedStatus;
    if (isChecked) {
      updatedStatus = [...selectedStatus, status];
    } else {
      updatedStatus = selectedStatus.filter((s) => s !== status);
    }

    setSelectedStatus(updatedStatus);

    // Update applied filters
    const statusFilters = updatedStatus.map((status) => ({
      type: "status",
      label: status === "inStock" ? "In Stock" : "On Sale",
      value: status,
    }));

    // Remove existing status filters and add new ones
    const nonStatusFilters = appliedFilters.filter(
      (filter) => filter.type !== "status"
    );
    setAppliedFilters([...nonStatusFilters, ...statusFilters]);
  };

  // Remove applied filter
  const removeFilter = (filterToRemove) => {
    if (filterToRemove.type === "price") {
      setPriceRange({ min: minPrice, max: maxPrice });
      setAppliedPriceRange({ min: minPrice, max: maxPrice });
    } else if (filterToRemove.type === "category") {
      setSelectedCategories(
        selectedCategories.filter((handle) => handle !== filterToRemove.value)
      );
    } else if (filterToRemove.type === "status") {
      setSelectedStatus(
        selectedStatus.filter((status) => status !== filterToRemove.value)
      );
    }
    setAppliedFilters(
      appliedFilters.filter((filter) => filter !== filterToRemove)
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setPriceRange({ min: minPrice, max: maxPrice });
    setAppliedPriceRange({ min: minPrice, max: maxPrice });
    setSelectedCategories([]);
    setSelectedStatus([]);
    setAppliedFilters([]);
    setSortBy("default"); // Reset sorting to default
    setProducts(allProducts); // Reset to all products
  };

  // Calculate pagination based on filtered products
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to maxVisiblePages
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);

      if (currentPage > 3) {
        items.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!items.includes(i)) {
          items.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        items.push("...");
      }

      // Always show last page
      if (!items.includes(totalPages)) {
        items.push(totalPages);
      }
    }

    return items;
  };

  return (
    <div className="shop-page">
      <div className="breadcrumb">
        <div className="container-xxl">
          <div className="row">
            <div className="breadcrumb-content">
              <Link to="/"> Home</Link> /
              <Link to={"/shop"} className="active">
                Shop
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="container-xxl">
        <div className="row">
          <div className="col-lg-3 d-none d-lg-block">
            <div className="filter-area">
              <div className="price-filer">
                <div className="price-header mb-4">
                  <h5>Filter by Price</h5>
                  <div className="divider1">
                    <span className="green-line"></span>
                    <span className="gray-line"></span>
                  </div>
                </div>
                <div className="price-bar">
                  <div className="price-slider-container">
                    <div className="price-slider-track">
                      <div
                        className="price-slider-range"
                        style={{
                          left: `${
                            ((priceRange.min - minPrice) /
                              (maxPrice - minPrice)) *
                            100
                          }%`,
                          width: `${
                            ((priceRange.max - priceRange.min) /
                              (maxPrice - minPrice)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <input
                      type="range"
                      min={minPrice}
                      max={maxPrice}
                      value={priceRange.min}
                      onChange={(e) => {
                        const newMin = parseInt(e.target.value);
                        if (newMin <= priceRange.max) {
                          setPriceRange({ ...priceRange, min: newMin });
                        }
                      }}
                      className="price-slider price-slider-min"
                    />
                    <input
                      type="range"
                      min={minPrice}
                      max={maxPrice}
                      value={priceRange.max}
                      onChange={(e) => {
                        const newMax = parseInt(e.target.value);
                        if (newMax >= priceRange.min) {
                          setPriceRange({ ...priceRange, max: newMax });
                        }
                      }}
                      className="price-slider price-slider-max"
                    />
                  </div>
                </div>
                <div className="price-footer">
                  <div className="price-range">
                    <p>
                      Price:{" "}
                      <span className="min-price"> ₹{priceRange.min}</span>—
                      <span className="max-price"> ₹{priceRange.max}</span>
                    </p>
                  </div>
                  <button
                    className="filter-btn"
                    onClick={() =>
                      handlePriceRangeChange(priceRange.min, priceRange.max)
                    }
                  >
                    Filter
                  </button>
                </div>
              </div>
              <div className="category-filter">
                <div className="category-header mb-4">
                  <h5>Filter by Categories</h5>
                  <div className="divider1">
                    <span className="green-line"></span>
                    <span className="gray-line"></span>
                  </div>
                </div>
                <div className="category-list">
                  {collections.map((collection) => {
                    const count = categoryCounts[collection.handle] || 0;
                    if (count === 0) return null;

                    return (
                      <div key={collection.handle} className="category-item">
                        <label className="category-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(
                              collection.handle
                            )}
                            onChange={(e) =>
                              handleCategoryChange(
                                collection.handle,
                                e.target.checked
                              )
                            }
                          />
                          <span className="checkmark"></span>
                          <span className="category-name">
                            {collection.title}
                          </span>
                          <span className="category-count">({count})</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="status-filter">
                <div className="status-header mb-4">
                  <h5>Product Status</h5>
                  <div className="divider1">
                    <span className="green-line"></span>
                    <span className="gray-line"></span>
                  </div>
                </div>
                <div className="status-list">
                  <div className="status-item">
                    <label className="status-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedStatus.includes("inStock")}
                        onChange={(e) =>
                          handleStatusChange("inStock", e.target.checked)
                        }
                      />
                      <span className="checkmark"></span>
                      <span className="status-name">In Stock</span>
                      <span className="status-count">
                        ({statusCounts.inStock})
                      </span>
                    </label>
                  </div>
                  <div className="status-item">
                    <label className="status-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedStatus.includes("onSale")}
                        onChange={(e) =>
                          handleStatusChange("onSale", e.target.checked)
                        }
                      />
                      <span className="checkmark"></span>
                      <span className="status-name">On Sale</span>
                      <span className="status-count">
                        ({statusCounts.onSale})
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filter Sidebar */}
          <div
            className={`mobile-filter-sidebar ${
              isMobileFilterOpen ? "open" : ""
            }`}
          >
            <div
              className="mobile-filter-overlay"
              onClick={closeMobileFilter}
            ></div>
            <div className="mobile-filter-content">
              <div className="mobile-filter-header">
                <h4>Filters</h4>
                <button className="close-filter" onClick={closeMobileFilter}>
                  <Icon icon="mdi:close" width="24" height="24" />
                </button>
              </div>

              <div className="mobile-filter-body">
                <div className="price-filer">
                  <div className="price-header mb-4">
                    <h5>Filter by Price</h5>
                    <div className="divider1">
                      <span className="green-line"></span>
                      <span className="gray-line"></span>
                    </div>
                  </div>
                  <div className="price-bar">
                    <div className="price-slider-container">
                      <div className="price-slider-track">
                        <div
                          className="price-slider-range"
                          style={{
                            left: `${
                              ((priceRange.min - minPrice) /
                                (maxPrice - minPrice)) *
                              100
                            }%`,
                            width: `${
                              ((priceRange.max - priceRange.min) /
                                (maxPrice - minPrice)) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <input
                        type="range"
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange.min}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          if (newMin <= priceRange.max) {
                            setPriceRange({ ...priceRange, min: newMin });
                          }
                        }}
                        className="price-slider price-slider-min"
                      />
                      <input
                        type="range"
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange.max}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          if (newMax >= priceRange.min) {
                            setPriceRange({ ...priceRange, max: newMax });
                          }
                        }}
                        className="price-slider price-slider-max"
                      />
                    </div>
                  </div>
                  <div className="price-footer">
                    <div className="price-range">
                      <p>
                        Price:{" "}
                        <span className="min-price"> ₹{priceRange.min}</span>—
                        <span className="max-price"> ₹{priceRange.max}</span>
                      </p>
                    </div>
                    <button
                      className="filter-btn"
                      onClick={() =>
                        handlePriceRangeChange(priceRange.min, priceRange.max)
                      }
                    >
                      Filter
                    </button>
                  </div>
                </div>

                <div className="category-filter">
                  <div className="category-header mb-4">
                    <h5>Filter by Categories</h5>
                    <div className="divider1">
                      <span className="green-line"></span>
                      <span className="gray-line"></span>
                    </div>
                  </div>
                  <div className="category-list">
                    {collections.map((collection) => {
                      const count = categoryCounts[collection.handle] || 0;
                      if (count === 0) return null;

                      return (
                        <div key={collection.handle} className="category-item">
                          <label className="category-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(
                                collection.handle
                              )}
                              onChange={(e) =>
                                handleCategoryChange(
                                  collection.handle,
                                  e.target.checked
                                )
                              }
                            />
                            <span className="checkmark"></span>
                            <span className="category-name">
                              {collection.title}
                            </span>
                            <span className="category-count">({count})</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="status-filter">
                  <div className="status-header mb-4">
                    <h5>Product Status</h5>
                    <div className="divider1">
                      <span className="green-line"></span>
                      <span className="gray-line"></span>
                    </div>
                  </div>
                  <div className="status-list">
                    <div className="status-item">
                      <label className="status-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedStatus.includes("inStock")}
                          onChange={(e) =>
                            handleStatusChange("inStock", e.target.checked)
                          }
                        />
                        <span className="checkmark"></span>
                        <span className="status-name">In Stock</span>
                        <span className="status-count">
                          ({statusCounts.inStock})
                        </span>
                      </label>
                    </div>
                    <div className="status-item">
                      <label className="status-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedStatus.includes("onSale")}
                          onChange={(e) =>
                            handleStatusChange("onSale", e.target.checked)
                          }
                        />
                        <span className="checkmark"></span>
                        <span className="status-name">On Sale</span>
                        <span className="status-count">
                          ({statusCounts.onSale})
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mobile-filter-footer">
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
                <button
                  className="apply-filters-btn"
                  onClick={closeMobileFilter}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-9 col-md-12 col-sm-12 col-12">
            <div className="product-grid-area">
              <img
                src={`${imageBase}/shop-banner.jpg`}
                srcSet={`${imageBase}/shop-banner@2x.jpg 2x, ${imageBase}/shop-banner@3x.jpg 3x`}
                alt="Shop Banner"
              />

              {/* Applied Filters */}
              <div className="applied-filter">
                {appliedFilters.length > 0 && (
                  <div className="applied-filters-container">
                    <div className="filter-tags">
                      {appliedFilters.map((filter, index) => (
                        <div key={index} className="filter-tag">
                          <span>{filter.label}</span>
                          <button
                            className="remove-filter"
                            onClick={() => removeFilter(filter)}
                          >
                            <Icon icon="mdi:close" width="14" height="14" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="clear-all-filters"
                      onClick={clearAllFilters}
                    >
                      <Icon icon="mdi:delete-outline" width="16" height="16" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>

              <div className="sorting-bar">
                <div className="sort-left">
                  <div
                    className="filter-btn d-block d-lg-none"
                    onClick={toggleMobileFilter}
                  >
                    <Icon icon="lets-icons:filter" width="24" height="24" />
                  </div>
                  <span>
                    Showing {startIndex + 1}-
                    {Math.min(
                      startIndex + productsPerPage,
                      filteredProducts.length
                    )}{" "}
                    of {filteredProducts.length} results
                  </span>
                </div>
                <select value={sortBy} onChange={handleSortChange}>
                  <option value="default">Default Sorting</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="name-a-z">Name: A to Z</option>
                  <option value="name-z-a">Name: Z to A</option>
                  <option value="new-arrival">New Arrivals</option>
                  <option value="trending">Trending</option>
                  <option value="smart-cart">Smart Cart</option>
                  <option value="featured">Featured</option>
                  <option value="on-sale">On Sale</option>
                  <option value="availability">Availability</option>
                </select>
              </div>

              {loading ? (
                <div className="product-grid">
                  {[...Array(12)].map((_, index) => (
                    <ShopProductCard key={index} />
                  ))}
                </div>
              ) : (
                <div className="product-grid">
                  {currentProducts.map((product, index) => (
                    <ShopProductCard
                      key={product.id || index}
                      productData={product}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination">
                    {/* Previous button */}
                    {currentPage > 1 && (
                      <button
                        className="pagination-btn pagination-prev"
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <Icon
                          icon="iconamoon:arrow-left-2"
                          width="16"
                          height="16"
                        />
                      </button>
                    )}

                    {getPaginationItems().map((item, index) => (
                      <React.Fragment key={index}>
                        {item === "..." ? (
                          <span className="pagination-dots">...</span>
                        ) : (
                          <button
                            className={`pagination-btn ${
                              currentPage === item ? "active" : ""
                            }`}
                            onClick={() => handlePageChange(item)}
                          >
                            {item}
                          </button>
                        )}
                      </React.Fragment>
                    ))}

                    {/* Next button */}
                    {currentPage < totalPages && (
                      <button
                        className="pagination-btn pagination-next"
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <Icon
                          icon="iconamoon:arrow-right-2"
                          width="16"
                          height="16"
                        />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shop;
