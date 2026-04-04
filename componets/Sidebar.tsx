'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  User,
  Home,
  FileText,
  BookOpen,
  Users,
  Building2,
  Settings,
  Menu,
  X,
  FileCheck,
} from 'lucide-react';

// ✅ Nav Items for ODL Student
const studentNavItems = [
  { label: 'Dashboard', href: '/application/dashboard', icon: Home },
  { label: 'Profile', href: '/application/personal-details', icon: User },
  { label: 'Contacts', href: '/application/contact-details', icon: Building2 },
  { label: 'Grades', href: '/application/High-school-records', icon: BookOpen },
  { label: 'Documents', href: '/application/documents', icon: FileText },
  { label: 'Next of Kin', href: '/application/next-of-kin', icon: Users },
  { label: 'Program Selection', href: '/application/program-selection', icon: FileCheck },
  { label: 'Submit', href: '/application/submit', icon: FileText },
  { label: 'Settings', href: '/student/settings', icon: Settings },
];

export default function StudentSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const isActiveLink = (href: string) => {
    return pathname === href;
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.querySelector('.sidebar');
        const toggleButton = document.querySelector('.toggle-button');
        
        if (sidebar && 
            !sidebar.contains(event.target as Node) && 
            !toggleButton?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="toggle-button md:hidden fixed top-4 right-4 z-[60] bg-green-700 text-white p-2 rounded-lg shadow-lg hover:bg-green-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Collapse Toggle */}
      <button
        className="hidden md:fixed md:flex top-4 left-4 z-[60] bg-green-700 text-white p-2 rounded-lg shadow-lg hover:bg-green-800 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle Sidebar Collapse"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Single Sidebar */}
      <aside
        className={`
          sidebar
          fixed top-0 left-0 h-screen bg-white shadow-lg border-r border-gray-200 pt-6
          overflow-y-auto z-50
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:relative md:z-auto
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
        onMouseEnter={() => !isMobile && setIsCollapsed(false)}
        onMouseLeave={() => !isMobile && setIsCollapsed(true)}
      >
        {/* Close button for mobile */}
        <div className="flex justify-between items-center mb-6 px-4 md:hidden">
          <Image
            src="/logo.jpeg"
            width={60}
            height={30}
            alt="Mzuzu University Logo"
            className="flex-shrink-0"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Logo for desktop */}
        <div className={`hidden md:flex justify-center mb-6 px-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {isCollapsed ? (
            <Image
              src="/logo.jpeg"
              width={40}
              height={20}
              alt="Mzuzu University Logo"
              className="mb-4"
            />
          ) : (
            <Image
              src="/logo.jpeg"
              width={80}
              height={40}
              alt="Mzuzu University Logo"
              className="mb-4"
            />
          )}
        </div>

        {/* Title - Hidden when collapsed */}
        <div className={`text-center mb-6 px-4 ${isCollapsed ? 'hidden' : 'block'}`}>
          <h1 className="font-bold text-green-900 text-lg md:text-xl">
            Mzuni Application
          </h1>
          <p className="text-gray-600 text-xs md:text-sm mt-1">
            ODL Student Portal
          </p>
        </div>

        <hr className="mb-4 border-gray-300 mx-4" />

        {/* Navigation */}
        <nav className="space-y-2 px-4">
          {studentNavItems.map(({ label, href, icon: Icon }) => {
            const isActive = isActiveLink(href);
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`
                  flex items-center font-semibold rounded-lg transition-all group relative
                  ${isCollapsed ? 'justify-center px-3 py-4' : 'gap-3 px-3 py-3'}
                  ${isActive
                    ? 'bg-green-700 text-white shadow-md'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-800 border border-transparent hover:border-green-200'
                  }
                `}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? label : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-green-600'}`} />
                
                {/* Label - Hidden when collapsed */}
                <span className={`
                  whitespace-nowrap overflow-hidden transition-all duration-300
                  ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-3'}
                `}>
                  {label}
                </span>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile footer info */}
        <div className="mt-8 p-3 bg-gray-50 rounded-lg mx-4 md:hidden">
          <p className="text-xs text-gray-600 text-center">
            Mzuzu University ODL
          </p>
        </div>
      </aside>

      {/* Add padding to main content when sidebar is open on mobile */}
      {isOpen && isMobile && (
        <style jsx global>{`
          body {
            overflow: hidden;
          }
        `}</style>
      )}
    </>
  );
}