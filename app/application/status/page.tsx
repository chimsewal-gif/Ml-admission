'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  User, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BookOpen,
  CreditCard,
  AlertCircle,
  Home,
  ChevronRight,
  Download,
  Printer,
  RefreshCw,
  Eye,
  ThumbsUp,
  Award,
  TrendingUp,
  Shield,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface ApplicationStatus {
  id: number;
  reference_number: string;
  status: 'pending' | 'under_review' | 'reviewed' | 'approved' | 'rejected' | 'submitted';
  submitted_at: string;
  programme_name: string;
  programme_department?: string;
  programme_duration?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  application_fee_status?: string;
  documents_verified?: boolean;
  eligibility_verified?: boolean;
  ml_prediction?: {
    decision: string;
    confidence: number;
    priority_level: string;
    recommendation: string;
  };
}

interface StatusStep {
  label: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  icon: React.ReactNode;
  date?: string;
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const [application, setApplication] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchApplicationStatus = useCallback(async (showRefreshIndicator = false) => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      const response = await fetch(`${API_BASE_URL}/submit/status/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch application status');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const previousStatus = application?.status;
        const newStatus = data.data.status;
        
        // Fetch additional details
        const [detailsResponse, feeResponse, programmeResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/personal-details/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/application-fees/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/applicants/programme/selection/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
        ]);
        
        const detailsData = await detailsResponse.json();
        const feeData = await feeResponse.json();
        const programmeData = await programmeResponse.json();
        
        const newApplicationData = {
          ...data.data,
          first_name: detailsData.data?.first_name || '',
          last_name: detailsData.data?.last_name || '',
          email: detailsData.data?.email || '',
          phone: detailsData.data?.phone || '',
          application_fee_status: feeData.data?.status || 'pending',
          documents_verified: true,
          eligibility_verified: data.data.status !== 'rejected',
          programme_name: programmeData.data?.name || 'Not selected',
          programme_department: programmeData.data?.department || '',
          programme_duration: programmeData.data?.duration || '',
        };
        
        // Show notification if status changed
        if (previousStatus && previousStatus !== newStatus) {
          let statusMessage = '';
          if (newStatus === 'approved') {
            statusMessage = '🎉 Congratulations! Your application has been approved!';
          } else if (newStatus === 'rejected') {
            statusMessage = 'Your application has been reviewed. Please check your email for details.';
          } else if (newStatus === 'under_review') {
            statusMessage = 'Your application is now under review by the committee.';
          } else if (newStatus === 'reviewed') {
            statusMessage = 'Your application has been reviewed. Final decision pending.';
          }
          
          if (statusMessage) {
            setNotification(statusMessage);
            setTimeout(() => setNotification(null), 5000);
          }
        }
        
        setApplication(newApplicationData);
        setLastChecked(new Date());
      } else {
        setApplication(null);
      }
    } catch (err) {
      console.error('Error fetching application status:', err);
      setError('Failed to load application status. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [application?.status, router]);

  // Start polling for status updates
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    pollingIntervalRef.current = setInterval(() => {
      fetchApplicationStatus(false);
    }, 5000); // Poll every 5 seconds
  }, [fetchApplicationStatus]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchApplicationStatus(true);
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [fetchApplicationStatus, startPolling, stopPolling]);

  const handleRefresh = async () => {
    await fetchApplicationStatus(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusSteps = (): StatusStep[] => {
    const status = application?.status || 'pending';
    
    const steps = [
      {
        label: 'Application Submitted',
        description: 'Your application has been received',
        status: ['submitted', 'under_review', 'reviewed', 'approved', 'rejected'].includes(status) ? 'completed' : 'current',
        icon: <FileText className="w-5 h-5" />,
        date: application?.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : undefined
      },
      {
        label: 'Document Verification',
        description: 'Verifying your uploaded documents',
        status: status === 'submitted' ? 'pending' : 
                ['under_review', 'reviewed', 'approved', 'rejected'].includes(status) ? 'completed' : 'current',
        icon: <Eye className="w-5 h-5" />
      },
      {
        label: 'Application Review',
        description: 'Academic committee reviewing your application',
        status: status === 'under_review' ? 'current' :
                ['reviewed', 'approved', 'rejected'].includes(status) ? 'completed' : 'pending',
        icon: <GraduationCap className="w-5 h-5" />
      },
      {
        label: 'ML Analysis',
        description: 'AI-powered eligibility assessment',
        status: status === 'reviewed' ? 'current' :
                ['approved', 'rejected'].includes(status) ? 'completed' : 'pending',
        icon: <TrendingUp className="w-5 h-5" />
      },
      {
        label: 'Final Decision',
        description: status === 'approved' ? 'Congratulations! You have been accepted.' :
                      status === 'rejected' ? 'We regret to inform you...' :
                      'Awaiting final decision',
        status: status === 'approved' || status === 'rejected' ? 'completed' : 'pending',
        icon: status === 'approved' ? <ThumbsUp className="w-5 h-5" /> :
              status === 'rejected' ? <XCircle className="w-5 h-5" /> :
              <Award className="w-5 h-5" />
      }
    ];
    
    return steps;
  };

  const getStatusColor = () => {
    switch (application?.status) {
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: <CheckCircle className="w-6 h-6" /> };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <XCircle className="w-6 h-6" /> };
      case 'under_review':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', icon: <Clock className="w-6 h-6" /> };
      case 'reviewed':
        return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', icon: <Eye className="w-6 h-6" /> };
      default:
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: <Clock className="w-6 h-6" /> };
    }
  };

  const getStatusText = () => {
    switch (application?.status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'under_review': return 'Under Review';
      case 'reviewed': return 'Reviewed';
      default: return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application status...</p>
        </div>
      </div>
    );
  }

  if (!application && !error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Application Found</h2>
            <p className="text-gray-600 mb-6">
              You haven't submitted an application yet. Start your application today!
            </p>
            <button
              onClick={() => router.push('/application/select-type')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Start Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor();
  const steps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-gray-600 hover:text-green-600"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Application Status</span>
          </nav>
        </div>

        {/* Auto-refresh Indicator */}
        <div className="mb-4 flex justify-end">
          <div className="inline-flex items-center gap-2 text-xs text-gray-400">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refreshing every 5 seconds</span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
              title="Refresh now"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {lastChecked && (
              <span className="text-gray-400">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Status Change Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">{notification}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Application Status</h1>
            <p className="text-gray-600 mt-1">Track your application progress in real-time</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Status Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white rounded-xl shadow-lg border ${statusColor.border} overflow-hidden mb-6`}
        >
          <div className={`${statusColor.bg} px-6 py-4`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {statusColor.icon}
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  <p className={`text-xl font-bold ${statusColor.text}`}>{getStatusText()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Reference Number</p>
                <p className="font-mono font-bold text-gray-900">{application?.reference_number}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Programme</p>
                  <p className="text-sm font-medium">{application?.programme_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Submitted Date</p>
                  <p className="text-sm font-medium">
                    {application?.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Fee Status</p>
                  <p className={`text-sm font-medium ${
                    application?.application_fee_status === 'verified' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {application?.application_fee_status === 'verified' ? 'Paid ✓' : 'Pending Verification'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Eligibility</p>
                  <p className={`text-sm font-medium ${
                    application?.eligibility_verified ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {application?.eligibility_verified ? 'Verified' : 'Under Review'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Application Progress</h2>
          </div>
          <div className="p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Steps */}
              <div className="space-y-8 relative">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-4 relative">
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      step.status === 'completed' ? 'bg-green-100 text-green-600' :
                      step.status === 'current' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className={`font-semibold ${
                          step.status === 'completed' ? 'text-gray-900' :
                          step.status === 'current' ? 'text-blue-600' :
                          'text-gray-500'
                        }`}>
                          {step.label}
                        </h3>
                        {step.date && (
                          <span className="text-xs text-gray-500">{step.date}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                      {step.status === 'current' && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-blue-600">In Progress...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ML Prediction Card (if available) */}
        {application?.ml_prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-lg border border-purple-200 overflow-hidden mb-6"
          >
            <div className="px-6 py-4 border-b border-purple-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">AI Prediction</h2>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">ML Analyzed</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-600">Predicted Decision</p>
                  <p className={`text-xl font-bold ${
                    application.ml_prediction.decision === 'approve' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {application.ml_prediction.decision === 'approve' ? 'Likely Admission' : 'Further Review Needed'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 rounded-full h-2"
                        style={{ width: `${(application.ml_prediction.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold">{Math.round((application.ml_prediction.confidence || 0) * 100)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority Level</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    application.ml_prediction.priority_level === 'High' ? 'bg-red-100 text-red-700' :
                    application.ml_prediction.priority_level === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {application.ml_prediction.priority_level}
                  </span>
                </div>
              </div>
              {application.ml_prediction.recommendation && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700">{application.ml_prediction.recommendation}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Applicant Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Applicant Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium">{application?.first_name} {application?.last_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{application?.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{application?.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Programme Department</p>
                    <p className="text-sm font-medium">{application?.programme_department || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Steps / Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Need Assistance?</h3>
              <p className="text-sm text-gray-600 mb-3">
                If you have questions about your application status, please contact the Admissions Office.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">admissions@mzuni.ac.mw</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">+265 887 138 538</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between gap-4">
          <button
            onClick={() => router.push('/application/dashboard')}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
          {application?.status === 'approved' && (
            <button
              onClick={() => router.push('/application/acceptance-letter')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              View Acceptance Letter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}