'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Phone, Calendar, MapPin, Flag, 
  Save, Edit2, Loader, CheckCircle, AlertCircle, Home, 
  IdCard, ChevronRight, ChevronLeft, Shield, Clock, X
} from 'lucide-react';
import ProgressIndicator from '@/componets/ProgressIndicator';
import Button2 from '@/componets/Button2';

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

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
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

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

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
        setError('Failed to load profile data. Please try again.');
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
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        
        if (user) {
          const updatedUser = { ...user, first_name: formData.first_name, last_name: formData.last_name, email: formData.email };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    router.push('/application/next-of-kin');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateCompletion = () => {
    const requiredFields = ['first_name', 'last_name', 'email'];
    const filledFields = requiredFields.filter(field => formData[field as keyof PersonalDetails]?.trim());
    return (filledFields.length / requiredFields.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = calculateCompletion();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <ProgressIndicator currentStep={3} />

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-6">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 md:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <User className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white mb-1">
                    Personal Profile
                  </h1>
                  <p className="text-green-100 text-xs md:text-sm">
                    Manage your personal information
                  </p>
                </div>
              </div>
              
              {/* Completion Badge */}
              <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-3 md:px-4 py-2 backdrop-blur-sm">
                <div className="relative">
                  <svg className="w-10 h-10 md:w-12 md:h-12">
                    <circle
                      className="text-white/20"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="transparent"
                      r="20"
                      cx="24"
                      cy="24"
                    />
                    <circle
                      className="text-green-300"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - completionPercentage / 100)}`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="20"
                      cx="24"
                      cy="24"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                    <text x="24" y="28" textAnchor="middle" className="text-[10px] md:text-xs font-bold fill-white">
                      {Math.round(completionPercentage)}%
                    </text>
                  </svg>
                </div>
                <div>
                  <p className="text-white text-[10px] md:text-xs">Profile</p>
                  <p className="text-green-100 text-[10px] md:text-xs">Completion</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8">
            {/* Success Message */}
            {success && (
              <div className="mb-6 p-3 md:p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 mr-2 md:mr-3 flex-shrink-0" />
                  <p className="text-green-700 text-xs md:text-sm">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess(null)}
                  className="text-green-500 hover:text-green-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 md:mr-3 flex-shrink-0" />
                  <p className="text-red-700 text-xs md:text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Edit Mode Banner */}
            {isEditing && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center text-xs md:text-sm text-blue-700">
                  <Edit2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  Editing mode - modify your information below
                </div>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setValidationErrors({});
                    // Reload original data when canceling edit
                    const fetchOriginalData = async () => {
                      const token = getToken();
                      if (token) {
                        const detailsRes = await fetch(`${API_BASE_URL}/personal-details/`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (detailsRes.ok) {
                          const detailsData = await detailsRes.json();
                          if (detailsData.success && detailsData.data) {
                            setFormData({
                              first_name: detailsData.data.first_name || user?.first_name || '',
                              middle_name: detailsData.data.middle_name || '',
                              last_name: detailsData.data.last_name || user?.last_name || '',
                              email: detailsData.data.email || user?.email || '',
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
                      }
                    };
                    fetchOriginalData();
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs md:text-sm"
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
              {/* Personal Information Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
                    <div className="p-1.5 md:p-2 bg-green-100 rounded-lg mr-2 md:mr-3">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    </div>
                    Personal Information
                  </h2>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-1.5 md:space-x-2 px-2 md:px-3 py-1 md:py-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors text-xs md:text-sm"
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        validationErrors.first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                      placeholder="Enter your first name"
                    />
                    {validationErrors.first_name && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                      } border-gray-300`}
                      placeholder="Enter your middle name (optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        validationErrors.last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                      placeholder="Enter your last name"
                    />
                    {validationErrors.last_name && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.last_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                      } border-gray-300`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          validationErrors.date_of_birth ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                      />
                    </div>
                    {validationErrors.date_of_birth && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.date_of_birth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                        placeholder="you@example.com"
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          validationErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`}
                        placeholder="+265 123 456 789"
                      />
                    </div>
                    {validationErrors.phone && (
                      <p className="mt-1 text-xs text-red-500">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address & Identification Section */}
              <div className="mb-8">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="p-1.5 md:p-2 bg-green-100 rounded-lg mr-2 md:mr-3">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  </div>
                  Address & Identification
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Nationality
                    </label>
                    <div className="relative">
                      <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., Malawian"
                        className={`w-full pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        } border-gray-300`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      National ID Number
                    </label>
                    <div className="relative">
                      <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="national_id"
                        value={formData.national_id}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., 1234567890"
                        className={`w-full pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        } border-gray-300`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Home District
                    </label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="home_district"
                        value={formData.home_district}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="e.g., Lilongwe, Blantyre, Mzuzu"
                        className={`w-full pl-10 pr-3 md:pr-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                        } border-gray-300`}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      Physical Address
                    </label>
                    <textarea
                      name="physical_address"
                      value={formData.physical_address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows={3}
                      placeholder="Enter your full physical address (street, city, postal code)"
                      className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                        !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                      } border-gray-300`}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons - ONLY Back and Next/Save */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
                <Button2
                  type="button"
                  onClick={() => router.push('/application/select-type')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button2>
                
                {/* Single action button - either Save (when editing) or Next (when viewing) */}
                <Button2
                  type={isEditing ? "submit" : "button"}
                  onClick={!isEditing ? handleContinue : undefined}
                  disabled={isEditing ? saving : false}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {isEditing ? (
                    saving ? (
                      <div className="flex items-center justify-center">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Saving...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center">
                      Continue to Next of Kin
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </div>
                  )}
                </Button2>
              </div>
            </form>
          </div>
        </div>

        {/* Help Text and Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Secure & Private</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-600">
              Your information is encrypted and will only be used for your application processing.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Save Progress</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-600">
              You can save your progress and return later to complete your application.
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center mb-2">
              <AlertCircle className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Required Fields</h3>
            </div>
            <p className="text-xs md:text-sm text-gray-600">
              Fields marked with <span className="text-red-500">*</span> are required to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}