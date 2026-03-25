import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { login as apiLogin, register as apiRegister, type LoginResponse, type CreateAccountRequest, type AccountResponse, type RegisterRequest, type OnboardingData } from "@/lib/api";

const AUTH_STORAGE_KEY = "upath_auth_user";
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
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (registration: RegisterRequest, onboarding: OnboardingData) => Promise<string>;
  logout: () => void;
  setPendingRegistration: (data: RegisterRequest) => void;
  getPendingRegistration: () => RegisterRequest | null;
  clearPendingRegistration: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

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
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
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
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    localStorage.removeItem(PENDING_REG_KEY);
    return authUser.id;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
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
