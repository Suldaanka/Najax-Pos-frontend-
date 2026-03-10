import { createAuthClient } from "better-auth/react";

// Point to the same domain (Netlify) so cookies are first-party.
// Netlify.toml will proxy these requests to Railway.
const frontendURL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000");

export const authClient = createAuthClient({
    baseURL: frontendURL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
