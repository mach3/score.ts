import { createRoot } from "react-dom/client";
import { Page } from "./page";
import React from "react";

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(React.createElement(Page));
