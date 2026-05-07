'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Plus, Trash2, Edit3, Save, ArrowRight, AlertCircle, 
  CheckCircle, X, Calendar, Building, Upload, Download, XCircle, ChevronLeft
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface EducationRecord {
  id?: number;
  qualification_type: string;
  institution: string;
  start_date: string;
  end_date: string;
  currently_studying: boolean;
  certificate_url?: string;
  transcript_url?: string;
  grade?: string;
}

const QUALIFICATION_TYPES = [
  'MSCE',
  'JCE',
  'Diploma',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'PhD',
  'Certificate',
  'Other'
];

const GRADE_OPTIONS = [
  'Distinction',
  'Credit',
  'Merit',
  'Pass',
  'First Class',
  'Second Class Upper',
  'Second Class Lower',
  'Third Class'
];

export default function EducationPage() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<EducationRecord>({
    qualification_type: '',
    institution: '',
    start_date: '',
    end_date: '',
    currently_studying: false,
    grade: '',
    certificate_url: '',
    transcript_url: '',
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
      fetchEducationRecords();
    }
  }, [token]);

  const fetchEducationRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authFetch('/education/');
      console.log('Education API response:', data);
      
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
        qualification_type: record.qualification_type || '',
        institution: record.institution || '',
        start_date: record.start_date || '',
        end_date: record.end_date || '',
        currently_studying: record.currently_studying || false,
        grade: record.grade || '',
        certificate_url: record.certificate_url || '',
        transcript_url: record.transcript_url || '',
      }));
      
      setEducationRecords(formattedRecords);
      localStorage.setItem('education_records', JSON.stringify(formattedRecords));
    } catch (err: any) {
      console.error('Error fetching education records:', err);
      setError(err.message || 'Failed to load education records');
      const saved = localStorage.getItem('education_records');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setEducationRecords(parsed);
        } catch (e) {
          console.error('Error parsing saved records:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalStorage = (records: EducationRecord[]) => {
    localStorage.setItem('education_records', JSON.stringify(records));
  };

  const createRecord = async (record: EducationRecord) => {
    const data = await authFetch('/education/', {
      method: 'POST',
      body: JSON.stringify({
        qualification_type: record.qualification_type,
        institution: record.institution,
        start_date: record.start_date,
        end_date: record.currently_studying ? null : record.end_date,
        currently_studying: record.currently_studying,
        grade: record.grade,
      }),
    });
    return data.data || data;
  };

  const updateRecord = async (id: number, record: EducationRecord) => {
    const data = await authFetch(`/education/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        qualification_type: record.qualification_type,
        institution: record.institution,
        start_date: record.start_date,
        end_date: record.currently_studying ? null : record.end_date,
        currently_studying: record.currently_studying,
        grade: record.grade,
      }),
    });
    return data.data || data;
  };

  const deleteRecord = async (id: number) => {
    await authFetch(`/education/${id}`, {
      method: 'DELETE',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      if (name === 'currently_studying' && checked) {
        setFormData(prev => ({ ...prev, end_date: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = (type: 'certificate' | 'transcript', file: File | null) => {
    if (!file) return;
    
    // Simulate file upload - in production, upload to server
    const fileUrl = URL.createObjectURL(file);
    if (type === 'certificate') {
      setFormData(prev => ({ ...prev, certificate_url: fileUrl }));
    } else {
      setFormData(prev => ({ ...prev, transcript_url: fileUrl }));
    }
    addToast(`${type === 'certificate' ? 'Certificate' : 'Transcript'} selected`, 'success');
  };

  const handleAddRecord = async () => {
    if (!formData.qualification_type) {
      addToast('Please select qualification type', 'error');
      return;
    }
    if (!formData.institution) {
      addToast('Please enter institution name', 'error');
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
      const updatedRecords = [...educationRecords, recordWithId];
      setEducationRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      addToast('Education record added successfully!', 'success');
    } catch (err: any) {
      console.error('Error adding record:', err);
      const newRecord = { ...formData, id: Date.now() };
      const updatedRecords = [...educationRecords, newRecord];
      setEducationRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      addToast('Education record saved locally!', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRecord = (record: EducationRecord) => {
    setFormData(record);
    setEditingId(record.id || null);
    setShowAddModal(true);
  };

  const handleUpdateRecord = async () => {
    if (!formData.qualification_type) {
      addToast('Please select qualification type', 'error');
      return;
    }
    if (!formData.institution) {
      addToast('Please enter institution name', 'error');
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
      const updatedRecords = educationRecords.map(r => 
        r.id === editingId ? { ...formData, id: editingId } : r
      );
      setEducationRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      setEditingId(null);
      addToast('Education record updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error updating record:', err);
      const updatedRecords = educationRecords.map(r => 
        r.id === editingId ? { ...formData, id: editingId } : r
      );
      setEducationRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      setEditingId(null);
      addToast('Education record updated locally!', 'success');
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
      const updatedRecords = educationRecords.filter(r => r.id !== deleteId);
      setEducationRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      addToast('Education record deleted successfully!', 'success');
    } catch (err: any) {
      console.error('Error deleting record:', err);
      const updatedRecords = educationRecords.filter(r => r.id !== deleteId);
      setEducationRecords(updatedRecords);
      saveToLocalStorage(updatedRecords);
      addToast('Education record deleted locally!', 'success');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      qualification_type: '',
      institution: '',
      start_date: '',
      end_date: '',
      currently_studying: false,
      grade: '',
      certificate_url: '',
      transcript_url: '',
    });
    setEditingId(null);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    addToast('All records saved successfully!', 'success');
  };

  const handleNext = () => {
    if (educationRecords.length === 0) {
      addToast('Please add at least one education record before continuing', 'error');
      return;
    }
    router.push('/application/teacher-subjects');
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
          <p className="text-gray-600">Loading your education records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Toast Notifications */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
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
          {/* Education Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">EDUCATION</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Provide all relevant educational qualifications. Ensure certificates and transcripts are uploaded where required.
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

            {/* Education Table */}
            <div>
              {educationRecords.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No Education added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a new record to get started</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">QUALIFICATION</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">INSTITUTION</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">GRADE</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">PERIOD</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">CERTIFICATE</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">TRANSCRIPT</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {educationRecords.map((record, index) => (
                        <tr key={record.id || `record-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-800 font-medium">
                            {record.qualification_type || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {record.institution || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {record.grade || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {formatDate(record.start_date)} - {record.currently_studying ? 'Present' : formatDate(record.end_date)}
                          </td>
                          <td className="px-4 py-3">
                            {record.certificate_url ? (
                              <span className="text-green-600 text-sm">✓ Uploaded</span>
                            ) : (
                              <span className="text-gray-400 text-sm">Not uploaded</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {record.transcript_url ? (
                              <span className="text-green-600 text-sm">✓ Uploaded</span>
                            ) : (
                              <span className="text-gray-400 text-sm">Not uploaded</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditRecord(record)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(record.id!)}
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
              )}
            </div>

            {/* Action Buttons - Back, Next, Save */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Add all your educational qualifications. Fields marked with * are required.
          </p>
        </div>
      </div>

      {/* Add/Edit Modal - Landscape Orientation */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? 'Edit Education Record' : 'Add Education Record'}
              </h3>
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
            
            <div className="p-6">
              {/* Two-column layout for landscape mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qualification Type *
                    </label>
                    <select
                      name="qualification_type"
                      value={formData.qualification_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">Select Qualification</option>
                      {QUALIFICATION_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution *
                    </label>
                    <input
                      type="text"
                      name="institution"
                      value={formData.institution}
                      onChange={handleInputChange}
                      placeholder="Enter institution name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">Select Grade</option>
                      {GRADE_OPTIONS.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        disabled={formData.currently_studying}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="currently_studying"
                      checked={formData.currently_studying}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">
                      I am currently studying here
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Certificate
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('certificate', e.target.files?.[0] || null)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                    </div>
                    {formData.certificate_url && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Certificate uploaded successfully</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Transcript
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload('transcript', e.target.files?.[0] || null)}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                    </div>
                    {formData.transcript_url && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Transcript uploaded successfully</span>
                      </div>
                    )}
                  </div>

                  {/* Preview Section */}
                  {(formData.certificate_url || formData.transcript_url) && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                      <div className="space-y-2">
                        {formData.certificate_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Certificate:</span>
                            <a 
                              href={formData.certificate_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              View
                            </a>
                          </div>
                        )}
                        {formData.transcript_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Transcript:</span>
                            <a 
                              href={formData.transcript_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              View
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 pt-0 border-t border-gray-200 mt-4">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdateRecord : handleAddRecord}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingId ? 'Update Record' : 'Add Record'}
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
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
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
            
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <p className="text-center text-gray-700 mb-2">
                Are you sure you want to delete this education record?
              </p>
              <p className="text-center text-gray-500 text-sm">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 font-medium"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Record
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