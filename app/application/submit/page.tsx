'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { CheckCircle, AlertCircle, FileText, User, Phone, BookOpen, ChevronRight, Download, Mail, MailCheck, MailWarning } from 'lucide-react';
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
}

interface ContactData {
  mobile1?: string;
  mobile2?: string;
  email?: string;
  postal_address?: string;
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
  contact: ContactData | null;
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
    contact: null,
    nextOfKin: [],
    subjects: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [progress, setProgress] = useState(0);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [submissionData, setSubmissionData] = useState<any>(null);
  
  // Helper to get token from localStorage
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
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Starting data fetch...');
        
        // Get current user data from /me/ endpoint
        const userRes = await axiosInstance.get('/me/');
        console.log('User response:', userRes.data);
        
        const userData = userRes.data;
        const applicantId = userData.id;

        if (!applicantId) {
          throw new Error('Could not determine applicant ID');
        }

        console.log('Applicant ID:', applicantId);

        // Fetch programme selection if available
        let programmeData = null;
        try {
          const programmeRes = await axiosInstance.get('/applicants/programme/selection/');
          console.log('Programme selection response:', programmeRes.data);
          programmeData = programmeRes.data;
        } catch (programmeErr) {
          console.warn('No programme selection found:', programmeErr);
        }

        // Fetch all data in parallel
        const requests = [
          // Next of Kin
          axiosInstance.get('/next-of-kin/').catch(err => {
            console.warn('Next of kin data not available:', err.message);
            return { data: { data: [] } };
          }),
          
          // Subject records
          axiosInstance.get('/subject-records/').catch(err => {
            console.warn('Subject records not available:', err.message);
            return { data: { data: [] } };
          })
        ];

        const [kinRes, subjectsRes] = await Promise.all(requests);
        
        console.log('All API responses:', {
          personal: userData,
          kin: kinRes.data,
          subjects: subjectsRes.data
        });

