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
  const [feeStatus, setFeeStatus] = useState<string>('pending');
  const [hasDepositSlip, setHasDepositSlip] = useState(false);
  const [apiError, setApiError] = useState(false);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Helper function to safely fetch JSON
  const safeFetch = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, options);
      
      // Check if response is JSON
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

        // Check if Profile is completed
        const profileResult = await safeFetch(`${API_BASE_URL}/personal-details/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (profileResult.success && profileResult.data && profileResult.data.data) {
          const profileData = profileResult.data.data;
          const hasPersonalInfo = profileData.first_name && profileData.last_name && profileData.email;
          if (hasPersonalInfo) {
            completed.push('Profile');
          }
        }

        // Check if Next of Kin is completed
        const nextOfKinResult = await safeFetch(`${API_BASE_URL}/next-of-kin/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (nextOfKinResult.success && nextOfKinResult.data && nextOfKinResult.data.data && nextOfKinResult.data.data.length > 0) {
          completed.push('Next of Kin');
        }

        // Check if Qualifications are completed
        const subjectsResult = await safeFetch(`${API_BASE_URL}/subject-records/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (subjectsResult.success && subjectsResult.data && subjectsResult.data.data && subjectsResult.data.data.length > 0) {
          completed.push('Qualifications');
        }

        // Check if Fees are paid/completed - FIXED VERSION
        let hasPayment = false;
        
        try {
          // Try the application-fees endpoint
          const feesResult = await safeFetch(`${API_BASE_URL}/application-fees/`, {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          
          console.log('Fees API Response:', feesResult);
          
          if (feesResult.success && feesResult.data) {
            const feesData = feesResult.data;
            
            // Check multiple conditions for payment
            if (feesData.data) {
              // Check if deposit_slip or deposit_slip_path exists
              if (feesData.data.deposit_slip || feesData.data.deposit_slip_path || feesData.data.file_path) {
                hasPayment = true;
                setHasDepositSlip(true);
                setFeeStatus(feesData.data.status || 'pending');
              }
              // Check if status indicates payment is complete
              if (feesData.data.status === 'verified' || 
                  feesData.data.status === 'approved' || 
                  feesData.data.status === 'accepted') {
                hasPayment = true;
                setHasDepositSlip(true);
                setFeeStatus(feesData.data.status);
              }
            }
          }
        } catch (feesErr) {
          console.error('Error checking fees:', feesErr);
        }
        
        // Fallback: Try payment-status endpoint if available
        if (!hasPayment) {
          try {
            const paymentStatusResult = await safeFetch(`${API_BASE_URL}/payment-status/`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (paymentStatusResult.success && paymentStatusResult.data) {
              if (paymentStatusResult.data.has_paid === true || paymentStatusResult.data.has_deposit_slip === true) {
                hasPayment = true;
                setHasDepositSlip(true);
                setFeeStatus(paymentStatusResult.data.status || 'pending');
              }
            }
          } catch (statusErr) {
            console.log('Payment status endpoint not available');
          }
        }
        
        if (hasPayment) {
          completed.push('Fees');
        }

        // Check if Application is submitted
        const submitResult = await safeFetch(`${API_BASE_URL}/submit/status/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (submitResult.success && submitResult.data && submitResult.data.data && submitResult.data.data.is_submitted) {
          setApplicationSubmitted(true);
          completed.push('My Application');
        }

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

  // Prevent body scroll when sidebar is open on mobile
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

  const isSectionComplete = (label: string) => {
    if (label === 'Dashboard') return true;
    if (label === 'My Application' && applicationSubmitted) return true;
    if (label === 'Fees') {
      return hasDepositSlip || completedSections.includes(label);
    }
    return completedSections.includes(label);
  };

  const isSectionDisabled = (label: string, required: boolean) => {
    if (label === 'Dashboard') return false;
    if (label === 'My Application') {
      const requiredSections = ['Profile', 'Next of Kin', 'Qualifications', 'Fees'];
      const allPreviousComplete = requiredSections.every(section => 
        completedSections.includes(section) || (section === 'Fees' && hasDepositSlip)
      );
      return !allPreviousComplete;
    }
    if (label === 'Fees') {
      return required && !hasDepositSlip && !completedSections.includes(label);
    }
    return required && !completedSections.includes(label);
  };

  // Calculate overall progress percentage
  const calculateProgress = () => {
    const totalRequired = studentNavItems.filter(item => item.required).length;
    let completedCount = 0;
    
    for (const item of studentNavItems) {
      if (item.label === 'My Application') {
        if (applicationSubmitted) completedCount++;
      } else if (item.label === 'Fees') {
        if (hasDepositSlip || completedSections.includes(item.label)) completedCount++;
      } else if (item.required && completedSections.includes(item.label)) {
        completedCount++;
      }
    }
    
    return totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;
  };

  const overallProgress = calculateProgress();

  const isRouteActive = (href: string) => {
    return pathname === href;
  };

  const getFeeStatusMessage = () => {
    if (feeStatus === 'verified' || feeStatus === 'approved') {
      return '✓ Fee payment verified!';
    }
    if (hasDepositSlip) {
      return '⏳ Deposit slip uploaded - Awaiting verification';
    }
    return 'Complete previous sections first';
  };

  if (loading) {
    return (
      <aside className="fixed top-0 left-0 h-screen w-64 bg-white shadow-md border-r border-gray-200 pt-4">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </aside>
    );
  }

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
          />
        </div>

        {/* Full Title */}
        {isExpanded && (
          <div className="text-center mb-4">
            <h1 className="font-extrabold text-green-950 text-sm whitespace-nowrap">Mzuni Student Portal</h1>
            <p className="text-gray-500 text-xs whitespace-nowrap">Admission System</p>
          </div>
        )}

        {/* Collapsed Title */}
        {!isExpanded && (
          <div className="text-center mb-4">
            <h1 className="font-extrabold text-green-950 text-xs whitespace-nowrap">Mzuni</h1>
          </div>
        )}

        <hr className="mb-3 mx-2" />

        {/* Progress Section */}
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
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
              {hasDepositSlip && feeStatus !== 'verified' && feeStatus !== 'approved' && (
                <div className="text-xs text-amber-600 mt-2 text-center">
                  Fee payment pending verification
                </div>
              )}
              {feeStatus === 'verified' && (
                <div className="text-xs text-green-600 mt-2 text-center">
                  ✓ Fee verified!
                </div>
              )}
              {apiError && (
                <div className="text-xs text-red-600 mt-2 text-center">
                  Unable to load some data
                </div>
              )}
            </div>
          </div>
        )}

        <hr className="mb-3 mx-2" />

        {/* Navigation */}
        <nav className="space-y-2 px-2">
          {studentNavItems.map(({ label, href, icon: Icon, required }) => {
            const isActive = isRouteActive(href);
            const isComplete = isSectionComplete(label);
            const isDisabled = isSectionDisabled(label, required);
            
            return (
              <div key={`${href}-${label}`} className="relative">
                {isDisabled ? (
                  <div
                    className={`
                      flex items-center gap-3 rounded-md cursor-not-allowed opacity-50
                      ${!isExpanded ? 'justify-center' : 'px-3 py-2'}
                      text-gray-400
                    `}
                    title={!isExpanded ? `${label} (${getFeeStatusMessage()})` : `${label} - Complete previous sections first`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className={`text-sm font-medium ${isExpanded ? 'inline-block' : 'hidden'}`}>
                      {label}
                    </span>
                    {isExpanded && label === 'Fees' && hasDepositSlip && feeStatus !== 'verified' && (
                      <span className="text-xs text-amber-500 ml-auto">Pending</span>
                    )}
                    {isExpanded && (
                      <Lock className="w-3 h-3 ml-auto" />
                    )}
                  </div>
                ) : (
                  <Link
                    href={href}
                    className={`
                      flex items-center gap-3 rounded-md transition-colors
                      ${isActive 
                        ? 'bg-green-600 text-white' 
                        : 'text-green-700 hover:bg-gray-100 hover:text-green-800'
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
                    {isExpanded && label === 'Fees' && hasDepositSlip && feeStatus !== 'verified' && (
                      <span className="text-xs text-amber-500 ml-auto">Pending</span>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* Completion Status Legend */}
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