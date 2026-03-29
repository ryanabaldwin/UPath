import { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  fetchMe,
  logoutApi,
  fetchUser,
  type LoginResponse,
  type CreateAccountRequest,
  type AccountResponse,
  type RegisterRequest,
  type OnboardingData,
  type User,
} from "@/lib/api";

const PENDING_REG_KEY = "upath_pending_registration";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextValue {
  /** Auth identity (from login / session) */
  user: AuthUser | null;
  /** Full user profile data (fetched from /api/users/:id) */
  profile: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (registration: RegisterRequest, onboarding: OnboardingData) => Promise<string>;
  logout: () => void;
  /** The authenticated user's ID (null when not logged in) */
  userId: string | null;
  /** Re-fetch the user profile from the API */
  refetchProfile: () => Promise<void>;
  setPendingRegistration: (data: RegisterRequest) => void;
  getPendingRegistration: () => RegisterRequest | null;
  clearPendingRegistration: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check the session cookie via /auth/me
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (!cancelled) {
          setUser({
            id: me.id,
            username: me.username,
            email: me.email,
            firstName: me.firstName,
            lastName: me.lastName,
            role: me.role,
          });
        }
      } catch {
        // Not logged in — that's fine
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch the full user profile whenever the auth user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchUser(user.id);
        if (!cancelled) setProfile(p);
      } catch {
        // Profile fetch failed — leave null
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const refetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const p = await fetchUser(user.id);
      setProfile(p);
    } catch {
      // ignore
    }
  }, [user]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiLogin({ username, password });
    const authUser: AuthUser = {
      id: response.id,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    };
    setUser(authUser);
  }, []);

  const register = useCallback(async (registration: RegisterRequest, onboarding: OnboardingData): Promise<string> => {
    const response = await apiRegister({ registration, onboarding });
    const authUser: AuthUser = {
      id: response.id,
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
    };
    setUser(authUser);
    localStorage.removeItem(PENDING_REG_KEY);
    return authUser.id;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort
    }
    setUser(null);
    setProfile(null);
  }, []);

  const setPendingRegistration = useCallback((data: RegisterRequest) => {
    localStorage.setItem(PENDING_REG_KEY, JSON.stringify(data));
  }, []);

  const getPendingRegistration = useCallback((): RegisterRequest | null => {
    const stored = localStorage.getItem(PENDING_REG_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const clearPendingRegistration = useCallback(() => {
    localStorage.removeItem(PENDING_REG_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isLoading,
        login,
        register,
        logout,
        userId: user?.id ?? null,
        refetchProfile,
        setPendingRegistration,
        getPendingRegistration,
        clearPendingRegistration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
