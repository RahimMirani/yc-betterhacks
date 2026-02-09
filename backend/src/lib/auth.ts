import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { env } from "../config/env";

const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string }
> = {};

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: new Pool({ connectionString: env.DATABASE_URL }),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  trustedOrigins: ["http://localhost:3000"],
  advanced: {
    useSecureCookies: false, // Set to true in production with HTTPS
  },
});

export type Session = typeof auth.$Infer.Session;
