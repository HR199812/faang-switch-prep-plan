import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// The System Design Atlas lives inside this app at /atlas (also /system-design).
// It's loaded as a separate chunk so the tracker stays light.
const Atlas = lazy(() => import("./atlas/Atlas.jsx"));
const isAtlas = /^\/(atlas|system-design)(\/|$)/.test(window.location.pathname);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAtlas ? (
      <Suspense fallback={null}>
        <Atlas />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
