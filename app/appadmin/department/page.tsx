'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Save, ArrowLeft, BookOpen, Shield, AlertCircle } from 'lucide-react';
import Button2 from '@/componets/Button2';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

interface Department {
  id?: number;
  name: string;
  code: string;
  description?: string;
  head_of_department?: string;
  email?: string;
  phone?: string;
  established_year?: string;
  is_active?: boolean;
}

export default function AddDepartmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeExists, setCodeExists] = useState(false);

  const [form, setForm] = useState<Department>({
    name: '',
    code: '',
    description: '',
    head_of_department: '',
    email: '',
    phone: '',
    established_year: new Date().getFullYear().toString(),
    is_active: true,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuthAndInitialize();
  }, []);

  // Check if department code already exists
  useEffect(() => {
    const checkDepartmentCode = async () => {
      if (form.code && form.code.length >= 2) {
        setCheckingCode(true);
        try {
          const response = await fetch(`${API_BASE_URL}/admin/departments/check-code/?code=${encodeURIComponent(form.code)}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setCodeExists(data.exists);
          } else {
            console.warn('Code check failed, assuming code is available');
            setCodeExists(false);
          }
        } catch (err) {
          console.error('Error checking department code:', err);
          setCodeExists(false);
        } finally {
          setCheckingCode(false);
        }
      } else {
        setCodeExists(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkDepartmentCode();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [form.code]);

  const checkAuthAndInitialize = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔍 Step 1: Getting CSRF token...');
      
      // Try to get CSRF token first
      let csrfToken = '';
      try {
        const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        console.log('CSRF Response status:', csrfResponse.status);
        
        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken || '';
          setCsrfToken(csrfToken);
          console.log('CSRF token received');
        } else {
          console.warn('CSRF token fetch failed, continuing without it');
        }
      } catch (csrfErr) {
        console.warn('CSRF fetch error:', csrfErr);
        // Continue without CSRF token
      }

      console.log('🔍 Step 2: Checking authentication...');
      // Step 2: Check authentication
      const authResponse = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
      });

      console.log('Auth Response status:', authResponse.status);

      if (!authResponse.ok) {
        console.log('❌ Auth failed, redirecting to login...');
        setError('Please log in to access this page');
        setTimeout(() => router.push('/login'), 1000);
        return;
      }

      const userData = await authResponse.json();
      console.log('User data:', userData);
      
      if (!userData.is_authenticated) {
        console.log('❌ User not authenticated, redirecting to login...');
        setError('Please log in to access this page');
        setTimeout(() => router.push('/login'), 1000);
        return;
      }

      console.log('✅ User authenticated successfully');
      setUser(userData);

    } catch (err: any) {
      console.error('Initialization error:', err);
      if (err.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please check your connection and try again.');
      } else {
        setError(`Connection error: ${err.message}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    setLoading(true);
    await checkAuthAndInitialize();
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[(]?[-\s.]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const getFieldError = (name: keyof Department, value: string): string | null => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Department name is required';
        if (value.length < 2) return 'Department name must be at least 2 characters';
        break;
      case 'code':
        if (!value.trim()) return 'Department code is required';
        if (value.length > 10) return 'Department code must be 10 characters or less';
        if (value.length < 2) return 'Department code must be at least 2 characters';
        if (codeExists) return 'This department code already exists';
        break;
      case 'email':
        if (value && !isValidEmail(value)) return 'Please enter a valid email address';
        break;
      case 'phone':
        if (value && !isValidPhone(value)) return 'Please enter a valid phone number';
        break;
      case 'established_year':
        if (value) {
          const year = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (year < 1900 || year > currentYear) {
            return `Please enter a valid establishment year (1900-${currentYear})`;
          }
        }
        break;
    }
    return null;
  };

  const validateForm = (): string | null => {
    const requiredFields: (keyof Department)[] = ['name', 'code'];
    
    for (const field of requiredFields) {
      const error = getFieldError(field, form[field] as string);
      if (error) return error;
    }

    const optionalFields: (keyof Department)[] = ['email', 'phone', 'established_year'];
    for (const field of optionalFields) {
      const error = getFieldError(field, form[field] as string);
      if (error) return error;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user?.is_authenticated) {
      setError('Please log in to create departments');
      return;
    }

    const allTouched = Object.keys(form).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const submitData = {
        ...form,
        code: form.code.toUpperCase().trim(),
        name: form.name.trim(),
        description: form.description?.trim() || '',
        head_of_department: form.head_of_department?.trim() || '',
        email: form.email?.trim() || '',
        phone: form.phone?.trim() || '',
        established_year: form.established_year ? parseInt(form.established_year) : null,
        is_active: form.is_active !== undefined ? form.is_active : true,
      };

      console.log('📤 Submitting department data:', submitData);
      console.log('CSRF Token:', csrfToken ? 'Present' : 'Missing');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/admin/departments/`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      console.log('📥 Response status:', response.status);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Response data:', data);
      } else {
        const text = await response.text();
        console.log('Response text:', text.substring(0, 200));
      }

      if (response.status === 401 || response.status === 403) {
        setError('Session expired. Please log in again.');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      if (!response.ok) {
        if (data?.errors) {
          const errors = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('; ');
          throw new Error(errors);
        } else if (data?.detail) {
          throw new Error(data.detail);
        } else if (data?.message) {
          throw new Error(data.message);
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      if (data?.success === false) {
        throw new Error(data.message || 'Failed to create department');
      }

      setSuccess('✅ Department created successfully! Redirecting...');
      
      // Reset form
      setForm({
        name: '',
        code: '',
        description: '',
        head_of_department: '',
        email: '',
        phone: '',
        established_year: new Date().getFullYear().toString(),
        is_active: true,
      });
      setTouched({});
      setCodeExists(false);

      // Redirect after delay
      setTimeout(() => {
        router.push('/appadmin/dashboard?message=department_created');
      }, 1500);

    } catch (err: any) {
      console.error('❌ Department creation error:', err);
      setError(err.message || 'Failed to create department. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const generateDepartmentCode = () => {
    if (!form.name.trim()) {
      setError('Please enter a department name first');
      return;
    }

    const words = form.name.trim().split(/\s+/);
    let code = '';
    
    if (words.length === 1) {
      code = words[0].substring(0, 3).toUpperCase();
    } else {
      code = words.map(word => word[0]).join('').toUpperCase();
    }
    
    if (code.length > 6) {
      code = code.substring(0, 6);
    } else if (code.length < 2) {
      code = form.name.substring(0, 2).toUpperCase();
    }
    
    setForm(prev => ({ ...prev, code }));
  };

  const isFieldInvalid = (fieldName: keyof Department): boolean => {
    return !!touched[fieldName] && !!getFieldError(fieldName, form[fieldName] as string);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Checking Authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 text-yellow-800 p-6 rounded-xl mb-4">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
              <p className="text-lg font-medium">Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Add New Department
                  </h1>
                  <p className="text-green-100 text-sm sm:text-lg">
                    Create a new academic department
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {user && user.is_authenticated ? (
                  <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Welcome, {user.username}!
                    </div>
                  </div>
                ) : null}
                
                <button
                  onClick={() => router.push('/appadmin/dashboard')}
                  className="flex items-center justify-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && !error.includes('✅') && (
          <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  {error.includes('Session expired') ? 'Authentication Error' : 'Error'}
                </h3>
                <p className="text-yellow-700 mb-4">{error}</p>
                <div className="flex gap-4">
                  {error.includes('Connection error') || error.includes('Cannot connect') ? (
                    <button
                      onClick={handleRetry}
                      className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Retry Connection
                    </button>
                  ) : null}
                  {error.includes('Please log in') ? (
                    <button
                      onClick={handleLoginRedirect}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Go to Login
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {user?.is_authenticated && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              {error && !error.includes('✅') && !error.includes('Session expired') && !error.includes('Connection error') && !error.includes('Please log in') && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
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

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                    Basic Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                        Department Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                          isFieldInvalid('name') 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="e.g., Computer Science"
                      />
                      {isFieldInvalid('name') && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError('name', form.name)}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                        Department Code *
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          id="code"
                          name="code"
                          value={form.code}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          maxLength={10}
                          className={`flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 uppercase ${
                            isFieldInvalid('code') || codeExists
                              ? 'border-red-300 bg-red-50' 
                              : 'border-gray-300'
                          }`}
                          placeholder="e.g., CS"
                        />
                        <button
                          type="button"
                          onClick={generateDepartmentCode}
                          disabled={!form.name.trim()}
                          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap"
                        >
                          Generate
                        </button>
                      </div>
                      <div className="mt-1">
                        {checkingCode && (
                          <p className="text-xs text-blue-600">Checking code availability...</p>
                        )}
                        {codeExists && !checkingCode && (
                          <p className="text-xs text-red-600">This department code already exists</p>
                        )}
                        {!checkingCode && !codeExists && form.code.length >= 2 && (
                          <p className="text-xs text-green-600">Department code is available</p>
                        )}
                        {isFieldInvalid('code') && !codeExists && (
                          <p className="text-xs text-red-600">{getFieldError('code', form.code)}</p>
                        )}
                        {!isFieldInvalid('code') && !codeExists && !checkingCode && form.code.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Maximum 10 characters. Use Generate to auto-create from name.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="Brief description of the department..."
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-green-600" />
                    Contact Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="head_of_department" className="block text-sm font-semibold text-gray-700 mb-2">
                        Head of Department
                      </label>
                      <input
                        type="text"
                        id="head_of_department"
                        name="head_of_department"
                        value={form.head_of_department}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        placeholder="e.g., Dr. John Smith"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                          isFieldInvalid('email') 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="e.g., cs@university.edu"
                      />
                      {isFieldInvalid('email') && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError('email', form.email || '')}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                          isFieldInvalid('phone') 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="e.g., +265 123 456 789"
                      />
                      {isFieldInvalid('phone') && (
                        <p className="mt-1 text-sm text-red-600">{getFieldError('phone', form.phone || '')}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="established_year" className="block text-sm font-semibold text-gray-700 mb-2">
                        Established Year
                      </label>
                      <input
                        type="number"
                        id="established_year"
                        name="established_year"
                        value={form.established_year}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        min="1900"
                        max={new Date().getFullYear()}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ${
                          isFieldInvalid('established_year') 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="e.g., 2020"
                      />
                      {isFieldInvalid('established_year') && (
                        <p className="mt-1 text-sm text-red-600">
                          {getFieldError('established_year', form.established_year || '')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button2
                    type="submit"
                    disabled={saving || codeExists || checkingCode}
                    className="px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-all duration-200 min-w-[200px]"
                  >
                    {saving ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="w-5 h-5 mr-2" />
                        Create Department
                      </div>
                    )}
                  </Button2>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Fields marked with * are required. Department code should be unique and typically 2-6 characters.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            API Endpoint: {API_BASE_URL}/admin/departments/
          </p>
        </div>
      </div>
    </div>
  );
}