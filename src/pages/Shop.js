import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useImagePath } from "../context/ImagePathContext";
import { Icon } from "@iconify/react";
import ShopProductCard from "../components/ShopProductCard";
import { getProducts } from "../utils/shopify";

function Shop() {
  const imageBase = useImagePath();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(products.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = products.slice(
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
          <div className="col-lg-3 col-md-3 d-none d-md-block"></div>
          <div className="col-lg-9 col-md-9 col-sm-12 col-12">
            <div className="product-grid-area">
              <img
                src={`${imageBase}/shop-banner.jpg`}
                srcSet={`${imageBase}/shop-banner@2x.jpg 2x, ${imageBase}/shop-banner@3x.jpg 3x`}
                alt="Shop Banner"
              />
              <div className="sorting-bar">
                <div className="sort-left">
                  <div className="filter-btn d-block d-md-none">
                    <Icon icon="lets-icons:filter" width="24" height="24" />
                  </div>
                  <span>
                    Showing {startIndex + 1}-
                    {Math.min(startIndex + productsPerPage, products.length)} of{" "}
                    {products.length} results
                  </span>
                </div>
                <select>
                  <option value="default">Default Sorting</option>
                  <option value="price">Sort by Price</option>
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
