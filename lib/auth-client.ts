import { createAuthClient } from "better-auth/react";

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

// We define a specialized type that informs the client about enabled server features.
// This allows forgetPassword and changePassword methods to be available without
// requiring a direct file-system link to the backend (important for separate repos).
interface BetterAuthServerSchema {
    emailAndPassword?: {
        enabled: true;
    };
}

export const authClient = createAuthClient<BetterAuthServerSchema>({
    baseURL: authBaseURL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
