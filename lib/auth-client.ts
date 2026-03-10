import { createAuthClient } from "better-auth/react";

// Use the backend URL directly to avoid proxy issues and ENOTFOUND/ECONNRESET errors.
const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://najax-pos-production.up.railway.app";

export const authClient = createAuthClient({
    baseURL: backendURL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
