import { createAuthClient } from "better-auth/react";

// Point to the local Next.js proxy so OAuth state cookies are on localhost:3000
// The proxy in next.config.ts forwards these requests to the Railway backend.
// This is CRITICAL for avoiding state_mismatch in cross-domain OAuth.
const frontendURL = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000");

export const authClient = createAuthClient({
    baseURL: frontendURL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
