'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  BookOpen,
  Users,
  Route,
  Layers,
  School,
  FileEdit,
  BookMarked,
  Briefcase,
  Award,
  ClipboardList,
  Send
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Base navigation items
const baseNavItems = [
  { label: 'Dashboard', href: '/application/dashboard', icon: Home, required: false, order: 0 },
  { label: 'Profile', href: '/application/profile', icon: User, required: true, order: 1 },
  { label: 'Next of Kin', href: '/application/next-of-kin', icon: Users, required: true, order: 2 },
  { label: 'Select Application Type', href: '/application/select-type', icon: Layers, required: true, order: 3 },
  { label: 'Select Study Route', href: '/application/select-route', icon: Route, required: true, order: 4 },
  { label: 'MSCE Results', href: '/application/High-school-records', icon: BookOpen, required: true, order: 5 },
  { label: 'Programme Choice', href: '/application/program-selection', icon: School, required: true, order: 6 },
  { label: 'Education', href: '/application/education', icon: GraduationCap, required: true, order: 7 },
  { label: 'Teaching Subjects', href: '/application/teacher-subjects', icon: School, required: false, order: 8 },
  { label: 'Documents', href: '/application/documents', icon: FileText, required: true, order: 9 },
];

const postgraduateNavItems = [
  { label: 'Essay/Statement of Purpose', href: '/application/essay', icon: FileEdit, required: true, order: 7.1 },
  { label: 'Publications', href: '/application/publications', icon: BookMarked, required: false, order: 7.2 },
  { label: 'Work History', href: '/application/work-history', icon: Briefcase, required: true, order: 7.3 },
  { label: 'Research Proposal', href: '/application/research-proposal', icon: ClipboardList, required: true, order: 7.4 },
];

const commonNavItems = [
  { label: 'Application Fees', href: '/application/application-fees', icon: Banknote, required: true, order: 10 },
  { label: 'Submit Application', href: '/application/submit', icon: FileText, required: true, order: 11 },
];

// Helper function to safely get localStorage value
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

// Statuses that should lock the application (no further edits allowed)
const LOCKED_STATUSES = ['submitted', 'approved', 'accepted', 'rejected', 'withdrawn', 'under_review', 'reviewed'];

