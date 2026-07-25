import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const backendUrl = "https://crimelens-backend-50044197986.development.catalystappsail.in";
    if (typeof input === "string") {
      if (input.startsWith("http://localhost:8000")) {
        input = input.replace("http://localhost:8000", backendUrl);
      } else if (input.startsWith("/api/v1")) {
        input = `${backendUrl}${input}`;
      }
    } else if (input instanceof URL) {
      if (input.href.startsWith("http://localhost:8000")) {
        input = new URL(input.href.replace("http://localhost:8000", backendUrl));
      }
    } else if (input instanceof Request) {
      if (input.url.startsWith("http://localhost:8000")) {
        input = new Request(input.url.replace("http://localhost:8000", backendUrl), input);
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
