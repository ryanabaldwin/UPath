import { Map, Users, Compass, BookOpen, Briefcase, Home } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/milestones", icon: Map, label: "Milestones" },
  { to: "/mentors", icon: Users, label: "Mentors" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/careers", icon: Briefcase, label: "Careers" },
  { to: "/resources", icon: BookOpen, label: "Resources" },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden" aria-label="Main navigation">
    <div className="flex items-center justify-around py-2">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors rounded-lg",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export default BottomNav;
