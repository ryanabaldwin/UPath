import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import DesktopNav from "./DesktopNav";
import DemoUserSelector from "./DemoUserSelector";

const AppLayout = () => (
  <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-56">
    <DesktopNav />
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-end">
        <span className="mr-2 text-xs text-muted-foreground">Demo profile:</span>
        <DemoUserSelector />
      </div>
      <Outlet />
    </main>
    <BottomNav />
  </div>
);

export default AppLayout;
