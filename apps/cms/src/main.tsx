import { ConvexBetterAuthProvider, type AuthClient } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import "./index.css";
import { authClient } from "./lib/auth-client";
import { entorno } from "./lib/entorno";

// expectAuth: las consultas esperan a conocer la sesión antes de ejecutarse.
const convex = new ConvexReactClient(entorno.convexUrl, { expectAuth: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Los tipos de @convex-dev/better-auth 0.12 no reconocen un cliente con
        crossDomainClient, aunque en ejecución es el que la librería espera. */}
    <ConvexBetterAuthProvider client={convex} authClient={authClient as unknown as AuthClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConvexBetterAuthProvider>
  </StrictMode>,
);
