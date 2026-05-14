'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, ArrowRight, AlertCircle, CheckCircle, GraduationCap, 
  BookOpen, Award, Home, ChevronRight, ChevronDown, X, 
  Search, Sparkles, Clock, Shield, Zap, Target, Brain, Star, TrendingUp, BarChart3, ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  duration?: string;
  careerPaths?: string[];
}

const applicationTypes: ApplicationType[] = [
  {
    id: 'degree',
    name: "Bachelor's Degree",
    description: "Undergraduate degree programmes (4 years) - Generic and Upgrading pathways available",
    icon: <GraduationCap className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    duration: "4 Years",
    careerPaths: ["Professional Careers", "Graduate Studies", "Research", "Industry Leadership"],
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
    duration: "2 Years",
    careerPaths: ["Senior Management", "Specialist Roles", "Research Positions", "Academia"],
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
    duration: "3-5 Years",
    careerPaths: ["Academia", "Research Director", "Senior Expert", "Consultant"],
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
    duration: "2 Years",
    careerPaths: ["Technical Roles", "Supervisory Positions", "Entrepreneurship"],
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
    duration: "1 Year",
    careerPaths: ["Entry Level Positions", "Skill Enhancement", "Career Change"],
    requirements: [
      'Malawi School Certificate of Education (MSCE) or equivalent',
      'Minimum of 2 credits',
      'Completed application form',
      'Copy of national ID',
    ],
  },
];

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Custom Styled Select Component
const StyledApplicationSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: ApplicationType[];
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedType = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (typeId: string) => {
    onChange(typeId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center justify-between gap-2 hover:border-green-300 transition-all"
      >
        <div className="flex-1 truncate">
          {selectedType ? (
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${selectedType.bgColor}`}>
                {selectedType.icon}
              </div>
              <span className="text-gray-800 font-medium">{selectedType.name}</span>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            {/* Search Bar */}
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search application types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No application types found
                </div>
              ) : (
                filteredOptions.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSelect(type.id)}
                    className={`w-full px-3 py-3 text-left hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 ${
                      selectedType?.id === type.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${type.bgColor} ${type.color}`}>
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${selectedType?.id === type.id ? 'text-green-700' : 'text-gray-800'}`}>
                            {type.name}
                          </span>
                          {selectedType?.id === type.id && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function SelectApplicationType() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const router = useRouter();

  // Add toast notification
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

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
      
      // Check if already selected
      const savedType = localStorage.getItem('userApplicationType');
      if (savedType) {
        setSelectedType(savedType);
      }
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const handleSelection = (typeId: string) => {
    setSelectedType(typeId);
  };

  const handleContinue = async () => {
    if (!selectedType) {
      addToast('Please select an application type', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addToast('Please log in first.', 'error');
        setTimeout(() => router.push('/login'), 1500);
        setIsLoading(false);
        return;
      }

      const selectedTypeData = applicationTypes.find(t => t.id === selectedType);
      
      // Store the selected application type
      localStorage.setItem('userApplicationType', selectedType);
      localStorage.setItem('userApplicationTypeName', selectedTypeData?.name || '');
      
      // Store completion flag for sidebar
      localStorage.setItem('applicationTypeCompleted', 'true');
      
      // Also store in session for backup
      sessionStorage.setItem('applicationTypeCompleted', 'true');
      
      addToast(`${selectedTypeData?.name} selected successfully! Redirecting...`, 'success');
      
      setTimeout(() => {
        router.push('/application/select-route');
      }, 1500);
      
    } catch (error: any) {
      if (error.message && error.message.includes('Failed to fetch')) {
        addToast('Cannot connect to server. Please ensure the Django backend is running.', 'error');
      } else {
        addToast(error.message || 'An unexpected error occurred. Please try again.', 'error');
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
        
        {/* Toast Notifications */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg ${
                toast.type === 'success' 
                  ? 'bg-green-600 text-white' 
                  : toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 hover:opacity-80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

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
            {/* Custom Dropdown Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Application Type *
              </label>
              <StyledApplicationSelect
                value={selectedType}
                onChange={handleSelection}
                options={applicationTypes}
                placeholder="-- Choose your application type --"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-green-500" />
                Choose the option that best describes your applicant category
              </p>
            </div>

            {/* Selected Type Details Card with Animation */}
            <AnimatePresence mode="wait">
              {selectedDetails && (
                <motion.div
                  key={selectedDetails.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8 border-2 border-green-500 rounded-lg overflow-hidden shadow-md"
                >
                  <div className={`${selectedDetails.bgColor} p-4 border-b border-green-200`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedDetails.bgColor} ${selectedDetails.color}`}>
                        {selectedDetails.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{selectedDetails.name}</h3>
                        <p className="text-sm text-gray-600">{selectedDetails.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white">
                    {/* Duration Info */}
                    {selectedDetails.duration && (
                      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Clock className="w-4 h-4 text-green-600" />
                        <span>Programme Duration: <strong>{selectedDetails.duration}</strong></span>
                      </div>
                    )}

                    {/* Career Paths */}
                    {selectedDetails.careerPaths && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2 text-sm flex items-center gap-2">
                          <Target className="w-4 h-4 text-green-600" />
                          Career Opportunities:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedDetails.careerPaths.map((path, idx) => (
                            <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                              {path}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <h4 className="font-medium text-gray-700 mb-3 text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      Entry Requirements:
                    </h4>
                    <ul className="space-y-2">
                      {selectedDetails.requirements.map((req, index) => (
                        <motion.li 
                          key={index} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start text-sm text-gray-600"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {req}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Type Hint */}
            {!selectedDetails && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 text-center"
              >
                <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Select an application type above to see detailed requirements</p>
                <p className="text-xs text-gray-400 mt-1">Our AI will help match you with the right programmes</p>
              </motion.div>
            )}

            {/* Recommended Badge */}
            {selectedDetails && (
              <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs">
                  <ThumbsUp className="w-3 h-3" />
                  <span>Recommended for applicants with similar profiles</span>
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
                className={`px-8 py-2.5 rounded-lg text-white font-semibold transition-all flex items-center gap-2 ${
                  selectedType && !isLoading
                    ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
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
                    Continue to Study Route
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-green-500" />
            Need help choosing? Contact our admissions office for guidance on the right application type for you.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Selected application type will determine your study route options and programme availability
          </p>
        </div>
      </div>
    </div>
  );
}