"use client";
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
