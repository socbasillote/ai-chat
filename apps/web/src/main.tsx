import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { AuthInitializer } from "./components/AuthInitializer";

import App from "./App";
import { store } from "./store/store";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthInitializer>
        <App />
      </AuthInitializer>
    </Provider>
  </React.StrictMode>,
);
