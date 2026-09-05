import Sidebar from "../components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}