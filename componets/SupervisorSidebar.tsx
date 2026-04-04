'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BarChart3,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  Home
} from 'lucide-react';

const supervisorNavItems = [
  { label: 'Home', href: '/supervisor/dashboard', icon: Home },
  { label: 'Profile', href: '/supervisor/profile', icon: User },
  { label: 'Monitor Task', href: '/supervisor/assigned-cleaners', icon: Users },
  { label: 'Task updates', href: '/supervisor/schedule', icon: CalendarDays },
  { label: 'Notifications', href: '/supervisor/attendance', icon: Clock },
  { label: 'Settings', href: '/supervisor/performance', icon: BarChart3 },
  
  
];

export default function SupervisorSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
    <aside className="w-64 fixed top-0 left-0 h-screen bg-white shadow-md border-r border-gray-200 p-4 overflow-y-auto z-50">
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 bg-white p-2 rounded shadow"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <X className="w-6 h-6 text-green-800" /> : <Menu className="w-6 h-6 text-green-800" />}
      </button>

      {/* Sidebar */}
          <aside
      className={`
        fixed top-10 left-0 h-screen w-64 bg-white shadow-md border-r border-gray-200 px-4 pt-4
        overflow-y-auto z-40
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.jpeg"
            width={80}
            height={40}
            alt="Mzuzu University Logo"
          />
        </div>

        <div className="text-center mb-4">
          <h1 className="font-extrabold text-green-950">Mzuzu University</h1>
          <p className="text-gray-500 text-sm">Supervisor Panel</p>
        </div>

        <hr className="mb-4" />

        <nav className="space-y-4">
          {supervisorNavItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 text-green-700 hover:bg-gray-400 font-bold hover:text-white px-3 py-2 rounded-md transition-all"
              onClick={() => setIsOpen(false)}
            >
              <Icon className="w-6 h-6 text-gray-700" />
              <span className="text-base font-bold">{label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </aside>
    </>
  );
}
