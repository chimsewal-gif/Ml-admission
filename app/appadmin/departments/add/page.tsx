'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  ArrowLeft,
  Save,
  X,
  Mail,
  Phone,
  Calendar,
  User,
  Hash,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

export default function AddDepartmentPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head_of_department: '',
    email: '',
    phone: '',
    established_date: '',
    is_active: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/me/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear general error
    if (error) setError(null);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Department name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Department name must be at least 2 characters';
    } else if (formData.name.length > 200) {
      errors.name = 'Department name must be less than 200 characters';
    }
    
    if (!formData.code.trim()) {
      errors.code = 'Department code is required';
    } else if (formData.code.length < 2) {
      errors.code = 'Department code must be at least 2 characters';
    } else if (formData.code.length > 10) {
      errors.code = 'Department code must be less than 10 characters';
    } else if (!/^[A-Z0-9]+$/i.test(formData.code)) {
      errors.code = 'Department code should contain only letters and numbers';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[\d\s\-+()]{10,20}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.established_date) {
      const date = new Date(formData.established_date);
      if (isNaN(date.getTime())) {
        errors.established_date = 'Please enter a valid date';
      } else if (date > new Date()) {
        errors.established_date = 'Established date cannot be in the future';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const token = getToken();
    if (!token) {
      setError('Please login to continue');
      setTimeout(() => router.push('/login'), 2000);
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || "",
        head_of_department: formData.head_of_department.trim() || "",
        email: formData.email.trim() || "",
        phone: formData.phone.trim() || "",
        established_date: formData.established_date || null,
        is_active: formData.is_active,
      };
      
      console.log('Creating department:', payload);
      
      const response = await fetch(`${API_BASE_URL}/departments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
        setTimeout(() => router.push('/login'), 2000);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.message) {
          throw new Error(data.message);
        }
        if (data.errors) {
          const apiErrors: { [key: string]: string } = {};
          Object.keys(data.errors).forEach(key => {
            apiErrors[key] = data.errors[key][0];
          });
          setValidationErrors(apiErrors);
          throw new Error('Please fix the validation errors');
        }
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        setSuccess(`Department "${formData.name}" created successfully!`);
        setFormData({
          name: '',
          code: '',
          description: '',
          head_of_department: '',
          email: '',
          phone: '',
          established_date: '',
          is_active: true,
        });
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/appadmin/departments');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to create department');
      }
      
    } catch (err: any) {
      console.error('Error creating department:', err);
      setError(err.message || 'Failed to create department. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/appadmin/departments')}
            className="inline-flex items-center space-x-2 text-green-700 hover:text-green-800 font-medium mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Departments</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Building className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Department</h1>
              <p className="text-gray-600 mt-1">Create a new academic department</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-800 font-medium">Success</p>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-green-600 to-green-700"></div>
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department Name */}
              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Building className="w-4 h-4 text-green-600" />
                  <span>Department Name *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Computer Science"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              {/* Department Code */}
              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Hash className="w-4 h-4 text-green-600" />
                  <span>Department Code *</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="e.g., CS"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.code ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.code && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Use uppercase letters and numbers only</p>
              </div>

              {/* Head of Department */}
              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <User className="w-4 h-4 text-green-600" />
                  <span>Head of Department</span>
                </label>
                <input
                  type="text"
                  name="head_of_department"
                  value={formData.head_of_department}
                  onChange={handleChange}
                  placeholder="e.g., Prof. John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Established Date */}
              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span>Established Date</span>
                </label>
                <input
                  type="date"
                  name="established_date"
                  value={formData.established_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.established_date ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.established_date && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.established_date}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., department@university.edu"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +265 123 456 789"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                    validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                <Building className="w-4 h-4 text-green-600" />
                <span>Description</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Enter department description..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Active Department
              </label>
              <p className="text-xs text-gray-500 ml-2">
                Inactive departments won't appear in public lists
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/appadmin/departments')}
                className="inline-flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Department
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Department Information</h3>
              <p className="text-xs text-blue-700 mt-1">
                Departments are used to organize academic programmes. Each department must have a unique code.
                After creating a department, you can assign programmes to it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}