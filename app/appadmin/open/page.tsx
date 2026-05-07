'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Edit, Trash2, Plus, Save, X, ChevronDown, ChevronRight, Check, 
  Shield, AlertCircle, CheckCircle, ArrowLeft, Power, PowerOff
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function AdminApplicationTypes() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingType, setEditingType] = useState<ApplicationType | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectionName, setSelectionName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeTypeId, setCloseTypeId] = useState<string | null>(null);
  const [closeTypeName, setCloseTypeName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requirements: [''] as string[],
    start_date: '',
    end_date: '',
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      router.push('/login');
      throw new Error('User not authenticated');
    }

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
    };

    const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || `Request failed with status ${res.status}`);
    return data;
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || 'guest');
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }, [router]);

  useEffect(() => {
    if (token) {
      const hasAdminAccess = userRole === 'admin' || userRole === 'administrator' || userRole === 'staff';
      
      if (!hasAdminAccess && userRole !== null) {
        setError('Access Denied: You do not have permission to access this page. Admin access required.');
        setLoading(false);
        return;
      }
      
      fetchApplicationTypes();
    }
  }, [token, userRole]);

  const fetchApplicationTypes = async () => {
    try {
      setLoading(true);
      const data = await authFetch('/admin/application-types');
      const types = data.data || data;
      const typesWithIds = types.map((type: any, index: number) => ({
        ...type,
        id: type.id || `temp-${index}-${Date.now()}`
      }));
      setApplicationTypes(typesWithIds);
    } catch (err: any) {
      console.error('Error fetching application types:', err);
      addToast('Failed to load application types', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (typeId: string) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    setSelectionName('');
  };

  const handleConfirmSelection = async () => {
    if (!selectedType || !selectionName.trim()) {
      addToast('Please enter a selection name', 'error');
      return;
    }

    try {
      addToast(`Successfully selected "${selectionName}" for application type`, 'success');
      setTimeout(() => {
        setSelectedType(null);
        setSelectionName('');
      }, 2000);
    } catch (err: any) {
      console.error('Error confirming selection:', err);
      addToast('Failed to confirm selection', 'error');
    }
  };

  // Close application - set is_active to false
  const openCloseModal = (typeId: string, typeName: string) => {
    setCloseTypeId(typeId);
    setCloseTypeName(typeName);
    setShowCloseModal(true);
  };

  const confirmCloseApplication = async () => {
    if (!closeTypeId) return;

    setSaving(true);
    try {
      // Find the application type
      const typeToClose = applicationTypes.find(t => t.id === closeTypeId);
      if (!typeToClose) {
        addToast('Application type not found', 'error');
        return;
      }

      // Update the application to inactive
      const payload = {
        name: typeToClose.name,
        description: typeToClose.description,
        requirements: typeToClose.requirements,
        start_date: typeToClose.start_date,
        end_date: typeToClose.end_date,
        is_active: false,
      };

      await authFetch(`/admin/application-types/${closeTypeId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // Update local state
      setApplicationTypes(prev =>
        prev.map(type => 
          type.id === closeTypeId 
            ? { ...type, is_active: false } 
            : type
        )
      );
      
      addToast(`Application "${closeTypeName}" has been closed successfully!`, 'success');
      setShowCloseModal(false);
      setCloseTypeId(null);
      setCloseTypeName('');
    } catch (err: any) {
      console.error('Error closing application:', err);
      addToast('Failed to close application', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reopen application - set is_active to true
  const confirmReopenApplication = async (typeId: string, typeName: string) => {
    setSaving(true);
    try {
      const typeToReopen = applicationTypes.find(t => t.id === typeId);
      if (!typeToReopen) {
        addToast('Application type not found', 'error');
        return;
      }

      // Check if date range is valid
      const now = new Date();
      const endDate = new Date(typeToReopen.end_date);
      if (endDate < now) {
        addToast('Cannot reopen because the deadline has passed. Please extend the deadline first.', 'error');
        return;
      }

      const payload = {
        name: typeToReopen.name,
        description: typeToReopen.description,
        requirements: typeToReopen.requirements,
        start_date: typeToReopen.start_date,
        end_date: typeToReopen.end_date,
        is_active: true,
      };

      await authFetch(`/admin/application-types/${typeId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setApplicationTypes(prev =>
        prev.map(type => 
          type.id === typeId 
            ? { ...type, is_active: true } 
            : type
        )
      );
      
      addToast(`Application "${typeName}" has been reopened successfully!`, 'success');
    } catch (err: any) {
      console.error('Error reopening application:', err);
      addToast('Failed to reopen application', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingType(null);
    setFormData({
      name: '',
      description: '',
      requirements: [''],
      start_date: '',
      end_date: '',
    });
    setShowFormModal(true);
  };

  const openEditModal = (type: ApplicationType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description,
      requirements: type.requirements?.length ? type.requirements : [''],
      start_date: type.start_date,
      end_date: type.end_date,
    });
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      addToast('Please enter application type name', 'error');
      return;
    }
    if (!formData.start_date) {
      addToast('Please select start date', 'error');
      return;
    }
    if (!formData.end_date) {
      addToast('Please select end date', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: true,
      };

      if (editingType) {
        await authFetch(`/admin/application-types/${editingType.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setApplicationTypes(prev =>
          prev.map(type => type.id === editingType.id ? { ...type, ...payload, id: type.id } : type)
        );
        addToast('Application type updated successfully!', 'success');
      } else {
        const res = await authFetch('/admin/application-types', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const newType = res.data || res;
        setApplicationTypes(prev => [...prev, { ...newType, id: newType.id || `new-${Date.now()}` }]);
        addToast('Application type added successfully!', 'success');
      }
      setShowFormModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error saving application type:', err);
      addToast(err.message || 'Failed to save application type', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      requirements: [''],
      start_date: '',
      end_date: '',
    });
    setEditingType(null);
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setSaving(true);
    try {
      await authFetch(`/admin/application-types/${deleteId}`, {
        method: 'DELETE',
      });

      setApplicationTypes(prev => prev.filter(type => type.id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
      addToast('Application type deleted successfully!', 'success');
    } catch (err: any) {
      console.error('Error deleting application type:', err);
      addToast('Failed to delete application type', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, ''],
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req),
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const isApplicationActive = (type: ApplicationType) => {
    const now = new Date();
    const startDate = new Date(type.start_date);
    const endDate = new Date(type.end_date);
    return now >= startDate && now <= endDate && type.is_active;
  };

  const getDaysRemaining = (type: ApplicationType) => {
    const endDate = new Date(type.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application types...</p>
        </div>
      </div>
    );
  }

  if (error && error.includes('Access Denied')) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Login as Different User
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
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

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">MANAGE APPLICATION TYPES</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Set deadlines and manage application availability. Admin access required.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Add New Type Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Type
              </button>
            </div>

            {/* Application Types List */}
            {applicationTypes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No application types found</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add New Type" to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicationTypes.map((type, index) => {
                  const isActive = isApplicationActive(type);
                  const daysRemaining = getDaysRemaining(type);
                  
                  return (
                    <div key={type.id || `type-${index}-${type.name}`} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header - Always Visible */}
                      <div className={`p-4 flex items-center justify-between ${
                        isActive ? 'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleExpand(type.id)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedTypes.has(type.id) ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                          <div>
                            <h3 className="font-semibold text-gray-800">{type.name}</h3>
                            <p className="text-sm text-gray-600">{type.description}</p>
                            {isActive && daysRemaining > 0 && daysRemaining < 7 && (
                              <p className="text-xs text-orange-600 mt-1">⚠️ {daysRemaining} days remaining</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                              isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Power className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <PowerOff className="w-3 h-3" />
                                Closed
                              </>
                            )}
                          </span>
                          
                          {/* Close/Reopen Button */}
                          {isActive ? (
                            <button
                              onClick={() => openCloseModal(type.id, type.name)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-xs font-medium"
                              title="Close Application"
                            >
                              <PowerOff className="w-3 h-3" />
                              Close
                            </button>
                          ) : (
                            <button
                              onClick={() => confirmReopenApplication(type.id, type.name)}
                              disabled={new Date(type.end_date) < new Date()}
                              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-medium transition-colors ${
                                new Date(type.end_date) < new Date()
                                  ? 'bg-gray-400 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                              title={new Date(type.end_date) < new Date() ? 'Deadline passed - cannot reopen' : 'Reopen Application'}
                            >
                              <Power className="w-3 h-3" />
                              Reopen
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleSelectType(type.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                          >
                            <Check className="w-4 h-4" />
                            Select
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditModal(type)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(type.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Content */}
                      {expandedTypes.has(type.id) && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3">Basic Information</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Start Date:</span>
                                  <span className="font-medium">
                                    {new Date(type.start_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">End Date:</span>
                                  <span className="font-medium">
                                    {new Date(type.end_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status:</span>
                                  <span className={`font-medium ${
                                    isActive ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {isActive ? 'Currently Active' : 'Closed'}
                                  </span>
                                </div>
                                {!isActive && new Date(type.end_date) < new Date() && (
                                  <div className="text-xs text-red-500 mt-1">
                                    Deadline has passed
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-gray-700 mb-3">Requirements</h4>
                              <ul className="space-y-1">
                                {type.requirements?.map((requirement, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-gray-600">{requirement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Back Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Manage application types, set deadlines, and control availability.
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingType ? 'Edit Application Type' : 'Add New Application Type'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., ODL Student Application"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                {formData.requirements.map((requirement, index) => (
                  <div key={`req-${index}-${Date.now()}`} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter requirement"
                    />
                    {formData.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRequirement}
                  className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Add Requirement
                </button>
              </div>
            </div>
            
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => {
                  setShowFormModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingType ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Application Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <PowerOff className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-800">Close Application</h3>
              </div>
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setCloseTypeId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="flex items-center justify-center mb-3">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-yellow-600" />
                </div>
              </div>
              <p className="text-center text-gray-700 mb-2">
                Are you sure you want to close <strong>{closeTypeName}</strong>?
              </p>
              <p className="text-center text-gray-500 text-sm">
                This will prevent new applications from being submitted.
                You can reopen it later if needed.
              </p>
            </div>
            
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setCloseTypeId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmCloseApplication}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Close Application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      {selectedType && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Confirm Selection</h3>
              </div>
              <button
                onClick={() => setSelectedType(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5">
              <p className="text-gray-600 mb-4">
                You are selecting: <strong>{applicationTypes.find(t => t.id === selectedType)?.name}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter selection name:
                </label>
                <input
                  type="text"
                  value={selectionName}
                  onChange={(e) => setSelectionName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., My Application Selection"
                />
              </div>
            </div>
            
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setSelectedType(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
              >
                <Check className="w-4 h-4" />
                Confirm Selection
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
                Are you sure you want to delete this application type?
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