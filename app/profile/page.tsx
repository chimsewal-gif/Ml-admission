'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, ChevronRight, AlertCircle, CheckCircle, 
  User, Phone, Mail, MapPin, Calendar, Flag, 
  IdCard, Save, Edit2, Loader, Shield, Clock, X,
  Heart, Users, ArrowRight
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface PersonalDetails {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  home_district: string;
  physical_address: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [applicationTypeName, setApplicationTypeName] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [formData, setFormData] = useState<PersonalDetails>({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    nationality: '',
    national_id: '',
    home_district: '',
    physical_address: '',
  });

  // Add toast notification
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    const token = getToken();
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      const savedAppTypeName = localStorage.getItem('userApplicationTypeName');
      setApplicationTypeName(savedAppTypeName || '');
      
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const userRes = await fetch(`${API_BASE_URL}/me/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!userRes.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await userRes.json();
        setUser(userData);

        const detailsRes = await fetch(`${API_BASE_URL}/personal-details/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          if (detailsData.success && detailsData.data) {
            setFormData({
              first_name: detailsData.data.first_name || userData.first_name || '',
              middle_name: detailsData.data.middle_name || '',
              last_name: detailsData.data.last_name || userData.last_name || '',
              email: detailsData.data.email || userData.email || '',
              phone: detailsData.data.phone || '',
              gender: detailsData.data.gender || '',
              date_of_birth: detailsData.data.date_of_birth || '',
              nationality: detailsData.data.nationality || '',
              national_id: detailsData.data.national_id || '',
              home_district: detailsData.data.home_district || '',
              physical_address: detailsData.data.physical_address || '',
            });
          }
        }

      } catch (err) {
        console.error('Error fetching profile:', err);
        addToast('Failed to load profile data. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[0-9+\-\s()]{8,20}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 100) {
        errors.date_of_birth = 'Age must be between 16 and 100 years';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      addToast('Please fix the validation errors before saving.', 'error');
      return;
    }
    
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE_URL}/personal-details/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        addToast('Profile updated successfully!', 'success');
        setIsEditing(false);
        
        if (user) {
          const updatedUser = { ...user, first_name: formData.first_name, last_name: formData.last_name, email: formData.email };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      addToast(err.message || 'Failed to save profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    router.push('/application/next-of-kin');
  };

  const handleBack = () => {
    router.push('/application/select-route');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        
        {/* Toast Notifications */}
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg animate-slide-down ${
                toast.type === 'success' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 hover:opacity-80 transition-opacity"
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
            <button
              onClick={() => router.push('/application/select-type')}
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Application Type
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => router.push('/application/select-route')}
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              Study Route
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Profile</span>
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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Personal Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your personal information</p>
        </div>

        {/* Main Card - Medium size */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-800">PERSONAL INFORMATION</h2>
              </div>
              
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Profile
                </button>
              )}
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg mt-3">
              <p className="text-xs text-gray-700">
                Please provide accurate personal information. This will be used for your application and official communication.
              </p>
            </div>
          </div>

          <div className="p-5">
            {/* Edit Mode Banner */}
            {isEditing && (
              <div className="mb-5 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center text-xs text-blue-700">
                  <Edit2 className="w-3 h-3 mr-2" />
                  Editing mode - modify your information below
                </div>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setValidationErrors({});
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Cancel
                </button>
              </div>
            )}

            <form onSubmit={(e) => {
              e.preventDefault();
              if (isEditing) {
                handleSave();
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      validationErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    placeholder="Enter first name"
                  />
                  {validationErrors.first_name && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.first_name}</p>
                  )}
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    } border-gray-300`}
                    placeholder="Enter middle name (optional)"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      validationErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    placeholder="Enter last name"
                  />
                  {validationErrors.last_name && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.last_name}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    } border-gray-300`}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        validationErrors.date_of_birth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                    />
                  </div>
                  {validationErrors.date_of_birth && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.date_of_birth}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                      placeholder="+265 123 456 789"
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>
                  )}
                </div>

                {/* Nationality */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nationality
                  </label>
                  <div className="relative">
                    <Flag className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                      } border-gray-300`}
                      placeholder="e.g., Malawian"
                    />
                  </div>
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    National ID Number
                  </label>
                  <div className="relative">
                    <IdCard className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      name="national_id"
                      value={formData.national_id}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                      } border-gray-300`}
                      placeholder="e.g., 1234567890"
                    />
                  </div>
                </div>

                {/* Home District */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Home District
                  </label>
                  <div className="relative">
                    <Home className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      name="home_district"
                      value={formData.home_district}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                      } border-gray-300`}
                      placeholder="e.g., Lilongwe, Blantyre, Mzuzu"
                    />
                  </div>
                </div>

                {/* Physical Address - Full width */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Physical Address
                  </label>
                  <textarea
                    name="physical_address"
                    value={formData.physical_address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={2}
                    placeholder="Enter your full physical address (street, city, postal code)"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${
                      !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                    } border-gray-300`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-200">
                <button
                  onClick={handleBack}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Back
                </button>
                
                {isEditing ? (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium text-sm flex items-center gap-2 shadow-md"
                  >
                    Continue to Next of Kin
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-xs">
            Fields marked with <span className="text-red-500">*</span> are required.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}