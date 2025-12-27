import { useSession, signIn, signUp, signOut } from "../lib/auth-client";

export function useAuth() {
  const { data: session, isPending, error, refetch } = useSession();

  const login = async (email: string, password: string) => {
    const { data, error } = await signIn.email({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await signUp.email({
      email,
      password,
      name,
    });
    // token will be used for emailVerification. It is not bearer/ session token

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const logout = async () => {
    await signOut();
  };

  return {
    // difference between user and session is that, user is for identity. Session is for login instance metadata
    user: session?.user ?? null,
    session: session?.session ?? null,
    // isPending is for initial session load
    // for action loading state, we track in component, not in this hook
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
    login,
    register,
    logout,
    refetch,
    // refetch manually triggers a new get session calls, use it when we do external changes that bypasses betterAuth, like changing userName in profile
  };
}