        // Process subject records
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
          } else if (Array.isArray(subjectsData)) {
            subjectRecords = subjectsData.map((r: any) => ({
              qualification: r.qualification || '',
              centreNumber: r.centre_number || r.centreNumber || '',
              examNumber: r.exam_number || r.examNumber || '',
              subject: r.subject || '',
              grade: r.grade || '',
              year: r.year || '',
            }));
          }
        }

        console.log('Processed subject records:', subjectRecords);

        // Process next of kin
        const kinData = kinRes.data;
        let nextOfKinData: NextOfKin[] = [];
        
        if (kinData && kinData.data) {
          nextOfKinData = Array.isArray(kinData.data) ? kinData.data : [kinData.data];
        } else if (Array.isArray(kinData)) {
          nextOfKinData = kinData;
        }

        // Get programme name if available
        let programmeName = 'Not selected';
        let programmeId = null;
        
        if (programmeData && programmeData.data) {
          if (programmeData.data.name) {
            programmeName = programmeData.data.name;
            programmeId = programmeData.data.id;
          }
        }

        // Also try to get applicant details for phone and address
        let phoneNumber = '';
        let physicalAddress = '';
        try {
          // Try to get applicant from the database
          const applicantRes = await axiosInstance.get(`/applicants/${applicantId}/`);
          if (applicantRes.data && applicantRes.data.data) {
            phoneNumber = applicantRes.data.data.phone || '';
            physicalAddress = applicantRes.data.data.physical_address || '';
          }
        } catch (applicantErr) {
          console.warn('Could not fetch applicant details:', applicantErr);
        }

        // Set the final data
        setData({
          personal: {
            firstname: userData.first_name || userData.firstname,
            lastname: userData.last_name || userData.lastname,
            email: userData.email,
            dob: userData.date_of_birth,
            programme_id: programmeId,
            programme_name: programmeName,
            id: userData.id,
            phone: phoneNumber,
            physical_address: physicalAddress,
          },
          contact: {
            mobile1: phoneNumber,
            mobile2: '',
            email: userData.email,
            postal_address: physicalAddress,
          },
          nextOfKin: nextOfKinData,
          subjects: subjectRecords,
        });

        console.log('Final application data:', {
          personal: {
            firstname: userData.first_name,
            lastname: userData.last_name,
            email: userData.email,
            programme_id: programmeId,
            programme_name: programmeName,
          },
          nextOfKin: nextOfKinData.length,
          subjects: subjectRecords.length,
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
        } else if (err.response?.status === 404) {
          setError('Some data could not be found. Please complete your profile first.');
        } else {
          setError(
            err.response?.data?.message || 
            err.response?.data?.error || 
            'Failed to load applicant data. Please try refreshing the page.'
          );
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
      setError('Your application has already been submitted. You cannot submit twice.');
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
        setError('Your programme information is missing. Please update your profile and select a programme.');
        setLoading(false);
        return;
      }

      if (data.subjects.length === 0) {
        setError('Please add your academic records before submitting your application.');
        setLoading(false);
        return;
      }

      console.log('Submitting with programme_id:', programmeId);

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

      console.log('Submission response:', res.data);

      if (res.data.success) {
        const submissionRef = res.data.data?.reference_number;
        
        if (submissionRef) {
          setReferenceNumber(submissionRef);
        } else {
          const fallbackRef = generateReferenceNumber();
          setReferenceNumber(fallbackRef);
        }
        
        setSubmitted(true);
        setIsDuplicate(res.data.is_duplicate || false);
        setSubmissionData(res.data.data);
        
        if (res.data.email_sent) {
          setEmailStatus('sent');
        } else {
          setEmailStatus('failed');
        }

      } else {
        throw new Error(res.data.message || 'Unexpected response format');
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
        setError(null);
        setError('Your application has already been submitted. You cannot submit twice.');
      } else if (err.response?.status === 422 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        setError('Please fix the validation errors below.');
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }, 2000);
      } else {
        setError(
          err.response?.data?.message || 
          err.response?.data?.error || 
          'An error occurred while submitting your application. Please try again.'
        );
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

  // Show loading state
  if (loading && !data.personal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your application data...</p>
        </div>
      </div>
    );
  }

  // If already submitted, show success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-12 text-center">
              <div className="mb-8">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {isDuplicate ? 'Application Already Submitted' : 'Application Submitted Successfully!'}
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {isDuplicate 
                    ? 'Your application has already been submitted and is being processed. You cannot submit twice.'
                    : 'Your application has been received and is now being processed.'
                  } Please save your reference number for future correspondence.
                </p>
                
                {emailStatus !== 'idle' && (
                  <div className={`mt-6 p-4 rounded-lg max-w-md mx-auto ${
                    emailStatus === 'sent' ? 'bg-green-50 border border-green-200' :
                    emailStatus === 'sending' ? 'bg-blue-50 border border-blue-200' :
                    'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-center">
                      {emailStatus === 'sent' && <MailCheck className="w-5 h-5 text-green-600 mr-2" />}
                      {emailStatus === 'sending' && <Mail className="w-5 h-5 text-blue-600 mr-2" />}
                      {emailStatus === 'failed' && <MailWarning className="w-5 h-5 text-yellow-600 mr-2" />}
                      <span className={`font-medium ${
                        emailStatus === 'sent' ? 'text-green-700' :
                        emailStatus === 'sending' ? 'text-blue-700' :
                        'text-yellow-700'
                      }`}>
                        {emailStatus === 'sending' && 'Sending confirmation email...'}
                        {emailStatus === 'sent' && 'Confirmation email sent successfully!'}
                        {emailStatus === 'failed' && 'Email not sent - please check your email address'}
                      </span>
                    </div>
                    {emailStatus === 'failed' && (
                      <button
                        onClick={handleResendEmail}
                        className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                      >
                        Resend Email
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 max-w-md mx-auto mb-8">
                <div className="bg-white rounded-xl p-6 border-2 border-dashed border-green-300">
                  <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide font-semibold">
                    Your Reference Number
                  </p>
                  <p className="text-2xl font-bold text-green-700 font-mono tracking-wide">
                    {referenceNumber}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Use this reference when making payment or writing your deposit slip.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handlePrintApplication}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Print Application
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-300 z-50 shadow-lg"
        style={{ width: `${progress}%` }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Final Application Review
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Review your application details before final submission. Once submitted, you'll receive your reference number and email confirmation.
            </p>
          </div>

          <ProgressIndicator currentStep={11} />

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-6">
            {error && (
              <div className={`${error.includes('already been submitted') ? 'bg-yellow-50' : 'bg-red-50'} border-l-4 ${error.includes('already been submitted') ? 'border-yellow-500' : 'border-red-500'} p-4 mx-6 mt-6 rounded-lg`}>
                <div className="flex items-center">
                  <AlertCircle className={`w-5 h-5 ${error.includes('already been submitted') ? 'text-yellow-500' : 'text-red-500'} mr-3`} />
                  <div>
                    <p className={`${error.includes('already been submitted') ? 'text-yellow-700' : 'text-red-700'} font-medium`}>{error}</p>
                    {Object.keys(validationErrors).length > 0 && (
                      <ul className="text-red-600 text-sm mt-2">
                        {Object.entries(validationErrors).map(([field, errors]) => (
                          <li key={field}>- {errors.join(', ')}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleFinalSubmit} className="p-8">
              {/* Personal Details Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg mr-4">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>
                    <p className="text-gray-600">Your basic information</p>
                  </div>
                </div>
                
                {data.personal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-semibold text-gray-900">
                        {data.personal.firstname} {data.personal.lastname}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">
                        {data.personal.email || 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="font-semibold text-gray-900">
                        {data.personal.phone || 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Selected Programme</p>
                      <p className="font-semibold text-gray-900">
                        {data.personal.programme_name || data.personal.programme_id || 'Not selected'}
                      </p>
                      {!data.personal.programme_id && (
                        <p className="text-xs text-red-600 mt-1">
                          Please select a programme in your profile
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm text-gray-500">Physical Address</p>
                      <p className="font-semibold text-gray-900">
                        {data.personal.physical_address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No personal data available</p>
                )}
              </div>

              {/* Contact Details Card */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-lg mr-4">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                    <p className="text-gray-600">How we can reach you</p>
                  </div>
                </div>
                
                {data.contact ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Primary Mobile</p>
                      <p className="font-semibold text-gray-900">
                        {data.contact.mobile1 || 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Contact Email</p>
                      <p className="font-semibold text-gray-900">
                        {data.contact.email || 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm text-gray-500">Postal Address</p>
                      <p className="font-semibold text-gray-900">
                        {data.contact.postal_address || 'Not provided'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No contact data available</p>
                )}
              </div>

              {/* Next of Kin Card */}
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 mb-6 border border-purple-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg mr-4">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Next of Kin</h3>
                    <p className="text-gray-600">Your emergency contacts</p>
                  </div>
                </div>
                
                {data.nextOfKin.length > 0 ? (
                  <div className="space-y-4">
                    {data.nextOfKin.map((kin: NextOfKin, index: number) => (
                      <div key={kin.id} className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900">
                            Contact {index + 1}
                          </h4>
                          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            {kin.relationship}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="font-medium">{kin.title} {kin.first_name} {kin.last_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone Numbers</p>
                            <p className="font-medium">
                              {kin.mobile1}{kin.mobile2 ? `, ${kin.mobile2}` : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{kin.email || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium">{kin.address || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No next of kin added</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Please add your next of kin information before submitting.
                    </p>
                  </div>
                )}
              </div>

              {/* Subjects Card */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 mb-8 border border-orange-100">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg mr-4">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Academic Records</h3>
                    <p className="text-gray-600">Your subject qualifications</p>
                  </div>
                </div>
                
                {data.subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-orange-100/50">
                          <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Qualification</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Centre</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Exam No</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Subject</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Grade</th>
                          <th className="text-left p-3 text-sm font-semibold text-gray-700 border-b">Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.subjects.map((r: SubjectRecord, i: number) => (
                          <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                            <td className="p-3 border-b text-sm">{r.qualification}</td>
                            <td className="p-3 border-b text-sm font-mono">{r.centreNumber}</td>
                            <td className="p-3 border-b text-sm font-mono">{r.examNumber}</td>
                            <td className="p-3 border-b text-sm font-medium">{r.subject}</td>
                            <td className="p-3 border-b text-sm">
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">
                                {r.grade}
                              </span>
                            </td>
                            <td className="p-3 border-b text-sm">{r.year}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No subject records found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Please add your academic records before submitting your application.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <Button2 
                  type="submit" 
                  className="w-full md:w-auto min-w-[200px] py-4 text-lg font-semibold"
                  disabled={loading || submitted || !data.personal?.programme_id || data.subjects.length === 0 || data.nextOfKin.length === 0}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Submitting Application...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Submit Application
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </Button2>
                
                {!data.personal?.programme_id && (
                  <p className="text-red-600 text-sm mt-2">
                    Please select a programme before submitting your application.
                  </p>
                )}
                
                {data.subjects.length === 0 && (
                  <p className="text-red-600 text-sm mt-2">
                    Please add your academic records before submitting your application.
                  </p>
                )}

                {data.nextOfKin.length === 0 && (
                  <p className="text-red-600 text-sm mt-2">
                    Please add your next of kin information before submitting.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}