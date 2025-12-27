import { createAuthClient } from "better-auth/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// better auth client is a wrapper that makes the API calls and manages React state
// useSession hook polls or subscribes to session state, hence no manual management of cookies
// this is a factory function, we pass in a config object, a new object instance is created
export const authClient = createAuthClient({
  // the backend where betterAuth is located
  baseURL: API_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
