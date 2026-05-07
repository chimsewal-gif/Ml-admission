'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Home, ChevronRight, AlertCircle, CheckCircle, 
  User, Phone, Mail, MapPin, Users, Heart, Save, ArrowRight,
  Plus, Trash2, Edit3, X
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface NextOfKin {
  id: number;
  title: string;
  relationship: string;
  first_name: string;
  last_name: string;
  mobile1: string;
  mobile2?: string;
  email?: string;
  address: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function NextOfKinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextOfKin, setNextOfKin] = useState<NextOfKin[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [savedKins, setSavedKins] = useState<NextOfKin[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [applicationType, setApplicationType] = useState<string>('');
  const [applicationTypeName, setApplicationTypeName] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    relationship: '',
    first_name: '',
    last_name: '',
    mobile1: '',
    mobile2: '',
    email: '',
    address: '',
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

  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = getAuthHeaders();
    
    const res = await fetch(`${API_BASE_URL}${url}`, { 
      ...options, 
      headers: {
        ...headers,
        ...options.headers,
      }
    });
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error('Server returned non-JSON response');
    }

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
      throw new Error(data.message || data.detail || `Request failed with status ${res.status}`);
    }
    
    return data;
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
      setUserId(parsedUser.id);
      
      const savedAppType = localStorage.getItem('userApplicationType');
      const savedAppTypeName = localStorage.getItem('userApplicationTypeName');
      
      if (!savedAppType) {
        router.push('/application/select-type');
        return;
      }
      
      setApplicationType(savedAppType);
      setApplicationTypeName(savedAppTypeName || '');
      
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (userId) {
      fetchNextOfKin();
    }
  }, [userId]);

  const fetchNextOfKin = async () => {
    try {
      setLoading(true);
      const data = await authFetch('/next-of-kin/');
      const kins = data.data || [];
      setNextOfKin(kins);
      setSavedKins(kins);
    } catch (err: any) {
      console.error('Error fetching next of kin:', err);
      addToast(err.message || 'Failed to load next of kin', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.relationship || !formData.first_name || 
        !formData.last_name || !formData.mobile1 || !formData.address) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/next-of-kin/${editingId}` : '/next-of-kin/';

      const payload = {
        title: formData.title,
        relationship: formData.relationship,
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile1: formData.mobile1,
        mobile2: formData.mobile2 || null,
        email: formData.email || null,
        address: formData.address,
      };

      await authFetch(url, { method, body: JSON.stringify(payload) });
      
      await fetchNextOfKin();
      resetForm();
      setShowAddModal(false);
      addToast(editingId ? 'Next of kin updated successfully!' : 'Next of kin added successfully!', 'success');
      
    } catch (err: any) {
      addToast(err.message || 'Failed to save next of kin', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (kin: NextOfKin) => {
    setFormData({
      title: kin.title,
      relationship: kin.relationship,
      first_name: kin.first_name,
      last_name: kin.last_name,
      mobile1: kin.mobile1,
      mobile2: kin.mobile2 || '',
      email: kin.email || '',
      address: kin.address,
    });
    setEditingId(kin.id);
    setShowAddModal(true);
  };

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    setSaving(true);
    try {
      await authFetch(`/next-of-kin/${deleteId}`, { method: 'DELETE' });
      await fetchNextOfKin();
      setShowDeleteModal(false);
      setDeleteId(null);
      addToast('Next of kin deleted successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete next of kin', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      relationship: '',
      first_name: '',
      last_name: '',
      mobile1: '',
      mobile2: '',
      email: '',
      address: '',
    });
    setEditingId(null);
  };

  const handleNext = async () => {
    if (savedKins.length === 0) {
      addToast('Please add at least one next of kin before continuing', 'error');
      return;
    }
    router.push('/application/select-type');
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        
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
            <span className="text-gray-900 font-medium">Next of Kin</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Next of Kin Details</h1>
          <p className="text-gray-600 mt-2">Provide information about your emergency contact person</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">NEXT OF KIN INFORMATION</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Please provide at least one next of kin. This information is required for emergency contact purposes.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Add Record Button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Next of Kin
              </button>
            </div>

            {/* Next of Kin Table */}
            <div>
              {savedKins.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No next of kin added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Add Next of Kin" to get started</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">NAME</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">RELATIONSHIP</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">CONTACT</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">EMAIL</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {savedKins.map((kin) => (
                          <tr key={kin.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {kin.title} {kin.first_name} {kin.last_name}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {kin.relationship}
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-600">{kin.mobile1}</div>
                              {kin.mobile2 && (
                                <div className="text-gray-400 text-xs">{kin.mobile2}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {kin.email || <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEdit(kin)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(kin.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
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
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                Back
              </button>
              
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium flex items-center gap-2 shadow-md"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            You can add multiple next of kin. At least one is required.
          </p>
        </div>
      </div>

      {/* Add/Edit Modal - Smaller Size */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingId ? 'Edit Next of Kin' : 'Add Next of Kin'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                    >
                      <option value="">Select Title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                    >
                      <option value="">Select Relationship</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile1"
                      value={formData.mobile1}
                      onChange={handleInputChange}
                      placeholder="Enter primary mobile number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secondary Mobile
                    </label>
                    <input
                      type="tel"
                      name="mobile2"
                      value={formData.mobile2}
                      onChange={handleInputChange}
                      placeholder="Enter secondary mobile number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter complete postal address"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-5 pt-0 border-t border-gray-200 mt-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex items-center justify-center mb-3">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-red-600" />
                </div>
              </div>
              <p className="text-center text-gray-700 mb-1">
                Are you sure you want to delete this next of kin?
              </p>
              <p className="text-center text-gray-500 text-xs">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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