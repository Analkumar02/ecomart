import { useImagePath } from "../context/ImagePathContext";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useState, useEffect } from "react";
import { getCollections } from "../utils/shopify";
import { Icon } from "@iconify/react/dist/iconify.js";
import ProductCard from "../components/ProductCard";
import ProductCardSmall from "../components/ProductCardSmall";
import BestSellingCard from "../components/BestSellingCard";

const Home = () => {
  const imageBase = useImagePath();
  const [collections, setCollections] = useState([]);
  const [mainProductId, setMainProductId] = useState(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const collectionsData = await getCollections();
        // Sort collections alphabetically by title
        const sortedCollections = collectionsData.sort((a, b) =>
          a.title.localeCompare(b.title)
        );
        setCollections(sortedCollections);
      } catch (error) {
        console.error("Error fetching collections:", error);
        setCollections([]);
      }
    };

    fetchCollections();
  }, []);

  return (
    <>
      <section className="hero-area">
        <div className="container-xxl">
          <div className="hero-content">
            <div className="hero-left position-relative">
              <img
                className="img-fluid"
                src={`${imageBase}/hero-left.jpg`}
                srcSet={`${imageBase}/hero-left@2x.jpg 2x, ${imageBase}/hero-left@3x.jpg 3x`}
                alt="Hero Left"
              />
              <div className="hero-left-text">
                <div className="tag">100% Farm Fresh Food</div>
                <h1>The Taste of Nature, Now in Every Order.</h1>
                <h6>Fresh from the farm, straight to your doorstep.</h6>
                <Link to="/shop" className="hero-left-btn">
                  Shop Now
                </Link>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero2 position-relative">
                <img
                  className="img-fluid"
                  src={`${imageBase}/hero2.jpg`}
                  srcSet={`${imageBase}/hero2@2x.jpg 2x, ${imageBase}/hero2@3x.jpg 3x`}
                  alt="Hero Left"
                />
                <div className="hero2-text">
                  <h4>Fresh Lentils for Every Indian Kitchen!</h4>
                  <Link to="/shop" className="hero-right-btn">
                    Shop Now
                  </Link>
                </div>
              </div>
              <div className="hero3 position-relative">
                <img
                  className="img-fluid"
                  src={`${imageBase}/hero3.jpg`}
                  srcSet={`${imageBase}/hero3@2x.jpg 2x, ${imageBase}/hero3@3x.jpg 3x`}
                  alt="Hero Left"
                />
                <div className="hero3-text">
                  <h4>Fresh. Crunchy. Delicious.</h4>
                  <Link to="/shop" className="hero-right-btn">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="category-area">
        <div className="container-xxl">
          <div className="category-content">
            <Swiper
              modules={[Navigation]}
              navigation={true}
              loop={true}
              slidesPerView="auto"
              spaceBetween={0}
              breakpoints={{
                0: {
                  slidesPerView: 2,
                },
                576: {
                  slidesPerView: 3,
                },
                768: {
                  slidesPerView: 4,
                },
                992: {
                  slidesPerView: 5,
                },
                1200: {
                  slidesPerView: 6,
                },
                1400: {
                  slidesPerView: 7,
                },
              }}
              className="category-swiper"
            >
              {collections.map((collection) => (
                <SwiperSlide key={collection.id}>
                  <Link
                    to={`/collections/${collection.handle}`}
                    className="category-slide"
                  >
                    <img
                      src={
                        collection.image?.src || `${imageBase}placeholder.png`
                      }
                      alt={collection.title}
                      className="category-image"
                    />
                    <p className="category-name">{collection.title}</p>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      <section className="smartcart-area">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-3 d-none d-lg-block">
              <div className="smartcart-left">
                <img
                  className="img-fluid"
                  src={`${imageBase}/smart-banner.jpg`}
                  srcSet={`${imageBase}/smart-banner@2x.jpg 2x, ${imageBase}/smart-banner@3x.jpg 3x`}
                  alt="Smart Cart banner"
                />
                <div className="text-area">
                  <h4>
                    Freshest Products
                    <br />
                    every hour.
                  </h4>
                  <p>Best Bakery Products</p>
                  <Link to="/shop" className="smartcart-btn">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-9 col-md-12 col-sm-12">
              <div className="smartcart-product">
                <div className="product-header">
                  <p>My Smart Cart</p>
                  <div className="divider1">
                    <span className="green-line"></span>
                    <span className="gray-line"></span>
                  </div>
                  <Link to="/shop" className="see-more-btn">
                    See more
                    <Icon icon="ep:arrow-right" height="16" width="16" />
                  </Link>
                </div>
                <div className="product-area">
                  <ProductCard
                    onProductLoad={setMainProductId}
                    collectionType="smart-cart"
                  />
                  <ProductCardSmall
                    excludeProductId={mainProductId}
                    collectionType="smart-cart"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="promo-area">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-6 col-md-6 col-sm-12 col-12">
              <div className="promo-left position-relative">
                <img
                  className="img-fluid"
                  src={`${imageBase}promo-left.jpg`}
                  srcSet={`${imageBase}promo-left@2x.jpg 2x, ${imageBase}promo-left@3x.jpg 3x`}
                  alt="Promo Left"
                />
                <div className="promo-text">
                  <h2>
                    Make Your Grocery
                    <br />
                    Shopping Easy With Us
                  </h2>
                  <h6>Best quality products at lowest price</h6>
                  <Link to="/shop" className="promo-left-btn">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-sm-12 col-12">
              <div className="promo-right position-relative">
                <img
                  className="img-fluid"
                  src={`${imageBase}promo-right.jpg`}
                  srcSet={`${imageBase}promo-right@2x.jpg 2x, ${imageBase}promo-right@3x.jpg 3x`}
                  alt="Promo Right"
                />
                <div className="promo-text">
                  <h2>
                    More Popular & 
                    <br />
                    Organic Fresh Meat
                  </h2>
                  <h6>10% Off on Meat limited offer’s</h6>
                  <Link to="/shop" className="promo-left-btn">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trending-area">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-3 d-none d-lg-block">
              <div className="best-selling">
                <div className="best-header">
                  <h5>Best Selling</h5>
                  <div className="divider1">
                    <span className="green-line"></span>
                    <span className="gray-line"></span>
                  </div>
                </div>
                <BestSellingCard />
              </div>
            </div>
            <div className="col-lg-9 col-md-12 col-sm-12">
              <div className="trending-product">
                <div className="product-header">
                  <p>Trending Products</p>
                  <div className="divider1">
                    <span className="green-line"></span>
                    <span className="gray-line"></span>
                  </div>
                  <Link to="/shop" className="see-more-btn">
                    See more
                    <Icon icon="ep:arrow-right" height="16" width="16" />
                  </Link>
                </div>
                <div className="product-area">
                  <ProductCardSmall
                    excludeProductId={mainProductId}
                    collectionType="trending"
                    className="d-none d-lg-block"
                  />
                  <ProductCard
                    onProductLoad={setMainProductId}
                    collectionType="trending"
                  />
                  <ProductCardSmall
                    excludeProductId={mainProductId}
                    collectionType="trending"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fresh-banner-area">
        <div className="container-xxl">
          <div className="fresh-text">
            <h2>Say yes to season’s fresh</h2>
            <p>Refresh the day, the fruity way</p>
            <Link to="/shop" className="fresh-btn">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      <section className="new-arrival-area">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-3 d-none d-lg-block">
              <div className="new-arrival-left">
                <img
                  className="img-fluid"
                  src={`${imageBase}/new-banner.jpg`}
                  srcSet={`${imageBase}/new-banner@2x.jpg 2x, ${imageBase}/new-banner@3x.jpg 3x`}
                  alt="Smart Cart banner"
                />
                <div className="text-area">
                  <h4>
                    Freshest Products
                    <br />
                    every hour.
                  </h4>
                  <p>Best Bakery Products</p>
                  <Link to="/shop" className="new-arrival-btn">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-lg-9 col-md-12 col-sm-12">
              <div className="new-arrival-product">
                <div className="product-header">
                  <p>New Arrivals</p>
                  <div className="divider1">
                    <span className="green-line"></span>
                    <span className="gray-line"></span>
                  </div>
                  <Link to="/shop" className="see-more-btn">
                    See more
                    <Icon icon="ep:arrow-right" height="16" width="16" />
                  </Link>
                </div>
                <div className="product-area">
                  <ProductCardSmall
                    excludeProductId={mainProductId}
                    collectionType="new"
                  />
                  <ProductCard
                    onProductLoad={setMainProductId}
                    collectionType="new"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
