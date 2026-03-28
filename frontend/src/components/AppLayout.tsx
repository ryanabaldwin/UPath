import { Outlet, NavLink } from "react-router-dom";
import { UserCircle, LogOut } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const AppLayout = () => {
  const { user, profile, logout } = useAuth();

  const displayName = profile
    ? `${profile.user_first} ${profile.user_last}`
    : user
      ? `${user.firstName} ${user.lastName}`
      : "";

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-56">
      <DesktopNav />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-end gap-2">
          {displayName && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <UserCircle className="h-5 w-5" />
              {displayName}
            </NavLink>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
