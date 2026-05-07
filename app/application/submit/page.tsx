'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, AlertCircle, FileText, User, Phone, BookOpen, 
  ChevronRight, Download, Mail, MailCheck, MailWarning, 
  GraduationCap, Calendar, MapPin, IdCard, Award, Clock,
  ExternalLink, Printer, Home, Building2, Smartphone, Mail as MailIcon,
  Shield, TrendingUp, Sparkles, Star, Heart, ThumbsUp, FileDown,
  Eye, EyeOff, Scale, PenTool, FileCheck, ClipboardList, 
  Edit3, ShieldCheck, Fingerprint, BadgeCheck, Flag, Gavel,
  ScrollText, PenSquare, CheckSquare, X, CreditCard, Bell, AlertTriangle
} from 'lucide-react';
import Breadcrumb from '@/componets/Breadcrumb';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface SubjectRecord {
  qualification: string;
  centreNumber: string;
  examNumber: string;
  subject: string;
  grade: string;
  year: string;
}

interface PersonalData {
  firstname?: string;
  lastname?: string;
  email?: string;
  dob?: string;
  programme_id?: string;
  programme_name?: string;
  id?: number;
  phone?: string;
  physical_address?: string;
  gender?: string;
  nationality?: string;
  national_id?: string;
  home_district?: string;
}

interface ProgrammeChoice {
  choice_number: number;
  programme_id: number;
  programme_name: string;
  department: string;
  duration: string;
  category: string;
}

interface NextOfKin {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  relationship: string;
  mobile1: string;
  mobile2?: string;
  email?: string;
  address?: string;
}

interface ApplicationData {
  personal: PersonalData | null;
  nextOfKin: NextOfKin[];
  subjects: SubjectRecord[];
  programmeChoices: ProgrammeChoice[];
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    reference_number: string;
    status: string;
    submitted_at: string;
    programme_name: string;
  };
  email_sent: boolean;
  is_duplicate: boolean;
}

const getRankSuffix = (rank: number): string => {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
};

