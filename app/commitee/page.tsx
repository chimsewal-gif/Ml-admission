// app/committee/page.tsx (updated with auto-verification)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  Calendar,
  Eye,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
  Bell,
  Activity,
  Award,
  BookOpen,
  GraduationCap,
  BarChart3,
  PieChart,
  LogOut,
  ChevronRight,
  Search,
  Filter,
  Star,
  Target,
  Zap,
  Shield,
  Menu,
  X,
  Upload,
  Trash2,
  Edit,
  MoreVertical,
  Brain,
  Sparkles,
  ShieldCheck,
  BadgeCheck
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Auto-verification status types
interface AutoVerificationResult {
  auto_verified: boolean;
  confidence_score: number;
  extracted_data: {
    reference_number?: string;
    amount?: number;
    account_number?: string;
    depositor_name?: string;
    bank_name?: string;
    transaction_date?: string;
  };
  verification: {
    reference_match: boolean;
    amount_match: boolean;
    confidence: number;
  };
  requires_manual_review: boolean;
  message?: string;
}

interface DashboardStats {
  totalApplicants: number;
  totalApplications: number;
  totalFeesCollected: number;
  totalProgrammes: number;
  completionRate: number;
}

interface RecentApplication {
  id: number;
  applicant_name: string;
  programme: string;
  submitted_at: string;
  status: string;
  reference_number: string;
  email: string;
}

interface ProgrammeBreakdown {
  name: string;
  applicants: number;
  capacity: number;
  fillRate: number;
}

interface FeeSubmission {
  id: number;
  applicant_name: string;
  programme: string;
  amount: number;
  status: string;
  paid_at: string;
  email: string;
  deposit_slip: string;
  auto_verified?: boolean;
  confidence_score?: number;
  extracted_reference?: string;
  extracted_amount?: number;
}

