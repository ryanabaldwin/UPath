import { Map, Users, Compass, BookOpen, Home, Briefcase, LogOut, Shield } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const links = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/milestones", icon: Map, label: "Milestones" },
  { to: "/mentors", icon: Users, label: "Mentors" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/careers", icon: Briefcase, label: "Careers" },
  { to: "/resources", icon: BookOpen, label: "Resources" },
];

const DesktopNav = () => {
  const { isAdmin, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-border bg-card md:flex md:flex-col" aria-label="Side navigation">
      <Link to="/" className="flex items-center gap-2 px-5 py-5 hover:opacity-80 transition-opacity">
        <Compass className="h-7 w-7 text-primary" />
        <span className="text-lg font-bold text-foreground">UPath</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Shield className="h-5 w-5" />
            Admin
          </NavLink>
        )}
      </nav>
      <div className="border-t border-border px-3 py-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default DesktopNav;
