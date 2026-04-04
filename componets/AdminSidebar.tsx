'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Users,
  FileText,
  Banknote,
  GraduationCap,
  Settings,
  Menu,
  X,
} from 'lucide-react';

const adminNavItems = [
  { label: 'Dashboard', href: '/appadmin', icon: Home },
  { label: 'Applicants', href: '/appadmin/applicants', icon: Users },
  { label: 'Applications', href: '/appadmin/applications', icon: FileText },
  { label: 'Fees', href: '/appadmin/fees', icon: Banknote },
  { label: 'Programmes', href: '/appadmin/programmes', icon: GraduationCap },
  { label: 'Settings', href: '/appadmin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  return (
    <>
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
          fixed top-0 left-0 h-screen w-64 bg-white shadow-md border-r border-gray-200 px-4 pt-4
          overflow-y-auto z-50
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <Image
          src="/logo.jpeg"
          width={80}
          height={40}
          alt="Mzuzu University Logo"
          className="mb-4 mx-auto"
        />

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="font-extrabold text-green-950">Mzuni Admin Panel</h1>
          <p className="text-gray-500 text-sm">Application Management System</p>
        </div>

        <hr className="mb-3" />

        {/* Navigation */}
        <nav className="space-y-4">
          {adminNavItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={`${href}-${label}`}
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
    </>
  );
}
