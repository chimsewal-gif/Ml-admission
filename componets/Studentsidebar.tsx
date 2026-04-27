'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Banknote,
  GraduationCap,
  User,
  Menu,
  X,
  Calendar,
  CheckCircle,
  Lock,
} from 'lucide-react';

const studentNavItems = [
  { label: 'Dashboard', href: '/application/dashboard', icon: Home, required: false },
  { label: 'Profile', href: '/application/profile', icon: User, required: true },
  { label: 'Next of Kin', href: '/application/next-of-kin', icon: GraduationCap, required: true },
  { label: 'Qualifications', href: '/application/High-school-records', icon: Calendar, required: true },
  { label: 'Fees', href: '/application/application-fees', icon: Banknote, required: true },
  { label: 'My Application', href: '/application/submit', icon: FileText, required: true },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

export default function StudentSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch user's application progress
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const completed: string[] = [];

        // Check if Profile is completed (has personal details)
        const profileRes = await fetch(`${API_BASE_URL}/personal-details/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        if (profileData.success && profileData.data) {
          const hasPersonalInfo = profileData.data.first_name && 
                                   profileData.data.last_name && 
                                   profileData.data.email;
          if (hasPersonalInfo) {
            completed.push('Profile');
          }
        }

        // Check if Next of Kin is completed
        const nextOfKinRes = await fetch(`${API_BASE_URL}/next-of-kin/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const nextOfKinData = await nextOfKinRes.json();
        if (nextOfKinData.success && nextOfKinData.data && nextOfKinData.data.length > 0) {
          completed.push('Next of Kin');
        }

        // Check if Qualifications (Subject Records) are completed
        const subjectsRes = await fetch(`${API_BASE_URL}/subject-records/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const subjectsData = await subjectsRes.json();
        if (subjectsData.success && subjectsData.data && subjectsData.data.length > 0) {
          completed.push('Qualifications');
        }

        // Check if Fees are paid
        const feesRes = await fetch(`${API_BASE_URL}/application-fees/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const feesData = await feesRes.json();
        if (feesData.success && feesData.data && feesData.data.status === 'verified') {
          completed.push('Fees');
        }

        // Check if Application is submitted
        const submitRes = await fetch(`${API_BASE_URL}/submit/status/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const submitData = await submitRes.json();
        if (submitData.success && submitData.data && submitData.data.is_submitted) {
          setApplicationSubmitted(true);
          completed.push('My Application');
        }

        setCompletedSections(completed);
        
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Remove animations - direct state change without any conditions
  const handleMouseEnter = () => {
    setIsCollapsed(true);
  };

  const handleMouseLeave = () => {
    setIsCollapsed(false);
  };

  // Default is expanded (w-64), collapses to w-20 on hover
  const isExpanded = !isCollapsed;

  // Function to check if a section is complete
  const isSectionComplete = (label: string) => {
    if (label === 'Dashboard') return true;
    if (label === 'My Application' && applicationSubmitted) return true;
    return completedSections.includes(label);
  };

  // Function to check if section should be disabled (incomplete and not dashboard)
  const isSectionDisabled = (label: string, required: boolean) => {
    if (label === 'Dashboard') return false;
    if (label === 'My Application') {
      // My Application is only disabled if not all previous sections are complete
      const requiredSections = ['Profile', 'Next of Kin', 'Qualifications', 'Fees'];
      const allPreviousComplete = requiredSections.every(section => completedSections.includes(section));
      return !allPreviousComplete;
    }
    return required && !completedSections.includes(label);
  };

  // Calculate overall progress percentage
  const calculateProgress = () => {
    const totalRequired = studentNavItems.filter(item => item.required).length;
    const completedCount = studentNavItems.filter(item => {
      if (item.label === 'My Application') return applicationSubmitted;
      return item.required && completedSections.includes(item.label);
    }).length;
    return Math.round((completedCount / totalRequired) * 100);
  };

  const overallProgress = calculateProgress();

  // Function to check if a route is active
  const isRouteActive = (href: string) => {
    return pathname === href;
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

      {/* Sidebar - No transition classes */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white shadow-md border-r border-gray-200 pt-4
          overflow-y-auto z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo - No transition classes */}
        <div className="flex justify-center mb-4 px-2">
          <Image
            src="/logo.jpeg"
            width={isExpanded ? 80 : 40}
            height={isExpanded ? 40 : 20}
            alt="Mzuzu University Logo"
          />
        </div>

        {/* Full Title - Conditionally rendered, no transitions */}
        {isExpanded && (
          <div className="text-center mb-4">
            <h1 className="font-extrabold text-green-950 text-sm whitespace-nowrap">Mzuni Student Portal</h1>
            <p className="text-gray-500 text-xs whitespace-nowrap">Admission System</p>
          </div>
        )}

        {/* Collapsed Title - Conditionally rendered, no transitions */}
        {!isExpanded && (
          <div className="text-center mb-4">
            <h1 className="font-extrabold text-green-950 text-xs whitespace-nowrap">Mzuni</h1>
          </div>
        )}

        <hr className="mb-3 mx-2" />

        {/* Progress Section - Only show when expanded */}
        {isExpanded && !loading && (
          <div className="px-3 mb-4">
            <div className="bg-transparent rounded-lg p-3">
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Application Progress</span>
                  <span className="font-semibold">{overallProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <hr className="mb-3 mx-2" />

        {/* Navigation - No transition classes */}
        <nav className="space-y-2 px-2">
          {studentNavItems.map(({ label, href, icon: Icon, required }) => {
            const isActive = isRouteActive(href);
            const isComplete = isSectionComplete(label);
            const isDisabled = isSectionDisabled(label, required);
            
            return (
              <div key={`${href}-${label}`} className="relative">
                {isDisabled ? (
                  // Disabled item - not clickable
                  <div
                    className={`
                      flex items-center gap-3 rounded-md cursor-not-allowed opacity-50
                      ${!isExpanded ? 'justify-center' : 'px-3 py-2'}
                      text-gray-400
                    `}
                    title={!isExpanded ? `${label} (Complete previous sections first)` : `${label} - Complete previous sections first`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={`text-sm font-medium ${isExpanded ? 'inline-block' : 'hidden'}`}>
                      {label}
                    </span>
                    {isExpanded && (
                      <Lock className="w-3 h-3 ml-auto" />
                    )}
                  </div>
                ) : (
                  // Active/Clickable item - No hover transitions
                  <Link
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
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-700'}`} />
                    <span className={`text-sm font-medium ${isExpanded ? 'inline-block' : 'hidden'}`}>
                      {label}
                    </span>
                    {isExpanded && isComplete && required && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Completion Status Legend - Only show when expanded */}
        {isExpanded && !loading && (
          <div className="mt-4 px-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-gray-400" />
                <span>Locked</span>
              </div>
            </div>
          </div>
        )}
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