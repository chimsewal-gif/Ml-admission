// app/application/acceptance-letter/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle, Download, Printer, Mail, Home, 
  Calendar, Award, GraduationCap, MapPin, Phone,
  Mail as MailIcon, User, FileText, ExternalLink,
  AlertCircle, Loader2, ChevronLeft, BookOpen,
  Users, CreditCard, Clock, Shield, Sparkles,
  Heart, Star, ThumbsUp, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface AcceptanceData {
  id: number;
  reference_number: string;
  applicant_name: string;
  programme_name: string;
  department: string;
  duration: string;
  study_mode: string;
  acceptance_date: string;
  registration_deadline: string;
  reporting_date: string;
  registration_fee: number;
  tuition_fee: number;
  status: string;
  offer_letter_url?: string;
}

export default function AcceptanceLetterPage() {
  const router = useRouter();
  const letterRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [acceptance, setAcceptance] = useState<AcceptanceData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [html2pdf, setHtml2pdf] = useState<any>(null);

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

  const fetchAcceptanceData = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First get user info
      const userResponse = await fetch(`${API_BASE_URL}/me/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userResponse.json();
      setUser(userData);

      // Get submission status to check if application is approved/accepted
      const statusResponse = await fetch(`${API_BASE_URL}/submit/status/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statusData = await statusResponse.json();

      if (statusData.success && statusData.data) {
        const applicationStatus = statusData.data.status;
        
        // Only show acceptance letter for approved or accepted applications
        if (applicationStatus !== 'approved' && applicationStatus !== 'accepted') {
          setError('You have not been accepted yet. Please check your application status.');
          setLoading(false);
          return;
        }

        // Get programme choices to find selected programme
        const choicesResponse = await fetch(`${API_BASE_URL}/applicants/programme-choices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const choicesData = await choicesResponse.json();

        let programmeName = 'Not specified';
        let department = 'Not specified';
        let duration = 'Not specified';

        if (choicesData.success && choicesData.choices && choicesData.choices.length > 0) {
          const firstChoice = choicesData.choices[0];
          programmeName = firstChoice.programme_name;
          department = firstChoice.department || 'Faculty of Education';
          duration = firstChoice.duration || '4 Years';
        }

        // Get personal details
        const personalResponse = await fetch(`${API_BASE_URL}/personal-details/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const personalData = await personalResponse.json();

        // Get next of kin for guardian info
        const kinResponse = await fetch(`${API_BASE_URL}/next-of-kin/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const kinData = await kinResponse.json();
        const nextOfKin = kinData.data && kinData.data.length > 0 ? kinData.data[0] : null;

        // Construct acceptance data
        const now = new Date();
        const registrationDeadline = new Date();
        registrationDeadline.setDate(now.getDate() + 30);
        
        const reportingDate = new Date();
        reportingDate.setMonth(now.getMonth() + 1);
        reportingDate.setDate(15);

        setAcceptance({
          id: userData.id,
          reference_number: statusData.data.reference_number || `MZU-${now.getFullYear()}-${String(userData.id).padStart(6, '0')}`,
          applicant_name: `${personalData.data?.first_name || userData.first_name} ${personalData.data?.last_name || userData.last_name}`,
          programme_name: programmeName,
          department: department,
          duration: duration,
          study_mode: 'Full Time',
          acceptance_date: now.toISOString(),
          registration_deadline: registrationDeadline.toISOString(),
          reporting_date: reportingDate.toISOString(),
          registration_fee: 50000,
          tuition_fee: 350000,
          status: applicationStatus
        });
      } else {
        setError('Unable to fetch application status. Please try again.');
      }
    } catch (err: any) {
      console.error('Error fetching acceptance data:', err);
      setError(err.message || 'Failed to load acceptance letter data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptanceData();
  }, []);

  const handleDownloadPDF = async () => {
    if (!letterRef.current || !html2pdf) {
      alert('PDF generation not ready. Please try again.');
      return;
    }

    setDownloading(true);
    const element = letterRef.current;
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Acceptance_Letter_${acceptance?.reference_number || 'MZU'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmailLetter = () => {
    if (acceptance) {
      window.location.href = `mailto:${user?.email}?subject=Acceptance Letter - ${acceptance.reference_number}&body=Dear ${acceptance.applicant_name},%0D%0A%0D%0APlease find attached your acceptance letter for ${acceptance.programme_name}.%0D%0A%0D%0ARegards,%0D%0AMzuzu University Admissions Office`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your acceptance letter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="text-center py-12 px-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/application/dashboard"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Link>
                <Link
                  href="/application/status"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Check Status
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!acceptance) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/application/dashboard" className="text-gray-600 hover:text-green-600 transition-colors">
              Dashboard
            </Link>
            <ChevronLeft className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Acceptance Letter</span>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Congratulations!</h1>
                <p className="text-sm text-gray-500">You have been accepted to Mzuzu University</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleEmailLetter}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </button>
            </div>
          </div>
        </div>

        {/* Acceptance Letter Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div ref={letterRef} className="p-8 md:p-12 print:p-8">
            {/* Letter Header */}
            <div className="text-center border-b border-gray-300 pb-6 mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Image
                    src="/logo.jpeg"
                    alt="Mzuzu University Logo"
                    width={64}
                    height={64}
                    className="rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Mzuzu University</h1>
              <p className="text-gray-600">Private Bag 201, Luwinga, Mzuzu 2, Malawi</p>
              <p className="text-gray-600">Tel: +265 1 320 575 | Email: admissions@mzuni.ac.mw</p>
              <div className="mt-4 inline-block px-4 py-2 bg-green-100 rounded-full">
                <span className="text-green-700 font-semibold">OFFICIAL ACCEPTANCE LETTER</span>
              </div>
            </div>

            {/* Letter Body */}
            <div className="space-y-6">
              {/* Date and Reference */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-600">Date: <span className="font-medium">{formatDate(acceptance.acceptance_date)}</span></p>
                  <p className="text-gray-600 mt-1">Our Ref: <span className="font-mono font-medium">{acceptance.reference_number}</span></p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Accepted</span>
                  </div>
                </div>
              </div>

              {/* Salutation */}
              <div>
                <p className="text-gray-800">Dear <span className="font-semibold">{acceptance.applicant_name}</span>,</p>
              </div>

              {/* Acceptance Message */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-green-800">Congratulations on Your Admission!</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  We are delighted to inform you that the Admissions Committee has approved your application 
                  for admission into the <strong>{acceptance.programme_name}</strong> programme at Mzuzu University 
                  for the upcoming academic year.
                </p>
              </div>

              {/* Programme Details */}
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  Programme Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Programme</p>
                    <p className="font-medium text-gray-900">{acceptance.programme_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{acceptance.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium text-gray-900">{acceptance.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Study Mode</p>
                    <p className="font-medium text-gray-900">{acceptance.study_mode}</p>
                  </div>
                </div>
              </div>

              {/* Important Dates */}
              <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                  Important Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-yellow-700">Registration Deadline</p>
                    <p className="font-medium text-gray-900">{formatDate(acceptance.registration_deadline)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-700">Reporting Date</p>
                    <p className="font-medium text-gray-900">{formatDate(acceptance.reporting_date)}</p>
                  </div>
                </div>
              </div>

              {/* Fee Structure */}
              <div className="border border-gray-200 rounded-lg p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Fee Structure
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Registration Fee</span>
                    <span className="font-semibold text-gray-900">MK {acceptance.registration_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Tuition Fee (Per Year)</span>
                    <span className="font-semibold text-gray-900">MK {acceptance.tuition_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 mt-2 pt-2 border-t-2 border-gray-200">
                    <span className="font-semibold text-gray-800">Total (First Year)</span>
                    <span className="font-bold text-green-700">MK {(acceptance.registration_fee + acceptance.tuition_fee).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  Next Steps
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Accept this offer by clicking the "Accept Offer" button below</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Pay the registration fee before the deadline to secure your place</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Complete online registration after payment confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Prepare required documents for physical reporting</span>
                  </li>
                </ul>
              </div>

              {/* Closing */}
              <div className="mt-6">
                <p className="text-gray-700">We look forward to welcoming you to Mzuzu University.</p>
                <p className="text-gray-700 mt-2">Yours sincerely,</p>
                <div className="mt-4">
                  <p className="font-semibold text-gray-900">Prof. John S. Phiri</p>
                  <p className="text-sm text-gray-600">Registrar, Mzuzu University</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-400">
                  This is an official document issued by Mzuzu University. Please present this letter upon registration.
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex gap-3">
                <Link
                  href="/application/application-fees"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Make Payment
                </Link>
                <Link
                  href="/application/registration"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Complete Registration
                </Link>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/application/dashboard"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Information Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Official Acceptance Letter</p>
              <p className="text-xs text-blue-700 mt-1">
                This letter is your official acceptance to Mzuzu University. You can download, print, or email this letter.
                Please keep it for your records and present it during registration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}