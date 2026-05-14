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
  ScrollText, PenSquare, CheckSquare, X, CreditCard, Bell, AlertTriangle,
  Loader2
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
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error" | "warning">("success");

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
        
        const response = await statusAxios.get('/submit/status/');
        if (response.data && response.data.data && response.data.data.is_submitted) {
          setAlreadySubmitted(true);
          setSubmitted(true);
          setReferenceNumber(response.data.data.reference_number || 'Already Submitted');
          setSubmissionData(response.data.data);
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
    
    if (alreadySubmitted) {
      setShowWarningModal(true);
      return;
    }
    
    if (!declarationChecked) {
      setNotification("Please declare that the information provided is correct before submitting.");
      setNotificationType("warning");
      setTimeout(() => setNotification(""), 3000);
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
      setNotification("You must be logged in to submit.");
      setNotificationType("error");
      setLoading(false);
      router.push('/login');
      return;
    }

    try {
      const firstChoice = data.programmeChoices.find(c => c.choice_number === 1);
      const programmeId = firstChoice?.programme_id || data.personal?.programme_id;

      if (!programmeId) {
        setNotification("Please select at least one programme before submitting.");
        setNotificationType("warning");
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
        setNotification(`✅ Application submitted successfully! Reference: ${submissionRef || generateReferenceNumber()}`);
        setNotificationType("success");
        setTimeout(() => setNotification(""), 5000);
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
        setNotification("❌ Error: " + errorMessage);
        setNotificationType("error");
        setTimeout(() => setNotification(""), 5000);
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

  const handleGoToPayments = () => {
    setShowWarningModal(false);
    router.push('/application/application-fees');
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Breadcrumb />

        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              notificationType === "success" 
                ? "bg-green-50 border border-green-200 text-green-800" 
                : notificationType === "warning"
                ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {notificationType === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : notificationType === "warning" ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm">{notification}</p>
          </motion.div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-800">DECLARATION OF ACCURACY</h2>
              </div>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">Preview Application</span>
              </button>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Legal Declaration Required - Please review all information carefully before submitting
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Progress Bar */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    completionPercentage === 100 ? 'bg-green-600' :
                    completionPercentage >= 70 ? 'bg-blue-600' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Declaration Section - Simple */}
            <div className="mb-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-full p-3">
                  <Gavel className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Legal Declaration</h3>
                  <p className="text-gray-700 leading-relaxed">
                    I, <span className="font-semibold">{declarationText || '[Applicant Name]'}</span>, hereby declare 
                    that all the information provided in this application is true, accurate, and complete.
                  </p>
                </div>
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  disabled={alreadySubmitted}
                  className="mt-1 w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">
                    I confirm that the information provided is correct
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Section */}
            <div className="pt-4 border-t border-gray-200">
              {alreadySubmitted ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">Application Already Submitted</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Please proceed to the payments page.
                  </p>
                  <button
                    onClick={handleGoToPayments}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center mx-auto gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <CreditCard className="w-5 h-5" />
                    Continue to Payments
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : canSubmit ? (
                <div className="flex justify-end">
                  <button
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-5 h-5" />
                        Submit Declaration & Application
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700 font-medium">Cannot submit yet</span>
                  </div>
                  <p className="text-sm text-gray-500">Please complete all required sections</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal - Clean headers, no background colors */}
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
              {/* Modal Header - No background color */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Application Preview</h2>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-80px)]">
                {/* Declaration Section - Clean */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-100 px-6 py-3 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-gray-600" />
                      Legal Declaration
                    </h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 leading-relaxed">
                      I, <span className="font-semibold">{declarationText || '[Applicant Name]'}</span>, hereby declare 
                      that all the information provided in this application is true, accurate, and complete.
                    </p>
                  </div>
                </div>

                {/* Programme Choices Section */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-100 px-6 py-3 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Award className="w-5 h-5 text-gray-600" />
                      Programme Choices (6 Preferences)
                    </h3>
                  </div>
                  <div className="p-6">
                    {data.programmeChoices.length >= 6 ? (
                      <div className="space-y-3">
                        {data.programmeChoices.map((choice) => (
                          <div key={choice.choice_number} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <span className="font-bold text-green-600 min-w-[80px]">{choice.choice_number}{getRankSuffix(choice.choice_number)}:</span>
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

                {/* Personal Information Section */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-100 px-6 py-3 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600" />
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
                    </div>
                  </div>
                </div>

                {/* Next of Kin Section */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-100 px-6 py-3 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-gray-600" />
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
                              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{kin.relationship}</span>
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

                {/* Academic Records Section */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="border-b border-gray-100 px-6 py-3 bg-gray-50">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-gray-600" />
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
                                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-bold">{subj.grade}</span>
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

              {/* Modal Footer */}
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

      {/* Warning Modal - Already Submitted - Clean */}
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
              {/* Warning Header - Clean */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 rounded-full p-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">Application Already Submitted</h2>
                </div>
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
                    Please proceed to the payments page to complete your application process.
                  </p>
                </div>
              </div>

              {/* Warning Footer */}
              <div className="bg-gray-50 px-6 py-4 flex flex-col gap-3">
                <button
                  onClick={handleGoToPayments}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <CreditCard className="w-5 h-5" />
                  Continue to Payments
                  <ChevronRight className="w-4 h-4" />
                </button>
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
    </div>
  );
}