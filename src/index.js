import React from "react";

import ReactDOM from "react-dom/client";
import App from "./App";
import { ImagePathProvider } from "./context/ImagePathContext";
import { StoreProvider } from "./context/StoreContext";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <StoreProvider>
    <ImagePathProvider basePath={`${process.env.PUBLIC_URL}/assets/images/`}>
      <App />
    </ImagePathProvider>
  </StoreProvider>
);

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = `${process.env.PUBLIC_URL}/sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
