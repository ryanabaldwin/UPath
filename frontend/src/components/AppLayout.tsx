import { Outlet, NavLink, Link } from "react-router-dom";
import { UserCircle, LogOut } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import DemoUserSelector from "./DemoUserSelector";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const AppLayout = () => {
  const { user } = useDemoIdentity();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-56">
      <DesktopNav />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          {/* Demo profile selector — always accessible so users know how to switch */}
          <DemoUserSelector />

          <div className="flex items-center gap-2">
            {user && (
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
                {user.user_first} {user.user_last}
              </NavLink>
            )}
            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
            )}
          </div>
        </div>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
