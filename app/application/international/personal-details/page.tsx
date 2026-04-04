'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { User, Calendar, Globe, MapPin, IdCard, Mail, Save, Venus, Mars, UserCircle } from 'lucide-react';
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

// ✅ FIXED: Point to Laravel backend directly
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
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();
  const token = Cookies.get('token');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [token, router]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!token) throw new Error('Not authenticated');

      console.log('Fetching profile...');
      
      // ✅ Try multiple endpoints for compatibility
      let profileRes;
      let endpoint = `${API_BASE_URL}/user`;
      
      try {
        profileRes = await fetch(endpoint, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
      } catch (err) {
        console.log('Trying alternative endpoint...');
        endpoint = `${API_BASE_URL}/applicants/me`;
        profileRes = await fetch(endpoint, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
      }

      console.log('Profile response status:', profileRes.status);

      // Check if response is JSON
      const contentType = profileRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await profileRes.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response. Please check if Laravel backend is running.');
      }

      if (!profileRes.ok) {
        const errData = await profileRes.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to fetch profile (${profileRes.status})`);
      }

      const data = await profileRes.json();
      console.log('Profile data:', data);
      
      // Extract user data from response (handle both /user and /applicants/me formats)
      const userData = data.user || data;
      
      if (!userData.id) {
        throw new Error('Invalid user data received');
      }

      setUserId(userData.id);

      setForm({
        firstName: userData.firstname || userData.firstName || '',
        middleName: userData.middlename || userData.middleName || '',
        lastName: userData.lastname || userData.lastName || '',
        gender: userData.gender || '',
        dob: userData.dob ? userData.dob.split('T')[0] : '',
        nationality: userData.nationality || '',
        nationalId: userData.national_id || userData.nationalId || '',
        homeDistrict: userData.home_district || userData.homeDistrict || '',
        physicalAddress: userData.physical_address || userData.physicalAddress || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to fetch profile. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!token) {
      setError('User not authenticated');
      setSaving(false);
      return;
    }

    try {
      const payload = {
        firstname: form.firstName,
        middlename: form.middleName,
        lastname: form.lastName,
        gender: form.gender,
        dob: form.dob,
        nationality: form.nationality,
        national_id: form.nationalId,
        home_district: form.homeDistrict,
        physical_address: form.physicalAddress,
        email: form.email,
        phone: form.phone,
      };

      console.log('Updating profile with:', payload);

      // ✅ Use the current user update endpoint instead of user ID
      const res = await fetch(`${API_BASE_URL}/applicants/current/update`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Update response status:', res.status);

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Failed to update profile (${res.status})`);
      }

      const result = await res.json();
      console.log('Update successful:', result);

      router.push('/application/contact-details');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <ProgressIndicator currentStep={3} />

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mt-6">
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
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg mr-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-700 font-medium">{error}</p>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
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
                      Continue to Contact Details
                    </div>
                  )}
                </Button2>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Fields marked with * are required. Your information is secure and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
}