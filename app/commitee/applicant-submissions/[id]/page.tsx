// app/appadmin/applicant-submissions/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  ArrowLeft, User, Mail, Phone, Calendar, FileText, 
  CheckCircle, XCircle, AlertCircle, Clock, Award, 
  Brain, Zap, Shield, TrendingUp, Download, Eye,
  Building2, MapPin, CreditCard, Receipt, BookOpen,
  GraduationCap, Briefcase, Users, Heart, Globe,
  ChevronDown, ChevronUp, Printer, Share2, Check, X,
  Send, RefreshCw, AlertTriangle, ThumbsUp, ThumbsDown
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

interface ApplicantDetails {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  home_district: string;
  physical_address: string;
}

interface ProgrammeDetails {
  id: number;
  name: string;
  code: string;
  department: string;
  school: string;
  duration: string;
  category: string;
  programme_type: string;
  study_mode: string;
}

interface ApplicationData {
  id: number;
  user_id: number;
  applicant_name: string;
  programme_id: number;
  programme: ProgrammeDetails;
  status: string;
  reference_number: string;
  submitted_at: string;
  updated_at: string;
  ml_prediction?: {
    decision: 'approve' | 'reject' | 'review';
    probability: number;
    confidence: number;
    factors: Array<{ factor: string; impact: 'positive' | 'negative' }>;
    recommendation: string;
    priority_level: 'High' | 'Medium' | 'Low';
  };
  auto_processed?: boolean;
  eligibility_verified?: boolean;
  documents_valid?: boolean;
  payment_verified?: boolean;
  submitted_by: {
    id: number;
    name: string;
    email: string;
  };
}

interface AcademicRecord {
  id: number;
  qualification: string;
  institution: string;
  subject: string;
  grade: string;
  year: string;
}

interface NextOfKin {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  relationship: string;
  mobile1: string;
  mobile2?: string;
  email?: string;
  address?: string;
}

interface Document {
  id: number;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
  verified: boolean;
  verified_at?: string;
}

interface WorkHistory {
  id: number;
  organization: string;
  job_title: string;
  start_date: string;
  end_date?: string;
  currently_working: boolean;
  responsibilities: string;
}

interface Referee {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone_number: string;
  referee_type: string;
}

interface Publication {
  id: number;
  title: string;
  journal: string;
  year: string;
  link?: string;
  authors?: string;
}

interface Essay {
  id: number;
  motivation: string;
  research_concept_note?: string;
}

