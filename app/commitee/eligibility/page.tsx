// app/committee/eligibility/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle, XCircle, AlertCircle, Loader2, 
  RefreshCw, Eye, ChevronRight, Plus, Save, Edit2,
  Users, FileText, GraduationCap, Clock, Filter, Search,
  Award, TrendingUp, TrendingDown, Minus, Calendar,
  User, Mail, Phone, BookOpen, Star, Flag, Settings,
  Home, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

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
  warnings: string[];
  recommendations: string[];
}

export default function EligibilityManager() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState({
    eligible: true,
    reason: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'ineligible' | 'overridden'>('all');
  const [criteria, setCriteria] = useState<any>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setApplicants(data.data || []);
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
      const response = await fetch(`${API_BASE_URL}/eligibility/check/${applicantId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      const response = await fetch(`${API_BASE_URL}/eligibility/criteria/1/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCriteria(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch criteria:', err);
    }
  };

  const updateCriteria = async () => {
    setProcessing(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/eligibility/criteria/1/`, {
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

  const handleViewApplicant = async (applicant: any) => {
    setSelectedApplicant(applicant);
    await checkEligibility(applicant.id);
  };

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = applicant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.applicant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
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

  const getStatusBadge = (result: EligibilityResult | null) => {
    if (!result) return null;
    
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Eligibility Manager</span>
          </nav>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Eligibility Management</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Eligibility Manager</h1>
          <p className="text-gray-600 mt-2">Automatic eligibility checks with manual override capability</p>
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
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
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
            </div>
            
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

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-md">
            <p className="text-blue-200 text-sm">Total Applicants</p>
            <p className="text-3xl font-bold">{applicants.length}</p>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white shadow-md">
            <p className="text-green-200 text-sm">Eligible</p>
            <p className="text-3xl font-bold">{applicants.filter(a => a.eligible).length}</p>
          </div>
          <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-xl p-4 text-white shadow-md">
            <p className="text-red-200 text-sm">Not Eligible</p>
            <p className="text-3xl font-bold">{applicants.filter(a => !a.eligible).length}</p>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-white shadow-md">
            <p className="text-purple-200 text-sm">Overridden</p>
            <p className="text-3xl font-bold">{applicants.filter(a => a.manually_overridden).length}</p>
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
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading applicants...</p>
                    </td>
                  </tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No applicants found</p>
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{applicant.applicant_name || applicant.name}</p>
                          <p className="text-xs text-gray-500">{applicant.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{applicant.programme || 'Not specified'}</p>
                      </td>
                      <td className="px-6 py-4">
                        {selectedApplicant?.id === applicant.id && eligibilityResult ? (
                          getStatusBadge(eligibilityResult)
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            <Clock className="w-3 h-3" />
                            Not Checked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {selectedApplicant?.id === applicant.id && eligibilityResult ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getScoreBgColor(eligibilityResult.score)}`}
                                style={{ width: `${eligibilityResult.score}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${getScoreColor(eligibilityResult.score)}`}>
                              {eligibilityResult.score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewApplicant(applicant)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Check Eligibility"
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

        {/* Eligibility Details Modal */}
        <AnimatePresence>
          {selectedApplicant && eligibilityResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedApplicant(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Eligibility Details</h2>
                      <p className="text-green-100 text-sm">{selectedApplicant.applicant_name || selectedApplicant.name}</p>
                    </div>
                    <button onClick={() => setSelectedApplicant(null)} className="p-2 hover:bg-white/20 rounded-lg">
                      <XCircle className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-lg ${eligibilityResult.eligible ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {eligibilityResult.eligible ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-600" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
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
                  
                  {/* Score */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Eligibility Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(eligibilityResult.score)}`}>
                        {eligibilityResult.score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getScoreBgColor(eligibilityResult.score)} transition-all`}
                        style={{ width: `${eligibilityResult.score}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Metrics */}
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
                  
                  {/* Checks Passed */}
                  {eligibilityResult.checks_passed.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Requirements Met
                      </h4>
                      <ul className="space-y-1">
                        {eligibilityResult.checks_passed.map((check, idx) => (
                          <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                            <span>✓</span>
                            {check}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Checks Failed */}
                  {eligibilityResult.checks_failed.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Requirements Not Met
                      </h4>
                      <ul className="space-y-1">
                        {eligibilityResult.checks_failed.map((check, idx) => (
                          <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                            <span>✗</span>
                            {check}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {eligibilityResult.recommendations.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {eligibilityResult.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-700">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Override Info */}
                  {eligibilityResult.manually_overridden && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Manual Override Applied
                      </h4>
                      <p className="text-sm text-purple-700">
                        <strong>Reason:</strong> {eligibilityResult.override_reason || 'Not specified'}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        Overridden by: {eligibilityResult.overridden_by} on {new Date(eligibilityResult.overridden_at || '').toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 px-6 py-4 flex gap-3 bg-gray-50">
                  <button
                    onClick={() => setSelectedApplicant(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowOverrideModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-xl">
                  <h2 className="text-xl font-semibold text-white">Manual Eligibility Override</h2>
                  <p className="text-green-100 text-sm">Override automatic eligibility decision</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Override Status *
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={overrideData.eligible === true}
                          onChange={() => setOverrideData({ ...overrideData, eligible: true })}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-green-700 font-medium">Mark as Eligible</span>
                      </label>
                      <label className="flex items-center gap-2">
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
                    <p className="text-xs text-yellow-800">
                      <strong>⚠️ Warning:</strong> Manual overrides bypass automatic eligibility checks.
                      All overrides are logged for audit purposes.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-6 pt-0">
                  <button
                    onClick={() => setShowOverrideModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => overrideEligibility(selectedApplicant.id)}
                    disabled={!overrideData.reason.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowCriteriaModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">Eligibility Criteria</h2>
                  <p className="text-green-100 text-sm">Configure automatic eligibility checks</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Subjects
                    </label>
                    <input
                      type="number"
                      value={criteria.min_subjects}
                      onChange={(e) => setCriteria({ ...criteria, min_subjects: parseInt(e.target.value) })}
                      disabled={!editingCriteria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum number of MSCE subjects required</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Credits
                    </label>
                    <input
                      type="number"
                      value={criteria.min_credits}
                      onChange={(e) => setCriteria({ ...criteria, min_credits: parseInt(e.target.value) })}
                      disabled={!editingCriteria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum number of credit passes required</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Points
                    </label>
                    <input
                      type="number"
                      value={criteria.max_points}
                      onChange={(e) => setCriteria({ ...criteria, max_points: parseInt(e.target.value) })}
                      disabled={!editingCriteria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum total points allowed</p>
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
                        required_subjects: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      disabled={!editingCriteria}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                      placeholder="Mathematics, English, Biology"
                    />
                    <p className="text-xs text-gray-500 mt-1">Subjects that are mandatory for eligibility</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 px-6 py-4 flex gap-3 bg-gray-50">
                  {editingCriteria ? (
                    <>
                      <button
                        onClick={() => {
                          setEditingCriteria(false);
                          fetchCriteria();
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
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