
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ensureMsal } from "./lib/entra";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("SpikeOS root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Initialize Microsoft authentication in the background.
// Do not block the entire React application from rendering
// while MSAL initializes.
void ensureMsal().catch((error) => {
  console.warn(
    "SpikeOS Microsoft authentication will initialize when the login flow starts.",
    error
  );
});

