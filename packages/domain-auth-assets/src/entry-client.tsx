import React from "react";
import ReactDOM, { hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const isSSR = false;

if (isSSR) {
  hydrateRoot(document.getElementById("root")!, <App />);
  console.log("hydrated dom");
} else {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
