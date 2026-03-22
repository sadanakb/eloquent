import React from "react";
import ReactDOM from "react-dom/client";
import App from "./src/App.jsx";
import { ErrorBoundary } from "./src/components/ErrorBoundary.jsx";

// Dark mode initialization
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
  document.documentElement.dataset.theme = 'dark';
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
