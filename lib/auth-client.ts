import { createAuthClient } from "better-auth/react";

// The baseURL must point to the Better Auth handler: /api/auth
// NEXT_PUBLIC_API_URL should be the backend base URL (e.g. http://localhost:5000)
const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

const cleanBackendURL = backendURL.endsWith('/') ? backendURL : `${backendURL}/`;

export const authClient = createAuthClient({
    baseURL: `${cleanBackendURL}api/auth`
});

export const { signIn, signOut, signUp, useSession } = authClient;
