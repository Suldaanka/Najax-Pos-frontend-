import { createAuthClient } from "better-auth/react";

// Point to the same domain (Netlify) so cookies are first-party.
// Netlify.toml will proxy these requests to Railway.
// Point directly to Railway backend for auth to ensure correct redirect_uri (Google OAuth).
// Using the backend domain directly avoids proxy/domain mismatch issues.
const authBaseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://najax-pos-production.up.railway.app/api/auth";

export const authClient = createAuthClient({
    baseURL: authBaseURL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
