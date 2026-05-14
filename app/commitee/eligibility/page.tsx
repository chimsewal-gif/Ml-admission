'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Shield, CheckCircle, XCircle, AlertCircle, Loader2, 
  RefreshCw, Eye, ChevronRight, Plus, Save, Edit2,
  Users, FileText, GraduationCap, Clock, Filter, Search,
  Award, TrendingUp, TrendingDown, Minus, Calendar,
  User, Mail, Phone, BookOpen, Star, Flag, Settings,
  Home, ChevronLeft, Building2, BookMarked, Target,
  BarChart3, PieChart, Download, Printer, Filter as FilterIcon,
  Upload, AlertTriangle, Info, Zap, Brain, Medal,
  Trophy, Crown, Sparkles, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface ProgrammeEligibility {
  programme_id: number;
  programme_name: string;
  programme_code: string;
  department: string;
  faculty: string;
  eligible: boolean;
  score: number;
  requirements_met: string[];
  requirements_missing: string[];
  points_required: number;
  points_obtained: number;
  subject_requirements: {
    subject: string;
    required_grade: string;
    obtained_grade: string;
    met: boolean;
  }[];
}

interface EligibilityResult {
  eligible: boolean;
  auto_eligible: boolean;
  manually_overridden: boolean;
  overridden_by?: string;
  overridden_at?: string;
  override_reason?: string;
  checks_passed: string[];
  checks_failed: string[];
  score: number;
  grade_point_average: number;
  subjects_count: number;
  credits_count: number;
  total_points: number;
  best_six_points: number;
  warnings: string[];
  recommendations: string[];
  programme_eligibility: ProgrammeEligibility[];
  subject_breakdown: {
    subject: string;
    grade: string;
    points: number;
    is_credit: boolean;
  }[];
}

interface Applicant {
  id: number;
  applicant_name: string;
  name: string;
  email: string;
  programme?: string;
  eligible?: boolean;
  manually_overridden?: boolean;
  submission_date?: string;
  application_status?: string;
  phone?: string;
  national_id?: string;
}

