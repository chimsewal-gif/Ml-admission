'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, User, Calendar, Eye, Edit, Check, X, MoreVertical, 
  RefreshCw, Brain, Zap, BarChart3, Filter, TrendingUp, 
  Shield, AlertTriangle, Award, Clock, Users, Download,
  PieChart, Activity, Target, ThumbsUp, ThumbsDown, AlertCircle,
  Sparkles, MessageCircle, Flag, Info, FileCheck, Loader,
  Image as ImageIcon, XCircle, CheckCircle
} from 'lucide-react';

import { mlService, MLPrediction } from '@/lib/mlService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

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
  eligibility_verified?: boolean;
  documents_valid?: boolean;
  priority_level?: 'High' | 'Medium' | 'Low';
  rejection_reason?: string;
  rejection_details?: {
    reason: string;
    factors: string[];
    recommendation: string;
    reviewed_by?: string;
    reviewed_at?: string;
  };
};

// Document type for the verification modal
interface Document {
  id: number;
  file: string;
  name: string;
  type: string;
  uploaded_at: string;
  mime_type?: string;
}

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-purple-100 text-purple-800' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' }
];

const PRIORITY_OPTIONS = [
  { value: 'High', label: 'High Priority', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'Medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'Low', label: 'Low Priority', color: 'bg-green-100 text-green-800 border-green-200' }
];

const ML_FILTER_OPTIONS = {
  ALL: 'all',
  HIGH_PRIORITY: 'high_priority',
  MEDIUM_PRIORITY: 'medium_priority',
  LOW_PRIORITY: 'low_priority',
  AUTO_APPROVED: 'auto_approved',
  AUTO_REJECTED: 'auto_rejected',
  NEEDS_REVIEW: 'needs_review',
  ELIGIBLE: 'eligible',
  INELIGIBLE: 'ineligible',
  NOT_ANALYZED: 'not_analyzed'
};

const REJECTION_REASONS = [
  { value: 'academic_requirements', label: 'Does not meet academic requirements', icon: '📚' },
  { value: 'incomplete_documents', label: 'Incomplete or missing documents', icon: '📄' },
  { value: 'low_msce_scores', label: 'Low MSCE scores', icon: '📊' },
  { value: 'programme_full', label: 'Programme capacity reached', icon: '🚫' },
  { value: 'ineligible_qualification', label: 'Ineligible qualifications', icon: '🎓' },
  { value: 'application_deadline', label: 'Application submitted after deadline', icon: '⏰' },
  { value: 'payment_issue', label: 'Payment not verified', icon: '💰' },
  { value: 'duplicate_application', label: 'Duplicate application', icon: '🔄' },
  { value: 'fraudulent_documents', label: 'Fraudulent or tampered documents', icon: '⚠️' },
  { value: 'other', label: 'Other reason', icon: '📝' },
];

const getToken = () => {
  if (typeof window !== 'undefined') return localStorage.getItem('token');
  return null;
};

const getUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

// ---------- Document Verification Modal Component ----------
interface DocModalProps {
  isOpen: boolean;
  applicationId: number;
  applicantName: string;
  currentStatus: boolean | null;
  onClose: () => void;
  onUpdate: (newStatus: boolean) => void;
}

function DocumentVerificationModal({ isOpen, applicationId, applicantName, currentStatus, onClose, onUpdate }: DocModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const apiClient = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    return axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` }
    });
  }, []);

  useEffect(() => {
    if (isOpen && applicationId) {
      fetchDocuments();
    }
  }, [isOpen, applicationId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    const client = apiClient();
    if (!client) {
      setError('Authentication required');
      setLoading(false);
      return;
    }
    try {
      const res = await client.get(`/applicant-submissions/${applicationId}/documents/`);
      if (res.data.success) {
        setDocuments(res.data.data || []);
      } else {
        setDocuments([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.response?.data?.message || 'Could not load documents');
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentValidation = async (newStatus: boolean) => {
    setSubmitting(true);
    setError(null);
    const client = apiClient();
    if (!client) {
      setError('Authentication required');
      setSubmitting(false);
      return;
    }
    try {
      const res = await client.patch(`/applicant-submissions/${applicationId}/documents`, {
        documents_valid: newStatus
      });
      if (res.data.success) {
        onUpdate(newStatus);
        onClose();
      } else {
        setError(res.data.message || 'Update failed');
      }
    } catch (err: any) {
      console.error('Failed to update document validation:', err);
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (currentStatus === true) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><Check className="w-3 h-3" /> Accepted</span>;
    } else if (currentStatus === false) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><X className="w-3 h-3" /> Invalid</span>;
    } else {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Document Verification</h2>
            <p className="text-sm text-gray-500">{applicantName} (ID: {applicationId})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            {getStatusBadge()}
          </div>

          <div className="border-t pt-3">
            <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader className="animate-spin w-6 h-6 text-green-600" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-gray-500 text-sm">No documents found for this application.</p>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                    {getFileIcon(doc.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.type} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={() => updateDocumentValidation(false)}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader className="animate-spin w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            Mark as Invalid
          </button>
          <button
            onClick={() => updateDocumentValidation(true)}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            Mark as Valid
          </button>
        </div>
      </div>

      {/* Simple preview modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={() => setSelectedDoc(null)}>
          <div className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b">
              <span className="font-medium">{selectedDoc.name}</span>
              <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              {selectedDoc.mime_type?.startsWith('image/') ? (
                <img src={selectedDoc.file} alt={selectedDoc.name} className="max-w-full max-h-[70vh] object-contain" />
              ) : (
                <iframe src={selectedDoc.file} className="w-full h-[70vh]" title={selectedDoc.name} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// -----------------------------------------------------------

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicantSubmission[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicantSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<{id: number, status: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMlModal, setShowMlModal] = useState<{show: boolean, application: ApplicantSubmission | null}>({
    show: false,
    application: null
  });
  const [showRejectionModal, setShowRejectionModal] = useState<{show: boolean, application: ApplicantSubmission | null}>({
    show: false,
    application: null
  });
  const [showDocModal, setShowDocModal] = useState<{show: boolean, applicationId: number, applicantName: string, currentStatus: boolean | null}>({
    show: false,
    applicationId: 0,
    applicantName: '',
    currentStatus: null
  });
  const [mlFilter, setMlFilter] = useState(ML_FILTER_OPTIONS.ALL);
  const [analysisInProgress, setAnalysisInProgress] = useState<number[]>([]);
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingRef = useRef(false);

  const apiClient = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }, []);

  const getRejectionFactors = (reason: string): string[] => {
    const factorsMap: Record<string, string[]> = {
      'academic_requirements': ['MSCE points below cutoff', 'Missing prerequisite subjects', 'Grades do not meet minimum requirement'],
      'incomplete_documents': ['Missing MSCE certificate', 'Missing identification document', 'Incomplete application form'],
      'low_msce_scores': ['Low average points', 'Poor performance in key subjects', 'Below minimum grade requirements'],
      'programme_full': ['Programme capacity reached', 'Higher competition this intake', 'Limited spaces available'],
      'ineligible_qualification': ['Qualification not recognized', 'Programme requires different qualification level', 'International qualification not verified'],
      'application_deadline': ['Submitted after closing date', 'Late payment submission', 'Documents uploaded after deadline'],
      'payment_issue': ['Payment not confirmed', 'Insufficient amount paid', 'Payment reference mismatch'],
      'duplicate_application': ['Multiple applications submitted', 'Same applicant with different details'],
      'fraudulent_documents': ['Document tampering detected', 'Inconsistent information across documents', 'Verification failed'],
    };
    return factorsMap[reason] || ['Does not meet admission criteria'];
  };

  const getRejectionRecommendation = (reason: string): string => {
    const recommendationsMap: Record<string, string> = {
      'academic_requirements': 'Consider improving grades through supplementary exams or apply for a different programme',
      'incomplete_documents': 'Submit all required documents in the next application cycle',
      'low_msce_scores': 'Improve academic performance or consider foundation programmes',
      'programme_full': 'Consider alternative programmes with available capacity',
      'ineligible_qualification': 'Obtain recognized qualification or apply for programmes matching your qualification',
      'application_deadline': 'Ensure timely submission in the next intake',
      'payment_issue': 'Verify payment details before submitting next application',
      'duplicate_application': 'Submit only one complete application per intake',
      'fraudulent_documents': 'Submit only authentic documents for verification',
    };
    return recommendationsMap[reason] || 'Please review admission requirements before reapplying';
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      const client = apiClient();
      if (!client) {
        router.push('/login');
        return;
      }
      const res = await client.get('/applicant-submissions');
      let applicationsData: ApplicantSubmission[] = [];
      if (res.data.success && Array.isArray(res.data.data)) {
        applicationsData = res.data.data;
      } else if (Array.isArray(res.data)) {
        applicationsData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        applicationsData = res.data.data;
      } else {
        setError('Unexpected response format from server');
      }
      const enrichedData = applicationsData.map(app => ({
        ...app,
        priority_level: calculatePriority(app),
        rejection_reason: app.rejection_reason || (app.status === 'rejected' ? 'Not specified' : undefined)
      }));
      setApplications(enrichedData);
      setFilteredApplications(enrichedData);
      return enrichedData;
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      handleError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const calculatePriority = (application: ApplicantSubmission): 'High' | 'Medium' | 'Low' => {
    if (!application.ml_prediction) return 'Medium';
    const { confidence, decision } = application.ml_prediction;
    if (decision === 'approve' && confidence > 0.7) return 'High';
    if (decision === 'approve' && confidence > 0.5) return 'Medium';
    if (decision === 'reject') return 'Low';
    return 'Medium';
  };

  const handleError = (err: any) => {
    if (err.response?.status === 401) {
      setError('Session expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => router.push('/login'), 2000);
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

  const updateStatus = async (id: number, newStatus: string, rejectionReason?: string, rejectionDetails?: any) => {
    try {
      setUpdatingId(id);
      const client = apiClient();
      if (!client) {
        router.push('/login');
        return;
      }
      const payload: any = { status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) {
        payload.rejection_reason = rejectionReason;
        payload.rejection_details = rejectionDetails;
      } else if (newStatus !== 'rejected') {
        payload.rejection_reason = null;
        payload.rejection_details = null;
      }
      const res = await client.patch(`/applicant-submissions/${id}/status`, payload);
      if (res.data.success) {
        setApplications(prev => prev.map(app => 
          app.id === id ? { 
            ...app, 
            status: newStatus,
            rejection_reason: newStatus === 'rejected' ? rejectionReason : undefined,
            rejection_details: newStatus === 'rejected' ? rejectionDetails : undefined
          } : app
        ));
        setEditingStatus(null);
        setShowRejectionModal({ show: false, application: null });
        setSuccess(newStatus === 'rejected' ? 'Application rejected with reason recorded' : 'Status updated successfully');
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

  const openRejectionModal = (application: ApplicantSubmission) => {
    setShowRejectionModal({ show: true, application });
  };

  const submitRejection = (reason: string, customReason?: string) => {
    if (showRejectionModal.application) {
      const finalReason = reason === 'other' && customReason ? customReason : 
        REJECTION_REASONS.find(r => r.value === reason)?.label || reason;
      const rejectionDetails = {
        reason: finalReason,
        factors: getRejectionFactors(reason),
        recommendation: getRejectionRecommendation(reason),
        reviewed_by: getUser()?.first_name || 'Committee Member',
        reviewed_at: new Date().toISOString()
      };
      updateStatus(showRejectionModal.application.id, 'rejected', finalReason, rejectionDetails);
    }
  };

  const autoAnalyzeApplication = async (application: ApplicantSubmission) => {
    if (isAnalyzingRef.current) return;
    if (analysisInProgress.includes(application.id)) return;
    if (application.ml_prediction) return;
    isAnalyzingRef.current = true;
    try {
      console.log(`Auto-analyzing application #${application.id}: ${application.applicant_name}`);
      const client = apiClient();
      if (!client) return;
      const prediction = await mlService.predictApplication(application);
      await client.patch(`/applicant-submissions/${application.id}/ml-prediction`, {
        ml_prediction: prediction,
        last_analyzed_at: new Date().toISOString()
      });
      setApplications(prev => prev.map(app => 
        app.id === application.id ? { 
          ...app, 
          ml_prediction: prediction,
          last_analyzed_at: new Date().toISOString(),
          priority_level: calculatePriority({ ...app, ml_prediction: prediction })
        } : app
      ));
      if (prediction.confidence > 0.75) {
        let newStatus = '';
        if (prediction.decision === 'approve') newStatus = 'approved';
        else if (prediction.decision === 'reject') newStatus = 'rejected';
        if (newStatus) {
          const rejectionReason = newStatus === 'rejected' ? 'Auto-rejected by ML system due to low eligibility score' : undefined;
          await client.patch(`/applicant-submissions/${application.id}/status`, { 
            status: newStatus,
            auto_processed: true,
            rejection_reason: rejectionReason
          });
          setApplications(prev => prev.map(app => 
            app.id === application.id ? { 
              ...app, 
              status: newStatus, 
              auto_processed: true,
              rejection_reason: newStatus === 'rejected' ? rejectionReason : undefined
            } : app
          ));
        }
      }
    } catch (err) {
      console.error(`Failed to auto-analyze application #${application.id}:`, err);
    } finally {
      isAnalyzingRef.current = false;
    }
  };

  const checkAndAnalyzeNewApplications = useCallback(async () => {
    if (isPolling) return;
    try {
      const currentApplications = await fetchApplications();
      if (!currentApplications || currentApplications.length === 0) return;
      const unanalyzedApps = currentApplications.filter(app => 
        (app.status === 'submitted' || app.status === 'pending') && !app.ml_prediction
      );
      if (unanalyzedApps.length > 0) {
        for (const app of unanalyzedApps) {
          await autoAnalyzeApplication(app);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        await fetchApplications();
      }
    } catch (err) {
      console.error('Error checking for new applications:', err);
    }
  }, [fetchApplications, autoAnalyzeApplication]);

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(() => {
      checkAndAnalyzeNewApplications();
    }, 10000);
  }, [checkAndAnalyzeNewApplications]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const autoProcessOnLoad = useCallback(async () => {
    try {
      setAutoProcessing(true);
      const token = getToken();
      if (!token) return;
      const pendingApplications = applications.filter(app => 
        (app.status === 'submitted' || app.status === 'pending') && 
        !app.auto_processed && app.ml_prediction
      );
      if (pendingApplications.length === 0) return;
      let processedCount = 0;
      const client = apiClient();
      if (!client) return;
      for (const application of pendingApplications) {
        const prediction = application.ml_prediction;
        if (prediction && prediction.confidence > 0.75) {
          let newStatus = '';
          let priorityLevel = 'Medium';
          let rejectionReason;
          if (prediction.decision === 'approve') {
            newStatus = 'approved';
            priorityLevel = prediction.confidence > 0.85 ? 'High' : 'Medium';
          } else if (prediction.decision === 'reject') {
            newStatus = 'rejected';
            priorityLevel = 'Low';
            rejectionReason = 'Auto-rejected by ML system - does not meet admission criteria';
          }
          if (newStatus) {
            await client.patch(`/applicant-submissions/${application.id}/status`, { 
              status: newStatus,
              auto_processed: true,
              priority_level: priorityLevel,
              rejection_reason: rejectionReason
            });
            processedCount++;
          }
        }
      }
      if (processedCount > 0) {
        setSuccess(`Auto-processed ${processedCount} applications based on ML confidence scores`);
        setTimeout(() => setSuccess(null), 5000);
        await fetchApplications();
      }
    } catch (err: any) {
      console.error('Auto-processing failed:', err);
    } finally {
      setAutoProcessing(false);
    }
  }, [applications, apiClient]);

  useEffect(() => {
    fetchApplications();
    startPolling();
    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (!loading && applications.length > 0 && !autoProcessing) {
      autoProcessOnLoad();
    }
  }, [loading, applications, autoProcessing, autoProcessOnLoad]);

  useEffect(() => {
    let filtered = [...applications];
    switch (mlFilter) {
      case ML_FILTER_OPTIONS.HIGH_PRIORITY:
        filtered = filtered.filter(app => app.priority_level === 'High');
        break;
      case ML_FILTER_OPTIONS.MEDIUM_PRIORITY:
        filtered = filtered.filter(app => app.priority_level === 'Medium');
        break;
      case ML_FILTER_OPTIONS.LOW_PRIORITY:
        filtered = filtered.filter(app => app.priority_level === 'Low');
        break;
      case ML_FILTER_OPTIONS.AUTO_APPROVED:
        filtered = filtered.filter(app => app.auto_processed && app.ml_prediction?.decision === 'approve');
        break;
      case ML_FILTER_OPTIONS.AUTO_REJECTED:
        filtered = filtered.filter(app => app.auto_processed && app.ml_prediction?.decision === 'reject');
        break;
      case ML_FILTER_OPTIONS.NEEDS_REVIEW:
        filtered = filtered.filter(app => !app.ml_prediction || app.ml_prediction?.decision === 'review');
        break;
      case ML_FILTER_OPTIONS.ELIGIBLE:
        filtered = filtered.filter(app => app.eligibility_verified === true);
        break;
      case ML_FILTER_OPTIONS.INELIGIBLE:
        filtered = filtered.filter(app => app.eligibility_verified === false);
        break;
      case ML_FILTER_OPTIONS.NOT_ANALYZED:
        filtered = filtered.filter(app => !app.ml_prediction);
        break;
      default: break;
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(app => app.priority_level === priorityFilter);
    }
    if (dateRange.start) {
      filtered = filtered.filter(app => new Date(app.submitted_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(app => new Date(app.submitted_at) <= new Date(dateRange.end));
    }
    setFilteredApplications(filtered);
  }, [applications, mlFilter, priorityFilter, dateRange]);

  const predictApplication = async (application: ApplicantSubmission) => {
    try {
      setProcessingId(application.id);
      setAnalysisInProgress(prev => [...prev, application.id]);
      const client = apiClient();
      if (!client) return null;
      const prediction = await mlService.predictApplication(application);
      await client.patch(`/applicant-submissions/${application.id}/ml-prediction`, {
        ml_prediction: prediction,
        last_analyzed_at: new Date().toISOString(),
        priority_level: calculatePriority({ ...application, ml_prediction: prediction })
      });
      setApplications(prev => prev.map(app => 
        app.id === application.id ? { 
          ...app, 
          ml_prediction: prediction,
          last_analyzed_at: new Date().toISOString(),
          priority_level: calculatePriority({ ...app, ml_prediction: prediction })
        } : app
      ));
      setSuccess(`ML analysis completed: ${prediction.decision.toUpperCase()} (${Math.round(prediction.confidence * 100)}% confidence)`);
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

  const startEditing = (id: number, currentStatus: string) => {
    setEditingStatus({ id, status: currentStatus });
    setError(null);
  };

  const exportApplications = () => {
    const headers = ['ID', 'Applicant Name', 'Programme (1st choice)', 'Reference', 'Status', 'Priority', 'ML Decision', 'Confidence', 'Documents Valid', 'Rejection Reason', 'Submitted Date'];
    const csvData = filteredApplications.map(app => [
      app.id,
      app.applicant_name,
      app.programme,
      app.reference_number || 'N/A',
      app.status,
      app.priority_level || 'N/A',
      app.ml_prediction?.decision || 'Not Analyzed',
      app.ml_prediction ? `${Math.round(app.ml_prediction.confidence * 100)}%` : 'N/A',
      app.documents_valid === true ? 'Valid' : app.documents_valid === false ? 'Invalid' : 'Pending',
      app.rejection_reason || 'N/A',
      new Date(app.submitted_at).toLocaleDateString()
    ]);
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return option?.label || status;
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Medium': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'Low': return <Shield className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  const handleDocumentUpdate = (appId: number, newStatus: boolean) => {
    setApplications(prev => prev.map(app =>
      app.id === appId ? { ...app, documents_valid: newStatus } : app
    ));
    setSuccess(`Document verification status updated to ${newStatus ? 'Accepted' : 'Invalid'}`);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Rejection Reason Modal Component (inline)
  const RejectionReasonModal = () => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!showRejectionModal.show || !showRejectionModal.application) return null;

    const handleSubmit = async () => {
      if (!selectedReason) {
        setError('Please select a rejection reason');
        return;
      }
      setSubmitting(true);
      try {
        await submitRejection(selectedReason, customReason);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Reject Application</h3>
                <p className="text-sm text-gray-500">
                  {showRejectionModal.application.applicant_name} - {showRejectionModal.application.programme}
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection <span className="text-red-500">*</span></label>
              <div className="space-y-2">
                {REJECTION_REASONS.map(reason => (
                  <label key={reason.value} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${selectedReason === reason.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="rejectionReason" value={reason.value} checked={selectedReason === reason.value} onChange={(e) => setSelectedReason(e.target.value)} className="mt-0.5 mr-3 text-red-600 focus:ring-red-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="text-lg">{reason.icon}</span><span className="font-medium text-gray-800">{reason.label}</span></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            {selectedReason === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Reason</label>
                <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Please provide additional details..." />
              </div>
            )}
            {selectedReason && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Rejection notice will include:</p>
                    <ul className="text-xs list-disc list-inside">
                      <li>Reason: {REJECTION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason}</li>
                      <li>Factors: {getRejectionFactors(selectedReason).join(', ')}</li>
                      <li>Recommendation: {getRejectionRecommendation(selectedReason)}</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={() => { setShowRejectionModal({ show: false, application: null }); setSelectedReason(''); setCustomReason(''); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleSubmit} disabled={!selectedReason || submitting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
              Confirm Rejection
            </button>
          </div>
        </div>
      </div>
    );
  };

  const stats = {
    total: applications.length,
    highPriority: applications.filter(a => a.priority_level === 'High').length,
    mediumPriority: applications.filter(a => a.priority_level === 'Medium').length,
    lowPriority: applications.filter(a => a.priority_level === 'Low').length,
    approved: applications.filter(a => a.status === 'approved' || a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    pending: applications.filter(a => a.status === 'pending' || a.status === 'submitted').length,
    analyzed: applications.filter(a => a.ml_prediction).length,
    autoProcessed: applications.filter(a => a.auto_processed).length,
    avgConfidence: applications.filter(a => a.ml_prediction).reduce((acc, a) => acc + (a.ml_prediction?.confidence || 0), 0) / (applications.filter(a => a.ml_prediction).length || 1)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-3 sm:p-6">
      <RejectionReasonModal />
      <DocumentVerificationModal
        isOpen={showDocModal.show}
        applicationId={showDocModal.applicationId}
        applicantName={showDocModal.applicantName}
        currentStatus={showDocModal.currentStatus}
        onClose={() => setShowDocModal({ show: false, applicationId: 0, applicantName: '', currentStatus: null })}
        onUpdate={(newStatus) => handleDocumentUpdate(showDocModal.applicationId, newStatus)}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Applicant Submissions</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                ML-Powered Application Management Dashboard
                {isPolling && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Sparkles className="w-3 h-3 animate-pulse mr-1" />
                    Auto-analyzing new applications...
                  </span>
                )}
                {autoProcessing && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    Auto-processing...
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={exportApplications} className="inline-flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"> <Download className="w-4 h-4" /><span>Export CSV</span> </button>
              <button onClick={fetchApplications} disabled={loading} className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"> <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /><span>Refresh</span> </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mt-6">
            <div className="bg-white rounded-lg shadow-sm p-3 text-center border border-gray-100"><div className="text-2xl font-bold text-gray-900">{stats.total}</div><div className="text-xs text-gray-500">Total</div></div>
            <div className="bg-red-50 rounded-lg shadow-sm p-3 text-center"><div className="text-2xl font-bold text-red-700">{stats.highPriority}</div><div className="text-xs text-red-600">High Priority</div></div>
            <div className="bg-yellow-50 rounded-lg shadow-sm p-3 text-center"><div className="text-2xl font-bold text-yellow-700">{stats.mediumPriority}</div><div className="text-xs text-yellow-600">Medium Priority</div></div>
            <div className="bg-green-50 rounded-lg shadow-sm p-3 text-center"><div className="text-2xl font-bold text-green-700">{stats.lowPriority}</div><div className="text-xs text-green-600">Low Priority</div></div>
            <div className="bg-emerald-50 rounded-lg shadow-sm p-3 text-center"><div className="text-2xl font-bold text-emerald-700">{stats.approved}</div><div className="text-xs text-emerald-600">Approved</div></div>
            <div className="bg-red-50 rounded-lg shadow-sm p-3 text-center"><div className="text-2xl font-bold text-red-700">{stats.rejected}</div><div className="text-xs text-red-600">Rejected</div></div>
            <div className="bg-purple-50 rounded-lg shadow-sm p-3 text-center"><div className="text-2xl font-bold text-purple-700">{Math.round(stats.avgConfidence * 100)}%</div><div className="text-xs text-purple-600">Avg. Confidence</div></div>
            <div className="bg-orange-50 rounded-lg shadow-sm p-3 text-center"><div className="text-2xl font-bold text-orange-700">{stats.pending}</div><div className="text-xs text-orange-600">Pending</div></div>
            <div className="bg-blue-50 rounded-lg shadow-sm p-3 text-center"><div className="text-2xl font-bold text-blue-700">{stats.analyzed}</div><div className="text-xs text-blue-600">ML Analyzed</div></div>
          </div>

          {/* ML Actions Bar */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setShowMlModal({ show: true, application: null })} className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg"> <Brain className="w-4 h-4" /><span>ML Analytics Dashboard</span> </button>
                <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"> <Filter className="w-4 h-4" /><span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span> </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select value={mlFilter} onChange={(e) => setMlFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500">
                  <option value={ML_FILTER_OPTIONS.ALL}>All Applications</option>
                  <option value={ML_FILTER_OPTIONS.HIGH_PRIORITY}>High Priority</option>
                  <option value={ML_FILTER_OPTIONS.MEDIUM_PRIORITY}>Medium Priority</option>
                  <option value={ML_FILTER_OPTIONS.LOW_PRIORITY}>Low Priority</option>
                  <option value={ML_FILTER_OPTIONS.AUTO_APPROVED}>Auto-Approved</option>
                  <option value={ML_FILTER_OPTIONS.AUTO_REJECTED}>Auto-Rejected</option>
                  <option value={ML_FILTER_OPTIONS.NEEDS_REVIEW}>Needs Review</option>
                  <option value={ML_FILTER_OPTIONS.NOT_ANALYZED}>Not Analyzed</option>
                </select>
              </div>
            </div>
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="all">All Priorities</option><option value="High">High Priority</option><option value="Medium">Medium Priority</option><option value="Low">Low Priority</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                  <div className="flex items-end"><button onClick={() => { setPriorityFilter('all'); setDateRange({ start: '', end: '' }); }} className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">Clear Filters</button></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {success && (<div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-2"><Check className="h-5 w-5 text-green-400" /><p className="text-green-700 text-sm font-medium">{success}</p></div><button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button></div></div>)}
        {error && (<div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-2"><X className="h-5 w-5 text-red-400" /><p className="text-red-700 text-sm font-medium">{error}</p></div><button onClick={() => setError(null)}><X className="w-4 h-4" /></button></div></div>)}

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div><p className="text-gray-600">Loading submissions...</p></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[1600px]">
                <thead>
                  <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Applicant</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Programme (1st choice)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Reference</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Documents</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ML Analysis</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Submitted</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplications.map((app, idx) => (
                    <tr key={app.id} className="hover:bg-green-50/50">
                      <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-xs font-medium">{idx+1}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center space-x-2"><div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-green-600" /></div><div><span className="text-sm font-medium text-gray-900">{app.applicant_name}</span>{app.rejection_reason && (<div className="flex items-center gap-1 mt-0.5"><MessageCircle className="w-3 h-3 text-red-400" /><span className="text-xs text-red-500 truncate max-w-[150px]">{app.rejection_reason}</span></div>)}</div></div></td>
                      {/* Programme column with indicator for 6 choices */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-700 line-clamp-2">
                              {app.programme}
                            </span>
                            <div className="group relative inline-block">
                              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full ml-1 cursor-help">
                                +5 more
                              </span>
                              <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-md p-2 mt-1 w-64 shadow-lg">
                                <p className="font-medium mb-1">Programme Preferences:</p>
                                <ul className="space-y-0.5">
                                  <li className="truncate">1. {app.programme}</li>
                                  <li className="text-gray-300">2. – 6. (view in details)</li>
                                </ul>
                                <p className="text-gray-400 text-[10px] mt-1">Click "View" for full list</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{app.reference_number || 'N/A'}</code></td>
                      <td className="px-4 py-3 whitespace-nowrap">{app.priority_level && (<div className="flex items-center space-x-1">{getPriorityIcon(app.priority_level)}<span className={`text-xs font-medium px-2 py-1 rounded-full ${PRIORITY_OPTIONS.find(p=>p.value===app.priority_level)?.color}`}>{app.priority_level}</span></div>)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{editingStatus?.id === app.id ? (<div className="flex items-center space-x-2"><select value={editingStatus.status} onChange={(e)=>setEditingStatus({...editingStatus, status:e.target.value})} className="text-sm border rounded px-2 py-1" disabled={updatingId===app.id}>{STATUS_OPTIONS.map(opt=><option key={opt.value} value={opt.value}>{opt.label}</option>)}</select><button onClick={()=>updateStatus(app.id, editingStatus.status)} disabled={updatingId===app.id} className="p-1 text-green-600"><Check className="w-4 h-4"/></button><button onClick={()=>setEditingStatus(null)} className="p-1 text-red-600"><X className="w-4 h-4"/></button></div>) : (<div className="flex items-center space-x-2"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>{formatStatus(app.status)}</span><button onClick={()=>startEditing(app.id, app.status)} className="p-1 text-gray-400 hover:text-gray-600"><Edit className="w-3 h-3"/></button>{app.status !== 'rejected' && app.status !== 'approved' && (<button onClick={()=>openRejectionModal(app)} className="p-1 text-red-400 hover:text-red-600" title="Reject Application"><ThumbsDown className="w-3 h-3"/></button>)}</div>)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => setShowDocModal({ show: true, applicationId: app.id, applicantName: app.applicant_name, currentStatus: app.documents_valid ?? null })} className="inline-flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" title="Verify Documents">
                          <FileCheck className="w-4 h-4 text-gray-600" />
                          {app.documents_valid === true ? 'Valid' : app.documents_valid === false ? 'Invalid' : 'Pending'}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{app.ml_prediction ? (<div className="space-y-1"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${app.ml_prediction.decision==='approve'?'bg-green-100 text-green-800':app.ml_prediction.decision==='reject'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800'}`}>{app.ml_prediction.decision.toUpperCase()} ({Math.round(app.ml_prediction.confidence*100)}%)</span></div>) : (<button onClick={()=>predictApplication(app)} disabled={analysisInProgress.includes(app.id)} className="inline-flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"><Brain className="w-3 h-3"/><span>Analyze</span></button>)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(app.submitted_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><Link href={`/commitee/applicant-submissions/${app.id}`} className="inline-flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"><Eye className="w-3 h-3"/><span>View</span></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3 p-3">
              {filteredApplications.map((app, idx) => (
                <div key={app.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3"><div className="flex items-center space-x-2"><div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-green-600"/></div><div><p className="font-medium text-gray-900">{app.applicant_name}</p><p className="text-xs text-gray-500">#{idx+1}</p></div></div>{app.priority_level && (<div className="flex items-center space-x-1">{getPriorityIcon(app.priority_level)}<span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_OPTIONS.find(p=>p.value===app.priority_level)?.color}`}>{app.priority_level}</span></div>)}</div>
                  <div className="mb-2"><p className="text-xs text-gray-500">Programme (1st choice)</p><p className="text-sm text-gray-700">{app.programme}</p><div className="text-xs text-green-600 mt-1">+5 additional preferences selected</div></div>
                  <div className="mb-2"><p className="text-xs text-gray-500">Reference</p><code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{app.reference_number || 'N/A'}</code></div>
                  <div className="mb-2"><p className="text-xs text-gray-500">Status</p><div className="flex items-center gap-2 flex-wrap"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>{formatStatus(app.status)}</span>{app.status !== 'rejected' && app.status !== 'approved' && (<button onClick={()=>openRejectionModal(app)} className="text-red-500 text-xs flex items-center gap-1"><ThumbsDown className="w-3 h-3"/> Reject</button>)}</div></div>
                  <div className="mb-2"><p className="text-xs text-gray-500">Documents</p><button onClick={()=>setShowDocModal({show:true, applicationId:app.id, applicantName:app.applicant_name, currentStatus:app.documents_valid??null})} className="inline-flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded"><FileCheck className="w-4 h-4"/>{app.documents_valid===true?'Valid':app.documents_valid===false?'Invalid':'Pending'}</button></div>
                  {app.status === 'rejected' && app.rejection_reason && (<div className="mb-2 p-2 bg-red-50 rounded-lg"><p className="text-xs text-red-600 font-medium">Rejection Reason:</p><p className="text-xs text-red-700">{app.rejection_reason}</p></div>)}
                  <div className="mb-2"><p className="text-xs text-gray-500">ML Analysis</p>{app.ml_prediction ? (<span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${app.ml_prediction.decision==='approve'?'bg-green-100 text-green-800':app.ml_prediction.decision==='reject'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800'}`}>{app.ml_prediction.decision.toUpperCase()} ({Math.round(app.ml_prediction.confidence*100)}%)</span>) : (<button onClick={()=>predictApplication(app)} className="inline-flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"><Brain className="w-3 h-3"/><span>Analyze</span></button>)}</div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t"><span className="text-xs text-gray-500">{formatDate(app.submitted_at)}</span><Link href={`/commitee/applicant-submissions/${app.id}`} className="inline-flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"><Eye className="w-3 h-3"/><span>View</span></Link></div>
                </div>
              ))}
              {filteredApplications.length===0 && (<div className="text-center py-8 bg-white rounded-lg border"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3"/><p className="text-gray-500">No applications found</p></div>)}
            </div>

            {/* Footer */}
            {filteredApplications.length > 0 && (<div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center"><p className="text-sm text-gray-600">Showing {filteredApplications.length} of {applications.length} applications</p><div className="text-sm text-gray-500">{stats.rejected>0 && (<span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3 text-red-500"/>{stats.rejected} rejected</span>)}</div></div>)}
          </div>
        )}
      </div>

      {/* ML Analytics Modal */}
      {showMlModal.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center"><div className="flex items-center space-x-3"><div className="p-2 bg-purple-100 rounded-lg"><Brain className="w-6 h-6 text-purple-600"/></div><h2 className="text-2xl font-bold text-gray-900">ML Analytics Dashboard</h2></div><button onClick={()=>setShowMlModal({show:false, application:null})} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button></div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"><div className="bg-blue-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-blue-700">{stats.total}</div><div className="text-sm text-blue-600">Total Applications</div></div><div className="bg-green-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-green-700">{stats.analyzed}</div><div className="text-sm text-green-600">Analyzed by ML</div></div><div className="bg-purple-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-purple-700">{stats.autoProcessed}</div><div className="text-sm text-purple-600">Auto-Processed</div></div><div className="bg-yellow-50 p-4 rounded-lg text-center"><div className="text-2xl font-bold text-yellow-700">{Math.round(stats.avgConfidence*100)}%</div><div className="text-sm text-yellow-600">Avg. Confidence</div></div></div>
              <div className="border-t pt-6 mb-6"><h3 className="font-semibold text-gray-900 mb-4 text-lg">Rejection Analysis</h3><div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><div className="bg-red-50 p-4 rounded-lg text-center"><div className="text-3xl font-bold text-red-700">{stats.rejected}</div><div className="text-sm text-red-600">Total Rejected</div></div><div className="bg-orange-50 p-4 rounded-lg text-center col-span-2 lg:col-span-3"><div className="text-sm text-orange-700">{stats.rejected>0?`${Math.round((stats.rejected/stats.total)*100)}% of total applications were rejected`:'No rejected applications'}</div></div></div></div>
              <div className="border-t pt-6"><h3 className="font-semibold text-gray-900 mb-4 text-lg">Recent ML Predictions</h3><div className="space-y-3 max-h-96 overflow-y-auto">{applications.filter(a=>a.ml_prediction).slice(0,10).map(app=>(<div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><div><p className="font-medium text-gray-900">{app.applicant_name}</p><p className="text-sm text-gray-600">{app.programme} (+5 other choices)</p></div><div className="text-right"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${app.ml_prediction!.decision==='approve'?'bg-green-100 text-green-800':app.ml_prediction!.decision==='reject'?'bg-red-100 text-red-800':'bg-yellow-100 text-yellow-800'}`}>{app.ml_prediction!.decision.toUpperCase()}</span><p className="text-xs text-gray-500 mt-1">Confidence: {Math.round(app.ml_prediction!.confidence*100)}%</p></div></div>))}</div></div>
              <div className="border-t pt-6 mt-6"><div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200"><div className="flex items-center space-x-2 mb-2"><Sparkles className="w-5 h-5 text-green-600 animate-pulse"/><h4 className="font-semibold text-green-800">Real-time Auto-Analysis Active</h4></div><p className="text-sm text-green-700">New applications are automatically analyzed by the ML model as they come in. {isPolling && <span className="block mt-1 text-xs">Polling every 10 seconds for new submissions...</span>}</p></div></div>
              <div className="border-t pt-6 mt-6"><div className="bg-blue-50 p-4 rounded-lg"><div className="flex items-center space-x-2 mb-2"><Shield className="w-5 h-5 text-blue-600"/><h4 className="font-semibold text-blue-800">How ML Predictions Work</h4></div><p className="text-sm text-blue-700">The ML model analyzes academic qualifications, MSCE results, previous institution performance, and all 6 programme preferences to predict success probability. High confidence (&gt;=75%) applications may be auto-processed, while others require manual review by the committee.</p></div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}