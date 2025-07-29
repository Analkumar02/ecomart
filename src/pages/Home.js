import { useImagePath } from "../context/ImagePathContext";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

const Home = () => {
  const imageBase = useImagePath();
  return (
    <section className="hero-area">
      <div className="container-xxl">
        <div className="hero-content">
          <div className="hero1 position-relative">
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
          <div className="hero2 position-relative">
            <img
              className="img-fluid"
              src={`${imageBase}/hero2.jpg`}
              srcSet={`${imageBase}/hero2@2x.jpg 2x, ${imageBase}/hero2@3x.jpg 3x`}
              alt="Hero Left"
            />
          </div>
          <div className="hero3 position-relative">
            <img
              className="img-fluid"
              src={`${imageBase}/hero3.jpg`}
              srcSet={`${imageBase}/hero3@2x.jpg 2x, ${imageBase}/hero3@3x.jpg 3x`}
              alt="Hero Left"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
