'use client';

import { useState, useEffect, useRef } from 'react';
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
  Download,
  Scan,
  Shield,
  Eye,
  X,
  Check,
  AlertTriangle,
  FileWarning
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface DocumentClassificationResult {
  success: boolean;
  document_type: string;
  confidence: number;
  is_valid: boolean;
  extracted_preview?: {
    has_reference: boolean;
    has_amount: boolean;
    has_bank: boolean;
  };
  message?: string;
  error?: string;
}

export default function ApplicationFeesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  
  // Form state
  const [depositReference, setDepositReference] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [depositSlip, setDepositSlip] = useState<File | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'pending' | 'submitted' | 'verified' | 'rejected' | null>(null);
  const [existingFile, setExistingFile] = useState<string | null>(null);
  
  // Document classification state
  const [classifying, setClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<DocumentClassificationResult | null>(null);
  const [showClassificationResults, setShowClassificationResults] = useState(false);
  
  // Warning Modal State
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  // Fee amounts based on program type
  const [programType, setProgramType] = useState<string>('undergraduate');
  const [feeAmount, setFeeAmount] = useState<number>(25000);

  // Auto-redirect countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (redirectCountdown !== null && redirectCountdown > 0) {
      interval = setInterval(() => {
        setRedirectCountdown(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (redirectCountdown === 0) {
      // Redirect to next page
      router.push('/application/referees');
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [redirectCountdown, router]);

  // Poll for fee verification status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (submissionStatus === 'pending' || submissionStatus === 'submitted') {
      // Poll every 5 seconds to check if fee has been verified
      pollInterval = setInterval(async () => {
        if (!token) return;
        
        try {
          const response = await fetch(`${API_BASE_URL}/application-fees/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const status = data.data.status;
              
              // If status changed to verified/approved, update and auto-redirect
              if ((status === 'verified' || status === 'approved') && submissionStatus !== 'verified') {
                setSubmissionStatus('verified');
                setSuccess('✓ Payment verified! Redirecting to next step...');
                
                // Start countdown for auto-redirect (3 seconds)
                setRedirectCountdown(3);
                
                // Clear polling
                if (pollInterval) clearInterval(pollInterval);
              } else if (status === 'rejected' && submissionStatus !== 'rejected') {
                setSubmissionStatus('rejected');
                setError('Your payment was rejected. Please contact support or submit a new payment.');
                
                // Clear polling
                if (pollInterval) clearInterval(pollInterval);
              }
            }
          }
        } catch (err) {
          console.error('Error polling fee status:', err);
        }
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [submissionStatus, token]);

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
        if (data.success && data.data) {
          const status = data.data.status;
          
          if (status === 'pending') {
            setSubmissionStatus('pending');
            if (data.data.file_path) {
              setExistingFile(data.data.file_path);
            }
          } else if (status === 'verified' || status === 'approved') {
            setSubmissionStatus('verified');
            setSuccess('✓ Payment already verified! Redirecting to next step...');
            setRedirectCountdown(3); // Auto-redirect after 3 seconds
          } else if (status === 'rejected') {
            setSubmissionStatus('rejected');
            setError('Your previous payment was rejected. Please submit a new payment.');
          }
        }
      }
    } catch (err) {
      console.error('Error checking existing submission:', err);
    } finally {
      setLoading(false);
    }
  };

  // Classify document using ML endpoint
  const classifyDocument = async (file: File) => {
    setClassifying(true);
    setClassificationResult(null);
    setShowClassificationResults(false);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/ml/classify-document/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setClassificationResult(data);
        setShowClassificationResults(true);
        
        if (data.document_type === 'deposit_slip' && data.is_valid && data.confidence >= 0.6) {
          setSuccess(`✓ Valid deposit slip detected! Confidence: ${(data.confidence * 100).toFixed(1)}%`);
          setTimeout(() => setSuccess(null), 5000);
        } else if (data.document_type === 'deposit_slip' && data.confidence < 0.6) {
          setWarningMessage(
            "The uploaded file may not be a valid bank deposit slip. " +
            "Please ensure you upload a clear image or PDF of your bank deposit slip."
          );
          setShowWarningModal(true);
        } else {
          setWarningMessage(
            `Document classified as "${data.document_type}" (${(data.confidence * 100).toFixed(1)}% confidence).\n\n` +
            "Please upload a valid bank deposit slip showing:\n" +
            "• Bank name and logo\n" +
            "• Deposit reference number\n" +
            "• Amount paid\n" +
            "• Date of transaction"
          );
          setShowWarningModal(true);
          setDepositSlip(null);
          const fileInput = document.getElementById('deposit-slip') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      } else {
        setWarningMessage(
          "We couldn't verify this document. Please upload a clear image or PDF of your bank deposit slip."
        );
        setShowWarningModal(true);
        setDepositSlip(null);
        const fileInput = document.getElementById('deposit-slip') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      console.error('Error classifying document:', err);
      setWarningMessage(
        "An error occurred while validating your document. " +
        "Please ensure the file is not corrupted and try again."
      );
      setShowWarningModal(true);
      setDepositSlip(null);
      const fileInput = document.getElementById('deposit-slip') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } finally {
      setClassifying(false);
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, JPEG, or PNG files are allowed');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      setDepositSlip(file);
      setError(null);
      
      // Classify the document
      await classifyDocument(file);
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
      
      // Include classification data if available
      if (classificationResult) {
        formData.append('document_type', classificationResult.document_type);
        formData.append('classification_confidence', classificationResult.confidence.toString());
      }
      
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
        setClassificationResult(null);
        setShowClassificationResults(false);
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

  // Handle continue (manual)
  const handleContinue = () => {
    if (submissionStatus === 'verified') {
      router.push('/application/referees');
    } else {
      setError('Please wait for payment verification before continuing');
    }
  };

  // Warning Modal Component
  const WarningModal = () => {
    if (!showWarningModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FileWarning className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Document Notice</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 whitespace-pre-line">{warningMessage}</p>
            </div>
            
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-6 rounded">
              <p className="text-sm text-amber-800 font-medium mb-2">What should be on your deposit slip:</p>
              <ul className="text-sm text-amber-700 space-y-1 ml-4">
                <li>• Bank name and logo</li>
                <li>• Deposit reference number</li>
                <li>• Amount paid (MWK)</li>
                <li>• Transaction date</li>
                <li>• Account number</li>
              </ul>
            </div>
            
            <button
              onClick={() => {
                setShowWarningModal(false);
                setWarningMessage('');
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              OK, I Understand
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Success Modal for Auto-redirect
  const SuccessModal = () => {
    if (!redirectCountdown) return null;
    
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full shadow-xl text-center p-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Verified!</h3>
          <p className="text-gray-600 mb-4">
            Your application fee has been successfully verified.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting to next step in <span className="font-bold text-green-600">{redirectCountdown}</span> seconds...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-green-600 rounded-full h-2 transition-all duration-1000"
              style={{ width: `${(3 - redirectCountdown + 1) * 33.33}%` }}
            />
          </div>
          <button
            onClick={() => router.push('/application/referees')}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Continue Now
          </button>
        </div>
      </div>
    );
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
      <WarningModal />
      <SuccessModal />
      
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-3">
                <Banknote className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-800">APPLICATION FEE</h2>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-1.5 rounded-full">
                <Scan className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Document Classification</span>
              </div>
            </div>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                All applicants are required to pay a non-refundable application fee. 
                <span className="font-semibold"> Undergraduate applicants must pay MWK 25,000</span>, while 
                <span className="font-semibold"> postgraduate applicants must pay MWK 40,000</span>.
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
            
            {success && !redirectCountdown && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Classification Results */}
            {showClassificationResults && classificationResult && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 relative">
                <button
                  onClick={() => setShowClassificationResults(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {classificationResult.is_valid && classificationResult.confidence >= 0.6 ? (
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <h3 className="font-semibold text-gray-800">
                        Document Classification Result
                      </h3>
                      {classificationResult.is_valid && classificationResult.confidence >= 0.6 ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Valid
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Review Recommended
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 w-32">Document Type:</span>
                        <span className="font-medium text-gray-800">{classificationResult.document_type}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 w-32">Confidence:</span>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                classificationResult.confidence > 0.7 ? 'bg-green-500' :
                                classificationResult.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${classificationResult.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs mt-1 block">
                            {(classificationResult.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={() => setShowClassificationResults(false)}
                        className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
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
                    Your application fee payment is being verified. You will be automatically redirected once approved.
                  </p>
                </div>
              </div>
            )}

            {submissionStatus === 'verified' && !redirectCountdown && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Payment Verified!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your application fee has been verified. Click Continue to proceed.
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
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
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
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
                    classifying 
                      ? 'border-purple-400 bg-purple-50' 
                      : classificationResult && classificationResult.is_valid
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}>
                    <div className="space-y-2 text-center">
                      {classifying ? (
                        <div className="text-center">
                          <Loader2 className="mx-auto h-12 w-12 text-purple-600 animate-spin" />
                          <p className="text-sm text-purple-600 mt-3 font-medium">Analyzing document...</p>
                          <p className="text-xs text-purple-500 mt-1">Classifying document type</p>
                        </div>
                      ) : (
                        <>
                          <Upload className={`mx-auto h-10 w-10 ${classificationResult && classificationResult.is_valid ? 'text-green-500' : 'text-gray-400'}`} />
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
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PDF, JPG, or PNG files, max size 5MB
                          </p>
                          {depositSlip && (
                            <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center justify-center gap-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700">{depositSlip.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDepositSlip(null);
                                  setClassificationResult(null);
                                  setShowClassificationResults(false);
                                  const input = document.getElementById('deposit-slip') as HTMLInputElement;
                                  if (input) input.value = '';
                                }}
                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Scan className="w-3 h-3 text-purple-500" />
                    Our AI will classify your document to ensure it's a valid bank deposit slip
                  </p>
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
                  disabled={submitting || classifying || !depositSlip}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                      {classificationResult?.is_valid && classificationResult.confidence >= 0.6 && (
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-2">
                          Verified
                        </span>
                      )}
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Navigation Buttons */}
            <div className={`mt-8 pt-6 border-t border-gray-200 flex justify-between ${submissionStatus === 'verified' && !redirectCountdown ? '' : 'flex-row-reverse'}`}>
              {submissionStatus !== 'verified' && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              
              {submissionStatus === 'verified' && !redirectCountdown && (
                <button
                  onClick={handleContinue}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
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