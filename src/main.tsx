import React from "react";
import ReactDOM from "react-dom/client";
import { setupIonicReact } from "@ionic/react";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/padding.css";
import "@ionic/react/css/flex-utils.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import { App } from "./app/App";
import "./styles/tailwind.css";
import "./styles/theme.css";

setupIonicReact({
  mode: "md",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
