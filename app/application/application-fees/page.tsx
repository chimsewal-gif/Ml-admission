'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Receipt, ArrowRight, CheckCircle, AlertCircle, Eye, Download, RefreshCw } from 'lucide-react';
import ProgressIndicator from '@/componets/ProgressIndicator';
import Button2 from '@/componets/Button2';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface PaymentData {
  status: string;
  file_path?: string;
  file_name?: string;
  uploaded_at?: string;
  amount?: number;
  submitted_date?: string;
}

export default function ApplicationFeesPage() {
  const [depositSlip, setDepositSlip] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  const router = useRouter();

  const bankName = 'National Bank of Malawi';
  const accountNumber = '000123456789';
  const accountName = 'University of Malawi - Applications';
  const applicationAmount = 'MK 25,000';

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch payment status
  const fetchPaymentStatus = async (token: string, userId: number) => {
    try {
      setFetchingStatus(true);
      const res = await fetch(`${API_BASE_URL}/application-fees/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setPaymentData(data.data);
          console.log('Payment data:', data.data);
        }
      } else if (res.status !== 404) {
        console.log('No payment found or error fetching');
      }
    } catch (err) {
      console.error('Error fetching payment status:', err);
    } finally {
      setFetchingStatus(false);
    }
  };

  // Fetch authenticated user on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUser(token);
  }, [router]);

  const fetchUser = async (token: string) => {
    try {
      setUserLoading(true);
      const res = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data && data.id) {
        setUserId(data.id);
        // Fetch payment status after getting user ID
        await fetchPaymentStatus(token, data.id);
      } else {
        throw new Error('User ID not found in response');
      }
    } catch (err: any) {
      console.error('User fetch error:', err);
      setError('Failed to fetch authenticated user. Please log in again.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } finally {
      setUserLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDepositSlip(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = getToken();

    if (!token) {
      setError('User not authenticated. Please log in again.');
      router.push('/login');
      return;
    }

    if (!userId) {
      setError('User information not loaded. Please try again.');
      return;
    }

    if (!depositSlip) {
      setError('Please upload your deposit slip.');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(depositSlip.type)) {
      setError('Please upload a valid file (JPG, PNG, or PDF).');
      return;
    }

    // Validate file size (5MB max)
    if (depositSlip.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('deposit_slip', depositSlip);

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/application-fees/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      let data;
      const contentType = res.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Unexpected response from server');
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
      }

      setSuccess('Deposit slip submitted successfully! Your application is being processed.');
      setDepositSlip(null);
      
      // Refresh payment status
      await fetchPaymentStatus(token, userId);
      
      // Clear file input
      const fileInput = document.getElementById('depositSlip') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Redirect after short delay if not pending
      if (paymentData?.status !== 'pending') {
        setTimeout(() => {
          router.push('/application/submit');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      
      if (err.message.includes('401') || err.message.includes('unauthorized')) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(err.message || 'Error uploading deposit slip. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewSlip = () => {
    if (paymentData?.file_path) {
      const url = `${API_BASE_URL.replace('/api', '')}${paymentData.file_path}`;
      window.open(url, '_blank');
    }
  };

  const handleDownloadSlip = () => {
    if (paymentData?.file_path) {
      const url = `${API_BASE_URL.replace('/api', '')}${paymentData.file_path}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = paymentData.file_name || 'deposit_slip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'verified':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Your payment is pending review. We will notify you once verified.';
      case 'verified':
        return 'Your payment has been verified. You can now submit your application.';
      case 'approved':
        return 'Your payment has been approved!';
      case 'rejected':
        return 'Your payment was rejected. Please upload a valid deposit slip.';
      default:
        return 'Please upload your deposit slip to complete your application.';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state while fetching user
  if (userLoading || fetchingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  // Check if payment is already submitted and approved/verified
  const isPaymentComplete = paymentData && (paymentData.status === 'verified' || paymentData.status === 'approved');
  const hasExistingPayment = paymentData && paymentData.status !== 'pending' && paymentData.file_path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <ProgressIndicator currentStep={10} />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-6">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Application Fee Payment
                </h1>
                <p className="text-green-100 text-lg">
                  {isPaymentComplete ? 'Payment Completed' : 'Complete your application payment'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            {/* Existing Payment Status */}
            {hasExistingPayment && (
              <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: `${getStatusColor(paymentData.status).split(' ')[0]}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {paymentData.status === 'verified' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                    {paymentData.status === 'pending' && <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />}
                    {paymentData.status === 'rejected' && <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                    <div>
                      <h3 className="font-semibold text-gray-900">Payment Status: {paymentData.status?.toUpperCase()}</h3>
                      <p className="text-sm text-gray-600 mt-1">{getStatusMessage(paymentData.status)}</p>
                      {paymentData.uploaded_at && (
                        <p className="text-xs text-gray-500 mt-2">Submitted on: {formatDate(paymentData.uploaded_at)}</p>
                      )}
                    </div>
                  </div>
                  {paymentData.file_path && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleViewSlip}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={handleDownloadSlip}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Instructions */}
              <div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-green-800 mb-4 flex items-center text-lg">
                    <Building2 className="mr-2" size={24} />
                    Payment Instructions
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-green-100">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Bank:</span>
                          <span className="text-green-800 font-semibold">{bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Account Number:</span>
                          <span className="text-green-800 font-semibold">{accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Account Name:</span>
                          <span className="text-green-800 font-semibold">{accountName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Amount:</span>
                          <span className="text-green-800 font-semibold text-lg">{applicationAmount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Important Notes:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Payment must be made using the exact amount specified</li>
                        <li>• Keep your bank receipt for reference</li>
                        <li>• Processing may take up to 24 hours</li>
                        <li>• Contact admissions@unima.mw if you encounter issues</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Form - Only show if payment is not already verified/approved */}
              {!isPaymentComplete && (
                <div>
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                      Upload Deposit Slip
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Select your deposit slip *
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors duration-200">
                          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 mb-3">
                            Drag and drop your file here or click to browse
                          </p>
                          <input
                            type="file"
                            id="depositSlip"
                            name="depositSlip"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="depositSlip"
                            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-green-700 transition-colors duration-200"
                          >
                            Choose File
                          </label>
                          <p className="text-xs text-gray-500 mt-3">
                            Supported formats: JPG, PNG, PDF (Max: 5MB)
                          </p>
                        </div>

                        {depositSlip && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                <span className="text-sm text-green-800 font-medium">
                                  {depositSlip.name}
                                </span>
                              </div>
                              <span className="text-xs text-green-600">
                                {(depositSlip.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button2
                        type="submit"
                        disabled={loading || !depositSlip}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            Submit Deposit Slip
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </div>
                        )}
                      </Button2>
                    </form>
                  </div>
                </div>
              )}

              {/* Payment Complete Message */}
              {isPaymentComplete && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Verified!</h3>
                  <p className="text-gray-600 mb-6">
                    Your payment has been verified. You can now proceed to submit your application.
                  </p>
                  <Button2
                    onClick={() => router.push('/application/submit')}
                    className="w-full"
                  >
                    Continue to Submit Application
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button2>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
              <Button2
                type="button"
                onClick={() => router.push('/application/documents')}
                variant="outline"
              >
                Back
              </Button2>
              
              {!isPaymentComplete && paymentData?.status !== 'pending' && (
                <Button2
                  type="button"
                  onClick={() => router.push('/application/submit')}
                  variant="outline"
                >
                  Skip for Now
                </Button2>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}