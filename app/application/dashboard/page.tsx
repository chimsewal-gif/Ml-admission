'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Button from '@/componets/Button';
import { CheckCircle, AlertCircle, FileText, Users, Layers, Route, School, User, BookOpen, CreditCard, Upload, Bell, Calendar, PlusCircle, ChevronRight, Send, Inbox, Award, GraduationCap, Eye, Lock as LockIcon, RefreshCw, Info, XCircle, Plus, X} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Helper function for localStorage
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

// Statuses that lock the application
const LOCKED_STATUSES = ['submitted', 'approved', 'accepted', 'rejected', 'withdrawn', 'under_review', 'reviewed'];

interface SectionProgress {
  personalInfo: boolean;
  nextOfKin: boolean;
  applicationType: boolean;
  studyRoute: boolean;
  academicBackground: boolean;
  programmeChoice: boolean;
  education: boolean;
  teachingSubjects: boolean;
  documents: boolean;
  payment: boolean;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
  time_ago: string;
}

interface Deadline {
  id: number;
  title: string;
  description: string;
  date: string;
  days_left: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sectionProgress, setSectionProgress] = useState<SectionProgress>({
    personalInfo: false,
    nextOfKin: false,
    applicationType: false,
    studyRoute: false,
    academicBackground: false,
    programmeChoice: false,
    education: false,
    teachingSubjects: false,
    documents: false,
    payment: false
  });
  const [applicationStatus, setApplicationStatus] = useState<{ 
    is_submitted: boolean; 
    reference_number?: string;
    status?: string;
    submitted_at?: string;
  }>({ is_submitted: false });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [selectedApplicationType, setSelectedApplicationType] = useState<string>('');
  const [isPostgraduate, setIsPostgraduate] = useState(false);
  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [newAppType, setNewAppType] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Refs for polling
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Helper to check if application is locked
  const isApplicationLocked = () => {
    const status = applicationStatus.status || '';
    return LOCKED_STATUSES.includes(status);
  };

  // Start a new application
  const startNewApplication = async () => {
    if (!newAppType) {
      alert('Please select an application type');
      return;
    }
    
    setIsCreating(true);
    const token = getToken();
    
    try {
      // Clear existing application data from localStorage
      const keysToRemove = [
        'profileCompleted', 'nextOfKinCompleted', 'applicationTypeCompleted',
        'studyRouteCompleted', 'msceResultsCompleted', 'programmeChoiceCompleted',
        'educationCompleted', 'teachingSubjectsCompleted', 'documentsCompleted',
        'documentsSaved', 'applicationFeesCompleted', 'application_documents',
        'userApplicationType', 'userApplicationTypeName', 'applicationId'
      ];
      keysToRemove.forEach(key => safeLocalStorage.removeItem(key));
      
      // Reset section progress
      setSectionProgress({
        personalInfo: false,
        nextOfKin: false,
        applicationType: false,
        studyRoute: false,
        academicBackground: false,
        programmeChoice: false,
        education: false,
        teachingSubjects: false,
        documents: false,
        payment: false
      });
      
      // Reset application status
      setApplicationStatus({ is_submitted: false });
      
      // Save new application type
      safeLocalStorage.setItem('userApplicationType', newAppType);
      const appTypeName = newAppType === 'masters' ? 'Master\'s Degree' : 
                          newAppType === 'phd' ? 'PhD' : 
                          newAppType === 'undergraduate' ? 'Undergraduate' : 'Diploma';
      safeLocalStorage.setItem('userApplicationTypeName', appTypeName);
      setSelectedApplicationType(appTypeName);
      setIsPostgraduate(newAppType === 'masters' || newAppType === 'phd');
      
      // Redirect to personal details to start fresh
      router.push('/application/profile');
      
    } catch (error) {
      console.error('Error starting new application:', error);
      alert('Failed to start new application. Please try again.');
    } finally {
      setIsCreating(false);
      setShowNewAppModal(false);
      setNewAppType('');
    }
  };

  const getStatusDisplay = () => {
    const status = applicationStatus.status || '';
    switch (status) {
      case 'submitted': return { text: 'Submitted - Under Review', color: 'bg-yellow-100 text-yellow-800', icon: Send };
      case 'under_review': return { text: 'Under Review', color: 'bg-blue-100 text-blue-800', icon: Eye };
      case 'reviewed': return { text: 'Reviewed', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle };
      case 'approved': return { text: 'Approved!', color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'accepted': return { text: 'Accepted!', color: 'bg-green-100 text-green-800', icon: Award };
      case 'rejected': return { text: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'withdrawn': return { text: 'Withdrawn', color: 'bg-gray-100 text-gray-800', icon: X };
      default: return { text: 'In Progress', color: 'bg-gray-100 text-gray-800', icon: FileText };
    }
  };

  // Helper to check Documents completion
  const isDocumentsComplete = () => {
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
    return sectionProgress.documents;
  };

  // Calculate completed required sections
  const getCompletedRequiredCount = () => {
    let count = 0;
    if (sectionProgress.personalInfo) count++;
    if (sectionProgress.nextOfKin) count++;
    if (sectionProgress.applicationType) count++;
    if (sectionProgress.studyRoute) count++;
    if (sectionProgress.academicBackground) count++;
    if (sectionProgress.programmeChoice) count++;
    if (sectionProgress.education) count++;
    if (isDocumentsComplete()) count++;
    if (sectionProgress.payment) count++;
    return count;
  };

  const TOTAL_REQUIRED_SECTIONS = 9;
  const completedCount = getCompletedRequiredCount();
  const exactProgress = (completedCount / TOTAL_REQUIRED_SECTIONS) * 100;
  const progress = Math.round(exactProgress);
  const remainingCount = TOTAL_REQUIRED_SECTIONS - completedCount;
  const isLocked = isApplicationLocked();

  const stats = {
    active: completedCount,
    submitted: applicationStatus.is_submitted ? 1 : 0,
    accepted: 0,
    messages: unreadCount
  };

  const checkLocalStorageCompletion = () => {
    const flags = {
      personalInfo: safeLocalStorage.getItem('profileCompleted') === 'true',
      nextOfKin: safeLocalStorage.getItem('nextOfKinCompleted') === 'true',
      applicationType: safeLocalStorage.getItem('applicationTypeCompleted') === 'true',
      studyRoute: safeLocalStorage.getItem('studyRouteCompleted') === 'true',
      academicBackground: safeLocalStorage.getItem('msceResultsCompleted') === 'true',
      programmeChoice: safeLocalStorage.getItem('programmeChoiceCompleted') === 'true',
      education: safeLocalStorage.getItem('educationCompleted') === 'true',
      teachingSubjects: safeLocalStorage.getItem('teachingSubjectsCompleted') === 'true',
      documents: safeLocalStorage.getItem('documentsCompleted') === 'true' || safeLocalStorage.getItem('documentsSaved') === 'true',
      payment: safeLocalStorage.getItem('applicationFeesCompleted') === 'true'
    };
    
    if (!flags.documents) {
      const storedDocs = safeLocalStorage.getItem('application_documents');
      if (storedDocs) {
        try {
          const docs = JSON.parse(storedDocs);
          if (docs && docs.length > 0) {
            flags.documents = true;
          }
        } catch (e) {}
      }
    }
    
    return flags;
  };

  // Check submission status - called by polling
  const checkSubmissionStatus = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/submit/status/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const newStatus = {
          is_submitted: data.data.is_submitted || false,
          reference_number: data.data.reference_number,
          status: data.data.status || '',
          submitted_at: data.data.submitted_at
        };
        
        if (JSON.stringify(newStatus) !== JSON.stringify(applicationStatus)) {
          console.log('Status updated:', newStatus.status);
          setApplicationStatus(newStatus);
        }
      }
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  }, [applicationStatus]);

  // Refresh all progress
  const refreshProgress = useCallback(async () => {
    await checkSectionProgress();
    await checkSubmissionStatus();
  }, []);

  // Start polling for status updates
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    pollingIntervalRef.current = setInterval(() => {
      checkSubmissionStatus();
    }, 5000);
  }, [checkSubmissionStatus]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    loadUserData();
    loadNotifications();
    loadDeadlines();
    checkSubmissionStatus();
    startPolling();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'documentsCompleted' || e.key === 'documentsSaved' ||
          e.key === 'teachingSubjectsCompleted' || e.key === 'profileCompleted' ||
          e.key === 'nextOfKinCompleted' || e.key === 'applicationTypeCompleted' ||
          e.key === 'studyRouteCompleted' || e.key === 'msceResultsCompleted' ||
          e.key === 'programmeChoiceCompleted' || e.key === 'educationCompleted' ||
          e.key === 'applicationFeesCompleted') {
        refreshProgress();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      isMounted.current = false;
      stopPolling();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      }

      const response = await fetch(`${API_BASE_URL}/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      }

      const appType = safeLocalStorage.getItem('userApplicationType');
      if (appType === 'masters' || appType === 'phd') {
        setIsPostgraduate(true);
      }
      const typeName = safeLocalStorage.getItem('userApplicationTypeName');
      setSelectedApplicationType(typeName || appType || '');

      await checkSectionProgress();
      
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unread_count || 0);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  const loadDeadlines = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const mockDeadlines = [
        {
          id: 1,
          title: "Application Deadline",
          description: "Submit your application",
          date: "2024-12-15",
          days_left: 60
        },
        {
          id: 2,
          title: "Document Submission",
          description: "Upload required documents",
          date: "2024-12-10",
          days_left: 55
        },
        {
          id: 3,
          title: "Entrance Exam",
          description: "University entrance examination",
          date: "2025-01-05",
          days_left: 81
        }
      ];
      
      try {
        const response = await fetch(`${API_BASE_URL}/deadlines/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            setDeadlines(data.data);
            return;
          }
        }
      } catch (error) {
        console.log('Deadlines endpoint not found, using mock data');
      }
      
      setDeadlines(mockDeadlines);
      
    } catch (error) {
      console.error('Error loading deadlines:', error);
      setDeadlines([]);
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const checkSectionProgress = async () => {
    const token = getToken();
    if (!token) return;

    const localStorageFlags = checkLocalStorageCompletion();
    const progress = { ...localStorageFlags };

    try {
      if (!progress.personalInfo) {
        const personalInfoRes = await fetch(`${API_BASE_URL}/personal-details/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const personalData = await personalInfoRes.json();
        progress.personalInfo = personalData.success && personalData.data && 
          personalData.data.first_name && personalData.data.last_name && personalData.data.email;
        if (progress.personalInfo) {
          safeLocalStorage.setItem('profileCompleted', 'true');
        }
      }

      if (!progress.nextOfKin) {
        const nextOfKinRes = await fetch(`${API_BASE_URL}/next-of-kin/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const nextOfKinData = await nextOfKinRes.json();
        progress.nextOfKin = nextOfKinData.success && nextOfKinData.data && nextOfKinData.data.length > 0;
        if (progress.nextOfKin) {
          safeLocalStorage.setItem('nextOfKinCompleted', 'true');
        }
      }

      if (!progress.academicBackground) {
        const subjectsRes = await fetch(`${API_BASE_URL}/subject-records/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const subjectsData = await subjectsRes.json();
        progress.academicBackground = subjectsData.success && subjectsData.data && subjectsData.data.length > 0;
        if (progress.academicBackground) {
          safeLocalStorage.setItem('msceResultsCompleted', 'true');
        }
      }

      if (!progress.programmeChoice) {
        const programmeRes = await fetch(`${API_BASE_URL}/applicants/programme-choices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const programmeData = await programmeRes.json();
        progress.programmeChoice = programmeData.success && programmeData.choices && programmeData.choices.length > 0;
        if (progress.programmeChoice) {
          safeLocalStorage.setItem('programmeChoiceCompleted', 'true');
        }
      }

      if (!progress.education) {
        const educationRes = await fetch(`${API_BASE_URL}/education/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const educationData = await educationRes.json();
        progress.education = educationData.success && educationData.data && educationData.data.length > 0;
        if (progress.education) {
          safeLocalStorage.setItem('educationCompleted', 'true');
        }
      }

      if (!progress.teachingSubjects) {
        const teachingRes = await fetch(`${API_BASE_URL}/teaching-subjects/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const teachingData = await teachingRes.json();
        let hasSubjects = false;
        if (teachingData.success && teachingData.data) {
          if (Array.isArray(teachingData.data)) {
            hasSubjects = teachingData.data.length > 0;
          } else if (teachingData.data.data && Array.isArray(teachingData.data.data)) {
            hasSubjects = teachingData.data.data.length > 0;
          }
        }
        progress.teachingSubjects = hasSubjects;
        if (progress.teachingSubjects) {
          safeLocalStorage.setItem('teachingSubjectsCompleted', 'true');
        }
      }

      if (!progress.documents) {
        const userRes = await fetch(`${API_BASE_URL}/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const userData = await userRes.json();
        
        if (userData.id) {
          const docsRes = await fetch(`${API_BASE_URL}/applicants/${userData.id}/documents/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const docsData = await docsRes.json();
          progress.documents = docsData.success && docsData.data && 
            (docsData.data.msce || docsData.data.id_card || docsData.data.payment_proof);
          if (progress.documents) {
            safeLocalStorage.setItem('documentsCompleted', 'true');
            safeLocalStorage.setItem('documentsSaved', 'true');
          }
        }
      }

      if (!progress.payment) {
        try {
          const paymentRes = await fetch(`${API_BASE_URL}/application-fees/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const paymentData = await paymentRes.json();
          
          if (paymentData.success && paymentData.data) {
            if (paymentData.data.deposit_slip_path || paymentData.data.file_path) {
              progress.payment = true;
            }
            if (paymentData.data.status === 'verified' || paymentData.data.status === 'approved') {
              progress.payment = true;
            }
          }
        } catch (paymentErr) {
          console.error('Error checking payment:', paymentErr);
        }
        if (progress.payment) {
          safeLocalStorage.setItem('applicationFeesCompleted', 'true');
        }
      }

    } catch (error) {
      console.error('Error checking section progress:', error);
    }

    setSectionProgress(progress);
  };

  const sections = [
    {
      id: 'personalInfo',
      title: 'Personal Information',
      description: 'Your basic personal details',
      icon: User,
      href: '/application/profile',
      color: 'blue'
    },
    {
      id: 'nextOfKin',
      title: 'Next of Kin',
      description: 'Emergency contact information',
      icon: Users,
      href: '/application/next-of-kin',
      color: 'indigo'
    },
    {
      id: 'applicationType',
      title: 'Application Type',
      description: 'Select your application category',
      icon: Layers,
      href: '/application/select-type',
      color: 'purple'
    },
    {
      id: 'studyRoute',
      title: 'Study Route',
      description: 'Choose your study pathway',
      icon: Route,
      href: '/application/select-route',
      color: 'pink'
    },
    {
      id: 'academicBackground',
      title: 'MSCE Results',
      description: 'Your academic qualifications',
      icon: BookOpen,
      href: '/application/High-school-records',
      color: 'green'
    },
    {
      id: 'programmeChoice',
      title: 'Programme Choice',
      description: 'Select your preferred programme',
      icon: School,
      href: '/application/program-selection',
      color: 'orange'
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Your education history',
      icon: GraduationCap,
      href: '/application/education',
      color: 'teal'
    },
    {
      id: 'teachingSubjects',
      title: 'Teaching Subjects',
      description: 'Subjects you can teach (Optional)',
      icon: BookOpen,
      href: '/application/teacher-subjects',
      color: 'cyan'
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Upload required documents',
      icon: Upload,
      href: '/application/documents',
      color: 'purple'
    },
    {
      id: 'payment',
      title: 'Application Fee',
      description: 'Pay application fee',
      icon: CreditCard,
      href: '/application/application-fees',
      color: 'red'
    }
  ];
// New Application Modal Component
const NewApplicationModal = () => {
  if (!showNewAppModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Start New Application</h2>
          <button
            onClick={() => setShowNewAppModal(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Starting a new application will clear your current progress. You can have only one active application at a time.
        </p>
        
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Application Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['undergraduate', 'diploma', 'masters', 'phd'].map((type) => (
              <button
                key={type}
                onClick={() => setNewAppType(type)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  newAppType === type
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900 capitalize">{type}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {type === 'undergraduate' && 'Bachelor\'s Degree'}
                  {type === 'diploma' && 'Diploma Program'}
                  {type === 'masters' && 'Master\'s Degree'}
                  {type === 'phd' && 'Doctoral Program'}
                </p>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewAppModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={startNewApplication}
            disabled={!newAppType || isCreating}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Starting...' : 'Start Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

  const CircleProgress = ({ percentage, size = 140 }: { percentage: number; size?: number }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const strokeWidth = 12;
    
    const getGreenColor = () => {
      if (percentage >= 80) return '#10b981';
      if (percentage >= 50) return '#22c55e';
      if (percentage >= 20) return '#34d399';
      return '#6ee7b7';
    };

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getGreenColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
          <span className="text-xs text-green-600 font-medium mt-1">Complete</span>
        </div>
      </div>
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'application':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If application is locked (submitted/approved/rejected), show status view
  if (isLocked) {
    return (
      <div className="p-4 md:p-8">
        <NewApplicationModal />
        <div className="max-w-5xl mx-auto">
          {/* Status Banner */}
          <div className={`mb-8 rounded-xl p-6 text-center ${statusDisplay.color} border border-opacity-30`}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <StatusIcon className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Application {statusDisplay.text}</h2>
            </div>
            {applicationStatus.reference_number && (
              <div className="bg-white rounded-lg p-3 inline-block mb-3">
                <p className="text-xs text-gray-500">Reference Number</p>
                <p className="text-lg font-bold font-mono">{applicationStatus.reference_number}</p>
              </div>
            )}
            {applicationStatus.submitted_at && (
              <p className="text-sm mt-2">
                Submitted on: {new Date(applicationStatus.submitted_at).toLocaleDateString()}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              <Link
                href="/application/status"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Full Status
              </Link>
              <Link
                href="/application/application-fees"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Make Payment
              </Link>
              {(applicationStatus.status === 'approved' || applicationStatus.status === 'accepted') && (
                <Link
                  href="/application/acceptance-letter"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Award className="w-4 h-4" />
                  View Acceptance Letter
                </Link>
              )}
              <button
                onClick={() => {
                  checkSubmissionStatus();
                  refreshProgress();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Status
              </button>
              {/* Start New Application Button - Always visible */}
              <button
                onClick={() => setShowNewAppModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start New Application
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-500 flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Auto-refreshing status...
            </div>
          </div>

          {/* Read-Only Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <LockIcon className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-800">Application Summary (Read Only)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Programme</p>
                <p className="font-medium text-gray-900">{sections.find(s => s.id === 'programmeChoice')?.title || 'Not selected'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Application Type</p>
                <p className="font-medium text-gray-900">{selectedApplicationType || 'Not selected'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Completion Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Documents</p>
                <p className="font-medium text-gray-900">
                  {isDocumentsComplete() ? '✓ Uploaded' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Application Locked</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your application has been {statusDisplay.text.toLowerCase()}. You cannot make changes to your application at this stage.
                  Click "Start New Application" to begin a new application.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular dashboard for active applications (not locked)
  return (
    <div className="p-4 md:p-8">
      <NewApplicationModal />
      <div className="max-w-5xl mx-auto">
        {/* Welcome Section with Start New Application Button */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.first_name || 'Applicant'}!
              </h1>
              {selectedApplicationType && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Applying as: {selectedApplicationType}
                  {isPostgraduate && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Postgraduate</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                Live updates
              </div>
              {/* Start New Application Button */}
              <button
                onClick={() => setShowNewAppModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Start New Application
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-sm text-gray-500">SECTIONS COMPLETED</p>
            <p className="text-xs text-gray-400 mt-1">out of {TOTAL_REQUIRED_SECTIONS}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Send className="w-5 h-5 text-purple-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.submitted}</p>
            <p className="text-sm text-gray-500">SUBMITTED</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.accepted}</p>
            <p className="text-sm text-gray-500">ACCEPTED</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Inbox className="w-5 h-5 text-yellow-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.messages}</p>
            <p className="text-sm text-gray-500">MESSAGES</p>
          </div>
        </div>

        {/* Progress Overview Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Application Progress</h2>
            {progress === 100 && (
              <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Ready to Submit
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-shrink-0">
              <CircleProgress percentage={progress} size={140} />
            </div>

            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-xs text-gray-500">Sections Completed</p>
                <p className="text-xs text-gray-400 mt-1">out of {TOTAL_REQUIRED_SECTIONS}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{remainingCount}</p>
                <p className="text-xs text-gray-500">Remaining</p>
                <p className="text-xs text-gray-400 mt-1">sections to go</p>
              </div>
            </div>
          </div>

          {progress > 0 && progress < 100 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 text-center">
                {progress < 30 ? "You're just getting started! Complete your first section." :
                 progress < 70 ? "Great progress! Keep going to complete your application." :
                 "Almost there! Just a few more sections to go."}
              </p>
            </div>
          )}
          <div className="mt-4 text-center text-xs text-gray-400">
            <span className="font-medium">Note:</span> Teaching Subjects is optional and not counted in progress
          </div>
        </div>

        {/* Application Sections */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Sections</h2>
          
          {sections.map((section) => {
            let isCompleted: boolean;
            if (section.id === 'documents') {
              isCompleted = isDocumentsComplete();
            } else {
              isCompleted = sectionProgress[section.id as keyof SectionProgress];
            }
            const Icon = section.icon;
            const isRequired = section.id !== 'teachingSubjects';
            
            return (
              <div
                key={section.id}
                className={`bg-white rounded-xl border transition-all hover:shadow-md ${
                  isCompleted 
                    ? 'border-green-200 bg-green-50/30' 
                    : 'border-gray-200'
                }`}
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-xl ${
                      isCompleted 
                        ? 'bg-green-100' 
                        : `bg-${section.color}-100`
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isCompleted 
                          ? 'text-green-600' 
                          : `text-${section.color}-600`
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{section.title}</h3>
                        {!isRequired && (
                          <span className="text-xs text-gray-400">(Optional)</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Completed</span>
                      </span>
                    ) : (
                      <Button
                        type="button"
                        title="Start"
                        variant="bg-green-600"
                        href={section.href}
                        className="px-4 py-2 text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Submission Section */}
        {progress === 100 && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Ready to Submit!</h3>
            </div>
            <p className="text-gray-600 mb-4">
              All required sections are complete. Review your application before final submission.
            </p>
            <Button
              type="button"
              title="Review & Submit"
              variant="bg-green-600"
              href="/application/submit"
              className="px-6 py-2"
            />
          </div>
        )}

        {/* Incomplete Alert */}
        {progress > 0 && progress < 100 && (
          <div className="mt-8 bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                You have {remainingCount} required section(s) remaining to complete your application.
              </p>
            </div>
          </div>
        )}

        {/* No Progress Started */}
        {progress === 0 && (
          <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6 text-center">
            <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Start Your Application</h3>
            <p className="text-gray-600 mb-4">
              Begin your application journey by completing the sections above
            </p>
            <Button
              type="button"
              title="Get Started"
              variant="bg-green-600"
              href="/application/profile"
              className="px-6 py-2"
            />
          </div>
        )}

        {/* Notifications & Deadlines Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Notifications */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Mark all read
                    </button>
                  )}
                  <button 
                    onClick={() => router.push('/notifications')}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markNotificationAsRead(notification.id);
                      }
                      if (notification.link) {
                        router.push(notification.link);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time_ago}</p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">You'll see updates here when you have new notifications</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
                </div>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                  View History
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {deadlines.length > 0 ? (
                deadlines.map((deadline) => (
                  <div key={deadline.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{deadline.title}</p>
                      <p className="text-xs text-gray-500">{deadline.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        deadline.days_left <= 7 ? 'text-red-600' : 
                        deadline.days_left <= 30 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {new Date(deadline.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">{deadline.days_left} days left</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No deadlines yet</p>
                  <p className="text-xs text-gray-400 mt-1">Check back later for important dates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}