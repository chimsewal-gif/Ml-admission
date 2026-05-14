// components/CommitteeSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home,
  Users,
  FileText,
  Star,
  BarChart3,
  Settings,
  Menu,
  X,
  UserCheck,
  User2Icon
} from 'lucide-react';

const committeeNavItems = [
  { label: 'Dashboard', href: '/commitee', icon: Home },
  { label: 'Applications', href: '/commitee/applications', icon: FileText },
  { label: 'All verifications', href: '/commitee/eligibility', icon: User2Icon },
  { label: 'Evaluations', href: '/commitee/evaluations', icon: Star },
  { label: 'Reports', href: '/commitee/reports', icon: BarChart3 },
  { label: 'Committee Members', href: '/commitee/members', icon: UserCheck },
  
  { label: 'Settings', href: '/commitee/settings', icon: Settings },
];

export default function CommitteeSidebar() {
  const [isOpen, setIsOpen] = useState(false);

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
          fixed top-0 left-0 h-screen bg-white shadow-md border-r border-gray-200 pt-4
          overflow-y-auto z-50 w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex justify-center mb-4 px-2">
          <Image
            src="/logo.jpeg"
            width={80}
            height={40}
            alt="Mzuzu University Logo"
            className="w-20"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="font-extrabold text-green-950 text-sm whitespace-nowrap">Committee Portal</h1>
          <p className="text-gray-500 text-xs whitespace-nowrap">Selection Committee</p>
        </div>

        <hr className="mb-3 mx-2" />

        {/* Navigation */}
        <nav className="space-y-2 px-2">
          {committeeNavItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={`${href}-${label}`}
              href={href}
              className="
                flex items-center gap-3 text-green-700 hover:bg-gray-400 font-bold hover:text-white 
                px-3 py-2 rounded-md
              "
              onClick={() => setIsOpen(false)}
            >
              <Icon className="w-6 h-6 text-gray-700" />
              <span className="text-base font-bold whitespace-nowrap">
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}