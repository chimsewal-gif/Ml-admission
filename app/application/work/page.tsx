'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Plus, Trash2, Edit3, Save, ArrowRight, AlertCircle, 
  CheckCircle, X, Calendar, Building, Upload, Download, XCircle, 
  ChevronLeft, Briefcase, MapPin, Clock, FileText as FileTextIcon, Home, ChevronRight
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface WorkRecord {
  id?: number;
  organization: string;
  job_title: string;
  employment_type: string;
  location: string;
  location_type: string;
  start_date: string;
  end_date: string;
  currently_working: boolean;
  responsibilities: string;
}

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Temporary',
  'Freelance',
  'Self-employed',
  'Volunteer'
];

const LOCATION_TYPES = [
  'On-site',
  'Remote',
  'Hybrid'
];

export default function WorkHistoryPage() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [applicationTypeName, setApplicationTypeName] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState<WorkRecord>({
    organization: '',
    job_title: '',
    employment_type: '',
    location: '',
    location_type: '',
    start_date: '',
    end_date: '',
    currently_working: false,
    responsibilities: '',
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

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    
    const savedAppTypeName = localStorage.getItem('userApplicationTypeName');
    setApplicationTypeName(savedAppTypeName || '');
  }, [router]);

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
    if (token) {
      fetchWorkRecords();
    }
  }, [token]);

  const fetchWorkRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authFetch('/work-history/');
      console.log('Work API response:', data);
      
      let records = [];
      if (data.data && Array.isArray(data.data)) {
        records = data.data;
      } else if (Array.isArray(data)) {
        records = data;
      } else if (data.records && Array.isArray(data.records)) {
        records = data.records;
      } else {
        records = [];
      }
      
      const formattedRecords = records.map((record: any, index: number) => ({
        id: record.id || Date.now() + index,
        organization: record.organization || '',
        job_title: record.job_title || '',
        employment_type: record.employment_type || '',
        location: record.location || '',
        location_type: record.location_type || '',
        start_date: record.start_date || '',
        end_date: record.end_date || '',
        currently_working: record.currently_working || false,
        responsibilities: record.responsibilities || '',
      }));
      
      setWorkRecords(formattedRecords);
      localStorage.setItem('work_records', JSON.stringify(formattedRecords));
    } catch (err: any) {
      console.error('Error fetching work records:', err);
      setError(err.message || 'Failed to load work history');
      const saved = localStorage.getItem('work_records');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setWorkRecords(parsed);
        } catch (e) {
          console.error('Error parsing saved records:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalStorage = (records: WorkRecord[]) => {
    localStorage.setItem('work_records', JSON.stringify(records));
  };

  const createRecord = async (record: WorkRecord) => {
    const data = await authFetch('/work-history/', {
      method: 'POST',
      body: JSON.stringify({
        organization: record.organization,
        job_title: record.job_title,
        employment_type: record.employment_type,
        location: record.location,
        location_type: record.location_type,
        start_date: record.start_date,
        end_date: record.currently_working ? null : record.end_date,
        currently_working: record.currently_working,
        responsibilities: record.responsibilities,
      }),
    });
    return data.data || data;
  };

  const updateRecord = async (id: number, record: WorkRecord) => {
    const data = await authFetch(`/work-history/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        organization: record.organization,
        job_title: record.job_title,
        employment_type: record.employment_type,
        location: record.location,
        location_type: record.location_type,
        start_date: record.start_date,
        end_date: record.currently_working ? null : record.end_date,
        currently_working: record.currently_working,
        responsibilities: record.responsibilities,
      }),
    });
    return data.data || data;
  };

  const deleteRecord = async (id: number) => {
    await authFetch(`/work-history/${id}`, {
      method: 'DELETE',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      if (name === 'currently_working' && checked) {
        setFormData(prev => ({ ...prev, end_date: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddRecord = async () => {
    if (!formData.organization) {
      addToast('Please enter organization name', 'error');
      return;
    }
    if (!formData.job_title) {
      addToast('Please enter job title', 'error');
      return;
    }
    if (!formData.start_date) {
      addToast('Please select start date', 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      const newRecord = await createRecord(formData);
      const recordWithId = { ...formData, id: newRecord.id || Date.now() };
      const updatedRecords = [...workRecords, recordWithId];
      setWorkRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      addToast('Work record added successfully!', 'success');
    } catch (err: any) {
      console.error('Error adding record:', err);
      const newRecord = { ...formData, id: Date.now() };
      const updatedRecords = [...workRecords, newRecord];
      setWorkRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      addToast('Work record saved locally!', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRecord = (record: WorkRecord) => {
    setFormData(record);
    setEditingId(record.id || null);
    setShowAddModal(true);
  };

  const handleUpdateRecord = async () => {
    if (!formData.organization) {
      addToast('Please enter organization name', 'error');
      return;
    }
    if (!formData.job_title) {
      addToast('Please enter job title', 'error');
      return;
    }
    if (!formData.start_date) {
      addToast('Please select start date', 'error');
      return;
    }
    
    if (editingId === null) return;
    
    setSaving(true);
    
    try {
      await updateRecord(editingId, formData);
      const updatedRecords = workRecords.map(r => 
        r.id === editingId ? { ...formData, id: editingId } : r
      );
      setWorkRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      setEditingId(null);
      addToast('Work record updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error updating record:', err);
      const updatedRecords = workRecords.map(r => 
        r.id === editingId ? { ...formData, id: editingId } : r
      );
      setWorkRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      setEditingId(null);
      addToast('Work record updated locally!', 'success');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    
    setSaving(true);
    
    try {
      await deleteRecord(deleteId);
      const updatedRecords = workRecords.filter(r => r.id !== deleteId);
      setWorkRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      addToast('Work record deleted successfully!', 'success');
    } catch (err: any) {
      console.error('Error deleting record:', err);
      const updatedRecords = workRecords.filter(r => r.id !== deleteId);
      setWorkRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      addToast('Work record deleted locally!', 'success');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      organization: '',
      job_title: '',
      employment_type: '',
      location: '',
      location_type: '',
      start_date: '',
      end_date: '',
      currently_working: false,
      responsibilities: '',
    });
    setEditingId(null);
  };

  const handleBack = () => {
    router.push('/application/education');
  };

  const handleSave = async () => {
    addToast('All records saved successfully!', 'success');
  };

  const handleNext = () => {
    router.push('/application/application-fees');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your work history...</p>
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
            <button onClick={() => router.push('/')} className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button onClick={() => router.push('/application/select-type')} className="text-gray-600 hover:text-green-600 transition-colors">
              Application Type
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Work History</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Work History</h1>
          <p className="text-gray-600 mt-2">List your most recent work experience first</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">WORK HISTORY</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                List your most recent work experience first. Include all relevant roles, even internships.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Add Record Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            </div>

            {/* Work History Table */}
            <div>
              {workRecords.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No Work History added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a new record to get started</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">ORGANIZATION</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">JOB TITLE</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">EMPLOYMENT TYPE</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">LOCATION</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">PERIOD</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {workRecords.map((record, index) => (
                        <tr key={record.id || `work-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-800 font-medium">{record.organization || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">{record.job_title || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                              {record.employment_type || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{record.location || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDate(record.start_date)} - {record.currently_working ? 'Present' : formatDate(record.end_date)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleEditRecord(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => openDeleteModal(record.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
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

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
              <button onClick={handleBack} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <div className="flex gap-3">
                <button onClick={handleSave} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button onClick={handleNext} className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium flex items-center gap-2 shadow-md">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">Add your work experience. List your most recent position first.</p>
        </div>
      </div>

      {/* Add/Edit Modal - Transparent Background, Landscape, Medium Size */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full my-8">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingId ? 'Edit Work Record' : 'Add Work Record'}
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
                      Organization <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                      placeholder="Enter organization name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="job_title"
                      value={formData.job_title}
                      onChange={handleInputChange}
                      placeholder="Enter job title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Type
                    </label>
                    <select
                      name="employment_type"
                      value={formData.employment_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                    >
                      <option value="">Select employment type</option>
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Enter location (city, country)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location Type
                    </label>
                    <select
                      name="location_type"
                      value={formData.location_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                    >
                      <option value="">Select location type</option>
                      {LOCATION_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        disabled={formData.currently_working}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="currently_working"
                      checked={formData.currently_working}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      I currently work here
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responsibilities
                    </label>
                    <textarea
                      name="responsibilities"
                      value={formData.responsibilities}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="Describe your key responsibilities and achievements..."
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
                onClick={editingId ? handleUpdateRecord : handleAddRecord}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingId ? 'Update Record' : 'Save Record'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Transparent Background */}
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
                Are you sure you want to delete this work record?
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
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
}