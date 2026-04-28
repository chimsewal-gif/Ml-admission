'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, BookOpen,
  FileText, CheckCircle, XCircle, Clock, Award, Brain,
  TrendingUp, Shield, AlertTriangle, Star, Download, Printer,
  ExternalLink, GraduationCap, Building2, IdCard, Home,
  ChevronRight, Loader2, Send, MessageSquare, ThumbsUp, ThumbsDown,
  Users, Briefcase, X
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface ApplicantDetails {
  id: number;
  applicant_name: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  national_id?: string;
  home_district?: string;
  physical_address?: string;
  programme: string;
  status: string;
  reference_number: string;
  submitted_at: string;
  ml_prediction?: {
    decision: string;
    confidence: number;
    probability: number;
    priority: string;
    factors: any;
    recommendation: string;
  };
  documents?: {
    msce?: string;
    id_card?: string;
    payment_proof?: string;
  };
  next_of_kin?: Array<{
    id: number;
    title: string;
    first_name: string;
    last_name: string;
    relationship: string;
    mobile1: string;
    email?: string;
    address?: string;
  }>;
  subject_records?: Array<{
    id: number;
    subject: string;
    grade: string;
    year: string;
    qualification: string;
  }>;
  teaching_subjects?: Array<{
    id: number;
    subject_name: string;
    teaching_level: string;
    is_major: boolean;
  }>;
  work_history?: Array<{
    id: number;
    organization: string;
    job_title: string;
    start_date: string;
    end_date?: string;
    currently_working: boolean;
  }>;
  education?: Array<{
    id: number;
    qualification_type: string;
    institution: string;
    start_date: string;
    end_date?: string;
  }>;
}

