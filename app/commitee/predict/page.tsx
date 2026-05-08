'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Brain, TrendingUp, Users, Award, Flame, Star, ClipboardList, 
  BarChart3, PieChart, Activity, Clock, CheckCircle, AlertCircle,
  Loader2, RefreshCw, ExternalLink, Eye, Filter, Search, X,
  User, Mail, Phone, MapPin, Calendar, BookOpen, FileText, GraduationCap,
  Building, Award as AwardIcon, ChevronRight, Download, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Priority Badge Component
const PriorityBadge = ({ priority, probability, confidence, size = 'md' }: { 
  priority: string; 
  probability?: number; 
  confidence?: number; 
  size?: 'sm' | 'md' | 'lg' 
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'High':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          text: 'text-white',
          icon: <Flame className="w-3 h-3" />,
          label: 'High Priority',
          badgeColor: 'bg-red-100 text-red-700'
        };
      case 'Medium':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          text: 'text-white',
          icon: <Star className="w-3 h-3" />,
          label: 'Medium Priority',
          badgeColor: 'bg-yellow-100 text-yellow-700'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: 'text-white',
          icon: <ClipboardList className="w-3 h-3" />,
          label: 'Low Priority',
          badgeColor: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const config = getPriorityConfig();
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${config.bg} ${config.text} shadow-sm`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
      {probability !== undefined && (
        <div className="text-xs text-gray-500">
          <span className="font-medium">Match Score:</span> {(probability * 100).toFixed(0)}%
          {confidence && <span className="ml-2">• Confidence: {(confidence * 100).toFixed(0)}%</span>}
        </div>
      )}
    </div>
  );
};

// Full Applicant Details Modal Component
const ApplicantDetailsModal = ({ applicant, onClose }: { applicant: any; onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [fullDetails, setFullDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchFullDetails();
  }, [applicant.id]);

  const fetchFullDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/${applicant.id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFullDetails(data.data);
      } else {
        setFullDetails(applicant);
      }
    } catch (err) {
      console.error('Failed to fetch details:', err);
      setFullDetails(applicant);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download if needed
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const details = fullDetails || applicant;

  return (
    <div className="flex flex-col max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Full Application Details</h2>
              <p className="text-purple-200 text-sm">Complete applicant information and documents</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Print"
            >
              <Printer className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-6 bg-white sticky top-0 z-10">
        <div className="flex gap-6">
          {['overview', 'academic', 'documents', 'prediction'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{details.first_name} {details.last_name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{details.email}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{details.phone || 'Not provided'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">{details.date_of_birth || 'Not provided'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900">{details.gender || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Nationality</p>
                  <p className="font-medium text-gray-900">{details.nationality || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">National ID</p>
                  <p className="font-medium text-gray-900">{details.national_id || 'Not provided'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Home District</p>
                  <p className="font-medium text-gray-900">{details.home_district || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Physical Address</p>
                  <p className="font-medium text-gray-900">{details.physical_address || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Programme Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Programme Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Selected Programme</p>
                  <p className="font-medium text-gray-900">{details.programme || 'Not specified'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Application Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    details.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                    details.status === 'approved' ? 'bg-green-100 text-green-700' :
                    details.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {details.status || 'Pending'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Reference Number</p>
                  <p className="font-medium text-gray-900 font-mono">{details.reference_number || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Submission Date</p>
                  <p className="font-medium text-gray-900">
                    {details.submitted_at ? new Date(details.submitted_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Next of Kin */}
            {details.next_of_kin && details.next_of_kin.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Next of Kin
                </h3>
                <div className="space-y-3">
                  {details.next_of_kin.map((kin: any, idx: number) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="font-medium text-gray-900">{kin.title} {kin.first_name} {kin.last_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Relationship</p>
                          <p className="font-medium text-gray-900">{kin.relationship}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">{kin.mobile1}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{kin.email || 'Not provided'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="font-medium text-gray-900">{kin.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6">
            {/* MSCE Results */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                MSCE Results
              </h3>
              {details.subject_records && details.subject_records.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subject</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {details.subject_records.map((record: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-sm text-gray-800">{record.subject}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                              {record.grade}
                            </span>
                           </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{record.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No academic records found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-800">MSCE Certificate</p>
                <p className="text-xs text-gray-500 mt-1">
                  {details.msce ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-800">National ID</p>
                <p className="text-xs text-gray-500 mt-1">
                  {details.id_card ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-800">Payment Proof</p>
                <p className="text-xs text-gray-500 mt-1">
                  {details.payment_proof ? 'Uploaded' : 'Not uploaded'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prediction' && (
          <div className="space-y-6">
            <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">AI Prediction Analysis</h3>
                <PriorityBadge 
                  priority={details.ml_priority || details.priority || 'Medium'} 
                  probability={details.probability || details.ml_probability}
                  confidence={details.confidence || details.ml_confidence}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Admission Probability</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-purple-600"
                        style={{ width: `${((details.probability || details.ml_probability || 0.5) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {((details.probability || details.ml_probability || 0.5) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Confidence Level</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${((details.confidence || details.ml_confidence || 0.5) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {((details.confidence || details.ml_confidence || 0.5) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {details.factors && details.factors.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">Key Factors</h4>
                <div className="space-y-2">
                  {details.factors.map((factor: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      {factor.impact === 'positive' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{factor.factor}</p>
                        {factor.details && <p className="text-xs text-gray-500">{factor.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details.recommendation && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-2">AI Recommendation</h4>
                <p className="text-sm text-gray-700">{details.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 flex gap-3 bg-gray-50 sticky bottom-0">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Close
        </button>
        <button
          onClick={() => {
            // You can add additional actions here like approving/rejecting
            onClose();
          }}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors"
        >
          Close Application
        </button>
      </div>
    </div>
  );
};

export default function CommitteePredictionsPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<any>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [showFullApplicationModal, setShowFullApplicationModal] = useState(false);
  const [fullApplicationData, setFullApplicationData] = useState<any>(null);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchPredictions = async () => {
    setLoadingPredictions(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/ml/predictions/dashboard/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPredictions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const fetchApplicantsByPriority = async (priority: string = 'all') => {
    setLoadingApplicants(true);
    try {
      const token = getToken();
      let url = `${API_BASE_URL}/applicant-submissions/`;
      if (priority !== 'all') {
        url = `${API_BASE_URL}/ml/predictions/priority/${priority}/`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (priority !== 'all' && data.success) {
        setApplicants(data.applicants || []);
      } else if (data.success && data.data) {
        setApplicants(data.data);
      } else {
        setApplicants([]);
      }
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const runBatchPredictions = async () => {
    setBatchProcessing(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        const applicantIds = data.data.map((a: any) => a.id);
        
        const batchResponse = await fetch(`${API_BASE_URL}/ml/batch-predict-admissions/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ applicant_ids: applicantIds })
        });
        
        const batchData = await batchResponse.json();
        if (batchData.success) {
          alert(`Batch prediction completed!\n\nSummary:\n- High Priority: ${batchData.summary.high_priority}\n- Medium Priority: ${batchData.summary.medium_priority}\n- Low Priority: ${batchData.summary.low_priority}\n- Total Processed: ${batchData.summary.successful}`);
          await fetchPredictions();
          await fetchApplicantsByPriority(selectedPriority);
        }
      }
    } catch (err) {
      console.error('Batch prediction failed:', err);
      alert('Failed to run batch predictions. Please try again.');
    } finally {
      setBatchProcessing(false);
    }
  };

  const viewApplicantDetails = (applicant: any) => {
    setSelectedApplicant(applicant);
    setShowDetailsModal(true);
  };

  const viewFullApplication = async (applicantId: number) => {
    setLoadingApplicants(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/${applicantId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFullApplicationData(data.data);
        setShowFullApplicationModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch full application:', err);
      alert('Failed to load application details');
    } finally {
      setLoadingApplicants(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    fetchApplicantsByPriority(selectedPriority);
  }, []);

  useEffect(() => {
    fetchApplicantsByPriority(selectedPriority);
  }, [selectedPriority]);

  const filteredApplicants = applicants.filter(applicant => {
    if (!searchTerm) return true;
    const name = applicant.name || applicant.applicant_name || '';
    const programme = applicant.programme || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      programme.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'border-l-4 border-l-red-500';
      case 'Medium': return 'border-l-4 border-l-yellow-500';
      default: return 'border-l-4 border-l-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/20 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
            <Brain className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Admission System</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ML Admission Predictions</h1>
          <p className="text-gray-600">AI-powered applicant prioritization and success prediction</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3 justify-end">
          <button
            onClick={runBatchPredictions}
            disabled={batchProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {batchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Run Batch Predictions</span>
          </button>
          <button
            onClick={() => {
              fetchPredictions();
              fetchApplicantsByPriority(selectedPriority);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Cards */}
        {loadingPredictions ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center mb-6">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading prediction data...</p>
          </div>
        ) : predictions?.priority_distribution ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Analyzed</p>
                  <p className="text-4xl font-bold">{predictions.total_predicted || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-200 text-sm">High Priority</p>
                  <p className="text-4xl font-bold">{predictions.priority_distribution.High || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
              </div>
              {predictions.average_probabilities?.High > 0 && (
                <p className="text-red-200 text-xs mt-2">
                  Avg Match: {(predictions.average_probabilities.High * 100).toFixed(0)}%
                </p>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm">Medium Priority</p>
                  <p className="text-4xl font-bold">{predictions.priority_distribution.Medium || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6" />
                </div>
              </div>
              {predictions.average_probabilities?.Medium > 0 && (
                <p className="text-yellow-200 text-xs mt-2">
                  Avg Match: {(predictions.average_probabilities.Medium * 100).toFixed(0)}%
                </p>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Low Priority</p>
                  <p className="text-4xl font-bold">{predictions.priority_distribution.Low || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" />
                </div>
              </div>
              {predictions.average_probabilities?.Low > 0 && (
                <p className="text-gray-300 text-xs mt-2">
                  Avg Match: {(predictions.average_probabilities.Low * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center mb-6">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No prediction data available</p>
            <p className="text-sm text-gray-400 mt-1">Click "Run Batch Predictions" to analyze applicants</p>
          </div>
        )}

        {/* Model Info Card */}
        {predictions?.model_info && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>ML Model: {predictions.model_info.model_loaded ? 'Active' : 'Fallback Mode'}</span>
              <span className="mx-2">•</span>
              <span>Features: {predictions.model_info.feature_columns?.length || 0}</span>
              <span className="mx-2">•</span>
              <span>Priority Thresholds: High ≥70% | Medium 40-70% | Low {'<'}40%</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPriority('all')}
                className={`px-4 py-2 rounded-xl transition-all ${selectedPriority === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedPriority('High')}
                className={`px-4 py-2 rounded-xl transition-all ${selectedPriority === 'High' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                High Priority
              </button>
              <button
                onClick={() => setSelectedPriority('Medium')}
                className={`px-4 py-2 rounded-xl transition-all ${selectedPriority === 'Medium' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Medium Priority
              </button>
              <button
                onClick={() => setSelectedPriority('Low')}
                className={`px-4 py-2 rounded-xl transition-all ${selectedPriority === 'Low' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Low Priority
              </button>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">APPLICANT</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PROGRAMME</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PRIORITY</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">MATCH SCORE</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingApplicants ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading applicants...</p>
                    </td>
                  </tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No applicants found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or run batch predictions</p>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant: any) => (
                    <tr key={applicant.id} className={`hover:bg-gray-50 transition-colors ${getPriorityColor(applicant.ml_priority || applicant.priority)}`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{applicant.name || applicant.applicant_name}</p>
                          <p className="text-xs text-gray-500">{applicant.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{applicant.programme || 'Not specified'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge 
                          priority={applicant.ml_priority || applicant.priority || 'Medium'} 
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (applicant.probability || applicant.ml_probability || 0.5) >= 0.7 ? 'bg-green-500' :
                                (applicant.probability || applicant.ml_probability || 0.5) >= 0.4 ? 'bg-yellow-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${((applicant.probability || applicant.ml_probability || 0.5) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-[45px]">
                            {((applicant.probability || applicant.ml_probability || 0.5) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => viewFullApplication(applicant.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Performance Notes */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">How AI Predictions Work</p>
              <p className="text-xs text-blue-700 mt-1">
                The machine learning model analyzes MSCE results, application completeness, programme competition, and other factors
                to predict admission success probability. Priority levels help the committee review the strongest applications first.
                <strong className="block mt-1">Note: AI predictions are advisory only. Final admission decisions are made by the committee.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Brief Details Modal (First Modal) */}
      <AnimatePresence>
        {showDetailsModal && selectedApplicant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Applicant Details</h2>
                    <p className="text-purple-200 text-sm">ML Analysis & Prediction Report</p>
                  </div>
                  <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedApplicant.name || selectedApplicant.applicant_name}</h3>
                    <p className="text-sm text-gray-500">{selectedApplicant.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Programme</p>
                      <p className="font-medium text-gray-900">{selectedApplicant.programme || 'Not specified'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="font-medium text-gray-900">
                        {selectedApplicant.submitted_at ? new Date(selectedApplicant.submitted_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">AI Prediction Summary</h4>
                      <PriorityBadge 
                        priority={selectedApplicant.ml_priority || selectedApplicant.priority || 'Medium'} 
                        probability={selectedApplicant.probability || selectedApplicant.ml_probability}
                        confidence={selectedApplicant.confidence || selectedApplicant.ml_confidence}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Admission Probability:</span>
                        <span className="font-semibold">{(selectedApplicant.probability || selectedApplicant.ml_probability || 0.5) * 100}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Confidence Level:</span>
                        <span className="font-semibold">{(selectedApplicant.confidence || selectedApplicant.ml_confidence || 0.5) * 100}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      viewFullApplication(selectedApplicant.id);
                    }}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Full Application
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Application Details Modal (Second Modal) */}
      <AnimatePresence>
        {showFullApplicationModal && fullApplicationData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFullApplicationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ApplicantDetailsModal 
                applicant={fullApplicationData} 
                onClose={() => setShowFullApplicationModal(false)} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}