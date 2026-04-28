import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { ConfirmDialogHost } from "./app/confirmModal";
import "./styles.css";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
    <ConfirmDialogHost />
  </React.StrictMode>
);
