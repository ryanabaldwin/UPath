import { Outlet, NavLink } from "react-router-dom";
import { UserCircle } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import { useDemoIdentity } from "@/contexts/DemoIdentityContext";

const AppLayout = () => {
  const { user } = useDemoIdentity();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-56">
      <DesktopNav />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-end gap-2">
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
        </div>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