export default function CommitteeApplicantDetail() {
  const router = useRouter();
  const params = useParams();
  const applicantId = params.id as string;
  
  const [applicant, setApplicant] = useState<ApplicantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comments, setComments] = useState('');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'academics' | 'experience'>('overview');

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchApplicantDetails = async () => {
    const token = getToken();
    if (!token) {
      setError('Please login to view applicant details');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/${applicantId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return;
      }

      if (response.status === 404) {
        setError('Applicant not found');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setApplicant(data.data);
        setSelectedStatus(data.data.status);
      } else {
        setError(data.message || 'Failed to fetch applicant details');
      }
    } catch (error) {
      console.error('Error fetching applicant details:', error);
      setError('Unable to load applicant details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicantStatus = async () => {
    const token = getToken();
    if (!token) return;

    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/${applicantId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: selectedStatus,
          comments: comments 
        }),
      });

      if (response.ok) {
        setShowCommentsModal(false);
        setComments('');
        fetchApplicantDetails();
      } else {
        const errorData = await response.json();
        console.error('Status update failed:', errorData);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>;
      case 'under_review':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Under Review</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><TrendingUp className="w-3 h-3 mr-1" /> High Priority</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Medium Priority</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Low Priority</span>;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (applicantId) {
      fetchApplicantDetails();
    }
  }, [applicantId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading applicant details...</p>
        </div>
      </div>
    );
  }

  if (error || !applicant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'Applicant not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Evaluations
          </button>
          
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{applicant.applicant_name}</h1>
                {getStatusBadge(applicant.status)}
                {applicant.ml_prediction?.priority && getPriorityBadge(applicant.ml_prediction.priority)}
              </div>
              <p className="text-gray-500 mt-1">Reference: {applicant.reference_number}</p>
              <p className="text-sm text-gray-500 mt-1">Submitted: {new Date(applicant.submitted_at).toLocaleString()}</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={() => setShowCommentsModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Update Status
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('academics')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'academics'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Academics
            </button>
            <button
              onClick={() => setActiveTab('experience')}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === 'experience'
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Experience
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* ML Prediction Card */}
          {applicant.ml_prediction && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      AI Admission Prediction
                    </h3>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      ML Powered
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Success Probability</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {applicant.ml_prediction.probability}%
                      </p>
                      <div className="h-2 bg-gray-200 rounded-full mt-2">
                        <div 
                          className="h-full rounded-full bg-purple-600"
                          style={{ width: `${applicant.ml_prediction.probability}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Confidence Level</p>
                      <p className="text-2xl font-bold">
                        {(applicant.ml_prediction.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">AI Decision</p>
                      <p className="text-lg font-semibold capitalize">{applicant.ml_prediction.decision}</p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-700">{applicant.ml_prediction.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Full Name</label>
                      <p className="font-medium">{applicant.first_name} {applicant.middle_name} {applicant.last_name}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Email Address</label>
                      <p className="font-medium">{applicant.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Phone Number</label>
                      <p className="font-medium">{applicant.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Date of Birth</label>
                      <p className="font-medium">{applicant.date_of_birth || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Gender</label>
                      <p className="font-medium">{applicant.gender === 'M' ? 'Male' : applicant.gender === 'F' ? 'Female' : 'Other'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Nationality</label>
                      <p className="font-medium">{applicant.nationality || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">National ID</label>
                      <p className="font-medium">{applicant.national_id || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Home District</label>
                      <p className="font-medium">{applicant.home_district || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 uppercase">Physical Address</label>
                      <p className="font-medium">{applicant.physical_address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Programme Information */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Programme Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Selected Programme</label>
                      <p className="font-medium">{applicant.programme}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase">Application Status</label>
                      <div>{getStatusBadge(applicant.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next of Kin */}
              {applicant.next_of_kin && applicant.next_of_kin.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Next of Kin
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {applicant.next_of_kin.map((kin) => (
                        <div key={kin.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-500">Name</label>
                              <p className="font-medium">{kin.title} {kin.first_name} {kin.last_name}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Relationship</label>
                              <p className="font-medium">{kin.relationship}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Phone</label>
                              <p className="font-medium">{kin.mobile1}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Email</label>
                              <p className="font-medium">{kin.email || 'Not provided'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-xs text-gray-500">Address</label>
                              <p className="font-medium">{kin.address || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Submitted Documents
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {applicant.documents?.msce && (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">MSCE Certificate</p>
                          <p className="text-sm text-gray-500">Academic qualification document</p>
                        </div>
                      </div>
                      <a
                        href={`${API_BASE_URL.replace('/api', '')}/media/${applicant.documents.msce}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                    </div>
                  )}
                  {applicant.documents?.id_card && (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <IdCard className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">National ID / Passport</p>
                          <p className="text-sm text-gray-500">Identification document</p>
                        </div>
                      </div>
                      <a
                        href={`${API_BASE_URL.replace('/api', '')}/media/${applicant.documents.id_card}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                    </div>
                  )}
                  {applicant.documents?.payment_proof && (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Payment Proof</p>
                          <p className="text-sm text-gray-500">Application fee deposit slip</p>
                        </div>
                      </div>
                      <a
                        href={`${API_BASE_URL.replace('/api', '')}/media/${applicant.documents.payment_proof}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                    </div>
                  )}
                  {!applicant.documents?.msce && !applicant.documents?.id_card && !applicant.documents?.payment_proof && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No documents have been uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Academics Tab */}
          {activeTab === 'academics' && (
            <div className="space-y-6">
              {/* Subject Records */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    MSCE Results
                  </h2>
                </div>
                <div className="p-6">
                  {applicant.subject_records && applicant.subject_records.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {applicant.subject_records.map((subject) => (
                            <tr key={subject.id}>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{subject.subject}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {subject.grade}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{subject.year}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{subject.qualification}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No academic records submitted</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Teaching Subjects */}
              {applicant.teaching_subjects && applicant.teaching_subjects.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Teaching Subjects
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applicant.teaching_subjects.map((subject) => (
                        <div key={subject.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{subject.subject_name}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Level: {subject.teaching_level === 'both' ? 'Junior & Senior' : 
                                        subject.teaching_level === 'junior' ? 'Junior Secondary' : 'Senior Secondary'}
                              </p>
                            </div>
                            {subject.is_major && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                Major
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Education History */}
              {applicant.education && applicant.education.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Education History
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {applicant.education.map((edu) => (
                        <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <p className="font-medium">{edu.qualification_type}</p>
                              <p className="text-sm text-gray-600">{edu.institution}</p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {edu.start_date} - {edu.currently_studying ? 'Present' : edu.end_date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              {/* Work History */}
              {applicant.work_history && applicant.work_history.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Work Experience
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {applicant.work_history.map((work) => (
                        <div key={work.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <p className="font-medium">{work.job_title}</p>
                              <p className="text-sm text-gray-600">{work.organization}</p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {work.start_date} - {work.currently_working ? 'Present' : work.end_date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Experience</h3>
                  <p className="text-gray-500">This applicant has not provided any work history.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showCommentsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Update Application Status</h3>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setComments('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Add any comments or feedback for the applicant..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setComments('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateApplicantStatus}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}