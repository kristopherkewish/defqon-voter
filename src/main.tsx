import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initStore } from "./store/voteStore";
import "./styles.css";

// Load the shared vote state once, then mount. initStore() resolves even if the
// backend is unreachable (it falls back to empty state + keeps polling).
initStore().finally(() => {
  const root = document.getElementById("root");
  if (!root) throw new Error("#root not found");
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
