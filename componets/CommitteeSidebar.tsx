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
} from 'lucide-react';

const committeeNavItems = [
  { label: 'Dashboard', href: '/commitee', icon: Home },


  { label: 'Applications', href: '/commitee/applications', icon: FileText },
  { label: 'Evaluations', href: '/commitee/evaluations', icon: Star },
  { label: 'Reports', href: '/commitee/reports', icon: BarChart3 },
  { label: 'Committee Members', href: '/commitee', icon: UserCheck },
  { label: 'Settings', href: '/commitee/settings', icon: Settings },
];

export default function CommitteeSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    setIsCollapsed(true);
  };

  const handleMouseLeave = () => {
    setIsCollapsed(false);
  };

  const isExpanded = !isCollapsed;

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
          overflow-y-auto z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="flex justify-center mb-4 px-2">
          <Image
            src="/logo.jpeg"
            width={isExpanded ? 80 : 40}
            height={isExpanded ? 40 : 20}
            alt="Mzuzu University Logo"
            className={`transition-all duration-300 ${isExpanded ? 'w-20' : 'w-10'}`}
          />
        </div>

        {/* Full Title */}
        <div className={`
          text-center mb-4 transition-all duration-300 overflow-hidden
          ${isExpanded ? 'opacity-100 max-h-24' : 'opacity-0 max-h-0'}
        `}>
          <h1 className="font-extrabold text-green-950 text-sm whitespace-nowrap">Committee Portal</h1>
          <p className="text-gray-500 text-xs whitespace-nowrap">Selection Committee</p>
        </div>

        {/* Collapsed Title */}
        <div className={`
          text-center mb-4 transition-all duration-300 overflow-hidden
          ${!isExpanded ? 'opacity-100 max-h-12' : 'opacity-0 max-h-0'}
        `}>
          <h1 className="font-extrabold text-green-950 text-xs whitespace-nowrap">Committee</h1>
        </div>

        <hr className="mb-3 mx-2" />

        {/* Navigation */}
        <nav className="space-y-2 px-2">
          {committeeNavItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={`
                flex items-center gap-3 text-green-700 hover:bg-gray-400 font-bold hover:text-white 
                px-3 py-2 rounded-md transition-all duration-200 group
                ${!isExpanded ? 'justify-center' : ''}
              `}
              onClick={() => setIsOpen(false)}
              title={!isExpanded ? label : ''}
            >
              <Icon className={`
                w-6 h-6 text-gray-700 transition-all duration-300
                ${!isExpanded ? 'group-hover:scale-110' : ''}
              `} />
              <span className={`
                text-base font-bold transition-all duration-300 whitespace-nowrap
                ${isExpanded ? 'opacity-100 inline-block' : 'opacity-0 hidden w-0'}
              `}>
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