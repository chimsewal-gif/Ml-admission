import AdminSidebar from '@/componets/AdminSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      {/* ✅ Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-50 min-h-screen md:ml-64">
        {children}
      </main>
    </div>
  );
}
