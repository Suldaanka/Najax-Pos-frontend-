import { createAuthClient } from "better-auth/react";
import { emailAndPassword } from "better-auth/client/plugins";

// Route auth through the frontend's own Next.js proxy (/api/* → backend).
// This is REQUIRED for Railway deployments: *.up.railway.app subdomains are on the
// public suffix list, meaning cookies cannot be shared between them. By routing
// through the frontend proxy, all auth cookies stay on the frontend domain,
// which eliminates the state_mismatch error during Google OAuth.
const authBaseURL = typeof window !== "undefined"
    ? `${window.location.origin}/api/auth`
    : (process.env.NEXT_PUBLIC_FRONTEND_URL
        ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/auth`
        : "https://najax-pos-frontend-production.up.railway.app/api/auth");

export const authClient = createAuthClient({
    baseURL: authBaseURL,
    plugins: [
        emailAndPassword()
    ]
});

export const { signIn, signOut, signUp, useSession } = authClient;
