import React, { createContext, useContext } from "react";

const ImagePathContext = createContext("");

export const ImagePathProvider = ({ children, basePath }) => {
  return (
    <ImagePathContext.Provider value={basePath}>
      {children}
    </ImagePathContext.Provider>
  );
};

export const useImagePath = () => {
  return useContext(ImagePathContext);
};
