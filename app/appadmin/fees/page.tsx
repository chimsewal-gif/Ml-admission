'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User, Calendar, Eye, Download, X, Search, Filter, Loader, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

type Fee = {
  id: number;
  applicant_name: string;
  programme?: string;
  amount: number;
  status: string;
  deposit_slip: string | null;
  paid_at: string;
  email?: string;
  phone?: string;
};

// Helper to get token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Centered Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />
  };

  const colors = {
    success: 'bg-green-100 border-green-300 text-green-800',
    error: 'bg-red-100 border-red-300 text-red-800',
    info: 'bg-blue-100 border-blue-300 text-blue-800'
  };

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${colors[type]} min-w-[300px] max-w-[500px]`}>
        {icons[type]}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function FeesPage() {
  const router = useRouter();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Create axios instance with auth header
  const apiClient = () => {
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
  };

  // Fetch fees function - can be called manually
  const fetchFees = useCallback(async (showFullLoading = true) => {
    try {
      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');
      
      const token = getToken();
      if (!token) {
        setError('Please login to view fees');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const client = apiClient();
      if (!client) {
        setError('Authentication error');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await client.get('/admin/fees');
      
      console.log('Fees response:', res.data);
      
      let feesData = [];
      if (res.data.success && Array.isArray(res.data.data)) {
        feesData = res.data.data;
      } else if (Array.isArray(res.data)) {
        feesData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        feesData = res.data.data;
      } else {
        console.error('Unexpected response format:', res.data);
        setError('Unexpected response format from server');
      }
      
      setFees(feesData);
      showToast(`Loaded ${feesData.length} payment records`, 'success');
    } catch (err: any) {
      console.error('Failed to fetch fees:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        showToast('Session expired. Please log in again.', 'error');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (err.response?.status === 404) {
        setError('Fees endpoint not found. Please check if the backend is running.');
        showToast('Fees endpoint not found. Check backend connection.', 'error');
      } else {
        const errorMessage = err.response?.data?.message || 'Failed to fetch fees';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFees(true);
  }, [fetchFees]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'verified':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MWK', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter fees by search & status
  const filteredFees = fees.filter(
    (fee) =>
      fee.applicant_name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter ? fee.status.toLowerCase() === statusFilter.toLowerCase() : true)
  );

  const openModal = (fee: Fee) => {
    setSelectedFee(fee);
    setModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setSelectedFee(null);
    setModalOpen(false);
    setError('');
  };

  const updateFeeStatus = async (newStatus: string) => {
    if (!selectedFee) return;

    setUpdatingId(selectedFee.id);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        setError('Please login to update status');
        showToast('Please login to update status', 'error');
        setUpdatingId(null);
        return;
      }

      const client = apiClient();
      if (!client) {
        setError('Authentication error');
        showToast('Authentication error', 'error');
        setUpdatingId(null);
        return;
      }

      const response = await client.patch(
        `/application-fees/${selectedFee.id}/status`,
        { status: newStatus }
      );

      console.log('Update response:', response.data);

      if (response.data.success) {
        await fetchFees(false);
        closeModal();
        
        // Show success toast
        const statusMessage = newStatus === 'accepted' ? 'accepted ✅' : 'rejected ❌';
        showToast(`${selectedFee.applicant_name}'s payment has been ${statusMessage}`, 'success');
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
      
    } catch (err: any) {
      console.error('Failed to update status:', err);
      
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        showToast('Session expired. Please log in again.', 'error');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (err.response?.status === 404) {
        setError('Fee record not found. It may have been deleted.');
        showToast('Fee record not found', 'error');
      } else {
        const errorMessage = err.response?.data?.message || 
                            err.response?.data?.error || 
                            'Failed to update status. Please try again.';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Function to get full URL for deposit slip
  const getDepositSlipUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    let cleanPath = path;
    if (cleanPath.startsWith('/media/media/')) {
      cleanPath = cleanPath.replace('/media/media/', '/media/');
    }
    return `${API_BASE_URL.replace('/api', '')}${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 sm:p-6">
      {/* Centered Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Application Fees</h1>
              <p className="text-gray-600">Manage and review all fee payments and deposits</p>
              {fees.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">Total: {fees.length} payment(s)</p>
              )}
            </div>
            <button
              onClick={() => fetchFees(false)}
              disabled={refreshing || loading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-500" />
                <span className="text-red-600 text-sm font-medium">{error}</span>
              </div>
              {error.includes('login') && (
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by applicant name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="accepted">Accepted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading fee payments...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                    <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider">#</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider">Applicant</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider">Action</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider">Deposit Slip</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold uppercase tracking-wider">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredFees.length > 0 ? (
                    filteredFees.map((fee, idx) => (
                      <tr key={fee.id} className="hover:bg-green-50/50 transition-all duration-200 group">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{idx + 1}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{fee.applicant_name}</div>
                              {fee.programme && (
                                <div className="text-xs text-gray-500">{fee.programme}</div>
                              )}
                              {fee.email && (
                                <div className="text-xs text-gray-400">{fee.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(fee.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(fee.status)}`}>
                            {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {(fee.status.toLowerCase() === 'pending' || fee.status.toLowerCase() === 'verified') && (
                            <button
                              onClick={() => openModal(fee)}
                              disabled={updatingId === fee.id}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              {updatingId === fee.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                'Update Status'
                              )}
                            </button>
                          )}
                          {fee.status.toLowerCase() === 'accepted' && (
                            <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                          )}
                          {fee.status.toLowerCase() === 'rejected' && (
                            <span className="text-xs text-red-600 font-medium">✗ Rejected</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {fee.deposit_slip ? (
                            <div className="flex space-x-2">
                              <a
                                href={getDepositSlipUrl(fee.deposit_slip)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs transition-colors"
                              >
                                <Eye className="w-3 h-3" /> <span>View</span>
                              </a>
                              <a
                                href={getDepositSlipUrl(fee.deposit_slip)}
                                download
                                className="inline-flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-xs transition-colors"
                              >
                                <Download className="w-3 h-3" /> <span>Download</span>
                              </a>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No slip</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formatDate(fee.paid_at)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-lg font-medium text-gray-900">No fee payments found</p>
                            <p className="text-gray-500 text-sm mt-1">
                              {search || statusFilter 
                                ? 'Try adjusting your search or filters' 
                                : 'There are no fee payments to display at this time.'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with count */}
            {filteredFees.length > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredFees.length}</span> of{' '}
                  <span className="font-medium">{fees.length}</span> payment(s)
                  {statusFilter && ` (filtered by: ${statusFilter})`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {modalOpen && selectedFee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={closeModal}
                disabled={updatingId !== null}
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold text-gray-900 mb-4">Update Payment Status</h2>
              
              <div className="mb-6 space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Applicant</p>
                  <p className="font-semibold text-gray-900">{selectedFee.applicant_name}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(selectedFee.amount)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Current Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedFee.status)}`}>
                    {selectedFee.status.charAt(0).toUpperCase() + selectedFee.status.slice(1)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => updateFeeStatus('rejected')}
                  disabled={updatingId !== null}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingId === selectedFee.id ? <Loader className="w-4 h-4 animate-spin" /> : 'Reject Payment'}
                </button>
                <button
                  onClick={() => updateFeeStatus('accepted')}
                  disabled={updatingId !== null}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {updatingId === selectedFee.id ? <Loader className="w-4 h-4 animate-spin" /> : 'Accept Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}