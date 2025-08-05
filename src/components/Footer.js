import { Icon } from "@iconify/react/dist/iconify.js";
import { useImagePath } from "../context/ImagePathContext";
import { Link } from "react-router-dom";

const Footer = () => {
  const imageBase = useImagePath();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container-xxl">
          <div className="icon-box-area">
            <div className="icon-box">
              <Icon
                icon="fluent:food-apple-20-regular"
                width="40"
                height="40"
              />
              <div className="icon-text">
                <p>Quality products</p>
                <span>Quality products</span>
              </div>
            </div>
            <div className="icon-box">
              <Icon icon="la:shipping-fast" width="40" height="40" />
              <div className="icon-text">
                <p>10 min delivery*</p>
                <span>On selected locations</span>
              </div>
            </div>
            <div className="icon-box">
              <Icon
                icon="streamline-ultimate:shipping-logistic-free-shipping-delivery-truck"
                width="40"
                height="40"
              />
              <div className="icon-text">
                <p>Free delivery*</p>
                <span>No extra cost</span>
              </div>
            </div>
            <div className="icon-box">
              <Icon icon="lsicon:sales-return-outline" width="40" height="40" />
              <div className="icon-text">
                <p>Return Policy</p>
                <span>No Question asked</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="main-footer">
        <div className="container-xxl">
          <div className="row">
            <div className="col-lg-3 col-md-12 col-sm-12 col-12">
              <div className="footer-info">
                <Link to="/" className="footer-logo img-fluid">
                  <img
                    src={`${imageBase}logo.webp`}
                    srcSet={`
                  ${imageBase}logo.webp 1x,
                  ${imageBase}logo@2x.webp 2x,
                  ${imageBase}logo@3x.webp 3x
                `}
                    alt="Ecomart Logo"
                    loading="lazy"
                  />
                </Link>
                <p>
                  Ecomart brings you fresh groceries, top-quality products, and
                  unbeatable value — all in one place.
                </p>
                <div className="location">
                  <Icon icon="ep:location" width="17" height="17" />
                  <span> Eco Space, New Town, AA II</span>
                </div>
                <a href="tel:" className="phone">
                  <Icon icon="mage:phone-call" width="17" height="17" />
                  <span>+91 9876543210</span>
                </a>
                <div className="social-icons">
                  <a href="https://www.facebook.com/" className="location">
                    <Icon icon="ri:facebook-fill" width="17" height="17" />
                  </a>
                  <a href="https://x.com/" className="location">
                    <Icon icon="prime:twitter" width="17" height="17" />
                  </a>
                  <a href="https://www.instagram.com/" className="location">
                    <Icon icon="ri:instagram-line" width="17" height="17" />
                  </a>
                  <a href="https://www.threads.com/" className="location">
                    <Icon
                      icon="streamline-logos:thread-logo-logo-solid"
                      width="17"
                      height="17"
                    />
                  </a>
                  <a href="https://web.whatsapp.com/" className="location">
                    <Icon icon="ic:round-whatsapp" width="17" height="17" />
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6 col-6">
              <div className="footer-menu">
                <h5>EcoMart</h5>
                <ul>
                  <li>
                    <Link to="/">About Us</Link>
                  </li>
                  <li>
                    <Link to="/">In News</Link>
                  </li>
                  <li>
                    <Link to="/">Green Ecomart</Link>
                  </li>
                  <li>
                    <Link to="/">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link to="/">Affiliate</Link>
                  </li>
                  <li>
                    <Link to="/">Terms and Conditions</Link>
                  </li>
                  <li>
                    <Link to="/">Ecomart Daily</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 col-sm-6 col-6">
              <div className="footer-menu">
                <h5>Help</h5>
                <ul>
                  <li>
                    <Link to="/">FAQs</Link>
                  </li>
                  <li>
                    <Link to="/">Contact Us</Link>
                  </li>
                  <li>
                    <Link to="/">Ecomart Wallet FAQs</Link>
                  </li>
                  <li>
                    <Link to="/">Ecomart Wallet T&Cs</Link>
                  </li>
                  <li>
                    <Link to="/">Vendor Connect</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-3 col-md-12 col-sm-12 col-12">
              <div className="footer-news">
                <h5>Sign Up Newsletter</h5>
                <p>₹200 discount for your first order</p>
                <form
                  className="newsletter-form"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    type="email"
                    className="newsletter-input"
                    placeholder="Enter Your E-mail"
                    required
                  />
                  <button
                    type="submit"
                    className="newsletter-submit"
                    aria-label="Subscribe"
                  >
                    <Icon
                      icon="tabler:send"
                      width="20"
                      height="20"
                      style={{ color: "white" }}
                    />
                  </button>
                </form>
                <div className="download-text">
                  <p>
                    <b>Download App on Mobile :</b>
                  </p>
                  <p>₹200 discount for your first order</p>
                </div>
                <div className="download-btn">
                  <Link to="/">
                    <img
                      src={`${imageBase}play-store.webp`}
                      srcSet={`
                  ${imageBase}play-store.webp 1x,
                  ${imageBase}play-store@2x.webp 2x,
                  ${imageBase}play-store@3x.webp 3x
                `}
                      alt="Download from Playstore"
                      loading="lazy"
                    />
                  </Link>
                  <Link to="/">
                    <img
                      src={`${imageBase}app-store.webp`}
                      srcSet={`
                  ${imageBase}app-store.webp 1x,
                  ${imageBase}app-store@2x.webp 2x,
                  ${imageBase}app-store@3x.webp 3x
                `}
                      alt="Download from Appstore"
                      loading="lazy"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container-xxl">
          <div className="footer-bottom-content">
            <p>
              Copyright 2025 © Ecomart India Pvt. Ltd.. All rights reserved.
            </p>
            <img
              src={`${imageBase}Payment_Icons1.webp`}
              srcSet={`
                  ${imageBase}Payment_Icons1.webp 1x,
                  ${imageBase}Payment_Icons1@2x.webp 2x,
                  ${imageBase}Payment_Icons1@3x.webp 3x
                `}
              alt="Payment Icons"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
