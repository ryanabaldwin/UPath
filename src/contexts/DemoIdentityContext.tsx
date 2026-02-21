import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchUsers, type User } from "@/lib/api";

const STORAGE_KEY = "upath_demo_user_id";

interface DemoIdentityContextValue {
  user: User | null;
  userId: string | null;
  users: User[];
  setUserId: (id: string | null) => void;
  isLoading: boolean;
  refetchUsers: () => void;
}

const DemoIdentityContext = createContext<DemoIdentityContextValue | null>(null);

export function DemoIdentityProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(() =>
    typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUsers = useCallback(async () => {
    try {
      const list = await fetchUsers();
      setUsers(list);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && !list.some((u) => u.id === stored)) {
        localStorage.removeItem(STORAGE_KEY);
        setUserIdState(list[0]?.id ?? null);
      } else if (!stored && list.length > 0) {
        setUserIdState(list[0].id);
        localStorage.setItem(STORAGE_KEY, list[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch users for demo selector", e);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchUsers();
  }, [refetchUsers]);

  const setUserId = useCallback((id: string | null) => {
    setUserIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const user = userId ? users.find((u) => u.id === userId) ?? null : null;

  return (
    <DemoIdentityContext.Provider
      value={{
        user,
        userId,
        users,
        setUserId,
        isLoading,
        refetchUsers,
      }}
    >
      {children}
    </DemoIdentityContext.Provider>
  );
}

export function useDemoIdentity() {
  const ctx = useContext(DemoIdentityContext);
  if (!ctx) {
    throw new Error("useDemoIdentity must be used within DemoIdentityProvider");
  }
  return ctx;
}
