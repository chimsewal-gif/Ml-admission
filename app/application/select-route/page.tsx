'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, ChevronRight, ArrowRight, AlertCircle, CheckCircle,
  Calendar, Clock, Laptop, Users, Building2, Globe
} from 'lucide-react';

interface StudyRoute {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  features: string[];
  schedule: string;
}

const studyRoutes: StudyRoute[] = [
  {
    id: 'full-time',
    name: 'Face-to-Face (Full-Time)',
    description: 'Traditional on-campus learning with regular class attendance',
    icon: <Building2 className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: [
      'Daily classes on campus',
      'Direct interaction with lecturers',
      'Access to library and lab facilities',
      'Structured academic calendar',
      'Group discussions and projects'
    ],
    schedule: 'Monday to Friday, 8:00 AM - 5:00 PM'
  },
  {
    id: 'weekend',
    name: 'Weekend Program',
    description: 'Classes held on weekends for working professionals',
    icon: <Calendar className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: [
      'Classes on Saturdays and Sundays',
      'Perfect for working professionals',
      'Flexible assignment deadlines',
      'Networking with experienced peers',
      'Reduced course load per semester'
    ],
    schedule: 'Saturday & Sunday, 8:00 AM - 5:00 PM'
  },
  {
    id: 'odel',
    name: 'Open and Distance Learning (ODeL)',
    description: 'Flexible online learning with minimal campus visits',
    icon: <Laptop className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: [
      'Study from anywhere',
      'Self-paced learning materials',
      'Online assignments and quizzes',
      'Virtual lecturer consultations',
      'Regional study centers support'
    ],
    schedule: 'Flexible - Study at your own pace'
  }
];

export default function SelectStudyRoute() {
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>(''); // ADDED: missing success state
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [applicationType, setApplicationType] = useState<string>('');
  const [applicationTypeName, setApplicationTypeName] = useState<string>('');
  const router = useRouter();

  // Auth check and get application type
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
      
      // Get previously selected application type
      const savedAppType = localStorage.getItem('userApplicationType');
      const savedAppTypeName = localStorage.getItem('userApplicationTypeName');
      
      if (!savedAppType) {
        // No application type selected, go back
        router.push('/application/select-type');
        return;
      }
      
      setApplicationType(savedAppType);
      setApplicationTypeName(savedAppTypeName || '');
      
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const handleSelection = (routeId: string) => {
    setSelectedRoute(routeId);
    setError('');
    setSuccess(''); // Clear success when new selection is made
  };

  const handleContinue = async () => {
    if (!selectedRoute) {
      setError('Please select a study route');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(''); // Clear previous success

    try {
      // Store the selected study route
      const selectedRouteData = studyRoutes.find(r => r.id === selectedRoute);
      
      localStorage.setItem('userStudyRoute', selectedRoute);
      localStorage.setItem('userStudyRouteName', selectedRouteData?.name || '');
      
      // IMPORTANT: Store completion flag for sidebar
      localStorage.setItem('studyRouteCompleted', 'true');
      
      // Also store in session for backup
      sessionStorage.setItem('studyRouteCompleted', 'true');
      
      setSuccess(`${selectedRouteData?.name} selected successfully! Redirecting...`);
      
      // Redirect to high school records page
      setTimeout(() => {
        router.push('/application/High-school-records');
      }, 1500);
      
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/application/select-type');
  };

  const selectedRouteDetails = studyRoutes.find(route => route.id === selectedRoute);

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
            <button
              onClick={() => router.push('/application/select-type')}
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Application Type
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Study Route</span>
          </nav>
        </div>

        {/* Selected Application Type Badge */}
        {applicationTypeName && (
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
              <span className="text-sm">Applying for:</span>
              <span className="font-semibold">{applicationTypeName}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Study Route</h1>
          <p className="text-gray-600 mt-2">Select how you want to study your programme</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">STUDY ROUTE SELECTION</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Choose the study mode that best fits your schedule and learning preferences.
                Each route offers different benefits and flexibility levels.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Study Route Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {studyRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => handleSelection(route.id)}
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-all ${
                    selectedRoute === route.id
                      ? `${route.bgColor} border-green-500 shadow-md`
                      : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                  }`}
                >
                  <div className="text-center">
                    <div className={`inline-flex p-3 rounded-lg mb-3 ${selectedRoute === route.id ? route.bgColor : 'bg-gray-100'}`}>
                      <div className={route.color}>{route.icon}</div>
                    </div>
                    <h3 className={`font-semibold text-lg ${selectedRoute === route.id ? route.color : 'text-gray-800'}`}>
                      {route.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">{route.description}</p>
                    {selectedRoute === route.id && (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto mt-3" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Route Details */}
            {selectedRouteDetails && (
              <div className="mb-8 border-2 border-dashed border-green-500 rounded-lg overflow-hidden">
                <div className="bg-green-50 p-4 border-b border-dashed border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      {selectedRouteDetails.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{selectedRouteDetails.name}</h3>
                      <p className="text-sm text-gray-600">{selectedRouteDetails.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Schedule
                    </h4>
                    <p className="text-sm text-gray-600">{selectedRouteDetails.schedule}</p>
                  </div>
                  
                  <h4 className="font-medium text-gray-700 mb-3 text-sm">Key Features:</h4>
                  <ul className="space-y-2">
                    {selectedRouteDetails.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
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
                disabled={!selectedRoute || isLoading}
                className={`px-8 py-2.5 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 ${
                  selectedRoute && !isLoading
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
                    Next
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}