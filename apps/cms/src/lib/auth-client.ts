import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { entorno } from "./entorno";

export const authClient = createAuthClient({
  baseURL: entorno.convexSiteUrl,
  plugins: [convexClient(), crossDomainClient()],
});
