'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Calendar, Globe, MapPin, IdCard, Mail, Save, Venus, Mars, UserCircle, LogOut } from 'lucide-react';
import ProgressIndicator from '@/componets/ProgressIndicator';
import Button2 from '@/componets/Button2';

const countries = [
  'Malawi','Zambia','Tanzania','South Africa','Kenya','Uganda','Nigeria','Ghana','Zimbabwe','Mozambique',
];

const districts = [
  'Balaka', 'Blantyre', 'Chikwawa', 'Chiradzulu', 'Chitipa', 'Dedza', 'Dowa',
  'Karonga', 'Kasungu', 'Likoma', 'Lilongwe', 'Machinga', 'Mangochi', 'Mchinji',
  'Mulanje', 'Mwanza', 'Mzimba', 'Nkhata Bay', 'Nkhotakota', 'Nsanje', 'Ntcheu',
  'Ntchisi', 'Phalombe', 'Rumphi', 'Salima', 'Thyolo', 'Zomba'
];

// Django backend URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dob: string;
  nationality: string;
  nationalId: string;
  homeDistrict: string;
  physicalAddress: string;
  email: string;
  phone: string;
}

export default function PersonalDetailsPage() {
  const [form, setForm] = useState<FormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dob: '',
    nationality: '',
    nationalId: '',
    homeDistrict: '',
    physicalAddress: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');

  const router = useRouter();

  useEffect(() => {
    checkAuthAndInitialize();
  }, []);

  const checkAuthAndInitialize = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get token from localStorage
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!storedToken || !storedUser) {
        console.error('No token or user found');
        router.push('/login');
        return;
      }

      setToken(storedToken);
      
      const userData = JSON.parse(storedUser);
      setUser(userData);

      // Pre-fill form with user data
      setForm(prev => ({
        ...prev,
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
      }));

      // Try to load saved personal details from backend
      await loadPersonalDetails(storedToken);

    } catch (err: any) {
      console.error('Initialization error:', err);
      setError('Session error. Please log in again.');
      setTimeout(() => router.push('/login'), 1500);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalDetails = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/personal-details/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setForm(prev => ({
            ...prev,
            firstName: data.data.first_name || prev.firstName,
            middleName: data.data.middle_name || '',
            lastName: data.data.last_name || prev.lastName,
            gender: data.data.gender || '',
            dob: data.data.date_of_birth || '',
            nationality: data.data.nationality || '',
            nationalId: data.data.national_id || '',
            homeDistrict: data.data.home_district || '',
            physicalAddress: data.data.physical_address || '',
            email: data.data.email || prev.email,
            phone: data.data.phone || '',
          }));
        }
      }
    } catch (err) {
      console.log('No saved personal details found on server');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'gender', 'dob', 'nationality', 'nationalId', 'homeDistrict', 'physicalAddress', 'email', 'phone'];
      const missingFields = requiredFields.filter(field => !form[field as keyof FormData]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setSaving(false);
        return;
      }

      const authToken = localStorage.getItem('token');
      if (!authToken) {
        setError('Please log in again.');
        setTimeout(() => router.push('/login'), 1500);
        setSaving(false);
        return;
      }

      // Prepare payload for Django
      const payload = {
        first_name: form.firstName,
        middle_name: form.middleName,
        last_name: form.lastName,
        gender: form.gender,
        date_of_birth: form.dob,
        nationality: form.nationality,
        national_id: form.nationalId,
        home_district: form.homeDistrict,
        physical_address: form.physicalAddress,
        email: form.email,
        phone: form.phone,
      };

      console.log('Saving personal details:', payload);

      // Save to backend
      const response = await fetch(`${API_BASE_URL}/personal-details/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update user in localStorage with saved name
        const updatedUser = {
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('applicationStep', 'personalDetails');

        setError('✅ Personal details saved successfully! Redirecting...');

        setTimeout(() => {
          router.push('/application/next-of-kin');
        }, 1500);
      } else {
        setError(result.message || 'Failed to save personal details. Please try again.');
      }

    } catch (err: any) {
      console.error('Error saving details:', err);
      setError(err.message || 'Failed to save personal details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getGenderIcon = () => {
    if (form.gender === 'Male') return <Mars className="w-5 h-5 text-blue-600" />;
    if (form.gender === 'Female') return <Venus className="w-5 h-5 text-pink-600" />;
    return <UserCircle className="w-5 h-5 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 text-yellow-800 p-6 rounded-xl mb-4">
            <p className="text-lg font-medium">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <ProgressIndicator currentStep={1} />

       
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Personal Details</h1>
                <p className="text-green-100 text-lg">Step 1 of 4 - Tell us about yourself</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className={`mb-6 p-4 rounded-xl ${
                error.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : error.includes('Please fill')
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    error.includes('✅') 
                      ? 'bg-green-100' 
                      : error.includes('Please fill')
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                  }`}>
                    {error.includes('✅') ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : error.includes('Please fill') ? (
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* First Name */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter first name"
                    />
                  </div>
                </div>

                {/* Middle Name */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={form.middleName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter middle name"
                  />
                </div>

                {/* Last Name */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Gender and Date of Birth */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      {getGenderIcon()}
                    </div>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors appearance-none bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Nationality and National ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nationality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality *
                  </label>
                  <div className="relative">
                    <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      name="nationality"
                      value={form.nationality}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors appearance-none bg-white"
                    >
                      <option value="">Select Nationality</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    National ID/Passport Number *
                  </label>
                  <div className="relative">
                    <IdCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      name="nationalId"
                      value={form.nationalId}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter ID or passport number"
                    />
                  </div>
                </div>
              </div>

              {/* Home District and Physical Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Home District *
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      name="homeDistrict"
                      value={form.homeDistrict}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors appearance-none bg-white"
                    >
                      <option value="">Select District</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Physical Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Physical Address *
                  </label>
                  <input
                    type="text"
                    name="physicalAddress"
                    value={form.physicalAddress}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter your physical address"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{10,15}"
                    title="Please enter a valid phone number (10-15 digits)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter phone number (e.g., 0881234567)"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={saving}
                >
                  ← Back to Home
                </button>
                
                <Button2 
                  type="submit" 
                  disabled={saving}
                  className="min-w-[200px] py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Saving Details...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Save className="w-5 h-5 mr-2" />
                      Continue to Next of Kin
                    </div>
                  )}
                </Button2>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Fields marked with * are required. Your information is secure and will be stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}