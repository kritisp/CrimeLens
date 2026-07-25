import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const deployedBackend = "https://crimelens-backend-50044197986.development.catalystappsail.in";

  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === "string") {
      if (input.startsWith("http://localhost:8000") || input.startsWith("http://127.0.0.1:8000")) {
        input = isLocal 
          ? input.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, "")
          : input.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, deployedBackend);
      } else if (input.startsWith("/api/v1") && !isLocal) {
        input = `${deployedBackend}${input}`;
      }

      // Hackathon trick: Bypass Zoho API Gateway CORS Preflight (OPTIONS)
      // by converting the request to a "Simple Request" using text/plain.
      // The backend middleware will automatically convert it back to application/json.
      if (init && init.headers) {
        // Convert headers object to a mutable Headers instance
        const newHeaders = new Headers(init.headers);
        if (newHeaders.get("Content-Type") === "application/json") {
          newHeaders.set("Content-Type", "text/plain");
          init.headers = newHeaders;
        }
      }
    } else if (input instanceof URL) {
      if (input.href.includes(":8000")) {
        const replacement = isLocal ? "" : deployedBackend;
        input = new URL(input.href.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, replacement));
      }
    } else if (input instanceof Request) {
      if (input.url.includes(":8000")) {
        const replacement = isLocal ? "" : deployedBackend;
        input = new Request(input.url.replace(/http:\/\/(localhost|127\.0\.0\.1):8000/, replacement), input);
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
