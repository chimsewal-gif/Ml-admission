// app/referees/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, X, ChevronLeft, ChevronRight, Save, 
  Mail, Phone, Briefcase, GraduationCap, User, 
  AlertCircle, Trash2, Edit, Eye, Home, Heart,
  CheckCircle
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface Referee {
  id?: number;
  first_name: string;
  last_name: string;
  title: string;
  gender: string;
  email: string;
  phone_number: string;
  referee_type: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function RefereesPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReferee, setEditingReferee] = useState<Referee | null>(null);
  const [applicationTypeName, setApplicationTypeName] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Form state for add/edit modal
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    title: '',
    gender: '',
    email: '',
    phone_number: '',
    referee_type: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  // Title options
  const titleOptions = ['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.', 'Mx.'];
  
  // Gender options
  const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other'];
  
  // Referee type options
  const refereeTypeOptions = ['Academic', 'Professional', 'Personal', 'Supervisor', 'Manager', 'Colleague'];

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    
    const savedAppTypeName = localStorage.getItem('userApplicationTypeName');
    setApplicationTypeName(savedAppTypeName || '');
    
    fetchCurrentUser(storedToken);
  }, [router]);

  // Fetch current user to get applicant ID
  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        const userData = await res.json();
        const userId = userData.id;
        setApplicantId(userId);
        await loadReferees(authToken, userId);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      addToast('Failed to load user information', 'error');
      setLoading(false);
    }
  };

  // Load referees from API
  const loadReferees = async (authToken: string, applicantId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/referees/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setReferees(data.data);
          localStorage.setItem('application_referees', JSON.stringify(data.data));
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('application_referees');
          if (saved) {
            setReferees(JSON.parse(saved));
          }
        }
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('application_referees');
        if (saved) {
          setReferees(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error('Error loading referees:', err);
      addToast('Failed to load referees', 'error');
      const saved = localStorage.getItem('application_referees');
      if (saved) {
        setReferees(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  // Save referee to API
  const saveRefereeToAPI = async (refereeData: Referee): Promise<Referee | null> => {
    if (!token || !applicantId) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/referees/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refereeData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      return null;
    } catch (err) {
      console.error('API save failed:', err);
      return null;
    }
  };

  // Update referee on API
  const updateRefereeOnAPI = async (refereeId: number, refereeData: Referee): Promise<Referee | null> => {
    if (!token || !applicantId) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/referees/${refereeId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refereeData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      }
      return null;
    } catch (err) {
      console.error('API update failed:', err);
      return null;
    }
  };

  // Delete referee from API
  const deleteRefereeFromAPI = async (refereeId: number): Promise<boolean> => {
    if (!token || !applicantId) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/referees/${refereeId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (err) {
      console.error('API delete failed:', err);
      return false;
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    if (!formData.referee_type) newErrors.referee_type = 'Referee type is required';
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      title: '',
      gender: '',
      email: '',
      phone_number: '',
      referee_type: '',
    });
    setFormErrors({});
    setEditingReferee(null);
  };

  // Handle save record (add or edit)
  const handleSaveRecord = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    
    const refereeToSave: Referee = { ...formData };
    
    let savedReferee: Referee | null = null;
    
    if (editingReferee && editingReferee.id) {
      // Update existing referee
      savedReferee = await updateRefereeOnAPI(editingReferee.id, refereeToSave);
      if (savedReferee) {
        setReferees(prev => prev.map(r => 
          r.id === editingReferee.id ? savedReferee! : r
        ));
        addToast('Referee updated successfully!', 'success');
      } else {
        // Fallback: update locally
        const updatedReferees = referees.map(r =>
          r.id === editingReferee.id ? { ...refereeToSave, id: editingReferee.id } : r
        );
        setReferees(updatedReferees);
        localStorage.setItem('application_referees', JSON.stringify(updatedReferees));
        addToast('Referee updated locally. Will sync when online.', 'success');
      }
    } else {
      // Add new referee
      savedReferee = await saveRefereeToAPI(refereeToSave);
      if (savedReferee) {
        setReferees(prev => [...prev, savedReferee!]);
        addToast('Referee added successfully!', 'success');
      } else {
        // Fallback: save locally
        const newReferee: Referee = {
          ...refereeToSave,
          id: Date.now(),
        };
        const updatedReferees = [...referees, newReferee];
        setReferees(updatedReferees);
        localStorage.setItem('application_referees', JSON.stringify(updatedReferees));
        addToast('Referee saved locally. Will sync when online.', 'success');
      }
    }
    
    resetForm();
    setShowAddModal(false);
    setSaving(false);
  };

  // Handle edit referee
  const handleEdit = (referee: Referee) => {
    setFormData({
      first_name: referee.first_name,
      last_name: referee.last_name,
      title: referee.title,
      gender: referee.gender,
      email: referee.email,
      phone_number: referee.phone_number,
      referee_type: referee.referee_type,
    });
    setEditingReferee(referee);
    setShowAddModal(true);
  };

  // Handle delete referee
  const handleDelete = async (id: number) => {
    const referee = referees.find(r => r.id === id);
    if (!referee) return;
    if (!confirm(`Delete ${referee.title} ${referee.first_name} ${referee.last_name}?`)) return;
    
    const apiDeleted = await deleteRefereeFromAPI(id);
    
    const updatedReferees = referees.filter(r => r.id !== id);
    setReferees(updatedReferees);
    localStorage.setItem('application_referees', JSON.stringify(updatedReferees));
    
    if (apiDeleted) {
      addToast('Referee deleted successfully', 'success');
    } else {
      addToast('Referee removed from local storage', 'success');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push('/application/work');
  };

  // Handle next navigation
  const handleNext = () => {
    if (referees.length === 0) {
      addToast('Please add at least one referee before continuing', 'error');
      return;
    }
    router.push('/application/publication');
  };

  // Handle save all
  const handleSaveAll = () => {
    localStorage.setItem('application_referees', JSON.stringify(referees));
    addToast('All referees saved successfully!', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your referees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
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
            <span className="text-gray-900 font-medium">Referees</span>
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Referees</h1>
          <p className="text-gray-600 mt-2">Provide academic or professional referees</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Referees Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">REFEREES</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Provide at least one academic or professional referee who can verify your qualifications.
                Referees may be contacted to confirm your academic and professional background.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Referees Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Referees</h3>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Record
                </button>
              </div>
              
              {referees.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No Referees added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a new record to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referees.map((referee) => (
                    <div
                      key={referee.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <User className="w-4 h-4 text-green-600" />
                            </div>
                            <h4 className="font-medium text-gray-800">
                              {referee.title} {referee.first_name} {referee.last_name}
                            </h4>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                              {referee.referee_type}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                              {referee.gender}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{referee.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{referee.phone_number}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(referee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit referee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(referee.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete referee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveAll}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center gap-2 font-medium shadow-md"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Add at least one referee. Academic referees are preferred.
          </p>
        </div>
      </div>

      {/* Add/Edit Referee Modal - Transparent Background */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingReferee ? 'Edit Referee' : 'Add Referee'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                  setError(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={(e) => {
                      setFormData({ ...formData, first_name: e.target.value });
                      if (formErrors.first_name) setFormErrors({ ...formErrors, first_name: '' });
                    }}
                    placeholder="Enter first name..."
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.first_name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.first_name}
                    </p>
                  )}
                </div>
                
                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={(e) => {
                      setFormData({ ...formData, last_name: e.target.value });
                      if (formErrors.last_name) setFormErrors({ ...formErrors, last_name: '' });
                    }}
                    placeholder="Enter last name..."
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.last_name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.last_name}</p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white ${
                      formErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    {titleOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {formErrors.title && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                  )}
                </div>
                
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={(e) => {
                      setFormData({ ...formData, gender: e.target.value });
                      if (formErrors.gender) setFormErrors({ ...formErrors, gender: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white ${
                      formErrors.gender ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {formErrors.gender && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                    }}
                    placeholder="Enter email address..."
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>
                
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={(e) => {
                      setFormData({ ...formData, phone_number: e.target.value });
                      if (formErrors.phone_number) setFormErrors({ ...formErrors, phone_number: '' });
                    }}
                    placeholder="Enter phone number..."
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      formErrors.phone_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.phone_number && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phone_number}</p>
                  )}
                </div>

                {/* Referee Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referee Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="referee_type"
                    value={formData.referee_type}
                    onChange={(e) => {
                      setFormData({ ...formData, referee_type: e.target.value });
                      if (formErrors.referee_type) setFormErrors({ ...formErrors, referee_type: '' });
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white ${
                      formErrors.referee_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    {refereeTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {formErrors.referee_type && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.referee_type}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-5 pt-0 border-t border-gray-200 mt-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
}