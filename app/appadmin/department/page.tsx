'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Save, ArrowLeft, BookOpen, Shield, AlertCircle, X, Edit2, Trash2 } from 'lucide-react';
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

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
    fetchDepartments();
  }, []);

  // Check if department code already exists
  useEffect(() => {
    const checkDepartmentCode = async () => {
      if (form.code && form.code.length >= 2 && (!editingDepartment || editingDepartment.code !== form.code)) {
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
  }, [form.code, editingDepartment]);

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/departments/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDepartments(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const checkAuthAndInitialize = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔍 Step 1: Getting CSRF token...');
      
      let csrfToken = '';
      try {
        const csrfResponse = await fetch(`${API_BASE_URL}/csrf/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (csrfResponse.ok) {
          const csrfData = await csrfResponse.json();
          csrfToken = csrfData.csrfToken || '';
          setCsrfToken(csrfToken);
        }
      } catch (csrfErr) {
        console.warn('CSRF fetch error:', csrfErr);
      }

      const authResponse = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
      });

      if (!authResponse.ok) {
        setError('Please log in to access this page');
        setTimeout(() => router.push('/login'), 1000);
        return;
      }

      const userData = await authResponse.json();
      
      if (!userData.is_authenticated) {
        setError('Please log in to access this page');
        setTimeout(() => router.push('/login'), 1000);
        return;
      }

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
      setModalTitle('Authentication Error');
      setModalMessage('Please log in to create departments');
      setShowErrorModal(true);
      return;
    }

    const allTouched = Object.keys(form).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    const validationError = validateForm();
    if (validationError) {
      setModalTitle('Validation Error');
      setModalMessage(validationError);
      setShowErrorModal(true);
      return;
    }

    setModalTitle('Confirm Creation');
    setModalMessage(`Are you sure you want to create the department "${form.name}"?`);
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    
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

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (response.status === 401 || response.status === 403) {
        setModalTitle('Session Expired');
        setModalMessage('Session expired. Please log in again.');
        setShowErrorModal(true);
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

      setModalTitle('Success!');
      setModalMessage('Department created successfully!');
      setShowSuccessModal(true);
      
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
      await fetchDepartments();

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);

    } catch (err: any) {
      console.error('❌ Department creation error:', err);
      setModalTitle('Error');
      setModalMessage(err.message || 'Failed to create department. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (department: Department) => {
    setEditingDepartment(department);
    setForm({
      name: department.name,
      code: department.code,
      description: department.description || '',
      head_of_department: department.head_of_department || '',
      email: department.email || '',
      phone: department.phone || '',
      established_year: department.established_year || new Date().getFullYear().toString(),
      is_active: department.is_active !== undefined ? department.is_active : true,
    });
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!editingDepartment) return;

    const validationError = validateForm();
    if (validationError) {
      setModalTitle('Validation Error');
      setModalMessage(validationError);
      setShowErrorModal(true);
      return;
    }

    setShowEditModal(false);
    setSaving(true);

    try {
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/admin/departments/${editingDepartment.id}/`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
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

      setModalTitle('Success!');
      setModalMessage('Department updated successfully!');
      setShowSuccessModal(true);
      
      setEditingDepartment(null);
      await fetchDepartments();

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);

    } catch (err: any) {
      console.error('❌ Department update error:', err);
      setModalTitle('Error');
      setModalMessage(err.message || 'Failed to update department. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (department: Department) => {
    setDeletingDepartment(department);
    setModalTitle('Confirm Deletion');
    setModalMessage(`Are you sure you want to delete the department "${department.name}"? This action cannot be undone.`);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingDepartment) return;

    setShowDeleteModal(false);
    setSaving(true);

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/admin/departments/${deletingDepartment.id}/`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        setModalTitle('Session Expired');
        setModalMessage('Session expired. Please log in again.');
        setShowErrorModal(true);
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to delete department';
        try {
          const data = await response.json();
          errorMessage = data.message || data.detail || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      setModalTitle('Success!');
      setModalMessage('Department deleted successfully!');
      setShowSuccessModal(true);
      
      setDeletingDepartment(null);
      await fetchDepartments();

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);

    } catch (err: any) {
      console.error('❌ Department deletion error:', err);
      setModalTitle('Error');
      setModalMessage(err.message || 'Failed to delete department. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const generateDepartmentCode = () => {
    if (!form.name.trim()) {
      setModalTitle('Information');
      setModalMessage('Please enter a department name first');
      setShowErrorModal(true);
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

  // Modal Component
  const Modal = ({ isOpen, onClose, title, message, type, children }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    message?: string; 
    type: 'success' | 'error' | 'confirm' | 'edit' | 'delete';
    children?: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    const bgColor = type === 'success' ? 'bg-green-50' : type === 'error' ? 'bg-red-50' : 'bg-blue-50';
    const borderColor = type === 'success' ? 'border-green-200' : type === 'error' ? 'border-red-200' : 'border-blue-200';
    const iconColor = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600';
    const Icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'edit' ? '✏️' : '❓';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full ${borderColor} border transform transition-all animate-slideUp max-h-[90vh] overflow-y-auto`}>
          <div className={`${bgColor} px-6 py-4 rounded-t-2xl border-b ${borderColor} sticky top-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`text-2xl ${iconColor}`}>{Icon}</span>
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="px-6 py-6">
            {children || (message && <p className="text-gray-700 text-base">{message}</p>)}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3 sticky bottom-0">
            {type === 'confirm' && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm
                </button>
              </>
            )}
            {type === 'delete' && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
            {type === 'edit' && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEdit}
                  disabled={saving || codeExists}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
            {(type === 'success' || type === 'error') && (
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  type === 'success' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Checking Authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100/90 backdrop-blur-sm text-yellow-800 p-6 rounded-xl mb-4">
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
    <div className="min-h-screen bg-transparent py-8">
      {/* Modals */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={modalTitle}
        message={modalMessage}
        type="confirm"
      />
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalTitle}
        message={modalMessage}
        type="success"
      />
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={modalTitle}
        message={modalMessage}
        type="error"
      />
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Department"
        type="edit"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Department Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              name="name"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                isFieldInvalid('name') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {isFieldInvalid('name') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('name', form.name)}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Department Code *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={form.code}
                onChange={handleChange}
                onBlur={handleBlur}
                name="code"
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase ${
                  isFieldInvalid('code') || codeExists ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={generateDepartmentCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate
              </button>
            </div>
            {codeExists && <p className="mt-1 text-sm text-red-600">Code already exists</p>}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={handleChange}
              name="description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Head of Department
            </label>
            <input
              type="text"
              value={form.head_of_department}
              onChange={handleChange}
              name="head_of_department"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange}
              name="email"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                isFieldInvalid('email') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {isFieldInvalid('email') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('email', form.email || '')}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange}
              name="phone"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                isFieldInvalid('phone') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {isFieldInvalid('phone') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('phone', form.phone || '')}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Established Year
            </label>
            <input
              type="number"
              value={form.established_year}
              onChange={handleChange}
              name="established_year"
              min="1900"
              max={new Date().getFullYear()}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                isFieldInvalid('established_year') ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {isFieldInvalid('established_year') && (
              <p className="mt-1 text-sm text-red-600">
                {getFieldError('established_year', form.established_year || '')}
              </p>
            )}
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={modalTitle}
        message={modalMessage}
        type="delete"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Card - Transparent */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-600/90 to-emerald-600/90 backdrop-blur-sm px-6 py-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    Department Management
                  </h1>
                  <p className="text-green-100 text-sm sm:text-lg">
                    Create, edit, or delete academic departments
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

        {user?.is_authenticated && (
          <>
            {/* Add Department Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden mb-6">
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-green-600" />
                  Add New Department
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-8">
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
                            : 'border-gray-300 bg-white/80'
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
                              : 'border-gray-300 bg-white/80'
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
                      </div>
                    </div>
                  </div>

                  <div>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80"
                      placeholder="Brief description of the department..."
                    />
                  </div>

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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/80"
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
                            : 'border-gray-300 bg-white/80'
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
                            : 'border-gray-300 bg-white/80'
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
                            : 'border-gray-300 bg-white/80'
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

            {/* Departments List */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Building2 className="w-6 h-6 mr-2 text-green-600" />
                  Existing Departments
                </h2>
                
                {loadingDepartments ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-gray-600">Loading departments...</p>
                  </div>
                ) : departments.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No departments created yet</p>
                    <p className="text-sm text-gray-400 mt-1">Use the form above to add your first department</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Head of Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {departments.map((dept) => (
                          <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {dept.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                              {dept.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {dept.head_of_department || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {dept.email || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditClick(dept)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Department"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(dept)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Department"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm bg-white/50 backdrop-blur-sm inline-block px-4 py-2 rounded-lg">
            Fields marked with * are required. Department code should be unique and typically 2-6 characters.
          </p>
        </div>
      </div>
    </div>
  );
}