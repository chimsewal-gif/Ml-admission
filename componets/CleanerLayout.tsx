'use client';

import { useState } from 'react';
import { Sidebar } from 'lucide-react';
import { Menu } from 'lucide-react';

export default function CleanerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Hidden on mobile) */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header with Menu Button */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white shadow">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-green-800 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-green-900">Mzuni Cleaner Portal</h1>
        </header>

        {/* Page content */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
