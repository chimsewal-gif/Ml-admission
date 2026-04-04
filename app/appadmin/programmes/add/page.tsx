'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  BookOpen,
  Building,
  Calendar,
  Tag,
  Hash,
  Save,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Programme {
  id: number;
  name: string;
  description: string;
  department: string;
  duration: string;
  category: string;
}

export default function AddOrEditProgrammePage() {
  const router = useRouter();
  const params = useParams();
  const programmeId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Checking authentication...');
      
      const response = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('📊 Auth response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('📊 User data:', userData);
        
        if (userData.is_authenticated) {
          console.log('✅ User authenticated');
          setUser(userData);
          await fetchCsrfToken();
        } else {
          console.log('❌ User not authenticated');
          handleAuthFailure();
        }
      } else {
        console.log('❌ Auth failed with status:', response.status);
        handleAuthFailure();
      }
    } catch (error: any) {
      console.error('💥 Auth error:', error);
      setError('Unable to connect to server. Please ensure Django is running on port 8000.');
      setCheckingAuth(false);
    }
  };

  const fetchCsrfToken = async () => {
    try {
      console.log('🛡️ Fetching CSRF token...');
      const response = await fetch(`${API_BASE_URL}/csrf/`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.csrfToken) {
          console.log('✅ CSRF token received');
          setCsrfToken(data.csrfToken);
          // Fetch departments after getting CSRF token
          fetchDepartments();
        }
      }
    } catch (error: any) {
      console.error('💥 CSRF error:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuthFailure = () => {
    setError('Please log in to continue');
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  // Fetch departments from API using session authentication
  const fetchDepartments = async () => {
    try {
      setDepartmentsLoading(true);
      console.log('📚 Fetching departments...');
      
      const response = await fetch(`${API_BASE_URL}/admin/departments/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      });

      console.log('📊 Departments response status:', response.status);

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Departments data:', data);

      // Handle different response formats
      if (data && Array.isArray(data)) {
        setDepartments(data); // Direct array response
      } else if (data && data.data && Array.isArray(data.data)) {
        setDepartments(data.data); // Paginated response
      } else if (data && data.departments && Array.isArray(data.departments)) {
        setDepartments(data.departments); // Nested departments key
      } else {
        console.error('Unexpected departments response format:', data);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments. Please try again.');
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Fetch programme details if editing
  useEffect(() => {
    const fetchProgramme = async () => {
      if (!programmeId || !user?.is_authenticated) return;
      
      setIsEditing(true);
      try {
        console.log('📖 Fetching programme details...');
        
        const response = await fetch(`${API_BASE_URL}/admin/programmes/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-CSRFToken': csrfToken,
          },
        });

        if (response.status === 401) {
          handleAuthFailure();
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch programmes: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Programmes data:', data);

        // Handle different response formats
        let programmes: Programme[] = [];
        if (data && Array.isArray(data)) {
          programmes = data; // Direct array response
        } else if (data && data.data && Array.isArray(data.data)) {
          programmes = data.data; // Paginated response
        } else if (data && data.programmes && Array.isArray(data.programmes)) {
          programmes = data.programmes; // Nested programmes key
        } else {
          console.error('Unexpected programmes response format:', data);
          programmes = [];
        }

        // Find the specific programme
        const programme = programmes.find((p: Programme) => p.id === parseInt(programmeId));
        if (!programme) throw new Error('Programme not found');

        setName(programme.name || '');
        setDescription(programme.description || '');
        setDepartment(programme.department || '');
        setDuration(programme.duration || '');
        setCategory(programme.category || '');
      } catch (error: any) {
        console.error('Error fetching programme details:', error);
        setError('Failed to fetch programme details.');
      }
    };

    if (csrfToken && user?.is_authenticated) {
      fetchProgramme();
    }
  }, [programmeId, user, csrfToken]);

  // Handle submit using fetch instead of axios
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user?.is_authenticated) {
      setError('Please log in to continue');
      return;
    }

    try {
      const payload = { 
        name, 
        description, 
        department, 
        duration, 
        category 
      };

      console.log('🚀 Submitting programme data:', payload);

      let url = `${API_BASE_URL}/admin/programmes/`;
      let method = 'POST';

      if (isEditing) {
        url = `${API_BASE_URL}/admin/programmes/${programmeId}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('📊 Submit response status:', response.status);

      if (response.status === 401) {
        handleAuthFailure();
        return;
      }

      let data;
      try {
        data = await response.json();
        console.log('📊 Submit response data:', data);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || data.detail || data.message || `Request failed with status ${response.status}`);
      }

      alert(isEditing ? 'Programme updated successfully!' : 'Programme added successfully!');
      router.push('/appadmin/programmes');

    } catch (error: any) {
      console.error('Error saving programme:', error);
      setError(`Failed to save programme: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Checking Authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/appadmin/programmes')}
            className="inline-flex items-center space-x-2 text-green-700 hover:text-green-800 font-medium mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Programmes</span>
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? 'Edit Programme' : 'Add New Programme'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditing
                    ? 'Update the programme details below.'
                    : 'Fill in the details to create a new programme.'}
                </p>
              </div>
            </div>
            
            {user && user.is_authenticated && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Welcome, {user.username}!
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-red-700 font-medium">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Show login prompt if not authenticated */}
        {!user?.is_authenticated && (
          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Authentication Required
            </h3>
            <p className="text-yellow-700 mb-4">
              You need to be logged in to manage programmes.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        )}

        {/* Form - Only show if authenticated */}
        {user?.is_authenticated && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-green-600 to-green-700"></div>
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span>Programme Name *</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter programme name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Hash className="w-4 h-4 text-green-600" />
                  <span>Programme Description</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter programme description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition-all duration-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Building className="w-4 h-4 text-green-600" />
                    <span>Department *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      disabled={departmentsLoading || departments.length === 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a department</option>
                      {departmentsLoading ? (
                        <option value="" disabled>Loading departments...</option>
                      ) : (
                        departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  {departments.length === 0 && !departmentsLoading && (
                    <p className="text-sm text-red-600 mt-1">
                      No departments found. Please add departments first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span>Duration *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select duration</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                      <option value="3 Years">3 Years</option>
                      <option value="4 Years">4 Years</option>
                      <option value="5 Years">5 Years</option>
                      <option value="6 Years">6 Years</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span>Category *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select category</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Certificate">Certificate</option>
                      <option value="Foundation">Foundation</option>
                      <option value="Professional">Professional</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading || departmentsLoading || departments.length === 0 || !user?.is_authenticated}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? 'Update Programme' : 'Add Programme'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Help Text */}
        {departments.length === 0 && !departmentsLoading && user?.is_authenticated && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>No departments found.</strong> Please{' '}
              <button
                type="button"
                onClick={() => router.push('/appadmin/department')}
                className="text-green-600 hover:text-green-700 underline font-medium"
              >
                add departments first
              </button>{' '}
              before creating programmes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}