export default function EligibilityManager() {
  const router = useRouter();
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    eligible: true,
    reason: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'ineligible' | 'overridden' | 'pending'>('all');
  const [criteria, setCriteria] = useState<any>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    eligible: 0,
    ineligible: 0,
    overridden: 0,
    pending: 0
  });
  const [selectedProgrammeFilter, setSelectedProgrammeFilter] = useState<string>('all');
  const [programmes, setProgrammes] = useState<string[]>([]);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        console.error('No token found');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        const applicantsData = data.data || [];
        
        const transformedApplicants = applicantsData.map((applicant: any) => {
          let isEligible = false;
          let isManuallyOverridden = false;
          
          if (applicant.ml_prediction) {
            isEligible = applicant.ml_prediction.decision === 'approve';
            isManuallyOverridden = !applicant.auto_processed && 
                                   (applicant.status === 'approved' || applicant.status === 'accepted');
          } else if (applicant.status) {
            isEligible = applicant.status === 'approved' || applicant.status === 'accepted';
          }
          
          if (applicant.eligibility_verified === true) {
            isEligible = true;
          }
          
          return {
            id: applicant.id,
            applicant_name: applicant.applicant_name,
            name: applicant.applicant_name,
            email: applicant.email,
            programme: applicant.programme,
            eligible: isEligible,
            manually_overridden: isManuallyOverridden,
            submission_date: applicant.submitted_at,
            application_status: applicant.status,
            phone: applicant.phone || '',
            national_id: applicant.national_id || ''
          };
        });
        
        setApplicants(transformedApplicants);
        
        const newStats = {
          total: transformedApplicants.length,
          eligible: transformedApplicants.filter((a: any) => a.eligible === true).length,
          ineligible: transformedApplicants.filter((a: any) => a.eligible === false && !a.manually_overridden).length,
          overridden: transformedApplicants.filter((a: any) => a.manually_overridden === true).length,
          pending: transformedApplicants.filter((a: any) => a.eligible === undefined || a.eligible === null).length
        };
        setStats(newStats);
        
        const uniqueProgrammes = [...new Set(transformedApplicants.map((a: any) => a.programme).filter(Boolean))];
        setProgrammes(uniqueProgrammes);
      }
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (applicantId: number) => {
    setProcessing(true);
    try {
      const token = getToken();
      if (!token) {
        console.error('No token found');
        return null;
      }
      
      const response = await fetch(`${API_BASE_URL}/eligibility/check/${applicantId}/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setEligibilityResult(data.data);
        return data.data;
      }
    } catch (err) {
      console.error('Failed to check eligibility:', err);
    } finally {
      setProcessing(false);
    }
    return null;
  };

  const overrideEligibility = async (applicantId: number) => {
    setProcessing(true);
    try {
      const token = getToken();
      if (!token) {
        alert('Authentication failed');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/eligibility/override/${applicantId}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(overrideData)
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Eligibility overridden successfully!\n\nStatus: ${overrideData.eligible ? 'Eligible' : 'Not Eligible'}\nReason: ${overrideData.reason}`);
        setShowOverrideModal(false);
        await checkEligibility(applicantId);
        await fetchApplicants();
        setOverrideData({ eligible: true, reason: '', notes: '' });
      } else {
        alert('Failed to override: ' + data.message);
      }
    } catch (err) {
      console.error('Failed to override:', err);
      alert('Failed to override eligibility');
    } finally {
      setProcessing(false);
    }
  };

  const batchCheckEligibility = async () => {
    setProcessing(true);
    try {
      const token = getToken();
      if (!token) {
        alert('Authentication failed');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/eligibility/batch-check/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert(`✅ Batch eligibility check completed!\n\n📊 Summary:\n- Total: ${data.summary.total}\n- Eligible: ${data.summary.eligible}\n- Auto Eligible: ${data.summary.auto_eligible}`);
        await fetchApplicants();
      }
    } catch (err) {
      console.error('Batch check failed:', err);
      alert('Failed to run batch eligibility check');
    } finally {
      setProcessing(false);
    }
  };

  const fetchCriteria = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/eligibility/criteria/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setCriteria(data.data[0]);
      } else {
        setCriteria({ min_subjects: 6, min_credits: 4, max_points: 30, required_subjects: [] });
      }
    } catch (err) {
      console.error('Failed to fetch criteria:', err);
      setCriteria({ min_subjects: 6, min_credits: 4, max_points: 30, required_subjects: [] });
    }
  };

  const updateCriteria = async () => {
    setProcessing(true);
    try {
      const token = getToken();
      if (!token) {
        alert('Authentication failed');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/eligibility/criteria/${criteria.programme_id || 1}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(criteria)
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Eligibility criteria updated successfully!');
        setShowCriteriaModal(false);
        setEditingCriteria(false);
      }
    } catch (err) {
      console.error('Failed to update criteria:', err);
      alert('Failed to update criteria');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewApplicant = async (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    await checkEligibility(applicant.id);
  };

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = applicant.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterStatus !== 'all') {
      if (filterStatus === 'eligible' && !applicant.eligible) return false;
      if (filterStatus === 'ineligible' && (applicant.eligible !== false || applicant.manually_overridden)) return false;
      if (filterStatus === 'overridden' && !applicant.manually_overridden) return false;
      if (filterStatus === 'pending' && (applicant.eligible !== undefined)) return false;
    }
    
    if (selectedProgrammeFilter !== 'all' && applicant.programme !== selectedProgrammeFilter) return false;
    
    return true;
  });

  useEffect(() => {
    fetchApplicants();
    fetchCriteria();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (result: EligibilityResult | null, applicant?: Applicant) => {
    if (!result && applicant) {
      if (applicant.manually_overridden) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
            <Shield className="w-3 h-3" />
            Manually Overridden
          </span>
        );
      }
      if (applicant.eligible === true) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Eligible
          </span>
        );
      }
      if (applicant.eligible === false) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Not Eligible
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    }
    
    if (result) {
      if (result.manually_overridden) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
            <Shield className="w-3 h-3" />
            Manually Overridden
          </span>
        );
      }
      
      if (result.eligible) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Eligible
          </span>
        );
      }
      
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" />
          Not Eligible
        </span>
      );
    }
    
    return null;
  };

  const exportToCSV = () => {
    const headers = ['Applicant Name', 'Email', 'Programme', 'Eligibility Status', 'Score', 'Subjects', 'Credits', 'Total Points', 'GPA'];
    const rows = filteredApplicants.map(a => [
      a.applicant_name || a.name,
      a.email,
      a.programme || 'N/A',
      a.eligible ? 'Eligible' : (a.eligible === false ? 'Not Eligible' : 'Pending'),
      '-',
      '-',
      '-',
      '-',
      '-'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eligibility_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/committee/dashboard')}
              className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Eligibility Manager</span>
          </nav>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Eligibility Management System</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Eligibility Manager</h1>
          <p className="text-gray-600 mt-2">Automatic eligibility checks with manual override capability</p>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-gray-900 shadow-md border border-gray-200 cursor-pointer hover:border-green-300 transition-all" onClick={() => setFilterStatus('all')}>
            <p className="text-gray-500 text-sm">Total Applicants</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">All applications</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-gray-900 shadow-md border border-gray-200 cursor-pointer hover:border-green-300 transition-all" onClick={() => setFilterStatus('eligible')}>
            <p className="text-gray-500 text-sm">Eligible</p>
            <p className="text-3xl font-bold text-green-600">{stats.eligible}</p>
            <p className="text-xs text-gray-400 mt-1">Auto-verified</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-gray-900 shadow-md border border-gray-200 cursor-pointer hover:border-green-300 transition-all" onClick={() => setFilterStatus('ineligible')}>
            <p className="text-gray-500 text-sm">Not Eligible</p>
            <p className="text-3xl font-bold text-red-600">{stats.ineligible}</p>
            <p className="text-xs text-gray-400 mt-1">Auto-failed</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-gray-900 shadow-md border border-gray-200 cursor-pointer hover:border-green-300 transition-all" onClick={() => setFilterStatus('overridden')}>
            <p className="text-gray-500 text-sm">Overridden</p>
            <p className="text-3xl font-bold text-purple-600">{stats.overridden}</p>
            <p className="text-xs text-gray-400 mt-1">Manual changes</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-gray-900 shadow-md border border-gray-200 cursor-pointer hover:border-green-300 transition-all" onClick={() => setFilterStatus('pending')}>
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-400 mt-1">Not checked</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={batchCheckEligibility}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Batch Check All</span>
              </button>
              <button
                onClick={() => {
                  setEditingCriteria(true);
                  setShowCriteriaModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all shadow-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Edit Criteria</span>
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedProgrammeFilter}
                onChange={(e) => setSelectedProgrammeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              >
                <option value="all">All Programmes</option>
                {programmes.map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applicants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">APPLICANT</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PROGRAMME</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">STATUS</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SCORE</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SUBMISSION</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading applicants...</p>
                    </td>
                  </tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No applicants found</p>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleViewApplicant(applicant)}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{applicant.applicant_name || applicant.name}</p>
                          <p className="text-xs text-gray-500">{applicant.email}</p>
                          {applicant.national_id && (
                            <p className="text-xs text-gray-400 mt-1">ID: {applicant.national_id}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{applicant.programme || 'Not specified'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(null, applicant)}
                      </td>
                      <td className="px-6 py-4">
                        {applicant.eligible !== undefined ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${applicant.eligible ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{ width: `${applicant.eligible ? 100 : 20}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${applicant.eligible ? 'text-green-600' : 'text-red-600'}`}>
                              {applicant.eligible ? 'Pass' : 'Fail'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not checked</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {applicant.submission_date ? (
                          <div className="text-sm text-gray-600">
                            {new Date(applicant.submission_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewApplicant(applicant);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Details"
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

        {/* Eligibility Details Modal - Fixed scrolling */}
        <AnimatePresence>
          {selectedApplicant && eligibilityResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSelectedApplicant(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Fixed Header */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 bg-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">Eligibility Details</h2>
                      <p className="text-gray-500 text-sm">{selectedApplicant.applicant_name || selectedApplicant.name}</p>
                      <p className="text-gray-400 text-xs">{selectedApplicant.email}</p>
                    </div>
                    <button onClick={() => setSelectedApplicant(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <XCircle className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-lg ${eligibilityResult.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        {eligibilityResult.eligible ? (
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        ) : (
                          <XCircle className="w-10 h-10 text-red-600" />
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {eligibilityResult.eligible ? 'Eligible for Admission' : 'Not Eligible for Admission'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {eligibilityResult.auto_eligible ? '✓ Auto-verified by system' : '⚠️ Manual review required'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(eligibilityResult)}
                    </div>
                  </div>
                  
                  {/* Score Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Eligibility Score</span>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          eligibilityResult.score >= 70 ? 'bg-green-100 text-green-700' :
                          eligibilityResult.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {eligibilityResult.score >= 70 ? <Trophy className="w-3 h-3" /> :
                           eligibilityResult.score >= 50 ? <TrendingUp className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {eligibilityResult.score >= 70 ? 'Excellent' :
                           eligibilityResult.score >= 50 ? 'Average' : 'Needs Improvement'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <svg className="w-24 h-24">
                            <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8"/>
                            <circle
                              cx="48"
                              cy="48"
                              r="40"
                              fill="none"
                              stroke={getScoreBgColor(eligibilityResult.score)}
                              strokeWidth="8"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - eligibilityResult.score / 100)}`}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                              transform="rotate(-90 48 48)"
                            />
                            <text x="48" y="54" textAnchor="middle" className="text-xl font-bold fill-gray-900">
                              {eligibilityResult.score}%
                            </text>
                          </svg>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Best 6 Points:</span>
                            <span className="font-semibold">{eligibilityResult.best_six_points || eligibilityResult.total_points}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">GPA:</span>
                            <span className="font-semibold">{eligibilityResult.grade_point_average.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <FileText className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold">{eligibilityResult.subjects_count}</p>
                        <p className="text-xs text-gray-500">Subjects</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Award className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold">{eligibilityResult.credits_count}</p>
                        <p className="text-xs text-gray-500">Credits</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <TrendingUp className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold">{eligibilityResult.total_points}</p>
                        <p className="text-xs text-gray-500">Total Points</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <GraduationCap className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-2xl font-bold">{eligibilityResult.grade_point_average.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">GPA</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subject Breakdown */}
                  {eligibilityResult.subject_breakdown && eligibilityResult.subject_breakdown.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-green-600" />
                          Subject Breakdown
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-gray-600">Subject</th>
                              <th className="px-4 py-2 text-center text-gray-600">Grade</th>
                              <th className="px-4 py-2 text-center text-gray-600">Points</th>
                              <th className="px-4 py-2 text-center text-gray-600">Credit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {eligibilityResult.subject_breakdown.map((subj, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-gray-900">{subj.subject}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                    subj.grade === 'A' || subj.grade === 'A*' ? 'bg-green-100 text-green-700' :
                                    subj.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                                    subj.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {subj.grade}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-center font-medium">{subj.points}</td>
                                <td className="px-4 py-2 text-center">
                                  {subj.is_credit ? (
                                    <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Checks Passed & Failed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eligibilityResult.checks_passed.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Requirements Met ({eligibilityResult.checks_passed.length})
                        </h4>
                        <ul className="space-y-1 max-h-40 overflow-y-auto">
                          {eligibilityResult.checks_passed.map((check, idx) => (
                            <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                              <span>✓</span>
                              {check}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {eligibilityResult.checks_failed.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Missing Requirements ({eligibilityResult.checks_failed.length})
                        </h4>
                        <ul className="space-y-1 max-h-40 overflow-y-auto">
                          {eligibilityResult.checks_failed.map((check, idx) => (
                            <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                              <span>✗</span>
                              {check}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Recommendations */}
                  {eligibilityResult.recommendations.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {eligibilityResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                            <span>•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Override Info */}
                  {eligibilityResult.manually_overridden && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Manual Override Applied
                      </h4>
                      <p className="text-sm text-purple-700">
                        <strong>Decision:</strong> {eligibilityResult.eligible ? 'Eligible' : 'Not Eligible'}
                      </p>
                      <p className="text-sm text-purple-700 mt-1">
                        <strong>Reason:</strong> {eligibilityResult.override_reason || 'Not specified'}
                      </p>
                      <p className="text-xs text-purple-600 mt-2">
                        Overridden by: {eligibilityResult.overridden_by} on {new Date(eligibilityResult.overridden_at || '').toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Fixed Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex gap-3 bg-gray-50">
                  <button
                    onClick={() => setSelectedApplicant(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Manual Override
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Override Modal */}
        <AnimatePresence>
          {showOverrideModal && selectedApplicant && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowOverrideModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Fixed Header */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800">Manual Eligibility Override</h2>
                  <p className="text-gray-500 text-sm">Override automatic eligibility decision</p>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Override Status *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={overrideData.eligible === true}
                          onChange={() => setOverrideData({ ...overrideData, eligible: true })}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-green-700 font-medium">Mark as Eligible</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={overrideData.eligible === false}
                          onChange={() => setOverrideData({ ...overrideData, eligible: false })}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-red-700 font-medium">Mark as Not Eligible</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Override *
                    </label>
                    <textarea
                      value={overrideData.reason}
                      onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Explain why this override is necessary..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={overrideData.notes}
                      onChange={(e) => setOverrideData({ ...overrideData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Any additional notes for the committee..."
                    />
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <p className="text-xs text-yellow-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Manual overrides bypass automatic eligibility checks. All overrides are logged for audit purposes.</span>
                    </p>
                  </div>
                </div>
                
                {/* Fixed Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex gap-3 bg-gray-50">
                  <button
                    onClick={() => setShowOverrideModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => overrideEligibility(selectedApplicant.id)}
                    disabled={!overrideData.reason.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Override
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Criteria Modal */}
        <AnimatePresence>
          {showCriteriaModal && criteria && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setShowCriteriaModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Fixed Header */}
                <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800">Eligibility Criteria</h2>
                  <p className="text-gray-500 text-sm">Configure automatic eligibility checks</p>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Subjects Required
                    </label>
                    <input
                      type="number"
                      value={criteria.min_subjects || 6}
                      onChange={(e) => setCriteria({ ...criteria, min_subjects: parseInt(e.target.value) })}
                      disabled={!editingCriteria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum number of MSCE subjects required for eligibility</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Credit Passes
                    </label>
                    <input
                      type="number"
                      value={criteria.min_credits || 4}
                      onChange={(e) => setCriteria({ ...criteria, min_credits: parseInt(e.target.value) })}
                      disabled={!editingCriteria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum number of credit passes (Grade C or better) required</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Total Points
                    </label>
                    <input
                      type="number"
                      value={criteria.max_points || 25}
                      onChange={(e) => setCriteria({ ...criteria, max_points: parseInt(e.target.value) })}
                      disabled={!editingCriteria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum total points allowed (lower is better)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Subjects (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={criteria.required_subjects?.join(', ') || ''}
                      onChange={(e) => setCriteria({ 
                        ...criteria, 
                        required_subjects: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)
                      })}
                      disabled={!editingCriteria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                      placeholder="Mathematics, English, Biology"
                    />
                    <p className="text-xs text-gray-500 mt-1">Subjects that are mandatory for eligibility</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-green-800 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>These criteria apply globally to all programmes. Individual programmes may have additional specific requirements.</span>
                    </p>
                  </div>
                </div>
                
                {/* Fixed Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex gap-3 bg-gray-50">
                  {editingCriteria ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingCriteria(false);
                          fetchCriteria();
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateCriteria}
                        disabled={processing}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowCriteriaModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => setEditingCriteria(true)}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Criteria
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}