// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  User,
  Phone,
  Users,
  School,
  BookOpen,
  File,
  CreditCard,
  CheckCircle,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/application/dashboard', icon: LayoutDashboard },
  { label: 'Personal Details', href: '/application/personal-details', icon: User },
  { label: 'Contact Details', href: '/application/contact-details', icon: Phone },
  { label: 'Next of Kin', href: '/application/next-of-kin', icon: Users },
  { label: 'High School Records', href: '/application/High-school-records', icon: School },
  { label: 'Program Selection', href: '/application/program-selection', icon: BookOpen },
  { label: 'Documents', href: '/application/documents', icon: File },
   { label: 'Submit Application', href: '/application/submit', icon: CheckCircle },
  { label: 'Application Fees', href: '/application/application-fees', icon: CreditCard },
 
];export default function Sidebar() {
  return (
    <aside className="w-64 fixed top-0 left-0 h-screen bg-white shadow-md border-r border-gray-200 p-4 overflow-y-auto z-50">
      <h1 className="text-2xl text-green-900 font-bold mb-4">Mzuzu University</h1>
      <nav className="space-y-2">
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
  );
}
