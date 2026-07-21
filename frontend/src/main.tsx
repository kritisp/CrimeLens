import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === "string" && input.startsWith("/api/v1")) {
      const hostname = window.location.hostname;
      if (hostname.includes("catalystserverless")) {
        const projectPart = hostname.split(".")[0];
        const appsailProjectPart = projectPart.replace(/^crimelens-/, "crimelens-backend-");
        const appsailHostname = hostname
          .replace(projectPart, appsailProjectPart)
          .replace("catalystserverless", "catalystappsail");
        input = `https://${appsailHostname}${input}`;
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
