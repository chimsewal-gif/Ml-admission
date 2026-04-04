// app/appadmin/applications/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, User, Calendar, Eye, Edit, Check, X, MoreVertical, 
  RefreshCw, Brain, Zap, BarChart3, Filter 
} from 'lucide-react';
import { mlService, MLPrediction } from '@/lib/mlService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Match backend structure
type ApplicantSubmission = {
  id: number;
  applicant_name: string;
  programme: string;
  reference_number?: string;
  status: string;
  submitted_at: string;
  ml_prediction?: MLPrediction;
  auto_processed?: boolean;
  last_analyzed_at?: string;
};

// Status options
const STATUS_OPTIONS = [
  'submitted',
  'pending',
  'under_review',
  'reviewed',
  'accepted',
  'approved',
  'rejected'
];

// ML Filter options
const ML_FILTER_OPTIONS = {
  ALL: 'all',
  AUTO_APPROVED: 'auto_approved',
  AUTO_REJECTED: 'auto_rejected',
  NEEDS_REVIEW: 'needs_review',
  NOT_ANALYZED: 'not_analyzed'
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicantSubmission[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicantSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<{id: number, status: string} | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [showMlModal, setShowMlModal] = useState<{show: boolean, application: ApplicantSubmission | null}>({
    show: false,
    application: null
  });
  const [mlFilter, setMlFilter] = useState(ML_FILTER_OPTIONS.ALL);
  const [analysisInProgress, setAnalysisInProgress] = useState<number[]>([]);
  const [autoProcessing, setAutoProcessing] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/applicant-submissions`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      // Handle different response formats
      let applicationsData: ApplicantSubmission[] = [];
      if (res.data.success && Array.isArray(res.data.data)) {
        applicationsData = res.data.data;
      } else if (Array.isArray(res.data)) {
        applicationsData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        applicationsData = res.data.data;
      } else {
        console.error('Unexpected response format:', res.data);
        setError('Unexpected response format from server');
      }

      setApplications(applicationsData);
      setFilteredApplications(applicationsData);

    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err: any) => {
    if (err.response?.status === 401) {
      setError('Session expired. Please log in again.');
      router.push('/login');
    } else if (err.response?.status === 403) {
      setError('You do not have permission to view applications.');
    } else if (err.response?.status === 404) {
      setError('Applications endpoint not found.');
    } else if (err.response?.status === 500) {
      setError('Server error. Please try again later.');
    } else if (err.message === 'Network Error') {
      setError('Cannot connect to server. Please check your connection.');
    } else {
      setError('Failed to fetch applications. Please try again.');
    }
  };

  // Auto-process applications on page load
  const autoProcessOnLoad = useCallback(async () => {
    try {
      setAutoProcessing(true);
      setError(null);

      const token = Cookies.get('token');
      if (!token) {
        return;
      }

      // Get applications that need processing
      const pendingApplications = applications.filter(app => 
        (app.status === 'submitted' || app.status === 'pending') && 
        !app.auto_processed &&
        !app.ml_prediction
      );

      if (pendingApplications.length === 0) {
        return;
      }

      console.log(`Auto-processing ${pendingApplications.length} applications...`);

      let processedCount = 0;
      let analyzedCount = 0;

      for (const application of pendingApplications) {
        try {
          // Analyze application with ML
          const prediction = await mlService.predictApplication(application);
          analyzedCount++;

          // Update application with ML prediction
          await axios.patch(
            `${API_BASE_URL}/applicant-submissions/${application.id}/ml-prediction`,
            { 
              ml_prediction: prediction,
              last_analyzed_at: new Date().toISOString()
            },
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              } 
            }
          );

          // Auto-process if confidence is high enough
          if (prediction && prediction.confidence > 0.75) {
            let newStatus = '';
            
            if (prediction.decision === 'approve') {
              newStatus = 'approved';
            } else if (prediction.decision === 'reject') {
              newStatus = 'rejected';
            }

            if (newStatus) {
              await axios.patch(
                `${API_BASE_URL}/applicant-submissions/${application.id}/status`,
                { 
                  status: newStatus,
                  auto_processed: true 
                },
                { 
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  } 
                }
              );
              processedCount++;
            }
          }

          // Update local state for this application
          setApplications(prev => prev.map(app => 
            app.id === application.id ? { 
              ...app, 
              ml_prediction: prediction,
              last_analyzed_at: new Date().toISOString(),
              ...(prediction && prediction.confidence > 0.75 ? {
                status: prediction.decision === 'approve' ? 'approved' : 
                       prediction.decision === 'reject' ? 'rejected' : app.status,
                auto_processed: prediction.decision === 'approve' || prediction.decision === 'reject'
              } : {})
            } : app
          ));

          // Small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (err) {
          console.error(`Failed to process application ${application.id}:`, err);
        }
      }

      if (processedCount > 0 || analyzedCount > 0) {
        setSuccess(`Auto-processed ${processedCount} applications and analyzed ${analyzedCount} applications`);
        setTimeout(() => setSuccess(null), 5000);
        
        // Refresh the applications list to get updated data
        await fetchApplications();
      }

    } catch (err: any) {
      console.error('Auto-processing failed:', err);
      // Don't show error to user for auto-processing failures
    } finally {
      setAutoProcessing(false);
    }
  }, [applications]);

  useEffect(() => {
    fetchApplications();
  }, [router]);

  // Auto-process when applications are loaded and there are unprocessed ones
  useEffect(() => {
    if (!loading && applications.length > 0) {
      const hasUnprocessed = applications.some(app => 
        (app.status === 'submitted' || app.status === 'pending') && 
        !app.auto_processed &&
        !app.ml_prediction
      );
      
      if (hasUnprocessed && !autoProcessing) {
        autoProcessOnLoad();
      }
    }
  }, [loading, applications, autoProcessing, autoProcessOnLoad]);

  // Apply ML filter when applications or filter changes
  useEffect(() => {
    let filtered = applications;
    
    switch (mlFilter) {
      case ML_FILTER_OPTIONS.AUTO_APPROVED:
        filtered = applications.filter(app => 
          app.auto_processed && app.ml_prediction?.decision === 'approve'
        );
        break;
      case ML_FILTER_OPTIONS.AUTO_REJECTED:
        filtered = applications.filter(app => 
          app.auto_processed && app.ml_prediction?.decision === 'reject'
        );
        break;
      case ML_FILTER_OPTIONS.NEEDS_REVIEW:
        filtered = applications.filter(app => 
          app.ml_prediction?.decision === 'review' || !app.ml_prediction
        );
        break;
      case ML_FILTER_OPTIONS.NOT_ANALYZED:
        filtered = applications.filter(app => !app.ml_prediction);
        break;
      default:
        filtered = applications;
    }
    
    setFilteredApplications(filtered);
  }, [applications, mlFilter]);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      setUpdatingId(id);
      const token = Cookies.get('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await axios.patch(
        `${API_BASE_URL}/applicant-submissions/${id}/status`,
        { status: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );

      if (res.data.success) {
        setApplications(prev => prev.map(app => 
          app.id === id ? { ...app, status: newStatus } : app
        ));
        
        setEditingStatus(null);
        setMobileMenuOpen(null);
        setError(null);
        setSuccess('Status updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(res.data.error || 'Status update failed');
      }

    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(err.response?.data?.error || 'Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const predictApplication = async (application: ApplicantSubmission) => {
    try {
      setProcessingId(application.id);
      setAnalysisInProgress(prev => [...prev, application.id]);
      setError(null);

      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Get ML prediction
      const prediction = await mlService.predictApplication(application);
      
      // Update application with ML prediction
      const updateRes = await axios.patch(
        `${API_BASE_URL}/applicant-submissions/${application.id}/ml-prediction`,
        { 
          ml_prediction: prediction,
          last_analyzed_at: new Date().toISOString()
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === application.id ? { 
          ...app, 
          ml_prediction: prediction,
          last_analyzed_at: new Date().toISOString()
        } : app
      ));

      setSuccess(`ML analysis completed: ${prediction.decision} (${Math.round(prediction.confidence * 100)}% confidence)`);
      setTimeout(() => setSuccess(null), 5000);

      return prediction;
    } catch (err: any) {
      console.error('ML prediction failed:', err);
      setError('Failed to get ML prediction. Please try again.');
      return null;
    } finally {
      setProcessingId(null);
      setAnalysisInProgress(prev => prev.filter(id => id !== application.id));
    }
  };

  const autoProcessApplication = async (application: ApplicantSubmission) => {
    const prediction = await predictApplication(application);
    
    if (prediction && prediction.confidence > 0.75) {
      let newStatus = '';
      
      if (prediction.decision === 'approve') {
        newStatus = 'approved';
      } else if (prediction.decision === 'reject') {
        newStatus = 'rejected';
      }

      if (newStatus) {
        await updateStatus(application.id, newStatus);
        
        // Mark as auto-processed
        setApplications(prev => prev.map(app => 
          app.id === application.id ? { ...app, auto_processed: true } : app
        ));

        setSuccess(`Application auto-processed as ${newStatus} based on ML prediction`);
        setTimeout(() => setSuccess(null), 5000);
      }
    }
  };

  const batchProcessApplications = async () => {
    try {
      setBatchProcessing(true);
      setError(null);

      const pendingApplications = applications.filter(app => 
        (app.status === 'submitted' || app.status === 'pending') && !app.auto_processed
      );

      let processedCount = 0;
      let skippedCount = 0;

      for (const application of pendingApplications) {
        const prediction = await predictApplication(application);
        
        if (prediction && prediction.confidence > 0.75) {
          let newStatus = '';
          
          if (prediction.decision === 'approve') {
            newStatus = 'approved';
          } else if (prediction.decision === 'reject') {
            newStatus = 'rejected';
          }

          if (newStatus) {
            await updateStatus(application.id, newStatus);
            
            setApplications(prev => prev.map(app => 
              app.id === application.id ? { ...app, auto_processed: true } : app
            ));
            
            processedCount++;
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }

        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setSuccess(`Batch processing completed: ${processedCount} auto-processed, ${skippedCount} need manual review`);
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      console.error('Batch processing failed:', err);
      setError('Batch processing failed. Please try again.');
    } finally {
      setBatchProcessing(false);
    }
  };

  const analyzeAllApplications = async () => {
    try {
      setBatchProcessing(true);
      setError(null);

      const unanalyzedApplications = applications.filter(app => !app.ml_prediction);

      for (const application of unanalyzedApplications) {
        await predictApplication(application);
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSuccess(`ML analysis completed for ${unanalyzedApplications.length} applications`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Batch analysis failed:', err);
      setError('Batch analysis failed. Please try again.');
    } finally {
      setBatchProcessing(false);
    }
  };

  const startEditing = (id: number, currentStatus: string) => {
    setEditingStatus({ id, status: currentStatus });
    setMobileMenuOpen(null);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingStatus(null);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review':
      case 'under review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reviewed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPredictionBadge = (application: ApplicantSubmission) => {
    if (!application.ml_prediction) return null;

    const pred = application.ml_prediction;
    const bgColor = pred.decision === 'approve' ? 'bg-green-100 text-green-800 border-green-200' : 
                    pred.decision === 'reject' ? 'bg-red-100 text-red-800 border-red-200' : 
                    'bg-yellow-100 text-yellow-800 border-yellow-200';

    return (
      <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium border ${bgColor}`}>
        ML: {pred.decision} ({Math.round(pred.confidence * 100)}%)
      </div>
    );
  };

  const getAutoProcessedBadge = (application: ApplicantSubmission) => {
    if (!application.auto_processed) return null;

    return (
      <div className="mt-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
        <Zap className="w-3 h-3 inline mr-1" />
        Auto-Processed
      </div>
    );
  };

  // Statistics for ML modal
  const mlStats = {
    total: applications.length,
    analyzed: applications.filter(app => app.ml_prediction).length,
    autoProcessed: applications.filter(app => app.auto_processed).length,
    approved: applications.filter(app => app.ml_prediction?.decision === 'approve').length,
    rejected: applications.filter(app => app.ml_prediction?.decision === 'reject').length,
    needsReview: applications.filter(app => app.ml_prediction?.decision === 'review').length,
    averageConfidence: applications.filter(app => app.ml_prediction)
      .reduce((acc, app) => acc + (app.ml_prediction?.confidence || 0), 0) / 
      (applications.filter(app => app.ml_prediction).length || 1)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Applicant Submissions</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Manage and review all applicant submissions with AI assistance
                {autoProcessing && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    Auto-processing...
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={fetchApplications}
                disabled={loading}
                className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ML Actions Bar */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={analyzeAllApplications}
                  disabled={batchProcessing || applications.length === 0}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Brain className={`w-4 h-4 ${batchProcessing ? 'animate-pulse' : ''}`} />
                  <span>{batchProcessing ? 'Analyzing...' : 'Analyze All with AI'}</span>
                </button>
                
                <button
                  onClick={batchProcessApplications}
                  disabled={batchProcessing || applications.length === 0}
                  className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className={`w-4 h-4 ${batchProcessing ? 'animate-pulse' : ''}`} />
                  <span>{batchProcessing ? 'Processing...' : 'Auto-Process All'}</span>
                </button>
                
                <button
                  onClick={() => setShowMlModal({ show: true, application: null })}
                  className="inline-flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>AI Analytics</span>
                </button>
              </div>

              {/* ML Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={mlFilter}
                  onChange={(e) => setMlFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={ML_FILTER_OPTIONS.ALL}>All Applications</option>
                  <option value={ML_FILTER_OPTIONS.NOT_ANALYZED}>Not Analyzed</option>
                  <option value={ML_FILTER_OPTIONS.NEEDS_REVIEW}>Needs Review</option>
                  <option value={ML_FILTER_OPTIONS.AUTO_APPROVED}>Auto-Approved</option>
                  <option value={ML_FILTER_OPTIONS.AUTO_REJECTED}>Auto-Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Success Display */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <Check className="h-5 w-5 text-green-400" />
                </div>
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-500 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      Programme
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      AI Analysis
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplications.length > 0 ? (
                    filteredApplications.map((app, idx) => (
                      <tr
                        key={app.id}
                        className="hover:bg-green-50/50 transition-all duration-200 group"
                      >
                        {/* Serial Number */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              {idx + 1}
                            </span>
                          </div>
                        </td>

                        {/* Applicant Name */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {app.applicant_name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Programme */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900 font-medium line-clamp-2">
                              {app.programme}
                            </span>
                          </div>
                        </td>

                        {/* Reference Number */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-mono text-gray-600 bg-gray-50 px-2 sm:px-3 py-1 rounded border">
                            {app.reference_number || 'N/A'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {editingStatus?.id === app.id ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={editingStatus.status}
                                onChange={(e) => setEditingStatus({...editingStatus, status: e.target.value})}
                                className="text-xs sm:text-sm border border-gray-300 rounded px-2 sm:px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                disabled={updatingId === app.id}
                              >
                                {STATUS_OPTIONS.map(status => (
                                  <option key={status} value={status}>
                                    {formatStatus(status)}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => updateStatus(app.id, editingStatus.status)}
                                disabled={updatingId === app.id}
                                className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                              >
                                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                disabled={updatingId === app.id}
                                className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                                {formatStatus(app.status)}
                              </span>
                              <button
                                onClick={() => startEditing(app.id, app.status)}
                                disabled={updatingId === app.id}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                title="Edit status"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          {getAutoProcessedBadge(app)}
                          {updatingId === app.id && (
                            <div className="mt-1">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mx-auto"></div>
                            </div>
                          )}
                        </td>

                        {/* AI Analysis */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          {app.ml_prediction ? (
                            <div className="space-y-1">
                              {getPredictionBadge(app)}
                              <div className="text-xs text-gray-500">
                                {app.last_analyzed_at && formatDate(app.last_analyzed_at)}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => predictApplication(app)}
                              disabled={analysisInProgress.includes(app.id)}
                              className="inline-flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-all duration-200 text-xs disabled:opacity-50"
                            >
                              <Brain className={`w-3 h-3 ${analysisInProgress.includes(app.id) ? 'animate-pulse' : ''}`} />
                              <span>{analysisInProgress.includes(app.id) ? 'Analyzing...' : 'Analyze'}</span>
                            </button>
                          )}
                        </td>

                        {/* Submission Date */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <div className="text-xs sm:text-sm text-gray-900">
                              {formatDate(app.submitted_at)}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/appadmin/applicant-submissions/${app.id}`}
                              className="inline-flex items-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-4 py-1 sm:py-2 rounded transition-all duration-200 group-hover:shadow-md text-xs sm:text-sm"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="font-medium">View</span>
                            </Link>
                            
                            {app.ml_prediction && app.ml_prediction.confidence > 0.75 && !app.auto_processed && (
                              <button
                                onClick={() => autoProcessApplication(app)}
                                disabled={updatingId === app.id}
                                className="inline-flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-all duration-200 text-xs disabled:opacity-50"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Auto-Process</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                          <div>
                            <p className="text-base sm:text-lg font-medium text-gray-900">No submissions found</p>
                            <p className="text-gray-500 text-xs sm:text-sm mt-1">
                              {mlFilter !== ML_FILTER_OPTIONS.ALL 
                                ? `No applications match the current filter (${mlFilter}).`
                                : 'There are no applicant submissions to display at this time.'
                              }
                            </p>
                          </div>
                          {mlFilter !== ML_FILTER_OPTIONS.ALL && (
                            <button
                              onClick={() => setMlFilter(ML_FILTER_OPTIONS.ALL)}
                              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors mt-2"
                            >
                              <Filter className="w-4 h-4" />
                              <span>Clear Filter</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3 p-3">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app, idx) => (
                  <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{app.applicant_name}</h3>
                          <p className="text-xs text-gray-500">#{idx + 1}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setMobileMenuOpen(mobileMenuOpen === app.id ? null : app.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {mobileMenuOpen === app.id && (
                          <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-40">
                            {!app.ml_prediction && (
                              <button
                                onClick={() => predictApplication(app)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b flex items-center space-x-2"
                              >
                                <Brain className="w-3 h-3" />
                                <span>Analyze with AI</span>
                              </button>
                            )}
                            {app.ml_prediction && app.ml_prediction.confidence > 0.75 && !app.auto_processed && (
                              <button
                                onClick={() => autoProcessApplication(app)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b flex items-center space-x-2"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Auto-Process</span>
                              </button>
                            )}
                            <button
                              onClick={() => startEditing(app.id, app.status)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b"
                            >
                              Edit Status
                            </button>
                            <Link
                              href={`/appadmin/applicant-submissions/${app.id}`}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setMobileMenuOpen(null)}
                            >
                              View Details
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Programme */}
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 line-clamp-2">{app.programme}</span>
                    </div>

                    {/* Reference */}
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Reference:</span>
                      <div className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border mt-1">
                        {app.reference_number || 'N/A'}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">Status:</span>
                      {editingStatus?.id === app.id ? (
                        <div className="flex items-center space-x-2 mt-1">
                          <select
                            value={editingStatus.status}
                            onChange={(e) => setEditingStatus({...editingStatus, status: e.target.value})}
                            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={updatingId === app.id}
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateStatus(app.id, editingStatus.status)}
                            disabled={updatingId === app.id}
                            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={updatingId === app.id}
                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                            {formatStatus(app.status)}
                          </span>
                        </div>
                      )}
                      {getAutoProcessedBadge(app)}
                    </div>

                    {/* AI Analysis */}
                    <div className="mb-2">
                      <span className="text-xs text-gray-500">AI Analysis:</span>
                      {app.ml_prediction ? (
                        <div className="mt-1">
                          {getPredictionBadge(app)}
                          {app.last_analyzed_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Analyzed: {formatDate(app.last_analyzed_at)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => predictApplication(app)}
                          disabled={analysisInProgress.includes(app.id)}
                          className="mt-1 inline-flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-all duration-200 text-xs disabled:opacity-50"
                        >
                          <Brain className={`w-3 h-3 ${analysisInProgress.includes(app.id) ? 'animate-pulse' : ''}`} />
                          <span>{analysisInProgress.includes(app.id) ? 'Analyzing...' : 'Analyze with AI'}</span>
                        </button>
                      )}
                    </div>

                    {/* Submission Date */}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-600">
                        {formatDate(app.submitted_at)}
                      </span>
                    </div>

                    {/* Loading Indicators */}
                    {(updatingId === app.id || analysisInProgress.includes(app.id)) && (
                      <div className="mt-2 flex justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-900 mb-1">No submissions found</p>
                  <p className="text-gray-500 text-sm mb-4">
                    {mlFilter !== ML_FILTER_OPTIONS.ALL 
                      ? `No applications match the current filter (${mlFilter}).`
                      : 'There are no applicant submissions to display at this time.'
                    }
                  </p>
                  {mlFilter !== ML_FILTER_OPTIONS.ALL ? (
                    <button
                      onClick={() => setMlFilter(ML_FILTER_OPTIONS.ALL)}
                      className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Clear Filter</span>
                    </button>
                  ) : (
                    <button
                      onClick={fetchApplications}
                      className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer with count */}
            {filteredApplications.length > 0 && (
              <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs sm:text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredApplications.length}</span> of <span className="font-medium">{applications.length}</span> submission{applications.length !== 1 ? 's' : ''}
                  {mlFilter !== ML_FILTER_OPTIONS.ALL && ` (filtered by ${mlFilter.replace('_', ' ')})`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ML Analytics Modal */}
      {showMlModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">AI Analytics Dashboard</h3>
                <button
                  onClick={() => setShowMlModal({ show: false, application: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-900">{mlStats.total}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-900">{mlStats.analyzed}</div>
                  <div className="text-sm text-green-700">Analyzed</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-900">{mlStats.autoProcessed}</div>
                  <div className="text-sm text-purple-700">Auto-Processed</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-emerald-900">{mlStats.approved}</div>
                  <div className="text-sm text-emerald-700">AI Approve</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-900">{mlStats.rejected}</div>
                  <div className="text-sm text-red-700">AI Reject</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-900">{Math.round(mlStats.averageConfidence * 100)}%</div>
                  <div className="text-sm text-yellow-700">Avg Confidence</div>
                </div>
              </div>

              {/* Recent Predictions */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 text-lg">Recent AI Predictions</h4>
                <div className="space-y-3">
                  {applications
                    .filter(app => app.ml_prediction)
                    .slice(0, 8)
                    .map(app => (
                      <div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{app.applicant_name}</p>
                          <p className="text-sm text-gray-600">{app.programme}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.ml_prediction!.decision === 'approve' ? 'bg-green-100 text-green-800 border border-green-200' :
                            app.ml_prediction!.decision === 'reject' ? 'bg-red-100 text-red-800 border border-red-200' :
                            'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {app.ml_prediction!.decision.toUpperCase()}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Confidence: {Math.round(app.ml_prediction!.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {applications.filter(app => app.ml_prediction).length === 0 && (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No AI predictions yet. Analyze some applications to see insights here.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6 mt-6">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={analyzeAllApplications}
                    disabled={batchProcessing}
                    className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Brain className="w-5 h-5" />
                    <span>Analyze All Applications</span>
                  </button>
                  <button
                    onClick={batchProcessApplications}
                    disabled={batchProcessing}
                    className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Auto-Process High Confidence</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}