export default function StudentSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [completedSectionsCount, setCompletedSectionsCount] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [applicationLocked, setApplicationLocked] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feeStatus, setFeeStatus] = useState<string>('pending');
  const [hasDepositSlip, setHasDepositSlip] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [selectedApplicationType, setSelectedApplicationType] = useState<string>('');
  const [selectedStudyRoute, setSelectedStudyRoute] = useState<string>('');
  const [isPostgraduate, setIsPostgraduate] = useState(false);
  
  // Use ref to prevent infinite loops
  const isMounted = useRef(true);
  const isCalculating = useRef(false);

  // Check if application is locked (submitted, approved, rejected, etc.)
  const checkApplicationStatus = useCallback(async () => {
    const token = getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/submit/status/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const status = data.data.status || '';
        const isLocked = LOCKED_STATUSES.includes(status);
        
        if (isMounted.current) {
          setApplicationLocked(isLocked);
          setApplicationStatus(status);
          if (data.data.reference_number) {
            setReferenceNumber(data.data.reference_number);
          }
        }
        return isLocked;
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
    return false;
  }, []);

  // Get status display text
  const getStatusDisplayText = () => {
    switch (applicationStatus) {
      case 'submitted': return 'Submitted - Under Review';
      case 'under_review': return 'Under Review';
      case 'reviewed': return 'Reviewed';
      case 'approved': return 'Approved!';
      case 'accepted': return 'Accepted!';
      case 'rejected': return 'Rejected';
      case 'withdrawn': return 'Withdrawn';
      default: return 'Locked';
    }
  };

  // Calculate progress consistently (same as dashboard)
  const calculateProgress = useCallback(() => {
    if (isCalculating.current) return 0;
    isCalculating.current = true;
    
    try {
      // Get completion status from localStorage
      const profileFlag = safeLocalStorage.getItem('profileCompleted') === 'true';
      const nextOfKinFlag = safeLocalStorage.getItem('nextOfKinCompleted') === 'true';
      const appTypeFlag = safeLocalStorage.getItem('applicationTypeCompleted') === 'true';
      const studyRouteFlag = safeLocalStorage.getItem('studyRouteCompleted') === 'true';
      const msceFlag = safeLocalStorage.getItem('msceResultsCompleted') === 'true';
      const programmeFlag = safeLocalStorage.getItem('programmeChoiceCompleted') === 'true';
      const educationFlag = safeLocalStorage.getItem('educationCompleted') === 'true';
      
      // Documents check
      let documentsFlag = safeLocalStorage.getItem('documentsCompleted') === 'true' || 
                          safeLocalStorage.getItem('documentsSaved') === 'true';
      if (!documentsFlag) {
        const storedDocs = safeLocalStorage.getItem('application_documents');
        if (storedDocs) {
          try {
            const docs = JSON.parse(storedDocs);
            if (docs && docs.length > 0) documentsFlag = true;
          } catch (e) {}
        }
      }
      
      const paymentFlag = safeLocalStorage.getItem('applicationFeesCompleted') === 'true';
      
      // Count completed sections (ONLY the 9 REQUIRED sections)
      let count = 0;
      if (profileFlag) count++;
      if (nextOfKinFlag) count++;
      if (appTypeFlag) count++;
      if (studyRouteFlag) count++;
      if (msceFlag) count++;
      if (programmeFlag) count++;
      if (educationFlag) count++;
      if (documentsFlag) count++;
      if (paymentFlag) count++;
      
      const TOTAL_REQUIRED_SECTIONS = 9;
      const percentage = TOTAL_REQUIRED_SECTIONS > 0 
        ? Math.round((count / TOTAL_REQUIRED_SECTIONS) * 100) 
        : 0;
      
      if (isMounted.current) {
        setCompletedSectionsCount(count);
        setOverallProgress(percentage);
      }
      
      return percentage;
    } finally {
      isCalculating.current = false;
    }
  }, []);

  // Function to check completion from localStorage
  const checkLocalStorageCompletion = useCallback(() => {
    const completed: string[] = [];
    
    const appType = safeLocalStorage.getItem('userApplicationType');
    const appTypeCompleted = safeLocalStorage.getItem('applicationTypeCompleted');
    if (appType || appTypeCompleted === 'true') {
      completed.push('Select Application Type');
      const typeName = safeLocalStorage.getItem('userApplicationTypeName');
      if (isMounted.current) {
        setSelectedApplicationType(typeName || appType || '');
      }
    }
    
    const studyRoute = safeLocalStorage.getItem('userStudyRoute');
    const studyRouteCompleted = safeLocalStorage.getItem('studyRouteCompleted');
    if (studyRoute || studyRouteCompleted === 'true') {
      completed.push('Select Study Route');
      const routeName = safeLocalStorage.getItem('userStudyRouteName');
      if (isMounted.current) {
        setSelectedStudyRoute(routeName || studyRoute || '');
      }
    }
    
    const teachingFlag = safeLocalStorage.getItem('teachingSubjectsCompleted');
    if (teachingFlag === 'true') {
      completed.push('Teaching Subjects');
    }
    
    const documentsFlag = safeLocalStorage.getItem('documentsCompleted');
    const documentsSaved = safeLocalStorage.getItem('documentsSaved');
    
    if (documentsFlag === 'true' || documentsSaved === 'true') {
      completed.push('Documents');
    } else {
      const storedDocs = safeLocalStorage.getItem('application_documents');
      if (storedDocs) {
        try {
          const docs = JSON.parse(storedDocs);
          if (docs && docs.length > 0) {
            completed.push('Documents');
          }
        } catch (e) {}
      }
    }
    
    return completed;
  }, []);

  const getNavItems = useCallback(() => {
    if (isPostgraduate) {
      return [...baseNavItems, ...postgraduateNavItems, ...commonNavItems].sort((a, b) => a.order - b.order);
    }
    return [...baseNavItems, ...commonNavItems].sort((a, b) => a.order - b.order);
  }, [isPostgraduate]);

  const studentNavItems = getNavItems();

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const safeFetch = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, options);
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: false, data: null, error: 'Invalid response format' };
      }
      const data = await response.json();
      return { success: true, data, error: null };
    } catch (err) {
      return { success: false, data: null, error: err };
    }
  };

  // Initial load effect - runs once
  useEffect(() => {
    isMounted.current = true;
    
    const fetchProgress = async () => {
      try {
        const token = getToken();
        if (!token) {
          if (isMounted.current) setLoading(false);
          return;
        }

        // Check application status (this will lock if status is submitted/approved/rejected/etc)
        await checkApplicationStatus();
        
        // First check localStorage
        const localStorageCompleted = checkLocalStorageCompletion();
        const completed = [...localStorageCompleted];

        // Check if postgraduate
        const appType = safeLocalStorage.getItem('userApplicationType');
        if (appType === 'masters' || appType === 'phd') {
          if (isMounted.current) setIsPostgraduate(true);
        }

        // Calculate initial progress
        calculateProgress();

        if (isMounted.current) {
          setCompletedSections(completed);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
        if (isMounted.current) {
          setApiError(true);
          setLoading(false);
        }
      }
    };

    fetchProgress();
    
    return () => {
      isMounted.current = false;
    };
  }, [calculateProgress, checkLocalStorageCompletion, checkApplicationStatus]);

  // Storage event listener - separate effect
  useEffect(() => {
    const handleStorageChange = () => {
      if (!isMounted.current) return;
      
      const localStorageCompleted = checkLocalStorageCompletion();
      setCompletedSections(prev => {
        const newCompleted = [...new Set([...prev, ...localStorageCompleted])];
        return newCompleted;
      });
      calculateProgress();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('documentsCompleted', handleStorageChange);
    window.addEventListener('teachingSubjectsSaved', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('documentsCompleted', handleStorageChange);
      window.removeEventListener('teachingSubjectsSaved', handleStorageChange);
    };
  }, [checkLocalStorageCompletion, calculateProgress]);

  // Periodic check for application status (every 5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      await checkApplicationStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [checkApplicationStatus]);

  // Mobile body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const isSectionComplete = (label: string) => {
    if (label === 'Dashboard') return true;
    if (label === 'Submit Application' && applicationLocked) return true;
    if (label === 'Application Fees') return hasDepositSlip || completedSections.includes(label);
    if (label === 'Documents') {
      const documentsFlag = safeLocalStorage.getItem('documentsCompleted');
      const documentsSaved = safeLocalStorage.getItem('documentsSaved');
      const storedDocs = safeLocalStorage.getItem('application_documents');
      
      if (documentsFlag === 'true' || documentsSaved === 'true') return true;
      if (storedDocs) {
        try {
          const docs = JSON.parse(storedDocs);
          if (docs && docs.length > 0) return true;
        } catch (e) {}
      }
      return completedSections.includes(label);
    }
    if (label === 'Select Application Type') {
      const appType = safeLocalStorage.getItem('userApplicationType');
      const appTypeCompleted = safeLocalStorage.getItem('applicationTypeCompleted');
      return appType !== null || appTypeCompleted === 'true' || completedSections.includes(label);
    }
    if (label === 'Select Study Route') {
      const studyRoute = safeLocalStorage.getItem('userStudyRoute');
      const studyRouteCompleted = safeLocalStorage.getItem('studyRouteCompleted');
      return studyRoute !== null || studyRouteCompleted === 'true' || completedSections.includes(label);
    }
    return completedSections.includes(label);
  };

  const isSectionDisabled = (label: string, required: boolean) => {
    // If application is locked (submitted, approved, rejected, withdrawn, under_review, reviewed), DISABLE ALL navigation except Dashboard
    if (applicationLocked && label !== 'Dashboard') {
      return true;
    }
    
    if (label === 'Dashboard') return false;
    if (label === 'Select Application Type') return false;
    
    if (label === 'Select Study Route') {
      const appType = safeLocalStorage.getItem('userApplicationType');
      const appTypeCompleted = safeLocalStorage.getItem('applicationTypeCompleted');
      const hasAppType = appType !== null || appTypeCompleted === 'true';
      return !hasAppType;
    }
    
    if (label === 'Submit Application') {
      const requiredSections = isPostgraduate
        ? ['Profile', 'Next of Kin', 'Select Application Type', 'Select Study Route', 'MSCE Results', 'Programme Choice', 'Education', 'Documents', 'Essay/Statement of Purpose', 'Work History', 'Research Proposal', 'Application Fees']
        : ['Profile', 'Next of Kin', 'Select Application Type', 'Select Study Route', 'MSCE Results', 'Programme Choice', 'Education', 'Documents', 'Application Fees'];
      const allPreviousComplete = requiredSections.every(section =>
        isSectionComplete(section) || (section === 'Application Fees' && hasDepositSlip)
      );
      return !allPreviousComplete;
    }
    
    if (label === 'Application Fees') return required && !hasDepositSlip && !completedSections.includes(label);
    
    if (required) {
      return !isSectionComplete(label);
    }
    
    return false;
  };

  const isRouteActive = (href: string) => pathname === href;
  const sortedNavItems = [...studentNavItems].sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 shadow-md border-r border-gray-200 dark:border-gray-700 pt-4">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 dark:border-green-400"></div>
        </div>
      </aside>
    );
  }

  // Get status display and color
  const getStatusColor = () => {
    switch (applicationStatus) {
      case 'approved':
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300';
      case 'submitted':
      case 'under_review':
      case 'reviewed':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 p-2 rounded shadow dark:shadow-gray-900"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-green-800 dark:text-green-400" />
        ) : (
          <Menu className="w-6 h-6 text-green-800 dark:text-green-400" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-950 border-r border-gray-200 dark:border-gray-700 pt-4
          overflow-y-auto z-50
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:w-64
        `}
      >
        {/* Logo */}
        <div className="flex justify-center mb-4 px-2">
          <Image
            src="/logo.jpeg"
            width={80}
            height={40}
            alt="Mzuzu University Logo"
            className="dark:brightness-90"
          />
        </div>

        {/* Full Title */}
        <div className="text-center mb-4">
          <h1 className="font-extrabold text-green-950 dark:text-green-300 text-sm whitespace-nowrap">Mzuni Student Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">Admission System</p>
        </div>

        <hr className="mb-3 mx-2 border-gray-200 dark:border-gray-700" />

        {/* Application Status Banner - Shows for ALL locked statuses */}
        {applicationLocked && (
          <div className={`mx-3 mb-4 p-3 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center gap-2 mb-2">
              {applicationStatus === 'approved' || applicationStatus === 'accepted' ? (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : applicationStatus === 'rejected' ? (
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              ) : (
                <Send className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              )}
              <span className="text-sm font-semibold">
                Application {getStatusDisplayText()}
              </span>
            </div>
            {referenceNumber && (
              <p className="text-xs font-mono mt-1">
                Ref: {referenceNumber}
              </p>
            )}
            <p className="text-xs mt-2">
              {applicationStatus === 'approved' || applicationStatus === 'accepted' 
                ? 'Congratulations! Your application has been approved.' 
                : applicationStatus === 'rejected'
                ? 'Your application has been reviewed and not accepted at this time.'
                : 'Your application is under review. You cannot modify it.'}
            </p>
          </div>
        )}

        {/* Selection Status Badges - Hide when locked */}
        {!loading && !applicationLocked && (
          <div className="px-3 mb-4">
            {selectedApplicationType && (
              <div className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 p-2 rounded-lg mb-2">
                <span className="font-medium">Application Type:</span> {selectedApplicationType}
                {isPostgraduate && (
                  <span className="ml-2 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Award className="w-3 h-3" />
                    Postgraduate
                  </span>
                )}
              </div>
            )}
            {selectedStudyRoute && (
              <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 p-2 rounded-lg">
                <span className="font-medium">Study Route:</span> {selectedStudyRoute}
              </div>
            )}
          </div>
        )}

        {/* Progress Section - Hide when locked */}
        {!loading && !applicationLocked && (
          <div className="px-3 mb-4">
            <div className="bg-transparent rounded-lg p-3">
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>Application Progress</span>
                  <span className="font-semibold">{overallProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 dark:bg-green-400 transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              {hasDepositSlip && feeStatus !== 'verified' && feeStatus !== 'approved' && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                  Fee payment pending verification
                </div>
              )}
              {feeStatus === 'verified' && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                  ✓ Fee verified!
                </div>
              )}
              {apiError && (
                <div className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
                  Unable to load some data
                </div>
              )}
            </div>
          </div>
        )}

        {/* Postgraduate Info Banner - Hide when locked */}
        {!loading && isPostgraduate && !applicationLocked && (
          <div className="px-3 mb-4">
            <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg p-2 text-center">
              <p className="text-xs text-purple-700 dark:text-purple-300">
                <Award className="w-3 h-3 inline mr-1" />
                Postgraduate requirements added
              </p>
            </div>
          </div>
        )}

        <hr className="mb-3 mx-2 border-gray-200 dark:border-gray-700" />

        {/* Stats Cards - Hide when locked */}
        {!loading && !applicationLocked && (
          <div className="px-3 mb-4">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{completedSectionsCount}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">SECTIONS COMPLETED</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">out of 9</p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">required</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <hr className="mb-3 mx-2 border-gray-200 dark:border-gray-700" />

        {/* Navigation */}
        <nav className="space-y-2 px-2">
          {sortedNavItems.map(({ label, href, icon: Icon, required }) => {
            const isActive = isRouteActive(href);
            const isComplete = isSectionComplete(label);
            const isDisabled = isSectionDisabled(label, required);

            let linkClasses = "flex items-center gap-3 rounded-md px-3 py-2 transition-colors ";
            
            if (isDisabled) {
              if (isActive) {
                linkClasses += "bg-green-600 dark:bg-green-700 text-white cursor-not-allowed opacity-80";
              } else {
                linkClasses += "cursor-not-allowed opacity-50 text-gray-400 dark:text-gray-500";
              }
            } else {
              if (isActive) {
                linkClasses += "bg-green-600 dark:bg-green-700 text-white";
              } else {
                linkClasses += "text-green-700 dark:text-green-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-green-800 dark:hover:text-green-200";
              }
            }

            let iconClasses = "w-5 h-5";
            if (isActive) {
              iconClasses += " text-white";
            } else {
              iconClasses += " text-gray-700 dark:text-gray-400";
            }

            return (
              <div key={`${href}-${label}`}>
                {isDisabled ? (
                  <div
                    className={linkClasses}
                    title={applicationLocked ? "Application is locked - cannot modify" : (!isActive ? `${label} - Complete previous sections first` : label)}
                  >
                    <Icon className={iconClasses} />
                    <span className="text-sm font-medium">{label}</span>
                    {label === 'Application Fees' && hasDepositSlip && feeStatus !== 'verified' && (
                      <span className="text-xs text-amber-500 dark:text-amber-400 ml-auto">Pending</span>
                    )}
                    {applicationLocked && label !== 'Dashboard' && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">Locked</span>
                    )}
                  </div>
                ) : (
                  <Link
                    href={href}
                    className={linkClasses}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className={iconClasses} />
                    <span className="text-sm font-medium">{label}</span>
                    {isComplete && required && label !== 'Submit Application' && label !== 'Select Application Type' && label !== 'Select Study Route' && label !== 'Teaching Subjects' && label !== 'Documents' && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500 dark:text-green-400" />
                    )}
                    {label === 'Teaching Subjects' && isComplete && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500 dark:text-green-400" />
                    )}
                    {label === 'Documents' && isComplete && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500 dark:text-green-400" />
                    )}
                    {(label === 'Select Application Type' && selectedApplicationType) && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500 dark:text-green-400" />
                    )}
                    {(label === 'Select Study Route' && selectedStudyRoute) && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500 dark:text-green-400" />
                    )}
                    {label === 'Application Fees' && hasDepositSlip && feeStatus !== 'verified' && (
                      <span className="text-xs text-amber-500 dark:text-amber-400 ml-auto">Pending</span>
                    )}
                    {label === 'Submit Application' && applicationLocked && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500 dark:text-green-400" />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Completion Status Legend - Hide when locked */}
        {!loading && !applicationLocked && (
          <div className="mt-4 px-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500 dark:text-green-400" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span>Locked</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Locked Status Legend */}
        {applicationLocked && (
          <div className="mt-4 px-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              <Lock className="w-3 h-3 mr-1" />
              <span>Application {getStatusDisplayText()} - Read Only</span>
            </div>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}