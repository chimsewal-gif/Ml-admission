'use client';

import { useState, useEffect } from 'react';
import Button from '@/componets/Button';
import { CheckCircle, AlertCircle, FileText, User, BookOpen, CreditCard, Upload, Bell, Calendar, PlusCircle, ChevronRight, Send, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface SectionProgress {
  personalInfo: boolean;
  academicBackground: boolean;
  documents: boolean;
  programSelection: boolean;
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
    academicBackground: false,
    documents: false,
    programSelection: false,
    payment: false
  });
  const [submissionStatus, setSubmissionStatus] = useState<{ is_submitted: boolean; reference_number?: string }>({ is_submitted: false });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    loadUserData();
    checkSubmissionStatus();
    loadNotifications();
    loadDeadlines();
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
        setUser(JSON.parse(userData));
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
      // Fallback to empty array
      setNotifications([]);
    }
  };

  const loadDeadlines = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // You can create a deadlines endpoint or use mock data for now
      // For now, we'll use mock deadlines until you create the backend endpoint
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
      
      // Try to fetch from backend if endpoint exists
      try {
        const response = await fetch(`${API_BASE_URL}/deadlines/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDeadlines(data.data || []);
            return;
          }
        }
      } catch (error) {
        console.log('Deadlines endpoint not found, using mock data');
      }
      
      // Fallback to mock deadlines
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
        // Update local state
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
        // Update local state
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

    try {
      const personalInfoRes = await fetch(`${API_BASE_URL}/personal-details/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const personalData = await personalInfoRes.json();
      const hasPersonalInfo = personalData.success && personalData.data && 
        personalData.data.first_name && personalData.data.last_name && personalData.data.email;

      const subjectsRes = await fetch(`${API_BASE_URL}/subject-records/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subjectsData = await subjectsRes.json();
      const hasSubjects = subjectsData.success && subjectsData.data && subjectsData.data.length > 0;

      const userRes = await fetch(`${API_BASE_URL}/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userRes.json();
      
      let hasDocuments = false;
      if (userData.id) {
        const docsRes = await fetch(`${API_BASE_URL}/applicants/${userData.id}/documents/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const docsData = await docsRes.json();
        hasDocuments = docsData.success && docsData.data && 
          (docsData.data.msce || docsData.data.id_card);
      }

      const programmeRes = await fetch(`${API_BASE_URL}/applicants/programme/selection/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const programmeData = await programmeRes.json();
      const hasProgramme = programmeData.success && programmeData.data && programmeData.data.id;

      const paymentRes = await fetch(`${API_BASE_URL}/application-fees/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const paymentData = await paymentRes.json();
      const hasPayment = paymentData.success && paymentData.data && 
        (paymentData.data.status === 'verified' || paymentData.data.status === 'approved');

      setSectionProgress({
        personalInfo: hasPersonalInfo,
        academicBackground: hasSubjects,
        documents: hasDocuments,
        programSelection: hasProgramme,
        payment: hasPayment
      });

    } catch (error) {
      console.error('Error checking section progress:', error);
    }
  };

  const checkSubmissionStatus = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/submit/status/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSubmissionStatus(data.data);
      }
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  };

  const calculateOverallProgress = () => {
    const completed = Object.values(sectionProgress).filter(Boolean).length;
    return Math.round((completed / 5) * 100);
  };

  const sections = [
    {
      id: 'personalInfo',
      title: 'Personal Information',
      description: 'Your basic personal details',
      icon: User,
      href: '/application/select-type',
      color: 'blue'
    },
    {
      id: 'academicBackground',
      title: 'Academic Background',
      description: 'Your education history and qualifications',
      icon: BookOpen,
      href: '/application/High-school-records',
      color: 'green'
    },
    {
      id: 'documents',
      title: 'Documents Upload',
      description: 'Upload required documents',
      icon: Upload,
      href: '/application/documents',
      color: 'purple'
    },
    {
      id: 'programSelection',
      title: 'Program Selection',
      description: 'Choose your desired program',
      icon: FileText,
      href: '/application/select-type',
      color: 'orange'
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

  const progress = calculateOverallProgress();
  const isSubmitted = submissionStatus.is_submitted;

  // Calculate stats for the cards
  const completedSections = Object.values(sectionProgress).filter(Boolean).length;
  const stats = {
    active: completedSections,
    submitted: submissionStatus.is_submitted ? 1 : 0,
    accepted: 0,
    messages: unreadCount
  };

  // Circle Progress Component
  const CircleProgress = ({ percentage, size = 120 }: { percentage: number; size?: number }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const strokeWidth = 8;
    
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={percentage === 100 ? '#22c55e' : percentage >= 50 ? '#3b82f6' : '#eab308'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{percentage}%</span>
          <span className="text-xs text-gray-500 mt-1">Complete</span>
        </div>
      </div>
    );
  };

  // Get icon based on notification type
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

  // If application is already submitted
  if (isSubmitted) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          
          
          <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center mt-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-4">
              Your application has been successfully submitted.
            </p>
            {submissionStatus.reference_number && (
              <div className="bg-white rounded-lg p-4 mb-6 inline-block">
                <p className="text-sm text-gray-500">Reference Number</p>
                <p className="text-xl font-bold text-green-600">{submissionStatus.reference_number}</p>
              </div>
            )}
            <Button
              type="button"
              title="View Application Status"
              variant="bg-green-600"
              href="/application/status"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
      

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              {/* Email removed as requested */}
            </div>
            <button
              onClick={() => router.push('/application/select-type')}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <PlusCircle className="w-5 h-5" />
              Start New Application
            </button>
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
            <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-sm text-gray-500">ACTIVE</p>
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

        {/* Progress Overview Card with Circle Progress */}
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
            {/* Circle Progress */}
            <div className="flex-shrink-0">
              <CircleProgress percentage={progress} size={140} />
            </div>

            {/* Stats Cards */}
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(sectionProgress).filter(Boolean).length}
                </p>
                <p className="text-xs text-gray-500">Sections Completed</p>
                <p className="text-xs text-gray-400 mt-1">out of 5</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {5 - Object.values(sectionProgress).filter(Boolean).length}
                </p>
                <p className="text-xs text-gray-500">Remaining</p>
                <p className="text-xs text-gray-400 mt-1">sections to go</p>
              </div>
            </div>
          </div>

          {/* Progress Message */}
          {progress > 0 && progress < 100 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 text-center">
                {progress < 30 ? "You're just getting started! Complete your first section." :
                 progress < 70 ? "Great progress! Keep going to complete your application." :
                 "Almost there! Just a few more sections to go."}
              </p>
            </div>
          )}
        </div>

        {/* Application Sections */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Sections</h2>
          
          {sections.map((section) => {
            const isCompleted = sectionProgress[section.id as keyof SectionProgress];
            const Icon = section.icon;
            
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
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
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
              All sections are complete. Review your application before final submission.
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
                You have {5 - Object.values(sectionProgress).filter(Boolean).length} section(s) remaining to complete your application.
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
              href="/application/select-type"
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