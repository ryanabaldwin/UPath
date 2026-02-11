import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";

const AppLayout = () => (
  <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-56">
    <DesktopNav />
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Outlet />
    </main>
    <BottomNav />
  </div>
);

export default AppLayout;
