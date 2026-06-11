import Sidebar from "@/components/layout/Sidebar";
import GlobalSearch from "@/components/layout/GlobalSearch";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <GlobalSearch />
      <div className="lg:pl-56">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
