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
