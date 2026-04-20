'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowRight, AlertCircle, CheckCircle, GraduationCap, BookOpen, Globe, Award } from 'lucide-react';

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  icon: React.ReactNode;
}

const applicationTypes: ApplicationType[] = [
  {
    id: 'odl',
    name: 'ODL Student Application',
    description: "For students applying for bachelor's degree programs under Open and Distance Learning",
    icon: <GraduationCap className="w-5 h-5" />,
    requirements: [
      'High School Certificate or equivalent',
      'Minimum GPA requirements met',
      'Completed application form',
    ],
  },
  {
    id: 'postgraduate',
    name: 'Postgraduate Application',
    description: 'For students applying for master\'s or doctoral programs',
    icon: <Award className="w-5 h-5" />,
    requirements: [
      "Bachelor's degree certificate",
      'Academic transcripts',
      'Research proposal (for research programs)',
      'Letters of recommendation',
    ],
  },
  {
    id: 'diploma',
    name: 'Diploma/Certificate Programs',
    description: 'For students applying for diploma or certificate courses',
    icon: <BookOpen className="w-5 h-5" />,
    requirements: [
      'High School Certificate or equivalent',
      'Specific subject requirements (if applicable)',
    ],
  },
  {
    id: 'international',
    name: 'International Student Application',
    description: 'For international students applying to the university',
    icon: <Globe className="w-5 h-5" />,
    requirements: [
      'Equivalent qualifications recognized by qualifications authority',
      'English language proficiency certificate',
      'Student visa documentation',
      'Passport copies',
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

      const updateResponse = await fetch(`${API_BASE_URL}/update-role/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedType }),
      });

      const result = await updateResponse.json();

      if (updateResponse.ok && result.success) {
        const updatedUser = {
          ...user,
          role: selectedType,
          application_type: selectedType
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('userApplicationType', selectedType);
        localStorage.setItem('userRole', selectedType);
        
        setSuccess('Application type selected successfully! Redirecting...');
        
        setTimeout(() => {
          router.push('/application/personal-details');
        }, 1500);
        
      } else {
        if (result.message?.includes('authenticated') || result.message?.includes('token')) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => router.push('/login'), 1500);
        } else {
          setError(result.message || 'Failed to update application type. Please try again.');
        }
      }

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

  const getSelectedTypeDetails = () => {
    return applicationTypes.find(type => type.id === selectedType);
  };

  const selectedDetails = getSelectedTypeDetails();

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
              <select
                value={selectedType}
                onChange={(e) => handleSelection(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800"
              >
                <option value="">-- Choose your application type --</option>
                {applicationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the option that best describes your applicant category
              </p>
            </div>

            {/* Selected Type Details Card - with DOTTED BORDER */}
            {selectedDetails && (
              <div className="mb-8 border-2 border-dashed border-green-500 rounded-lg overflow-hidden">
                <div className="bg-green-50 p-4 border-b border-dashed border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
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