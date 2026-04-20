'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Plus, Trash2, Edit3, Save, ArrowRight, AlertCircle, 
  CheckCircle, X, Calendar, Building, Upload, Download, XCircle, 
  ChevronLeft, BookOpen, Link as LinkIcon, Users
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface PublicationRecord {
  id?: number;
  title: string;
  journal: string;
  year: string;
  link: string;
  authors?: string;
  doi?: string;
}

export default function PublicationsPage() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<PublicationRecord>({
    title: '',
    journal: '',
    year: '',
    link: '',
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
      fetchPublications();
    }
  }, [token]);

  const fetchPublications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authFetch('/publications/');
      console.log('Publications API response:', data);
      
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
        title: record.title || '',
        journal: record.journal || '',
        year: record.year || '',
        link: record.link || '',
      }));
      
      setPublications(formattedRecords);
      localStorage.setItem('publications', JSON.stringify(formattedRecords));
    } catch (err: any) {
      console.error('Error fetching publications:', err);
      setError(err.message || 'Failed to load publications');
      const saved = localStorage.getItem('publications');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPublications(parsed);
        } catch (e) {
          console.error('Error parsing saved records:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalStorage = (records: PublicationRecord[]) => {
    localStorage.setItem('publications', JSON.stringify(records));
  };

  const createRecord = async (record: PublicationRecord) => {
    const data = await authFetch('/publications/', {
      method: 'POST',
      body: JSON.stringify({
        title: record.title,
        journal: record.journal,
        year: record.year,
        link: record.link,
      }),
    });
    return data.data || data;
  };

  const updateRecord = async (id: number, record: PublicationRecord) => {
    const data = await authFetch(`/publications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: record.title,
        journal: record.journal,
        year: record.year,
        link: record.link,
      }),
    });
    return data.data || data;
  };

  const deleteRecord = async (id: number) => {
    await authFetch(`/publications/${id}`, {
      method: 'DELETE',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddRecord = async () => {
    if (!formData.title) {
      addToast('Please enter publication title', 'error');
      return;
    }
    if (!formData.journal) {
      addToast('Please enter journal/publisher name', 'error');
      return;
    }
    if (!formData.year) {
      addToast('Please enter year of publication', 'error');
      return;
    }
    
    // Validate year
    const year = parseInt(formData.year);
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 5) {
      addToast('Please enter a valid year', 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      const newRecord = await createRecord(formData);
      const recordWithId = { ...formData, id: newRecord.id || Date.now() };
      const updatedRecords = [...publications, recordWithId];
      setPublications(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      addToast('Publication added successfully!', 'success');
    } catch (err: any) {
      console.error('Error adding publication:', err);
      const newRecord = { ...formData, id: Date.now() };
      const updatedRecords = [...publications, newRecord];
      setPublications(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      addToast('Publication saved locally!', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRecord = (record: PublicationRecord) => {
    setFormData(record);
    setEditingId(record.id || null);
    setShowAddModal(true);
  };

  const handleUpdateRecord = async () => {
    if (!formData.title) {
      addToast('Please enter publication title', 'error');
      return;
    }
    if (!formData.journal) {
      addToast('Please enter journal/publisher name', 'error');
      return;
    }
    if (!formData.year) {
      addToast('Please enter year of publication', 'error');
      return;
    }
    
    if (editingId === null) return;
    
    setSaving(true);
    
    try {
      await updateRecord(editingId, formData);
      const updatedRecords = publications.map(r => 
        r.id === editingId ? { ...formData, id: editingId } : r
      );
      setPublications(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      setEditingId(null);
      addToast('Publication updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error updating publication:', err);
      const updatedRecords = publications.map(r => 
        r.id === editingId ? { ...formData, id: editingId } : r
      );
      setPublications(updatedRecords);
      saveToLocalStorage(updatedRecords);
      resetForm();
      setShowAddModal(false);
      setEditingId(null);
      addToast('Publication updated locally!', 'success');
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
      const updatedRecords = publications.filter(r => r.id !== deleteId);
      setPublications(updatedRecords);
      saveToLocalStorage(updatedRecords);
      addToast('Publication deleted successfully!', 'success');
    } catch (err: any) {
      console.error('Error deleting publication:', err);
      const updatedRecords = publications.filter(r => r.id !== deleteId);
      setPublications(updatedRecords);
      saveToLocalStorage(updatedRecords);
      addToast('Publication deleted locally!', 'success');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      journal: '',
      year: '',
      link: '',
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
    if (publications.length === 0) {
      addToast('Please add at least one publication before continuing', 'error');
      return;
    }
    router.push('/application/teacher-subjects');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your publications...</p>
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
          {/* Publications Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">PUBLICATIONS</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Provide details of any academic or professional publications you have contributed to, including journal articles, conference papers, or other scholarly work. Leave blank if not applicable.
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

            {/* Publications Table */}
            <div>
              {publications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No Publications added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a new record to get started</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">TITLE</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">JOURNAL / PUBLISHER</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">YEAR</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">LINK</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {publications.map((record, index) => (
                        <tr key={record.id || `pub-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-800 font-medium">{record.title || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">{record.journal || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-600">{record.year || 'N/A'}</td>
                          <td className="px-4 py-3">
                            {record.link ? (
                              <a href={record.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">No link</span>
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

            {/* Action Buttons - Back, Save, Next */}
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
            Add your academic publications. Include journal articles, conference papers, or other scholarly work.
          </p>
        </div>
      </div>

      {/* Add/Edit Modal - Styled like the uploaded picture */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full my-8">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Add Publications</h3>
              
              <div className="space-y-5 mt-6">
                {/* Publication Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publication Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter publication title..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Journal / Publisher */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Journal / Publisher</label>
                  <input
                    type="text"
                    name="journal"
                    value={formData.journal}
                    onChange={handleInputChange}
                    placeholder="Enter journal / publisher..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Year of Publication */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Publication</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="Enter year of publication..."
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Link (URL) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link (URL)</label>
                  <input
                    type="url"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Modal Buttons */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleUpdateRecord : handleAddRecord}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
                Are you sure you want to delete this publication?
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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