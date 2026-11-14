import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/db";
import { sendEmail } from "./email";

const googleConfigured =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      // Not awaited so response timing does not reveal whether an account exists
      void sendEmail({
        to: user.email,
        subject: "Reset your Joan's Kitchen password",
        text: `Hi ${user.name},\n\nUse the link below to reset your password:\n${url}\n\nIf you didn't request this, you can ignore this email.`,
      }).catch((err) => console.error("[auth] reset email failed", err));
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Verify your Joan's Kitchen email",
        text: `Hi ${user.name},\n\nConfirm your email address using the link below:\n${url}`,
      }).catch((err) => console.error("[auth] verification email failed", err));
    },
  },

  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},

  account: {
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },

  user: {
    additionalFields: {
      about: { type: "string", required: false },
      isAdmin: { type: "boolean", required: false, defaultValue: false, input: false },
    },
    changeEmail: { enabled: true, updateEmailWithoutVerification: true },
  },

  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
