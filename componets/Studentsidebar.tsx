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
  BookOpen,
  Users,
  Route,
  Layers,
  School,
  FileEdit,
  BookMarked,
  Briefcase,
  Award,
  ClipboardList
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
  { label: 'Documents', href: '/application/documents', icon: FileText, required: false, order: 9 },
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

export default function StudentSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feeStatus, setFeeStatus] = useState<string>('pending');
  const [hasDepositSlip, setHasDepositSlip] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [selectedApplicationType, setSelectedApplicationType] = useState<string>('');
  const [selectedStudyRoute, setSelectedStudyRoute] = useState<string>('');
  const [isPostgraduate, setIsPostgraduate] = useState(false);

  // Listen for storage events to update completion status in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teachingSubjectsCompleted' || e.key === 'teachingSubjectsSaved') {
        // Refresh the completion status
        const teachingFlag = safeLocalStorage.getItem('teachingSubjectsCompleted');
        if (teachingFlag === 'true') {
          if (!completedSections.includes('Teaching Subjects')) {
            setCompletedSections(prev => [...prev, 'Teaching Subjects']);
          }
        } else {
          setCompletedSections(prev => prev.filter(s => s !== 'Teaching Subjects'));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [completedSections]);

  const getNavItems = () => {
    if (isPostgraduate) {
      return [...baseNavItems, ...postgraduateNavItems, ...commonNavItems].sort((a, b) => a.order - b.order);
    }
    return [...baseNavItems, ...commonNavItems].sort((a, b) => a.order - b.order);
  };

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
        console.warn(`Non-JSON response from ${url}:`, contentType);
        return { success: false, data: null, error: 'Invalid response format' };
      }
      const data = await response.json();
      return { success: true, data, error: null };
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      return { success: false, data: null, error: err };
    }
  };

  // Function to check completion from localStorage (safe)
  const checkLocalStorageCompletion = () => {
    const completed: string[] = [];
    
    // Check Application Type
    const appType = safeLocalStorage.getItem('userApplicationType');
    const appTypeCompleted = safeLocalStorage.getItem('applicationTypeCompleted');
    if (appType || appTypeCompleted === 'true') {
      completed.push('Select Application Type');
      const typeName = safeLocalStorage.getItem('userApplicationTypeName');
      setSelectedApplicationType(typeName || appType || '');
    }
    
    // Check Study Route
    const studyRoute = safeLocalStorage.getItem('userStudyRoute');
    const studyRouteCompleted = safeLocalStorage.getItem('studyRouteCompleted');
    if (studyRoute || studyRouteCompleted === 'true') {
      completed.push('Select Study Route');
      const routeName = safeLocalStorage.getItem('userStudyRouteName');
      setSelectedStudyRoute(routeName || studyRoute || '');
    }
    
    // Check Teaching Subjects from localStorage
    const teachingFlag = safeLocalStorage.getItem('teachingSubjectsCompleted');
    if (teachingFlag === 'true') {
      completed.push('Teaching Subjects');
    }
    
    return completed;
  };

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // First check localStorage for immediate completion status
        const localStorageCompleted = checkLocalStorageCompletion();
        const completed = [...localStorageCompleted];

        // 1. Check if postgraduate
        const appType = safeLocalStorage.getItem('userApplicationType');
        if (appType === 'masters' || appType === 'phd') {
          setIsPostgraduate(true);
        }

        // 2. Profile
        const profileResult = await safeFetch(`${API_BASE_URL}/personal-details/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (profileResult.success && profileResult.data?.data) {
          const profileData = profileResult.data.data;
          if (profileData.first_name && profileData.last_name && profileData.email) {
            completed.push('Profile');
          }
        }

        const profileCompleted = safeLocalStorage.getItem('profileCompleted');
        if (profileCompleted === 'true' && !completed.includes('Profile')) {
          completed.push('Profile');
        }

        // 3. Next of Kin
        const nextOfKinResult = await safeFetch(`${API_BASE_URL}/next-of-kin/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (nextOfKinResult.success && nextOfKinResult.data?.data?.length > 0) {
          completed.push('Next of Kin');
        }

        const nextOfKinCompleted = safeLocalStorage.getItem('nextOfKinCompleted');
        if (nextOfKinCompleted === 'true' && !completed.includes('Next of Kin')) {
          completed.push('Next of Kin');
        }

        // 4. MSCE Results
        const subjectsResult = await safeFetch(`${API_BASE_URL}/subject-records/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (subjectsResult.success && subjectsResult.data?.data?.length > 0) {
          completed.push('MSCE Results');
        }

        // 5. Programme Choice
        const programmeChoicesResult = await safeFetch(`${API_BASE_URL}/applicants/programme-choices`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (programmeChoicesResult.success && programmeChoicesResult.data?.choices?.length > 0) {
          completed.push('Programme Choice');
        } else {
          const progChoiceFlag = safeLocalStorage.getItem('programmeChoiceCompleted');
          if (progChoiceFlag === 'true') {
            completed.push('Programme Choice');
          }
        }

        // 6. Education
        const educationResult = await safeFetch(`${API_BASE_URL}/education/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (educationResult.success && educationResult.data?.data?.length > 0) {
          completed.push('Education');
        }

        // 7. Teaching Subjects - FIXED: Better API response handling
        console.log('📚 Fetching teaching subjects...');
        const teachingSubjectsResult = await safeFetch(`${API_BASE_URL}/teaching-subjects/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        console.log('Teaching subjects API response:', teachingSubjectsResult);
        
        if (teachingSubjectsResult.success && teachingSubjectsResult.data) {
          let subjectsArray = null;
          
          // Handle different response formats
          if (Array.isArray(teachingSubjectsResult.data)) {
            subjectsArray = teachingSubjectsResult.data;
          } else if (teachingSubjectsResult.data.data && Array.isArray(teachingSubjectsResult.data.data)) {
            subjectsArray = teachingSubjectsResult.data.data;
          } else if (teachingSubjectsResult.data.subjects && Array.isArray(teachingSubjectsResult.data.subjects)) {
            subjectsArray = teachingSubjectsResult.data.subjects;
          }
          
          // Also check for count > 0 in response
          const count = teachingSubjectsResult.data.count || (subjectsArray ? subjectsArray.length : 0);
          
          if ((subjectsArray && subjectsArray.length > 0) || count > 0) {
            console.log('✅ Teaching subjects found! Adding to completed sections.');
            completed.push('Teaching Subjects');
            safeLocalStorage.setItem('teachingSubjectsCompleted', 'true');
          } else {
            console.log('⚠️ No teaching subjects found in API response');
          }
        }
        
        // Double-check localStorage for teaching subjects flag
        const teachingFlag = safeLocalStorage.getItem('teachingSubjectsCompleted');
        if (teachingFlag === 'true' && !completed.includes('Teaching Subjects')) {
          console.log('✅ Teaching subjects flag found in localStorage');
          completed.push('Teaching Subjects');
        }

        // 8. Documents
        const documentsCompleted = safeLocalStorage.getItem('documentsCompleted');
        if (documentsCompleted === 'true') {
          completed.push('Documents');
        }

        // 9. Postgraduate sections
        if (isPostgraduate) {
          const essayResult = await safeFetch(`${API_BASE_URL}/essay/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (essayResult.success && essayResult.data?.data?.content) {
            completed.push('Essay/Statement of Purpose');
          }

          const publicationsResult = await safeFetch(`${API_BASE_URL}/publications/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (publicationsResult.success && publicationsResult.data?.data?.length > 0) {
            completed.push('Publications');
          }

          const workHistoryResult = await safeFetch(`${API_BASE_URL}/work-history/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (workHistoryResult.success && workHistoryResult.data?.data?.length > 0) {
            completed.push('Work History');
          }

          const researchProposalResult = await safeFetch(`${API_BASE_URL}/research-proposal/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (researchProposalResult.success && researchProposalResult.data?.data?.title) {
            completed.push('Research Proposal');
          }
        }

        // 10. Application Fees
        let hasPayment = false;
        try {
          const feesResult = await safeFetch(`${API_BASE_URL}/application-fees/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
          });
          if (feesResult.success && feesResult.data?.data) {
            const feesData = feesResult.data.data;
            if (feesData.deposit_slip || feesData.deposit_slip_path || feesData.file_path) {
              hasPayment = true;
              setHasDepositSlip(true);
              setFeeStatus(feesData.status || 'pending');
            }
            if (feesData.status === 'verified' || feesData.status === 'approved' || feesData.status === 'accepted') {
              hasPayment = true;
              setHasDepositSlip(true);
              setFeeStatus(feesData.status);
            }
          }
        } catch (feesErr) {
          console.error('Error checking fees:', feesErr);
        }
        if (hasPayment) completed.push('Application Fees');

        // 11. Submit Application
        const submitResult = await safeFetch(`${API_BASE_URL}/submit/status/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (submitResult.success && submitResult.data?.data?.is_submitted) {
          setApplicationSubmitted(true);
          completed.push('Submit Application');
        }

        console.log('✅ Final completed sections:', completed);
        setCompletedSections(completed);
        setApiError(false);
      } catch (err) {
        console.error('Error fetching progress:', err);
        setApiError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  // Also listen for custom events from the teacher-subjects page
  useEffect(() => {
    const handleTeachingSubjectsSaved = () => {
      console.log('📢 Teaching subjects saved event received');
      if (!completedSections.includes('Teaching Subjects')) {
        setCompletedSections(prev => [...prev, 'Teaching Subjects']);
      }
    };

    window.addEventListener('teachingSubjectsSaved', handleTeachingSubjectsSaved);
    return () => window.removeEventListener('teachingSubjectsSaved', handleTeachingSubjectsSaved);
  }, [completedSections]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const isSectionComplete = (label: string) => {
    if (label === 'Dashboard') return true;
    if (label === 'Submit Application' && applicationSubmitted) return true;
    if (label === 'Application Fees') return hasDepositSlip || completedSections.includes(label);
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
    if (label === 'Dashboard') return false;
    
    // Select Application Type - always enabled
    if (label === 'Select Application Type') return false;
    
    // Select Study Route - only disabled if no application type selected
    if (label === 'Select Study Route') {
      const appType = safeLocalStorage.getItem('userApplicationType');
      const appTypeCompleted = safeLocalStorage.getItem('applicationTypeCompleted');
      const hasAppType = appType !== null || appTypeCompleted === 'true';
      return !hasAppType;
    }
    
    if (label === 'Submit Application') {
      const requiredSections = isPostgraduate
        ? ['Profile', 'Next of Kin', 'Select Application Type', 'Select Study Route', 'MSCE Results', 'Programme Choice', 'Education', 'Essay/Statement of Purpose', 'Work History', 'Research Proposal', 'Application Fees']
        : ['Profile', 'Next of Kin', 'Select Application Type', 'Select Study Route', 'MSCE Results', 'Programme Choice', 'Education', 'Application Fees'];
      const allPreviousComplete = requiredSections.every(section =>
        isSectionComplete(section) || (section === 'Application Fees' && hasDepositSlip)
      );
      return !allPreviousComplete;
    }
    
    if (label === 'Application Fees') return required && !hasDepositSlip && !completedSections.includes(label);
    
    // For all other required sections
    if (required) {
      return !isSectionComplete(label);
    }
    
    return false;
  };

  const calculateProgress = () => {
    const totalRequired = studentNavItems.filter(item => item.required).length;
    let completedCount = 0;
    for (const item of studentNavItems) {
      if (item.label === 'Submit Application') {
        if (applicationSubmitted) completedCount++;
      } else if (item.label === 'Application Fees') {
        if (hasDepositSlip || completedSections.includes(item.label)) completedCount++;
      } else if (item.label === 'Select Application Type') {
        const appType = safeLocalStorage.getItem('userApplicationType');
        if (appType) completedCount++;
      } else if (item.label === 'Select Study Route') {
        const studyRoute = safeLocalStorage.getItem('userStudyRoute');
        if (studyRoute) completedCount++;
      } else if (item.required && isSectionComplete(item.label)) {
        completedCount++;
      }
    }
    return totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;
  };

  const overallProgress = calculateProgress();
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

        {/* Selection Status Badges */}
        {!loading && (
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

        {/* Progress Section */}
        {!loading && (
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

        {/* Postgraduate Info Banner */}
        {!loading && isPostgraduate && (
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
                    title={!isActive ? `${label} - Complete previous sections first` : label}
                  >
                    <Icon className={iconClasses} />
                    <span className="text-sm font-medium">{label}</span>
                    {label === 'Application Fees' && hasDepositSlip && feeStatus !== 'verified' && (
                      <span className="text-xs text-amber-500 dark:text-amber-400 ml-auto">Pending</span>
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
                    {isComplete && required && label !== 'Submit Application' && label !== 'Select Application Type' && label !== 'Select Study Route' && label !== 'Teaching Subjects' && (
                      <CheckCircle className="w-3 h-3 ml-auto text-green-500 dark:text-green-400" />
                    )}
                    {/* Show checkmark for Teaching Subjects when complete */}
                    {label === 'Teaching Subjects' && isComplete && (
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
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Completion Status Legend */}
        {!loading && (
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