interface PaymentInfo {
  reference_number: string;
  amount: number;
  status: string;
  submitted_at: string;
  verified_at?: string;
  deposit_slip_url?: string;
}

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-purple-100 text-purple-800' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
];

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export default function ApplicantSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params?.id as string;

  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [applicantDetails, setApplicantDetails] = useState<ApplicantDetails | null>(null);
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [nextOfKin, setNextOfKin] = useState<NextOfKin[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [essay, setEssay] = useState<Essay | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (submissionId) {
      fetchAllData();
    }
  }, [submissionId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const client = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      // Fetch application details
      const appRes = await client.get(`/applicant-submissions/${submissionId}`);
      const appData = appRes.data.data || appRes.data;
      setApplication(appData);
      setSelectedStatus(appData.status);

      // Fetch applicant details
      if (appData.user_id) {
        const userRes = await client.get(`/applicants/${appData.user_id}`);
        const userData = userRes.data.data || userRes.data;
        
        const personalDetailsRes = await client.get(`/personal-details/`);
        const personalData = personalDetailsRes.data.data || {};

        setApplicantDetails({
          id: userData.id,
          first_name: userData.first_name || personalData.first_name || '',
          last_name: userData.last_name || personalData.last_name || '',
          email: userData.email || '',
          phone: personalData.phone || '',
          gender: personalData.gender || '',
          date_of_birth: personalData.date_of_birth || '',
          nationality: personalData.nationality || '',
          national_id: personalData.national_id || '',
          home_district: personalData.home_district || '',
          physical_address: personalData.physical_address || '',
        });
      }

      // Fetch academic records
      const subjectsRes = await client.get(`/subject-records/`);
      const subjectsData = subjectsRes.data.data || subjectsRes.data;
      setAcademicRecords(Array.isArray(subjectsData) ? subjectsData : []);

      // Fetch next of kin
      const kinRes = await client.get(`/next-of-kin/`);
      const kinData = kinRes.data.data || kinRes.data;
      setNextOfKin(Array.isArray(kinData) ? kinData : []);

      // Fetch documents
      const docsRes = await client.get(`/documents/`);
      const docsData = docsRes.data.data || docsRes.data;
      setDocuments(Array.isArray(docsData) ? docsData : []);

      // Fetch work history
      const workRes = await client.get(`/work-history/`);
      const workData = workRes.data.data || workRes.data;
      setWorkHistory(Array.isArray(workData) ? workData : []);

      // Fetch referees
      const refereeRes = await client.get(`/referees/`);
      const refereeData = refereeRes.data.data || refereeRes.data;
      setReferees(Array.isArray(refereeData) ? refereeData : []);

      // Fetch publications
      const pubRes = await client.get(`/publications/`);
      const pubData = pubRes.data.data || pubRes.data;
      setPublications(Array.isArray(pubData) ? pubData : []);

      // Fetch essay
      const essayRes = await client.get(`/essays/`);
      const essayData = essayRes.data.data || essayRes.data;
      setEssay(essayData);

      // Fetch payment info
      const paymentRes = await client.get(`/application-fees/`);
      const paymentData = paymentRes.data.data || paymentRes.data;
      setPaymentInfo(paymentData);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load application data');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const client = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const res = await client.patch(`/applicant-submissions/${submissionId}/status`, { 
        status: newStatus,
        updated_by: 'committee' 
      });

      if (res.data.success) {
        setApplication(prev => prev ? { ...prev, status: newStatus } : null);
        setSelectedStatus(newStatus);
        setSuccess(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(res.data.error || 'Status update failed');
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const runMLPrediction = async () => {
    try {
      setUpdating(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const client = axios.create({
        baseURL: API_BASE_URL,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const res = await client.post(`/ml/predict-submission/${submissionId}`);
      
      if (res.data.success) {
        setApplication(prev => prev ? { 
          ...prev, 
          ml_prediction: res.data.prediction,
          last_analyzed_at: new Date().toISOString()
        } : null);
        setShowAIModal(true);
        setSuccess('ML prediction completed successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(res.data.error || 'ML prediction failed');
      }
    } catch (err: any) {
      console.error('Error running ML prediction:', err);
      setError(err.response?.data?.message || 'Failed to get ML prediction');
    } finally {
      setUpdating(false);
    }
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Application</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/appadmin/applications')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/appadmin/applications')}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Applications</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={runMLPrediction}
                disabled={updating}
                className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Brain className="w-4 h-4" />
                <span>Run ML Analysis</span>
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-green-700">{success}</p>
              </div>
              <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Application Overview
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500">Reference Number</label>
                    <p className="font-mono text-lg font-semibold text-gray-900">
                      {application?.reference_number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Submission Date</label>
                    <p className="text-gray-900">{formatDate(application?.submitted_at || '')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <div className="flex items-center space-x-3 mt-1">
                      <select
                        value={selectedStatus}
                        onChange={(e) => updateStatus(e.target.value)}
                        disabled={updating}
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedStatus)} focus:outline-none focus:ring-2 focus:ring-green-500`}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {updating && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{formatDate(application?.updated_at || '')}</p>
                  </div>
                </div>

                {/* Programme Details */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Programme Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{application?.programme?.name}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Code:</span>
                        <p className="text-gray-800">{application?.programme?.code || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Department:</span>
                        <p className="text-gray-800">{application?.programme?.department || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">School:</span>
                        <p className="text-gray-800">{application?.programme?.school || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <p className="text-gray-800">{application?.programme?.duration || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Study Mode:</span>
                        <p className="text-gray-800 capitalize">{application?.programme?.study_mode || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Programme Type:</span>
                        <p className="text-gray-800 capitalize">{application?.programme?.programme_type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Card */}
            {applicantDetails && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Full Name</label>
                      <p className="font-medium text-gray-900">
                        {applicantDetails.first_name} {applicantDetails.last_name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="text-gray-900">{applicantDetails.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="text-gray-900">{applicantDetails.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Gender</label>
                      <p className="text-gray-900">{applicantDetails.gender || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Date of Birth</label>
                      <p className="text-gray-900">{applicantDetails.date_of_birth || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Nationality</label>
                      <p className="text-gray-900">{applicantDetails.nationality || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">National ID</label>
                      <p className="text-gray-900">{applicantDetails.national_id || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Home District</label>
                      <p className="text-gray-900">{applicantDetails.home_district || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-500">Physical Address</label>
                      <p className="text-gray-900">{applicantDetails.physical_address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Academic Records Card */}
            {academicRecords.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Academic Records
                  </h2>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Subject</th>
                          <th className="px-4 py-2 text-left">Grade</th>
                          <th className="px-4 py-2 text-left">Year</th>
                          <th className="px-4 py-2 text-left">Qualification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {academicRecords.map((record, idx) => (
                          <tr key={record.id || idx} className="border-t border-gray-100">
                            <td className="px-4 py-2 font-medium">{record.subject}</td>
                            <td className="px-4 py-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                {record.grade}
                              </span>
                            </td>
                            <td className="px-4 py-2">{record.year}</td>
                            <td className="px-4 py-2 text-gray-500">{record.qualification}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Card */}
            {documents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Uploaded Documents
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {documents.slice(0, showAllDocs ? documents.length : 5).map((doc, idx) => (
                      <div key={doc.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-800">{doc.name}</p>
                            <p className="text-xs text-gray-500">Uploaded: {formatDate(doc.uploaded_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.verified ? (
                            <span className="inline-flex items-center text-xs text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs text-yellow-600">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          )}
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {documents.length > 5 && (
                      <button
                        onClick={() => setShowAllDocs(!showAllDocs)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 mt-2"
                      >
                        {showAllDocs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showAllDocs ? 'Show Less' : `Show ${documents.length - 5} More Documents`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI & Status */}
          <div className="space-y-6">
            {/* ML Prediction Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Prediction
                </h2>
              </div>
              <div className="p-6">
                {application?.ml_prediction ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                        application.ml_prediction.decision === 'approve' 
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : application.ml_prediction.decision === 'reject'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {application.ml_prediction.decision === 'approve' && <ThumbsUp className="w-4 h-4 mr-2" />}
                        {application.ml_prediction.decision === 'reject' && <ThumbsDown className="w-4 h-4 mr-2" />}
                        {application.ml_prediction.decision === 'review' && <AlertCircle className="w-4 h-4 mr-2" />}
                        {application.ml_prediction.decision.toUpperCase()}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Confidence Score</span>
                        <span className="font-semibold">{Math.round(application.ml_prediction.confidence * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            application.ml_prediction.confidence > 0.7 ? 'bg-green-500' :
                            application.ml_prediction.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${application.ml_prediction.confidence * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Success Probability</span>
                        <span className="font-semibold">{Math.round(application.ml_prediction.probability * 100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${application.ml_prediction.probability * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-600">Priority Level</span>
                      <div className="mt-1">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(application.ml_prediction.priority_level)}`}>
                          {application.ml_prediction.priority_level} Priority
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{application.ml_prediction.recommendation}</p>
                    </div>

                    {application.ml_prediction.factors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Factors</h4>
                        <ul className="space-y-1">
                          {application.ml_prediction.factors.map((factor, idx) => (
                            <li key={idx} className="flex items-center text-sm">
                              {factor.impact === 'positive' ? (
                                <TrendingUp className="w-3 h-3 text-green-500 mr-2" />
                              ) : (
                                <TrendingUp className="w-3 h-3 text-red-500 mr-2 transform rotate-180" />
                              )}
                              <span className="text-gray-600">{factor.factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={runMLPrediction}
                        disabled={updating}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
                        Re-run Analysis
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No AI prediction available</p>
                    <button
                      onClick={runMLPrediction}
                      disabled={updating}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Analyze with AI
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Verification Status
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Eligibility</span>
                  {application?.eligibility_verified ? (
                    <span className="text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Verified</span>
                  ) : (
                    <span className="text-yellow-600 flex items-center"><Clock className="w-4 h-4 mr-1" /> Pending</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Documents</span>
                  {application?.documents_valid ? (
                    <span className="text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Valid</span>
                  ) : (
                    <span className="text-yellow-600 flex items-center"><Clock className="w-4 h-4 mr-1" /> Under Review</span>
                  )}
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Payment</span>
                  {paymentInfo?.status === 'verified' ? (
                    <span className="text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> Verified</span>
                  ) : paymentInfo?.status === 'pending' ? (
                    <span className="text-yellow-600 flex items-center"><Clock className="w-4 h-4 mr-1" /> Pending</span>
                  ) : (
                    <span className="text-red-600 flex items-center"><XCircle className="w-4 h-4 mr-1" /> Not Submitted</span>
                  )}
                </div>
                {paymentInfo && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="text-gray-600">Payment Reference: {paymentInfo.reference_number}</p>
                    <p className="text-gray-600">Amount: MWK {paymentInfo.amount?.toLocaleString()}</p>
                    {paymentInfo.verified_at && (
                      <p className="text-gray-600">Verified: {formatDate(paymentInfo.verified_at)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => window.open(`mailto:${applicantDetails?.email}`, '_blank')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button
                  onClick={() => updateStatus('approved')}
                  disabled={updating || application?.status === 'approved'}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Application
                </button>
                <button
                  onClick={() => updateStatus('rejected')}
                  disabled={updating || application?.status === 'rejected'}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </button>
              </div>
            </div>

            {/* Next of Kin Card */}
            {nextOfKin.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-pink-600 to-pink-700 px-6 py-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Next of Kin
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {nextOfKin.map((kin, idx) => (
                    <div key={kin.id || idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{kin.first_name} {kin.last_name}</p>
                          <p className="text-sm text-gray-500">{kin.relationship}</p>
                        </div>
                        <span className="text-xs text-gray-500">{kin.title}</span>
                      </div>
                      <div className="mt-2 text-sm">
                        <p className="text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3" /> {kin.email || 'N/A'}</p>
                        <p className="text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {kin.mobile1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Sections (Work, Referees, etc.) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Work History */}
          {workHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Work Experience
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {workHistory.map((work, idx) => (
                  <div key={work.id || idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{work.job_title}</p>
                    <p className="text-gray-600 text-sm">{work.organization}</p>
                    <p className="text-xs text-gray-500">
                      {work.start_date} - {work.currently_working ? 'Present' : work.end_date}
                    </p>
                    {work.responsibilities && (
                      <p className="text-sm text-gray-600 mt-2">{work.responsibilities}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Referees */}
          {referees.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Referees
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {referees.map((ref, idx) => (
                  <div key={ref.id || idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">
                      {ref.title} {ref.first_name} {ref.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{ref.referee_type}</p>
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3" /> {ref.email}</p>
                      <p className="text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {ref.phone_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publications */}
          {publications.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Publications
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {publications.map((pub, idx) => (
                  <div key={pub.id || idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-800">{pub.title}</p>
                    <p className="text-sm text-gray-600">{pub.journal} ({pub.year})</p>
                    {pub.authors && <p className="text-xs text-gray-500">Authors: {pub.authors}</p>}
                    {pub.link && (
                      <a href={pub.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                        View Publication
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivation Essay */}
          {essay && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Motivation Essay
                </h2>
              </div>
              <div className="p-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{essay.motivation}</p>
                  {essay.research_concept_note && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Research Concept Note</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{essay.research_concept_note}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAIModal && application?.ml_prediction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Analysis Complete
                </h2>
                <button onClick={() => setShowAIModal(false)} className="text-white hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  application.ml_prediction.decision === 'approve' 
                    ? 'bg-green-100 text-green-800'
                    : application.ml_prediction.decision === 'reject'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {application.ml_prediction.decision.toUpperCase()} Recommendation
                </div>
              </div>
              <p className="text-gray-700 text-center mb-6">{application.ml_prediction.recommendation}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const decision = application.ml_prediction?.decision;
                    if (decision === 'approve') updateStatus('approved');
                    if (decision === 'reject') updateStatus('rejected');
                    setShowAIModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Apply Recommendation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}