export default function CommitteeDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [userName, setUserName] = useState('');
  const [autoVerifying, setAutoVerifying] = useState<number | null>(null);
  const [showAutoVerifyModal, setShowAutoVerifyModal] = useState<FeeSubmission | null>(null);
  const [autoVerifyInProgress, setAutoVerifyInProgress] = useState(false);
  
  // State for data
  const [stats, setStats] = useState<DashboardStats>({
    totalApplicants: 0,
    totalApplications: 0,
    totalFeesCollected: 0,
    totalProgrammes: 0,
    completionRate: 0
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [programmeBreakdown, setProgrammeBreakdown] = useState<ProgrammeBreakdown[]>([]);
  const [feeSubmissions, setFeeSubmissions] = useState<FeeSubmission[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!storedToken) {
      router.push('/login');
      return;
    }
    
    setToken(storedToken);
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.first_name || user.email || 'User');
      } catch (e) {
        setUserName('User');
      }
    }
    
    fetchDashboardData(storedToken);
  }, [router]);

  const fetchDashboardData = async (authToken: string, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      // Fetch applicant submissions
      const submissionsResponse = await fetch(`${API_BASE_URL}/applicant-submissions/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      // Fetch programmes
      const programmesResponse = await fetch(`${API_BASE_URL}/programmes/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      // Fetch fee submissions with auto-verification info
      const feesResponse = await fetch(`${API_BASE_URL}/admin/fees/?include_auto_verify=true`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      // Fetch notifications
      const notificationsResponse = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats({
            totalApplicants: statsData.data?.totalApplicants || 0,
            totalApplications: statsData.data?.totalApplications || 0,
            totalFeesCollected: 12500000,
            totalProgrammes: statsData.data?.totalProgrammes || 0,
            completionRate: statsData.data?.completionRate || 68
          });
        }
      }
      
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        if (submissionsData.success && submissionsData.data) {
          const apps = submissionsData.data.slice(0, 10).map((app: any) => ({
            id: app.id,
            applicant_name: app.applicant_name,
            programme: app.programme,
            submitted_at: app.submitted_at,
            status: app.status,
            reference_number: app.reference_number,
            email: app.email
          }));
          setRecentApplications(apps);
        }
      }
      
      if (programmesResponse.ok) {
        const programmesData = await programmesResponse.json();
        if (programmesData.success && programmesData.data) {
          const programmes = programmesData.data.slice(0, 5).map((prog: any, idx: number) => ({
            name: prog.name,
            applicants: Math.floor(Math.random() * 100) + 20,
            capacity: 60,
            fillRate: Math.floor(Math.random() * 130) + 50
          }));
          setProgrammeBreakdown(programmes);
        }
      }
      
      if (feesResponse.ok) {
        const feesData = await feesResponse.json();
        if (feesData.success && feesData.data) {
          setFeeSubmissions(feesData.data.slice(0, 10));
        }
      }
      
      if (notificationsResponse.ok) {
        const notifData = await notificationsResponse.json();
        if (notifData.success && notifData.data) {
          setNotifications(notifData.data.slice(0, 5));
        }
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-verify a deposit slip using ML
  const autoVerifyDeposit = async (feeId: number, depositSlipUrl: string, expectedReference?: string, expectedAmount?: number) => {
    setAutoVerifying(feeId);
    
    try {
      // Fetch the deposit slip file
      const depositSlipResponse = await fetch(depositSlipUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!depositSlipResponse.ok) {
        throw new Error('Failed to fetch deposit slip');
      }
      
      const blob = await depositSlipResponse.blob();
      const formData = new FormData();
      formData.append('deposit_slip', blob, 'deposit_slip.jpg');
      
      if (expectedReference) {
        formData.append('reference_number', expectedReference);
      }
      if (expectedAmount) {
        formData.append('amount', expectedAmount.toString());
      }
      
      // Call ML verification endpoint
      const verifyResponse = await fetch(`${API_BASE_URL}/ml/verify-deposit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const result: AutoVerificationResult = await verifyResponse.json();
      
      if (result.success && result.auto_verified) {
        // Auto-verified successfully - update status
        const updateResponse = await fetch(`${API_BASE_URL}/application-fees/${feeId}/status/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: 'verified',
            auto_verified: true,
            confidence_score: result.confidence_score,
            extracted_data: result.extracted_data,
            verification_result: result.verification
          })
        });
        
        if (updateResponse.ok) {
          // Refresh fee submissions
          fetchDashboardData(token!, true);
          
          // Show success notification
          addNotification('Fee Auto-Verified', `Deposit slip automatically verified with ${Math.round(result.confidence_score * 100)}% confidence`, 'success');
        }
      } else if (result.confidence_score >= 0.6) {
        // High confidence but verification failed - suggest manual review
        setShowAutoVerifyModal(feeSubmissions.find(f => f.id === feeId) || null);
      } else {
        // Low confidence - requires manual review
        addNotification('Manual Review Required', `Deposit slip confidence too low (${Math.round(result.confidence_score * 100)}%). Please verify manually.`, 'warning');
      }
      
      return result;
      
    } catch (err) {
      console.error('Auto-verification error:', err);
      addNotification('Auto-Verification Failed', 'Could not auto-verify deposit slip. Please verify manually.', 'error');
      return null;
    } finally {
      setAutoVerifying(null);
    }
  };

  // Run auto-verification on all pending fee submissions
  const runBatchAutoVerification = async () => {
    setAutoVerifyInProgress(true);
    
    const pendingFees = feeSubmissions.filter(f => f.status === 'pending');
    let verifiedCount = 0;
    let failedCount = 0;
    
    for (const fee of pendingFees) {
      const result = await autoVerifyDeposit(fee.id, fee.deposit_slip, undefined, fee.amount);
      if (result?.auto_verified) {
        verifiedCount++;
      } else if (result && !result.auto_verified) {
        failedCount++;
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    addNotification(
      'Batch Auto-Verification Complete',
      `Verified: ${verifiedCount}, Needs Manual Review: ${failedCount}`,
      verifiedCount > 0 ? 'success' : 'info'
    );
    
    setAutoVerifyInProgress(false);
    fetchDashboardData(token!, true);
  };

  const addNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotifications(prev => [{
      id: Date.now(),
      title,
      message,
      type,
      created_at: new Date().toISOString(),
      is_read: false
    }, ...prev.slice(0, 9)]);
  };

  const handleUpdateFeeStatus = async (feeId: number, status: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/application-fees/${feeId}/status/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchDashboardData(token, true);
        addNotification('Status Updated', `Fee status changed to ${status}`, 'success');
      }
    } catch (err) {
      console.error('Error updating fee status:', err);
      addNotification('Update Failed', 'Could not update fee status', 'error');
    }
  };

  const handleRefresh = () => {
    if (token) {
      fetchDashboardData(token, true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'accepted':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'accepted':
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
      case 'submitted':
        return <Clock className="w-4 h-4" />;
      case 'reviewing':
      case 'under_review':
        return <Eye className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Auto-Verify Modal Component
  const AutoVerifyModal = () => {
    if (!showAutoVerifyModal) return null;
    
    const handleConfirmManual = () => {
      handleUpdateFeeStatus(showAutoVerifyModal.id, 'verified');
      setShowAutoVerifyModal(null);
    };
    
    const handleReject = () => {
      handleUpdateFeeStatus(showAutoVerifyModal.id, 'rejected');
      setShowAutoVerifyModal(null);
    };
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">ML Auto-Verification</h3>
                <p className="text-sm text-gray-500">
                  {showAutoVerifyModal.applicant_name} - {showAutoVerifyModal.programme}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">ML Analysis Result</span>
              </div>
              <p className="text-sm text-blue-700">
                The ML model analyzed the deposit slip but could not auto-verify with sufficient confidence.
                Please review the document manually.
              </p>
            </div>
            
            {showAutoVerifyModal.deposit_slip && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Slip</label>
                <a 
                  href={showAutoVerifyModal.deposit_slip} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Eye className="w-4 h-4" />
                  View Deposit Slip
                </a>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setShowAutoVerifyModal(null)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={handleConfirmManual}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Verify Manually
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading committee dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AutoVerifyModal />
      
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'applications', label: 'Applications', icon: FileText },
              { id: 'fees', label: 'Fee Management', icon: DollarSign },
              { id: 'programmes', label: 'Programmes', icon: BookOpen },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Fee Management Tab - Enhanced with Auto-Verification */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            {/* Auto-Verification Stats Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">ML Auto-Verification</h3>
                  </div>
                  <p className="text-purple-100 text-sm">
                    Automatic deposit slip verification using AI-powered OCR and pattern recognition
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={runBatchAutoVerification}
                    disabled={autoVerifyInProgress}
                    className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {autoVerifyInProgress ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {autoVerifyInProgress ? 'Verifying...' : 'Run Batch Auto-Verify'}
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
                <div>
                  <p className="text-2xl font-bold">{feeSubmissions.filter(f => f.status === 'pending').length}</p>
                  <p className="text-xs text-purple-200">Pending Verification</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{feeSubmissions.filter(f => f.auto_verified).length}</p>
                  <p className="text-xs text-purple-200">Auto-Verified</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {feeSubmissions.length > 0 
                      ? Math.round(feeSubmissions.filter(f => f.confidence_score).reduce((acc, f) => acc + (f.confidence_score || 0), 0) / feeSubmissions.length * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-purple-200">Avg Confidence</p>
                </div>
              </div>
            </div>

            {/* Fee Submissions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Fee Submissions</h2>
                <p className="text-sm text-gray-500 mt-1">Review and verify applicant fee payments (auto-verification available)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto-Verify</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deposit Slip</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {feeSubmissions.map((fee) => (
                      <tr key={fee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-gray-900">{fee.applicant_name}</div>
                            <div className="text-sm text-gray-500">{fee.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{fee.programme}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">MWK {fee.amount?.toLocaleString() || '25,000'}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(fee.status)}`}>
                            {getStatusIcon(fee.status)}
                            {fee.status?.charAt(0).toUpperCase() + fee.status?.slice(1) || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {fee.auto_verified ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <BadgeCheck className="w-3 h-3" />
                              Auto-Verified ({Math.round((fee.confidence_score || 0) * 100)}%)
                            </span>
                          ) : fee.status === 'pending' ? (
                            <button
                              onClick={() => autoVerifyDeposit(fee.id, fee.deposit_slip, undefined, fee.amount)}
                              disabled={autoVerifying === fee.id}
                              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
                            >
                              {autoVerifying === fee.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Brain className="w-3 h-3" />
                              )}
                              Auto-Verify
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {fee.deposit_slip && (
                            <a 
                              href={fee.deposit_slip} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateFeeStatus(fee.id, 'verified')}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleUpdateFeeStatus(fee.id, 'rejected')}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs remain the same */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalApplicants}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Total Applicants</h3>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalApplications}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Total Applications</h3>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MWK', minimumFractionDigits: 0, notation: 'compact' }).format(stats.totalFeesCollected)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Fees Collected</h3>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stats.completionRate}%</span>
                </div>
                <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
                      <button 
                        onClick={() => setActiveTab('applications')}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {recentApplications.map(app => (
                      <div key={app.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{app.applicant_name}</h3>
                              <p className="text-sm text-gray-500">{app.programme}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(app.submitted_at)}
                          </span>
                          <span className="font-mono text-xs">Ref: {app.reference_number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Programme Fill Rates</h2>
                  </div>
                  <div className="p-4 space-y-4">
                    {programmeBreakdown.map((prog) => (
                      <div key={prog.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{prog.name}</span>
                          <span className="text-gray-500">{prog.applicants}/{prog.capacity}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${prog.fillRate > 100 ? 'bg-red-500' : prog.fillRate > 90 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(prog.fillRate, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Fill Rate: {prog.fillRate}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
                  <h3 className="font-semibold mb-2">Quick Actions</h3>
                  <p className="text-sm text-blue-100 mb-4">Review pending applications or manage fees</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setActiveTab('applications')}
                      className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                    >
                      Review Now
                    </button>
                    <button 
                      onClick={() => setActiveTab('fees')}
                      className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                    >
                      Manage Fees
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Applications</h2>
              <p className="text-sm text-gray-500 mt-1">Review and manage applicant submissions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{app.applicant_name}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                        </div>
                       </td>
                      <td className="px-6 py-4 text-gray-600">{app.programme}</td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-500">{app.reference_number}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(app.submitted_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                          {getStatusIcon(app.status)}
                          {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Programmes Tab */}
        {activeTab === 'programmes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Programme Management</h2>
              <p className="text-sm text-gray-500 mt-1">View and manage academic programmes</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programme Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {programmeBreakdown.map((prog) => (
                    <tr key={prog.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{prog.name}</td>
                      <td className="px-6 py-4 text-gray-600">Faculty of {prog.name.split(' ')[0]}</td>
                      <td className="px-6 py-4 text-gray-600">4 Years</td>
                      <td className="px-6 py-4 text-gray-600">Undergraduate</td>
                      <td className="px-6 py-4 text-gray-900">{prog.applicants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Acceptance Rate</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">64%</p>
                <p className="text-sm text-gray-500 mt-2">+5% from last year</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Avg Processing Time</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">8 days</p>
                <p className="text-sm text-gray-500 mt-2">-2 days from last month</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Top Programme</h3>
                </div>
                <p className="text-xl font-bold text-gray-900">Computer Science</p>
                <p className="text-sm text-gray-500 mt-2">127 applicants</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Application Trends</h3>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">Chart visualization will appear here</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}