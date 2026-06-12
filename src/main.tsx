import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CategoryAnimationProvider, RainbowProvider } from "./context";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <RainbowProvider>
        <CategoryAnimationProvider>
          <App />
        </CategoryAnimationProvider>
      </RainbowProvider>
    </BrowserRouter>
  </StrictMode>
);
