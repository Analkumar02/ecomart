import React, { useState, useRef, useEffect } from "react";

const OptimizedImage = ({
  src,
  alt,
  className = "",
  loading = "lazy",
  sizes,
  srcSet,
  width,
  height,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === "lazy" && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = src;
              observer.unobserve(img);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }
  }, [src, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // Generate WebP sources if original is not WebP
  const generateWebPSource = (originalSrc) => {
    if (originalSrc.includes(".webp")) return originalSrc;
    return originalSrc.replace(/\.(jpg|jpeg|png)$/, ".webp");
  };

  return (
    <picture>
      {/* WebP source for modern browsers */}
      <source srcSet={generateWebPSource(src)} type="image/webp" />

      <img
        ref={imgRef}
        src={loading === "eager" ? src : undefined}
        alt={alt}
        className={`${className} ${isLoaded ? "loaded" : "loading"}`}
        loading={loading}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={srcSet}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          transition: "opacity 0.3s ease",
          opacity: hasError ? 0.5 : isLoaded ? 1 : 0.7,
        }}
        {...props}
      />
    </picture>
  );
};

export default OptimizedImage;
