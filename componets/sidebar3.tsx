'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  CalendarDays,
  CheckCircle,
  Building2,
  User,
  LogOut,
  Clock,
  BarChart3,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/cleaner/dashboard', icon: LayoutDashboard },
  { label: 'Assigned Rooms', href: '/cleaner/assigned-rooms', icon: Building2 },
  { label: 'Cleaning Schedule', href: '/cleaner/schedule', icon: CalendarDays },
  { label: 'Completed Tasks', href: '/cleaner/completed-tasks', icon: CheckCircle },
  { label: 'Mark Attendance', href: '/cleaner/attendance', icon: Clock },
  { label: 'Profile', href: '/cleaner/profile', icon: User },
  { label: 'Performance Report', href: '/cleaner/performance-report', icon: BarChart3 },
  { label: 'Logout', href: '/login', icon: LogOut },
];

export default function Sidebar2({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-md border-r border-gray-200 p-4 z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:block`}
      >
        {/* Close button for mobile */}
        <div className="flex justify-between items-center mb-4 md:hidden">
          <h1 className="text-xl font-bold text-green-900">Mzuni Cleaning</h1>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Title for md+ */}
        <h1 className="text-2xl text-green-900 font-bold mb-6 hidden md:block">
          Mzuni Cleaning
        </h1>

        <nav className="flex flex-col gap-2">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 text-green-700 hover:bg-gray-400 font-bold hover:text-white px-3 py-2 rounded-md transition-all"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
