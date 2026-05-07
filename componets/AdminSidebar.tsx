'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  FileText,
  Banknote,
  GraduationCap,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

const adminNavItems = [
  { label: 'Dashboard', href: '/appadmin', icon: Home },
  { label: 'Applicants', href: '/appadmin/applicants', icon: Users },
  { label: 'Applications', href: '/appadmin/applications', icon: FileText },
  { label: 'Departments', href: '/appadmin/departments', icon: GraduationCap },
  { label: 'Fees', href: '/appadmin/fees', icon: Banknote },
  { label: 'Open/close', href: '/appadmin/open', icon: Clock },
  { label: 'Programmes', href: '/appadmin/programmes', icon: GraduationCap },
];

interface ApplicationStats {
  total_applications: number;
  pending_review: number;
  under_review: number;
  approved: number;
  rejected: number;
  submitted: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({
    total_applications: 0,
    pending_review: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    submitted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch application stats
  useEffect(() => {
    const fetchApplicationStats = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/applicant-submissions/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const submissions = data.data;
            
            const stats = {
              total_applications: submissions.length,
              pending_review: submissions.filter((s: any) => s.status === 'pending').length,
              under_review: submissions.filter((s: any) => s.status === 'under_review').length,
              approved: submissions.filter((s: any) => s.status === 'approved' || s.status === 'accepted').length,
              rejected: submissions.filter((s: any) => s.status === 'rejected').length,
              submitted: submissions.filter((s: any) => s.status === 'submitted').length,
            };
            
            setApplicationStats(stats);
          }
        }
      } catch (err) {
        console.error('Error fetching application stats:', err);
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationStats();
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Save collapsed state to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(savedState === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', String(newState));
  };

  const isExpanded = !isCollapsed;

  // Function to check if a route is active
  const isRouteActive = (href: string) => {
    if (href === '/appadmin') {
      return pathname === '/appadmin';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

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
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
      >
        {/* Logo */}
        <div className="flex justify-center mb-4 px-2">
          <Image
            src="/logo.jpeg"
            width={isExpanded ? 80 : 40}
            height={isExpanded ? 40 : 20}
            alt="Mzuzu University Logo"
            className={isExpanded ? 'w-20' : 'w-10'}
          />
        </div>

        {/* Full Title - visible when expanded */}
        <div className={isExpanded ? 'text-center mb-4' : 'hidden'}>
          <h1 className="font-extrabold text-green-950 text-sm whitespace-nowrap">Mzuni Admin Panel</h1>
          <p className="text-gray-500 text-xs whitespace-nowrap">Application Management System</p>
        </div>

        {/* Collapsed Title - visible when collapsed */}
        <div className={!isExpanded ? 'text-center mb-4' : 'hidden'}>
          <h1 className="font-extrabold text-green-950 text-xs whitespace-nowrap">Admin</h1>
        </div>
       {/* Collapsed Stats Indicator */}
        {!isExpanded && !loading && applicationStats.pending_review > 0 && (
          <div className="px-2 mb-3 flex justify-center">
            <div className="relative">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                {applicationStats.pending_review}
              </span>
            </div>
          </div>
        )}

        <hr className="mb-3 mx-2" />

        {/* Navigation */}
        <nav className="space-y-2 px-2">
          {adminNavItems.map(({ label, href, icon: Icon }) => {
            const isActive = isRouteActive(href);
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`
                  flex items-center gap-3 rounded-md
                  ${isActive 
                    ? 'bg-green-600 text-white' 
                    : 'text-green-700 hover:bg-gray-400 hover:text-white'
                  }
                  ${!isExpanded ? 'justify-center' : 'px-3 py-2'}
                `}
                onClick={() => setIsOpen(false)}
                title={!isExpanded ? label : ''}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-white'}`} />
                {/* Label - hide when collapsed */}
                <span className={`text-sm font-medium ${isExpanded ? 'inline-block' : 'hidden'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button - Desktop only */}
        <button
          onClick={toggleCollapse}
          className="absolute bottom-4 right-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 hidden md:block"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}