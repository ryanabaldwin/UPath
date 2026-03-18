import { Outlet, NavLink } from "react-router-dom";
import { UserCircle } from "lucide-react";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import DemoUserSelector from "./DemoUserSelector";

const AppLayout = () => (
  <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-56">
    <DesktopNav />
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">Demo profile:</span>
        <DemoUserSelector />
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }
          aria-label="Edit profile"
        >
          <UserCircle className="h-5 w-5" />
        </NavLink>
      </div>
      <Outlet />
    </main>
    <BottomNav />
  </div>
);

export default AppLayout;
