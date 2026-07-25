import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === "string") {
      const backendUrl = "https://crimelens-backend-50044197986.development.catalystappsail.in";
      
      // Override hardcoded localhost URLs
      if (input.startsWith("http://localhost:8000/api/v1")) {
        input = input.replace("http://localhost:8000", backendUrl);
      } 
      // Override relative API URLs
      else if (input.startsWith("/api/v1")) {
        input = `${backendUrl}${input}`;
      }
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
