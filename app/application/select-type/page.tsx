'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  requirements: string[];
}

const applicationTypes: ApplicationType[] = [
  {
    id: 'odl',
    name: 'ODL Student Application',
    description: "For students applying for bachelor's degree programs under Open and Distance Learning",
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
    requirements: [
      'High School Certificate or equivalent',
      'Specific subject requirements (if applicable)',
    ],
  },
  {
    id: 'international',
    name: 'International Student Application',
    description: 'For international students applying to the university',
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
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  // Simple auth check on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      // No token, redirect to login
      router.push('/login');
      return;
    }
    
    // Set user from localStorage
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
  };

  const handleContinue = async () => {
    if (!selectedType) {
      setError('Please select an application type');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in first.');
        setTimeout(() => router.push('/login'), 1500);
        setIsLoading(false);
        return;
      }

      // Update user role
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
        // Update localStorage with new role
        const updatedUser = {
          ...user,
          role: selectedType,
          application_type: selectedType
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('userApplicationType', selectedType);
        localStorage.setItem('userRole', selectedType);
        
        setError('✅ Success! Redirecting to personal details...');
        
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

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
          <p className="text-gray-600 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // If not authenticated (should not happen due to redirect, but just in case)
  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold text-gray-800">
                Select Your Application Type
              </h1>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Welcome, {user.username || user.email || 'User'}!
              </div>
            </div>
            <p className="text-lg text-gray-600">
              Choose the application type that matches your qualifications and educational goals.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            error.includes('✅') || error.includes('Success') 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center">
                {error.includes('✅') || error.includes('Success') ? (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <p className="font-medium">{error}</p>
              </div>
              {(error.includes('log in') || error.includes('authenticated')) && (
                <button
                  onClick={handleLoginRedirect}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}

        {/* Application Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {applicationTypes.map((type) => (
            <div
              key={type.id}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                selectedType === type.id
                  ? 'border-green-500 bg-green-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
              }`}
              onClick={() => handleSelection(type.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{type.name}</h3>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedType === type.id
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedType === type.id && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-4 text-sm">{type.description}</p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2 text-sm">Requirements:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {type.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-200">
          <button
            onClick={handleBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isLoading}
          >
            ← Back to Home
          </button>

          <button
            onClick={handleContinue}
            disabled={!selectedType || isLoading}
            className={`px-8 py-3 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 ${
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
              'Continue to Application'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}