// app/application-fees/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ChevronLeft,
  FileText,
  Loader2,
  Banknote,
  Receipt,
  Download
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function ApplicationFeesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [depositReference, setDepositReference] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [depositSlip, setDepositSlip] = useState<File | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'pending' | 'submitted' | 'verified' | 'rejected' | null>(null);
  const [existingFile, setExistingFile] = useState<string | null>(null);
  
  // Fee amounts based on program type
  const [programType, setProgramType] = useState<string>('undergraduate');
  const [feeAmount, setFeeAmount] = useState<number>(25000);

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchCurrentUser(storedToken);
  }, [router]);

  // Fetch current user and check existing submission
  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        const userData = await res.json();
        const userId = userData.id;
        setApplicantId(userId);
        
        // Check user's program type to determine fee amount
        const role = userData.role || 'guest';
        if (role === 'postgraduate' || role === 'masters') {
          setProgramType('postgraduate');
          setFeeAmount(40000);
        } else {
          setProgramType('undergraduate');
          setFeeAmount(25000);
        }
        
        await checkExistingSubmission(authToken, userId);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError('Failed to load user information');
      setLoading(false);
    }
  };

  // Check if user has already submitted fees
  const checkExistingSubmission = async (authToken: string, userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/application-fees/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.status === 'pending') {
          setSubmissionStatus('pending');
          if (data.data.file_path) {
            setExistingFile(data.data.file_path);
          }
        } else if (data.data && (data.data.status === 'verified' || data.data.status === 'approved')) {
          setSubmissionStatus('verified');
        }
      }
    } catch (err) {
      console.error('Error checking existing submission:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        e.target.value = '';
        return;
      }
      
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        e.target.value = '';
        return;
      }
      
      setDepositSlip(file);
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!depositReference.trim()) {
      setError('Deposit reference number is required');
      return;
    }
    
    if (!amountPaid) {
      setError('Amount paid is required');
      return;
    }
    
    const amount = parseFloat(amountPaid);
    if (isNaN(amount) || amount < feeAmount) {
      setError(`Amount must be at least MWK ${feeAmount.toLocaleString()}`);
      return;
    }
    
    if (!depositSlip) {
      setError('Please upload your bank deposit slip');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('deposit_slip', depositSlip);
      formData.append('reference_number', depositReference);
      formData.append('amount', amountPaid);
      
      const response = await fetch(`${API_BASE_URL}/application-fees/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Application fee submitted successfully! Your payment is being verified.');
        setSubmissionStatus('pending');
        setDepositReference('');
        setAmountPaid('');
        setDepositSlip(null);
        // Reset file input
        const fileInput = document.getElementById('deposit-slip') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.message || 'Failed to submit application fee');
      }
    } catch (err) {
      console.error('Error submitting fee:', err);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/application/documents');
  };

  // Handle continue
  const handleContinue = () => {
    if (submissionStatus === 'verified' || submissionStatus === 'submitted') {
      router.push('/application/referees');
    } else {
      setError('Please submit your application fee before continuing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application fee information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Banknote className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">APPLICATION FEE</h2>
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                All applicants are required to pay a non-refundable application fee. 
                <span className="font-semibold"> Undergraduate applicants must pay MWK 25,000</span>, while 
                <span className="font-semibold"> postgraduate applicants must pay MWK 40,000</span>. 
                Ensure the amount paid is correct and that your deposit reference number matches your payment proof.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Fee Summary Card */}
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Application Type</p>
                  <p className="text-lg font-semibold text-gray-800 capitalize">
                    {programType === 'postgraduate' ? 'Postgraduate Program' : 'Undergraduate Program'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Application Fee (Non-refundable)</p>
                  <p className="text-2xl font-bold text-green-700">MWK {feeAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Submission Status */}
            {submissionStatus === 'pending' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Payment Under Review</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Your application fee payment is being verified. You will be notified once approved.
                  </p>
                </div>
              </div>
            )}

            {submissionStatus === 'verified' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Payment Verified</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your application fee has been verified. You can proceed with your application.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Form - Only show if not already submitted/verified */}
            {submissionStatus !== 'verified' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Deposit Reference Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Reference Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={depositReference}
                      onChange={(e) => setDepositReference(e.target.value)}
                      placeholder="Enter deposit reference number..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the reference number from your bank deposit slip
                  </p>
                </div>

                {/* Amount Paid */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount Paid <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">MWK</span>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="Enter amount paid..."
                      className="w-full pl-16 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum amount: MWK {feeAmount.toLocaleString()}
                  </p>
                </div>

                {/* Upload Bank Deposit Slip */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Bank Deposit Slip <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors">
                    <div className="space-y-2 text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="deposit-slip"
                          className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="deposit-slip"
                            name="deposit-slip"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF files only, max size 2MB
                      </p>
                      {depositSlip && (
                        <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700">{depositSlip.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setDepositSlip(null);
                              const input = document.getElementById('deposit-slip') as HTMLInputElement;
                              if (input) input.value = '';
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Bank Account Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Bank Name:</span>
                      <span className="font-medium text-gray-800">National Bank of Malawi</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Account Name:</span>
                      <span className="font-medium text-gray-800">MZUNI Admissions</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-medium text-gray-800">1001234567890</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Branch:</span>
                      <span className="font-medium text-gray-800">City Centre, Lilongwe</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Submit Application Fee
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Navigation Buttons */}
            <div className={`mt-8 pt-6 border-t border-gray-200 flex justify-between ${submissionStatus === 'verified' ? '' : 'flex-row-reverse'}`}>
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              {submissionStatus === 'verified' && (
                <button
                  onClick={handleContinue}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}