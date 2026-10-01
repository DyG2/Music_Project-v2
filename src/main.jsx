import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Styles : Bootstrap puis nos styles personnalises (ordre important).
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/index.css";
import "./styles/style.css";

import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
