'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowRight, AlertCircle, CheckCircle, GraduationCap, BookOpen, Globe, Award, Home, ChevronRight, ChevronDown } from 'lucide-react';

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const applicationTypes: ApplicationType[] = [
  {
    id: 'degree',
    name: "Bachelor's Degree",
    description: "Undergraduate degree programmes (4 years) - Generic and Upgrading pathways available",
    icon: <GraduationCap className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    requirements: [
      'Malawi School Certificate of Education (MSCE) or equivalent',
      'Minimum of 6 credits including English and Mathematics',
      'Completed application form',
      'Copy of national ID or passport',
    ],
  },
  {
    id: 'masters',
    name: "Master's Degree",
    description: "Postgraduate master's programmes (2 years) - Full-time and ODeL options",
    icon: <Award className="w-5 h-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    requirements: [
      "Bachelor's degree with at least lower second class honours",
      'Academic transcripts',
      'Research proposal (for research programs)',
      'Two letters of recommendation',
      'Curriculum vitae (CV)',
    ],
  },
  {
    id: 'phd',
    name: "PhD / Doctorate",
    description: "Doctoral programmes (3 years) - Research-focused degrees",
    icon: <Award className="w-5 h-5" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    requirements: [
      "Master's degree in a relevant field",
      "Bachelor's degree with upper second class honours",
      'Detailed research proposal',
      'Academic transcripts',
      'Three letters of recommendation',
      'Curriculum vitae (CV)',
      'Publications (if any)',
    ],
  },
  {
    id: 'diploma',
    name: "Diploma Programmes",
    description: "Diploma certificates (2 years) - Practical and career-focused programmes",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    requirements: [
      'Malawi School Certificate of Education (MSCE) or equivalent',
      'Minimum of 4 credits including relevant subjects',
      'Completed application form',
      'Copy of national ID',
    ],
  },
  {
    id: 'certificate',
    name: "Certificate Programmes",
    description: "Short certificate courses (1 year) - Foundation and specialized training",
    icon: <BookOpen className="w-5 h-5" />,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    requirements: [
      'Malawi School Certificate of Education (MSCE) or equivalent',
      'Minimum of 2 credits',
      'Completed application form',
      'Copy of national ID',
    ],
  },
];

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export default function SelectApplicationType() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  // Simple auth check on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const handleSelection = (typeId: string) => {
    setSelectedType(typeId);
    setError('');
    setSuccess('');
  };

  const handleContinue = async () => {
    if (!selectedType) {
      setError('Please select an application type');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in first.');
        setTimeout(() => router.push('/login'), 1500);
        setIsLoading(false);
        return;
      }

      const selectedTypeData = applicationTypes.find(t => t.id === selectedType);
      
      // Store the selected application type
      localStorage.setItem('userApplicationType', selectedType);
      localStorage.setItem('userApplicationTypeName', selectedTypeData?.name || '');
      
      setSuccess(`${selectedTypeData?.name} selected successfully! Redirecting...`);
      
      setTimeout(() => {
        router.push('/application/program-selection');
      }, 1500);
      
    } catch (error: any) {
      if (error.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please ensure the Django backend is running.');
      } else {
        setError(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  const selectedDetails = applicationTypes.find(type => type.id === selectedType);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Application Type</span>
          </nav>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Application Type</h1>
          <p className="text-gray-600 mt-2">Select the programme category that matches your academic goals</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Application Type Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">APPLICATION TYPE</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Select the type of application that matches your qualifications and educational goals.
                This will determine the requirements and process for your application.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Dropdown Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Application Type *
              </label>
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => handleSelection(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 appearance-none cursor-pointer"
                >
                  <option value="">-- Choose your application type --</option>
                  {applicationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Choose the option that best describes your applicant category
              </p>
            </div>

            {/* Selected Type Details Card */}
            {selectedDetails && (
              <div className="mb-8 border-2 border-dashed border-green-500 rounded-lg overflow-hidden">
                <div className={`${selectedDetails.bgColor} p-4 border-b border-dashed border-green-200`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${selectedDetails.bgColor} rounded-lg ${selectedDetails.color}`}>
                      {selectedDetails.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedDetails.name}</h3>
                      <p className="text-sm text-gray-600">{selectedDetails.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white">
                  <h4 className="font-medium text-gray-700 mb-3 text-sm">Requirements:</h4>
                  <ul className="space-y-2">
                    {selectedDetails.requirements.map((req, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                Back
              </button>

              <button
                onClick={handleContinue}
                disabled={!selectedType || isLoading}
                className={`px-8 py-2.5 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 ${
                  selectedType && !isLoading
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Need help choosing? Contact our admissions office for guidance on the right application type for you.
          </p>
        </div>
      </div>
    </div>
  );
}