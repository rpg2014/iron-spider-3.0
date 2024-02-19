import React from "react";
import ReactDOM, { hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (!import.meta.env.DEV) {
  hydrateRoot(document.getElementById("root")!, <App />);
  console.log("hydrated dom");
} else {
  console.log("creating root");
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
