import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  
  // Choose optimal backend based on current location
  const remoteBackendUrl = "https://crimelens-backend-50044197986.development.catalystappsail.in";
  const localBackendUrl = "http://127.0.0.1:8000";
  const targetBackend = isLocal ? localBackendUrl : remoteBackendUrl;

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === "string") {
      if (input.startsWith("http://localhost:8000") || input.startsWith("http://127.0.0.1:8000")) {
        input = input.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, targetBackend);
      } else if (input.startsWith("/api/v1")) {
        input = `${targetBackend}${input}`;
      }
    } else if (input instanceof URL) {
      if (input.href.includes(":8000")) {
        input = new URL(input.href.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, targetBackend));
      }
    } else if (input instanceof Request) {
      if (input.url.includes(":8000")) {
        input = new Request(input.url.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, targetBackend), input);
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
