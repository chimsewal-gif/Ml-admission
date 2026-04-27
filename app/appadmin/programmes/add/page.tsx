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
  School,
  Clock,
  Layers,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

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
  school?: string;
  study_mode?: string;
  programme_type?: string;
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
  const [school, setSchool] = useState('');
  const [studyMode, setStudyMode] = useState('');
  const [programmeType, setProgrammeType] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Authentication check using JWT
  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Checking authentication with JWT...');
      
      const token = getToken();
      
      if (!token) {
        console.log('❌ No token found');
        setCheckingAuth(false);
        handleAuthFailure();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Auth response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('📊 User data:', userData);
        
        if (userData.is_authenticated || userData.id) {
          console.log('✅ User authenticated');
          setUser(userData);
          setCheckingAuth(false);
          // Fetch departments after authentication
          await fetchDepartments(token);
          // Fetch programme if editing
          if (programmeId) {
            await fetchProgramme(token);
          }
        } else {
          console.log('❌ User not authenticated');
          setCheckingAuth(false);
          handleAuthFailure();
        }
      } else if (response.status === 401) {
        console.log('❌ Token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCheckingAuth(false);
        handleAuthFailure();
      } else {
        console.log('❌ Auth failed with status:', response.status);
        setCheckingAuth(false);
        handleAuthFailure();
      }
    } catch (error: any) {
      console.error('💥 Auth error:', error);
      setError('Unable to connect to server. Please ensure Django is running on port 8000.');
      setCheckingAuth(false);
    }
  };

  const handleAuthFailure = () => {
    setError('Please log in to continue');
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  // Fetch departments from API using JWT
  const fetchDepartments = async (token: string) => {
    try {
      setDepartmentsLoading(true);
      console.log('📚 Fetching departments...');
      
      const response = await fetch(`${API_BASE_URL}/departments/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Departments response status:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Departments data:', data);

      // Handle different response formats
      if (data && data.success && Array.isArray(data.data)) {
        setDepartments(data.data);
      } else if (data && Array.isArray(data)) {
        setDepartments(data);
      } else if (data && data.departments && Array.isArray(data.departments)) {
        setDepartments(data.departments);
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
  const fetchProgramme = async (token: string) => {
    if (!programmeId) return;
    
    setIsEditing(true);
    try {
      console.log('📖 Fetching programme details...');
      
      const response = await fetch(`${API_BASE_URL}/programmes/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
      if (data && data.success && Array.isArray(data.data)) {
        programmes = data.data;
      } else if (data && Array.isArray(data)) {
        programmes = data;
      } else if (data && data.programmes && Array.isArray(data.programmes)) {
        programmes = data.programmes;
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
      setSchool(programme.school || '');
      setStudyMode(programme.study_mode || '');
      setProgrammeType(programme.programme_type || '');
    } catch (error: any) {
      console.error('Error fetching programme details:', error);
      setError('Failed to fetch programme details.');
    }
  };

  // Initial auth check
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Handle submit using JWT
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      setError('Please log in to continue');
      router.push('/login');
      return;
    }

    try {
      const payload = { 
        name, 
        description, 
        department, 
        duration, 
        category,
        school,
        study_mode: studyMode,
        programme_type: programmeType,
      };

      console.log('🚀 Submitting programme data:', payload);

      let url = `${API_BASE_URL}/programmes/`;
      let method = 'POST';

      if (isEditing) {
        url = `${API_BASE_URL}/programmes/${programmeId}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📊 Submit response status:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
        setTimeout(() => router.push('/login'), 2000);
        setLoading(false);
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
        throw new Error(data.message || data.error || data.detail || `Request failed with status ${response.status}`);
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

  // Show loading state
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

  // Show error if any
  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Go to Login
          </button>
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
            
            {user && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Welcome, {user.username || user.email || user.first_name}!
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

        {/* Form */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-green-600 to-green-700"></div>
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {/* Programme Name */}
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

              {/* Description */}
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

              {/* School Field - NEW */}
              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <School className="w-4 h-4 text-green-600" />
                  <span>School / Faculty</span>
                </label>
                <div className="relative">
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                  >
                    <option value="">Select School/Faculty</option>
                    <option value="Science, Technology and Innovation">Science, Technology and Innovation</option>
                    <option value="Humanities and Social Sciences">Humanities and Social Sciences</option>
                    <option value="Tourism, Hospitality and Management">Tourism, Hospitality and Management</option>
                    <option value="Education">Education</option>
                    <option value="Law">Law</option>
                    <option value="Business">Business</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1">The school or faculty offering this programme</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Department */}
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

                {/* Duration */}
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

                {/* Category */}
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
                      <option value="undergraduate">Undergraduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="diploma">Diploma</option>
                      <option value="certificate">Certificate</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                {/* Study Mode - NEW */}
                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span>Study Mode *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={studyMode}
                      onChange={(e) => setStudyMode(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select study mode</option>
                      <option value="full time">Full Time</option>
                      <option value="weekend">Weekend</option>
                      <option value="evening">Evening</option>
                      <option value="online">Online</option>
                      <option value="odel">ODeL</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">How the programme is delivered (Full Time, Weekend, ODeL, etc.)</p>
                </div>

                {/* Programme Type - NEW */}
                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Layers className="w-4 h-4 text-green-600" />
                    <span>Programme Type *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={programmeType}
                      onChange={(e) => setProgrammeType(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select programme type</option>
                      <option value="generic">Generic (4 years)</option>
                      <option value="upgrading">Upgrading (2-3 years)</option>
                      <option value="non-generic">Non-Generic</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Type of programme (Generic, Upgrading, or Non-Generic)</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading || departmentsLoading || departments.length === 0}
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
        {departments.length === 0 && !departmentsLoading && user && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>No departments found.</strong> Please{' '}
              <button
                type="button"
                onClick={() => router.push('/appadmin/departments')}
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