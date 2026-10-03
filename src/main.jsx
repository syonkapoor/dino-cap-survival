import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";

// Dino Cap (2010) is the game. The earlier Dino Cap 2-flavoured build is kept,
// unchanged, behind ?sequel so nothing that worked before is lost.
const wantsSequel = new URLSearchParams(location.search).has("sequel");
const Root = lazy(() =>
  wantsSequel ? import("./legacy/LegacyApp.jsx") : import("./dc1/App.jsx"),
);

createRoot(document.getElementById("root")).render(
  <Suspense fallback={null}>
    <Root />
  </Suspense>,
);
