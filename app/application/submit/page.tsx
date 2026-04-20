'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  CheckCircle, AlertCircle, FileText, User, Phone, BookOpen, 
  ChevronRight, Download, Mail, MailCheck, MailWarning, 
  GraduationCap, Calendar, MapPin, IdCard, Award, Clock,
  ExternalLink, Printer, Home, Building2, Smartphone, Mail as MailIcon
} from 'lucide-react';
import ProgressIndicator from '@/componets/ProgressIndicator';
import Button2 from '@/componets/Button2';

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

export default function FinalSubmitPage() {
  const router = useRouter();
  const [data, setData] = useState<ApplicationData>({
    personal: null,
    nextOfKin: [],
    subjects: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [submissionData, setSubmissionData] = useState<any>(null);
  
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
        const applicantId = userData.id;

        let programmeData = null;
        try {
          const programmeRes = await axiosInstance.get('/applicants/programme/selection/');
          programmeData = programmeRes.data;
        } catch (programmeErr) {
          console.warn('No programme selection found:', programmeErr);
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

        let programmeName = 'Not selected';
        let programmeId = null;
        
        if (programmeData && programmeData.data) {
          if (programmeData.data.name) {
            programmeName = programmeData.data.name;
            programmeId = programmeData.data.id;
          }
        }

        const personalDetails = personalDetailsRes.data.data || {};

        setData({
          personal: {
            firstname: userData.first_name || userData.firstname,
            lastname: userData.last_name || userData.lastname,
            email: userData.email,
            programme_id: programmeId,
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
    
    if (submitted) {
      setError('Your application has already been submitted.');
      return;
    }
    
    setError(null);
    setValidationErrors({});
    setLoading(true);
    setEmailStatus('idle');

    const currentToken = getToken();

    if (!currentToken) {
      setError('You must be logged in to submit.');
      setLoading(false);
      router.push('/login');
      return;
    }

    try {
      const programmeId = data.personal?.programme_id;

      if (!programmeId) {
        setError('Please select a programme before submitting.');
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
        programme_id: programmeId,
      });

      if (res.data.success) {
        const submissionRef = res.data.data?.reference_number;
        setReferenceNumber(submissionRef || generateReferenceNumber());
        setSubmitted(true);
        setIsDuplicate(res.data.is_duplicate || false);
        setSubmissionData(res.data.data);
        setEmailStatus(res.data.email_sent ? 'sent' : 'failed');
      } else {
        throw new Error(res.data.message || 'Submission failed');
      }

    } catch (err: any) {
      console.error('Submission error:', err);
      
      if (err.response?.status === 409) {
        setSubmitted(true);
        setIsDuplicate(true);
        const duplicateData = err.response.data.submission || err.response.data.data || {};
        setReferenceNumber(duplicateData.reference_number || 'Already Submitted');
        setSubmissionData(duplicateData);
        setEmailStatus(err.response.data.email_sent ? 'sent' : 'failed');
      } else {
        setError(err.response?.data?.message || 'An error occurred while submitting your application.');
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
    } catch (error) {
      console.error('Failed to resend email:', error);
      setEmailStatus('failed');
    }
  };

  if (loading && !data.personal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application data...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 text-white">
              <CheckCircle className="w-12 h-12 mb-4" />
              <h1 className="text-2xl font-bold">
                {isDuplicate ? 'Application Already Submitted' : 'Application Submitted Successfully!'}
              </h1>
              <p className="text-green-100 mt-2">
                {isDuplicate 
                  ? 'Your application has already been received and is being processed.'
                  : 'Thank you for submitting your application to Mzuzu University.'}
              </p>
            </div>
            
            <div className="p-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center mb-6">
                <p className="text-sm text-gray-600 mb-2">Your Application Reference Number</p>
                <p className="text-3xl font-bold text-green-700 font-mono tracking-wider">{referenceNumber}</p>
                <p className="text-xs text-gray-500 mt-3">Please save this number for future correspondence</p>
              </div>
              
              {emailStatus !== 'idle' && (
                <div className={`mb-6 p-4 rounded-lg ${
                  emailStatus === 'sent' ? 'bg-green-50 border border-green-200' :
                  emailStatus === 'sending' ? 'bg-blue-50 border border-blue-200' :
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center">
                      {emailStatus === 'sent' && <MailCheck className="w-5 h-5 text-green-600 mr-2" />}
                      {emailStatus === 'sending' && <Mail className="w-5 h-5 text-blue-600 mr-2" />}
                      {emailStatus === 'failed' && <MailWarning className="w-5 h-5 text-yellow-600 mr-2" />}
                      <span className={
                        emailStatus === 'sent' ? 'text-green-700' :
                        emailStatus === 'sending' ? 'text-blue-700' :
                        'text-yellow-700'
                      }>
                        {emailStatus === 'sending' && 'Sending confirmation email...'}
                        {emailStatus === 'sent' && 'Confirmation email sent successfully!'}
                        {emailStatus === 'failed' && 'Could not send confirmation email'}
                      </span>
                    </div>
                    {emailStatus === 'failed' && (
                      <button
                        onClick={handleResendEmail}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                      >
                        Resend Email
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handlePrintApplication}
                  className="flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Go to Dashboard
                  <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canSubmit = data.personal?.programme_id && data.subjects.length > 0 && data.nextOfKin.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Review Your Application</h1>
          <p className="text-gray-600 mt-2">Please review all information before submitting</p>
        </div>

        <ProgressIndicator currentStep={11} />

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="mt-6 space-y-6">
          {/* Programme Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center">
                <GraduationCap className="w-5 h-5 mr-2" />
                Programme Information
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-gray-500">Selected Programme</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.personal?.programme_name || 'Not selected'}
                  </p>
                </div>
                {!data.personal?.programme_id && (
                  <span className="text-red-600 text-sm bg-red-50 px-3 py-1 rounded-full">Missing</span>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Personal Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{data.personal?.firstname} {data.personal?.lastname}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium">{data.personal?.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{data.personal?.phone || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{data.personal?.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{data.personal?.dob || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nationality</p>
                  <p className="font-medium">{data.personal?.nationality || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">National ID</p>
                  <p className="font-medium">{data.personal?.national_id || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Home District</p>
                  <p className="font-medium">{data.personal?.home_district || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Physical Address</p>
                  <p className="font-medium">{data.personal?.physical_address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next of Kin Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Next of Kin
              </h2>
            </div>
            <div className="p-6">
              {data.nextOfKin.length > 0 ? (
                <div className="space-y-4">
                  {data.nextOfKin.map((kin, index) => (
                    <div key={kin.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-900">Contact {index + 1}</span>
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{kin.relationship}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm">{kin.title} {kin.first_name} {kin.last_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-sm">{kin.mobile1}{kin.mobile2 ? `, ${kin.mobile2}` : ''}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm">{kin.email || 'Not provided'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm">{kin.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No next of kin added</p>
                  <p className="text-sm text-red-500 mt-2">Required before submission</p>
                </div>
              )}
            </div>
          </div>

          {/* Academic Records Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Academic Records
              </h2>
            </div>
            <div className="p-6">
              {data.subjects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Subject</th>
                        <th className="px-4 py-2 text-left">Grade</th>
                        <th className="px-4 py-2 text-left">Year</th>
                        <th className="px-4 py-2 text-left">Qualification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.subjects.map((subj, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-4 py-2 font-medium">{subj.subject}</td>
                          <td className="px-4 py-2">
                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">{subj.grade}</span>
                          </td>
                          <td className="px-4 py-2">{subj.year}</td>
                          <td className="px-4 py-2 text-gray-500">{subj.qualification}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No academic records added</p>
                  <p className="text-sm text-red-500 mt-2">Required before submission</p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <button
                onClick={handleFinalSubmit}
                disabled={!canSubmit || loading}
                className={`px-8 py-3 rounded-lg font-semibold flex items-center justify-center mx-auto gap-2 transition-all ${
                  canSubmit && !loading
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Submit Application
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
              
              {!canSubmit && (
                <p className="text-sm text-red-500 mt-4">
                  Please complete all required sections before submitting:
                  {!data.personal?.programme_id && ' Programme selection,'}
                  {data.subjects.length === 0 && ' Academic records,'}
                  {data.nextOfKin.length === 0 && ' Next of kin'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}