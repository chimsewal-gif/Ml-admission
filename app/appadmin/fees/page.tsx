'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { User, Calendar, Eye, Download, X, Search, Filter, Loader } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

type Fee = {
  id: number;
  applicant_name: string;
  programme?: string;
  amount: number;
  status: string;
  deposit_slip: string | null;
  paid_at: string;
};

export default function FeesPage() {
  const router = useRouter();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const token = Cookies.get('token');
        if (!token) return router.push('/login');

        const res = await axios.get(`${API_BASE_URL}/admin/fees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Handle different response formats
        const feesData = res.data.data || res.data;
        setFees(Array.isArray(feesData) ? feesData : []);
      } catch (err: any) {
        console.error('Failed to fetch fees:', err);
        const errorMessage = err.response?.data?.message || 'Failed to fetch fees';
        setError(errorMessage);
        
        if (err.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFees();
  }, [router]);

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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);

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
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Use the correct endpoint from your API routes
      const response = await axios.patch(
        `${API_BASE_URL}/application-fees/${selectedFee.id}/status`,
        { 
          status: newStatus,
          // Some APIs might expect different field names, try these if the above doesn't work:
          // 'status': newStatus,
          // 'payment_status': newStatus,
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          } 
        }
      );

      console.log('Update response:', response.data);

      // Update local state
      setFees((prev) =>
        prev.map((fee) => 
          fee.id === selectedFee.id ? { ...fee, status: newStatus } : fee
        )
      );
      
      closeModal();
      
      // Show success message
      alert(`Status updated to ${newStatus} successfully!`);
      
    } catch (err: any) {
      console.error('Failed to update status:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to update status. Please try again.';
      setError(errorMessage);
      
      // Show specific error messages for common issues
      if (err.response?.status === 404) {
        setError('Fee record not found. It may have been deleted.');
      } else if (err.response?.status === 422) {
        setError('Invalid status value. Please try again.');
      } else if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
        router.push('/login');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Alternative update function if the above doesn't work
  const updateFeeStatusAlternative = async (newStatus: string) => {
    if (!selectedFee) return;

    setUpdatingId(selectedFee.id);
    setError('');

    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Try PUT method instead of PATCH
      const response = await axios.put(
        `${API_BASE_URL}/application-fees/${selectedFee.id}`,
        { 
          status: newStatus 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('Update response:', response.data);

      // Update local state
      setFees((prev) =>
        prev.map((fee) => 
          fee.id === selectedFee.id ? { ...fee, status: newStatus } : fee
        )
      );
      
      closeModal();
      alert(`Status updated to ${newStatus} successfully!`);
      
    } catch (err: any) {
      console.error('Failed to update status (alternative):', err);
      const errorMessage = err.response?.data?.message || 'Failed to update status';
      setError(errorMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Application Fees</h1>
          <p className="text-gray-600">Manage and review all fee payments and deposits</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-600 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by applicant"
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
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="approved">Approved</option>
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
              <table className="w-full min-w-[600px]">
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
                        <td className="px-4 py-4 whitespace-nowrap">{idx + 1}</td>
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
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(fee.amount)}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(fee.status)}`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {fee.status.toLowerCase() === 'pending' && (
                            <button
                              onClick={() => openModal(fee)}
                              disabled={updatingId === fee.id}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {updatingId === fee.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                'Update Status'
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {fee.deposit_slip ? (
                            <div className="flex space-x-2">
                              <a
                                href={fee.deposit_slip}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs"
                              >
                                <Eye className="w-3 h-3" /> <span>View</span>
                              </a>
                              <a
                                href={fee.deposit_slip}
                                download
                                className="inline-flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-xs"
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
                            <span className="text-sm">{new Date(fee.paid_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No fee payments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {modalOpen && selectedFee && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                onClick={closeModal}
                disabled={updatingId !== null}
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-lg font-bold mb-4">Update Payment Status</h2>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Applicant: <span className="font-semibold">{selectedFee.applicant_name}</span>
                </p>
                <p className="text-gray-700">
                  Amount: <span className="font-semibold">{formatCurrency(selectedFee.amount)}</span>
                </p>
                <p className="text-gray-700">
                  Current Status: <span className={`font-semibold ${getStatusColor(selectedFee.status)} px-2 py-1 rounded`}>
                    {selectedFee.status}
                  </span>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => updateFeeStatus('rejected')}
                  disabled={updatingId !== null}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updatingId === selectedFee.id ? <Loader className="w-4 h-4 animate-spin" /> : 'Reject'}
                </button>
                <button
                  onClick={() => updateFeeStatus('accepted')}
                  disabled={updatingId !== null}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {updatingId === selectedFee.id ? <Loader className="w-4 h-4 animate-spin" /> : 'Accept'}
                </button>
              </div>

              {/* Debug info */}
              <div className="mt-4 p-2 bg-gray-50 rounded text-xs text-gray-500">
                <p>Fee ID: {selectedFee.id}</p>
                <p>Endpoint: {API_BASE_URL}/application-fees/{selectedFee.id}/status</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}