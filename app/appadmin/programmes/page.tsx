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

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface Department {
  id: number;
  name: string;
  code: string;
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

  // Check authentication
  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData.is_authenticated) {
          setUser(userData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  };

  // Fetch departments from Django API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }

        setDepartmentsLoading(true);

        // Get CSRF token first
        const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
          credentials: 'include',
        });

        if (!csrfResponse.ok) {
          throw new Error('Failed to get CSRF token');
        }

        const csrfData = await csrfResponse.json();

        // Fetch departments
        const response = await fetch(`${API_BASE_URL}/departments/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfData.csrfToken,
          },
        });

        console.log('Departments response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Departments response data:', data);

        // Handle response format
        if (data && data.success) {
          setDepartments(data.data || []);
        } else if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          console.error('Unexpected departments response format:', data);
          setDepartments([]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch programme details if editing
  useEffect(() => {
    const fetchProgramme = async () => {
      if (!programmeId) return;
      
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      setIsEditing(true);
      try {
        // Get CSRF token first
        const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
          credentials: 'include',
        });

        if (!csrfResponse.ok) {
          throw new Error('Failed to get CSRF token');
        }

        const csrfData = await csrfResponse.json();

        // Fetch programmes
        const response = await fetch(`${API_BASE_URL}/programmes/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfData.csrfToken,
          },
        });

        console.log('Programmes response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Programmes response data:', data);

        // Handle response format
        let programmes = [];
        if (data && data.success) {
          programmes = data.data || [];
        } else if (Array.isArray(data)) {
          programmes = data;
        } else {
          console.error('Unexpected programmes response format:', data);
          programmes = [];
        }

        // Find the specific programme
        const programme = programmes.find((p: any) => p.id === parseInt(programmeId));
        if (!programme) throw new Error('Programme not found');

        setName(programme.name || '');
        setDescription(programme.description || '');
        setDepartment(programme.department || '');
        setDuration(programme.duration || '');
        setCategory(programme.category || '');
      } catch (error: any) {
        console.error('Error fetching programme details:', error);
        alert('Failed to fetch programme details: ' + error.message);
      }
    };
    fetchProgramme();
  }, [programmeId]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      // Get CSRF token first
      const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const csrfData = await csrfResponse.json();

      const payload = { 
        name, 
        description, 
        department, 
        duration, 
        category 
      };

      let response;
      if (isEditing) {
        response = await fetch(`${API_BASE_URL}/programmes/${programmeId}/`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfData.csrfToken,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/programmes/`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfData.csrfToken,
          },
          body: JSON.stringify(payload),
        });
      }

      console.log('Save response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Save response data:', result);

      if (result.success) {
        alert(isEditing ? 'Programme updated successfully!' : 'Programme added successfully!');
        router.push('/appadmin/programmes');
      } else {
        throw new Error(result.message || 'Failed to save programme');
      }
    } catch (error: any) {
      console.error('Error saving programme:', error);
      alert(`Failed to save programme: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Get CSRF token first
      const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
        credentials: 'include',
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const csrfData = await csrfResponse.json();

      const response = await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfData.csrfToken,
        },
      });

      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/login');
    }
  };

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
              {user && (
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-500">
                    Welcome, {user.username}!
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                  >
                    <option value="">Select a department</option>
                    {departmentsLoading ? (
                      <option value="" disabled>Loading departments...</option>
                    ) : (
                      departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name} {dept.code && `(${dept.code})`}
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
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                    <option value="diploma">Diploma</option>
                    <option value="certificate">Certificate</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
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

        {/* Help Text */}
        {departments.length === 0 && !departmentsLoading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>No departments found.</strong> You can still create a programme by typing the department name manually in the department field.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}