export default function FinalSubmitPage() {
  const router = useRouter();
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ApplicationData>({
    personal: null,
    nextOfKin: [],
    subjects: [],
    programmeChoices: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [html2pdf, setHtml2pdf] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [declarationText, setDeclarationText] = useState('');
  const [checkingSubmissionStatus, setCheckingSubmissionStatus] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    import('html2pdf.js').then((module) => {
      setHtml2pdf(() => module.default);
    });
  }, []);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const token = getToken();

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 
      Authorization: `Bearer ${token}`, 
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
  });

  // Check if application is already submitted
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      if (!token) {
        setCheckingSubmissionStatus(false);
        return;
      }

      try {
        const statusAxios = axios.create({
          baseURL: API_BASE_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const response = await statusAxios.get('/submission-status/');
        if (response.data && response.data.submitted) {
          setAlreadySubmitted(true);
          setSubmitted(true);
          setReferenceNumber(response.data.reference_number || 'Already Submitted');
          setSubmissionData(response.data.submission);
        }
      } catch (err) {
        console.warn('Could not check submission status:', err);
      } finally {
        setCheckingSubmissionStatus(false);
      }
    };

    checkSubmissionStatus();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('You must be logged in to view this page.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const userRes = await axiosInstance.get('/me/');
        const userData = userRes.data;

        let programmeChoices: ProgrammeChoice[] = [];
        try {
          const choicesRes = await axiosInstance.get('/applicants/programme-choices');
          if (choicesRes.data.success && choicesRes.data.choices) {
            programmeChoices = choicesRes.data.choices;
          }
        } catch (choicesErr) {
          console.warn('No programme choices found:', choicesErr);
        }

        const requests = [
          axiosInstance.get('/next-of-kin/').catch(err => ({ data: { data: [] } })),
          axiosInstance.get('/subject-records/').catch(err => ({ data: { data: [] } })),
          axiosInstance.get('/personal-details/').catch(err => ({ data: { data: {} } }))
        ];

        const [kinRes, subjectsRes, personalDetailsRes] = await Promise.all(requests);
        
        const subjectsData = subjectsRes.data;
        let subjectRecords: SubjectRecord[] = [];
        
        if (subjectsData) {
          if (subjectsData.data && Array.isArray(subjectsData.data)) {
            subjectRecords = subjectsData.data.map((r: any) => ({
              qualification: r.qualification || '',
              centreNumber: r.centre_number || r.centreNumber || '',
              examNumber: r.exam_number || r.examNumber || '',
              subject: r.subject || '',
              grade: r.grade || '',
              year: r.year || '',
            }));
          }
        }

        const kinData = kinRes.data;
        let nextOfKinData: NextOfKin[] = [];
        
        if (kinData && kinData.data) {
          nextOfKinData = Array.isArray(kinData.data) ? kinData.data : [kinData.data];
        }

        const firstChoice = programmeChoices.find(c => c.choice_number === 1);
        const programmeName = firstChoice?.programme_name || 'Not selected';
        const programmeId = firstChoice?.programme_id || null;

        const personalDetails = personalDetailsRes.data.data || {};

        const fullName = `${userData.first_name || userData.firstname || ''} ${userData.last_name || userData.lastname || ''}`.trim();
        setDeclarationText(fullName);

        setData({
          personal: {
            firstname: userData.first_name || userData.firstname,
            lastname: userData.last_name || userData.lastname,
            email: userData.email,
            programme_id: programmeId?.toString(),
            programme_name: programmeName,
            id: userData.id,
            phone: personalDetails.phone || '',
            physical_address: personalDetails.physical_address || '',
            gender: personalDetails.gender || '',
            nationality: personalDetails.nationality || '',
            national_id: personalDetails.national_id || '',
            home_district: personalDetails.home_district || '',
            dob: personalDetails.date_of_birth || '',
          },
          nextOfKin: nextOfKinData,
          subjects: subjectRecords,
          programmeChoices: programmeChoices,
        });

      } catch (err: any) {
        console.error('Error fetching applicant data:', err);
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
          }, 2000);
        } else {
          setError('Failed to load application data. Please try refreshing the page.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, router]);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show warning modal if already submitted
    if (alreadySubmitted) {
      setShowWarningModal(true);
      return;
    }
    
    if (!declarationChecked) {
      alert('Please declare that the information provided is correct before submitting.');
      return;
    }
    
    if (submitted) {
      setShowWarningModal(true);
      return;
    }
    
    setError(null);
    setValidationErrors({});
    setLoading(true);
    setEmailStatus('idle');

    const currentToken = getToken();

    if (!currentToken) {
      alert('You must be logged in to submit.');
      setLoading(false);
      router.push('/login');
      return;
    }

    try {
      const firstChoice = data.programmeChoices.find(c => c.choice_number === 1);
      const programmeId = firstChoice?.programme_id || data.personal?.programme_id;

      if (!programmeId) {
        alert('Please select at least one programme before submitting.');
        setLoading(false);
        return;
      }

      const submitAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: { 
          Authorization: `Bearer ${currentToken}`, 
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
      });

      const res = await submitAxios.post<SubmissionResponse>('/submit/', {
        programme_id: parseInt(programmeId.toString()),
        declaration_confirmed: true,
        declared_by: declarationText,
        declared_at: new Date().toISOString()
      });

      if (res.data.success) {
        const submissionRef = res.data.data?.reference_number;
        setReferenceNumber(submissionRef || generateReferenceNumber());
        setSubmitted(true);
        setAlreadySubmitted(true);
        setIsDuplicate(res.data.is_duplicate || false);
        setSubmissionData(res.data.data);
        setEmailStatus(res.data.email_sent ? 'sent' : 'failed');
        alert('✅ Application submitted successfully! Your reference number is: ' + (submissionRef || generateReferenceNumber()));
      } else {
        throw new Error(res.data.message || 'Submission failed');
      }

    } catch (err: any) {
      console.error('Submission error:', err);
      
      if (err.response?.status === 409) {
        setSubmitted(true);
        setAlreadySubmitted(true);
        setIsDuplicate(true);
        const duplicateData = err.response.data.submission || err.response.data.data || {};
        setReferenceNumber(duplicateData.reference_number || 'Already Submitted');
        setSubmissionData(duplicateData);
        setEmailStatus(err.response.data.email_sent ? 'sent' : 'failed');
        setShowWarningModal(true);
      } else {
        const errorMessage = err.response?.data?.message || 'An error occurred while submitting your application.';
        setError(errorMessage);
        alert('❌ Error: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReferenceNumber = () => {
    const prefix = 'MZU';
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${date}-${random}`;
  };

  const handlePrintApplication = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!pdfContentRef.current || !html2pdf) return;
    
    setDownloading(true);
    
    const element = pdfContentRef.current;
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Mzuni_Application_${referenceNumber || 'Summary'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!submissionData) return;
    
    setEmailStatus('sending');
    try {
      const currentToken = getToken();
      if (!currentToken) throw new Error('No token');
      
      const resendAxios = axios.create({
        baseURL: API_BASE_URL,
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      
      await resendAxios.post('/resend-confirmation/', { submission_id: submissionData.id });
      setEmailStatus('sent');
      alert('Confirmation email resent successfully!');
    } catch (error) {
      console.error('Failed to resend email:', error);
      setEmailStatus('failed');
      alert('Failed to resend confirmation email. Please try again later.');
    }
  };

  const handleGoToPayments = () => {
    setShowWarningModal(false);
    router.push('/payments');
  };

  const calculateCompletion = () => {
    let total = 0;
    let completed = 0;
    
    if (data.personal?.firstname && data.personal?.lastname) completed++;
    total++;
    
    if (data.nextOfKin.length > 0) completed++;
    total++;
    
    if (data.subjects.length > 0) completed++;
    total++;
    
    if (data.programmeChoices.length >= 6) completed++;
    total++;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const completionPercentage = calculateCompletion();
  const canSubmit = !alreadySubmitted && data.programmeChoices.length >= 6 && data.subjects.length > 0 && data.nextOfKin.length > 0 && declarationChecked;

  if ((loading && !data.personal) || checkingSubmissionStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your application data...</p>
        </div>
      </div>
    );
  }

  const PDFContent = () => (
    <div ref={pdfContentRef} className="hidden">
      <div className="p-8 max-w-4xl mx-auto bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="text-center mb-8 pb-6 border-b-2 border-blue-600">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Image
                src="/logo.jpeg"
                alt="Mzuzu University Logo"
                width={56}
                height={56}
                className="rounded-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'text-white text-2xl';
                    fallback.innerHTML = '🎓';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Mzuzu University</h1>
          <p className="text-gray-600">e-Admission Portal</p>
          <h2 className="text-xl font-semibold text-gray-700 mt-4">Application Declaration & Summary</h2>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg mb-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <Gavel className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <p className="text-lg font-semibold text-blue-800 mb-2">DECLARATION</p>
              <p className="text-gray-700 italic">
                "I, <span className="font-semibold not-italic">{declarationText || '_____________________'}</span>, 
                hereby declare that all the information provided in this application is true, accurate, and complete 
                to the best of my knowledge. I understand that any false or misleading information may result in 
                the rejection of my application or cancellation of admission."
              </p>
              <p className="text-sm text-gray-500 mt-3">
                Declared on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-3 pb-2 border-b border-gray-200">Application Reference</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-700 font-mono">{referenceNumber || submissionData?.reference_number || 'Pending'}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-3 pb-2 border-b border-gray-200">Programme Choices</h3>
          {data.programmeChoices.length > 0 ? (
            <div className="space-y-2">
              {data.programmeChoices.map((choice) => (
                <div key={choice.choice_number} className="flex items-start gap-2 text-sm">
                  <span className="font-bold text-blue-600 min-w-[70px]">{choice.choice_number}{getRankSuffix(choice.choice_number)} Choice:</span>
                  <span className="text-gray-700">{choice.programme_name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No programme selected</p>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-blue-700 mb-3 pb-2 border-b border-gray-200">Personal Information</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="font-semibold text-gray-600">Full Name:</div>
            <div>{data.personal?.firstname || ''} {data.personal?.lastname || ''}</div>
            <div className="font-semibold text-gray-600">Email:</div>
            <div>{data.personal?.email || 'Not provided'}</div>
            <div className="font-semibold text-gray-600">Phone:</div>
            <div>{data.personal?.phone || 'Not provided'}</div>
            <div className="font-semibold text-gray-600">National ID:</div>
            <div>{data.personal?.national_id || 'Not provided'}</div>
          </div>
        </div>

        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">This is an official declaration of your application to Mzuzu University.</p>
          <p className="text-sm text-gray-500">Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Breadcrumb />

        {/* Warning Modal - Popup when application already submitted */}
        <AnimatePresence>
          {showWarningModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowWarningModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Warning Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2"
                  >
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white">Cannot Submit Twice!</h2>
                </div>

                {/* Warning Body */}
                <div className="p-6 text-center">
                  <p className="text-gray-700 mb-2">
                    Your application has already been submitted successfully.
                  </p>
                  {referenceNumber && (
                    <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                      <p className="text-xs text-gray-500">Reference Number</p>
                      <p className="text-lg font-bold text-amber-700 font-mono">{referenceNumber}</p>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      ⚠️ You cannot submit the same application twice. Please proceed to the payments page to complete your application process.
                    </p>
                  </div>
                </div>

                {/* Warning Footer */}
                <div className="bg-gray-50 px-6 py-4 flex flex-col gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoToPayments}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <CreditCard className="w-5 h-5" />
                    Continue to Payments
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                  <button
                    onClick={() => setShowWarningModal(false)}
                    className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
            <Scale className="w-4 h-4" />
            <span className="text-sm font-medium">Legal Declaration Required</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Declaration of Accuracy</h1>
          <p className="text-gray-600">Review your application and make a legal declaration before submission</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-6 mb-8"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Application Completion</span>
              <span className={`text-sm font-bold ${
                completionPercentage === 100 ? 'text-green-600' : 
                completionPercentage >= 70 ? 'text-blue-600' : 
                completionPercentage >= 40 ? 'text-yellow-600' : 'text-gray-500'
              }`}>
                {completionPercentage}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full rounded-full ${
                  completionPercentage === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  completionPercentage >= 70 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                  'bg-gradient-to-r from-yellow-500 to-orange-500'
                }`}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-end">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Eye className="w-4 h-4" />
              Preview Application
            </button>
          </div>
          <p className="text-xs text-gray-500 text-right mt-2">
            Review all information carefully before making your declaration
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreviewModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowPreviewModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-full p-2">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Application Preview</h2>
                  </div>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-80px)]">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
                      <h3 className="text-white font-semibold flex items-center">
                        <Gavel className="w-5 h-5 mr-2" />
                        Legal Declaration
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-100 rounded-full p-3">
                          <Scale className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-700 leading-relaxed">
                            <span className="font-semibold">I, {declarationText || '[Applicant Name]'},</span> hereby declare 
                            that all the information provided in this application form, including personal details, 
                            academic records, programme choices, and next of kin information, is true, accurate, and 
                            complete to the best of my knowledge.
                          </p>
                          <p className="text-gray-700 leading-relaxed mt-3">
                            I understand that providing false or misleading information may result in the immediate 
                            rejection of my application, cancellation of admission, or other disciplinary actions as 
                            per Mzuzu University regulations.
                          </p>
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>This declaration carries legal weight and is equivalent to a sworn affidavit.</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3">
                      <h3 className="text-white font-semibold flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Programme Choices (6 Preferences)
                      </h3>
                    </div>
                    <div className="p-6">
                      {data.programmeChoices.length >= 6 ? (
                        <div className="space-y-3">
                          {data.programmeChoices.map((choice) => (
                            <div key={choice.choice_number} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                              <span className="font-bold text-blue-600 min-w-[80px]">{choice.choice_number}{getRankSuffix(choice.choice_number)}:</span>
                              <div>
                                <p className="font-medium text-gray-800">{choice.programme_name}</p>
                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                                  <span>{choice.department}</span>
                                  <span>{choice.duration}</span>
                                  <span>{choice.category}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">Please select 6 programmes in order of preference</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-3">
                      <h3 className="text-white font-semibold flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Personal Information
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Full Name</p>
                          <p className="font-medium text-gray-900">{data.personal?.firstname} {data.personal?.lastname}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="font-medium text-gray-900">{data.personal?.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="font-medium text-gray-900">{data.personal?.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">National ID</p>
                          <p className="font-medium text-gray-900">{data.personal?.national_id || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p className="font-medium text-gray-900">{data.personal?.dob || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Nationality</p>
                          <p className="font-medium text-gray-900">{data.personal?.nationality || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3">
                      <h3 className="text-white font-semibold flex items-center">
                        <Heart className="w-5 h-5 mr-2" />
                        Next of Kin
                      </h3>
                    </div>
                    <div className="p-6">
                      {data.nextOfKin.length > 0 ? (
                        <div className="space-y-4">
                          {data.nextOfKin.map((kin, index) => (
                            <div key={kin.id} className="border border-gray-200 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-semibold text-gray-900">Contact {index + 1}</span>
                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{kin.relationship}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-500">Name</p>
                                  <p className="text-sm text-gray-900">{kin.title} {kin.first_name} {kin.last_name}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Phone</p>
                                  <p className="text-sm text-gray-900">{kin.mobile1}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No next of kin added</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-3">
                      <h3 className="text-white font-semibold flex items-center">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Academic Records
                      </h3>
                    </div>
                    <div className="p-6">
                      {data.subjects.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-gray-600">Subject</th>
                                <th className="px-4 py-2 text-left text-gray-600">Grade</th>
                                <th className="px-4 py-2 text-left text-gray-600">Year</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.subjects.map((subj, idx) => (
                                <tr key={idx} className="border-t border-gray-100">
                                  <td className="px-4 py-2 font-medium text-gray-900">{subj.subject}</td>
                                  <td className="px-4 py-2">
                                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">{subj.grade}</span>
                                  </td>
                                  <td className="px-4 py-2 text-gray-600">{subj.year}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No academic records added</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Declaration Checkbox and Submit Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  disabled={alreadySubmitted}
                  className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">
                    I, {declarationText || '_____________________'}, hereby declare that the information provided is correct
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    I confirm that all details in this application are accurate and complete. I understand that 
                    providing false information may lead to rejection or cancellation of admission.
                  </p>
                </div>
              </label>
            </div>

            <div className="text-center">
              {alreadySubmitted ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">Application Already Submitted</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    You cannot submit the same application twice. Please proceed to the payments page.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoToPayments}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center mx-auto gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <CreditCard className="w-5 h-5" />
                    Continue to Payments
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : canSubmit ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold flex items-center justify-center mx-auto gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Submitting Declaration...
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-5 h-5" />
                        Submit Declaration & Application
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700">Cannot submit yet</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Please complete all required sections and check the declaration box:
                  </p>
                  <ul className="mt-2 text-sm text-gray-500 space-y-1">
                    {data.programmeChoices.length < 6 && (
                      <li className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        Programme choices (6 required)
                      </li>
                    )}
                    {data.subjects.length === 0 && (
                      <li className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        Academic records
                      </li>
                    )}
                    {data.nextOfKin.length === 0 && (
                      <li className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        Next of kin
                      </li>
                    )}
                    {!declarationChecked && (
                      <li className="flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        Declaration confirmation
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}