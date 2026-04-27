'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Plus, Trash2, Edit3, Save, ArrowRight, 
  AlertCircle, CheckCircle, X, Sparkles, Users, 
  GraduationCap, ChevronLeft, Loader2 
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface TeachingSubject {
  id?: number;
  subject_name: string;
  subject_code: string;
  teaching_level: 'junior' | 'senior' | 'both';
  is_major: boolean;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Available teaching subjects
const AVAILABLE_SUBJECTS = [
  'English', 'Chichewa', 'Mathematics', 'Physical Science', 
  'Biology', 'Chemistry', 'Physics', 'Geography', 'History',
  'Social Studies', 'Bible Knowledge', 'Agriculture', 
  'Home Economics', 'Commerce', 'Accounts', 'Computer Studies',
  'Expressive Arts', 'Physical Education', 'French', 'Life Skills'
];

const TEACHING_LEVELS = [
  { value: 'junior', label: 'Junior Secondary (Form 1-2)', icon: '📚' },
  { value: 'senior', label: 'Senior Secondary (Form 3-4)', icon: '🎓' },
  { value: 'both', label: 'Both Junior & Senior', icon: '⭐' }
];

export default function TeacherSubjectsPage() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<TeachingSubject[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Form state
  const [addForm, setAddForm] = useState({
    subject_name: '',
    teaching_level: 'both' as 'junior' | 'senior' | 'both',
    is_major: false
  });
  
  const [editForm, setEditForm] = useState({
    id: null as number | null,
    subject_name: '',
    teaching_level: 'both' as 'junior' | 'senior' | 'both',
    is_major: false
  });

  // Add toast notification
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  // Remove toast
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Auth fetch helper
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
    loadTeachingSubjects(storedToken);
  }, [router]);

  // Load teaching subjects from backend API
  const loadTeachingSubjects = async (authToken: string) => {
    try {
      setLoading(true);
      
      const response = await authFetch('/teaching-subjects/');
      
      if (response.success && response.data) {
        setSubjects(response.data);
      } else {
        setSubjects([]);
      }
    } catch (err: any) {
      console.error('Error loading teaching subjects:', err);
      // If endpoint doesn't exist yet, initialize empty array
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Save teaching subjects to backend API
  const saveTeachingSubjects = async (updatedSubjects: TeachingSubject[]) => {
    try {
      setSaving(true);
      
      const response = await authFetch('/teaching-subjects/', {
        method: 'POST',
        body: JSON.stringify({ subjects: updatedSubjects }),
      });
      
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Failed to save subjects');
      }
    } catch (err: any) {
      console.error('Error saving teaching subjects:', err);
      addToast(err.message || 'Failed to save subjects', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete a specific teaching subject
  const deleteTeachingSubject = async (subjectId: number) => {
    try {
      const response = await authFetch(`/teaching-subjects/${subjectId}/`, {
        method: 'DELETE',
      });
      
      return response.success;
    } catch (err: any) {
      console.error('Error deleting teaching subject:', err);
      addToast(err.message || 'Failed to delete subject', 'error');
      return false;
    }
  };

  const handleAddSubject = async () => {
    if (!addForm.subject_name) {
      addToast('Please select a subject', 'error');
      return;
    }
    
    if (subjects.some(s => s.subject_name === addForm.subject_name)) {
      addToast(`Subject "${addForm.subject_name}" has already been added`, 'error');
      return;
    }
    
    const newSubject: TeachingSubject = {
      id: Date.now(), // Temporary ID, will be replaced by backend
      subject_name: addForm.subject_name,
      subject_code: addForm.subject_name.substring(0, 3).toUpperCase(),
      teaching_level: addForm.teaching_level,
      is_major: addForm.is_major
    };
    
    const updatedSubjects = [...subjects, newSubject];
    
    // Save to backend
    const success = await saveTeachingSubjects(updatedSubjects);
    
    if (success) {
      // Reload from backend to get server-generated IDs
      await loadTeachingSubjects(token!);
      setAddForm({
        subject_name: '',
        teaching_level: 'both',
        is_major: false
      });
      setShowAddModal(false);
      addToast('Teaching subject added successfully!', 'success');
    }
  };

  const openEditModal = (index: number) => {
    const subject = subjects[index];
    setEditForm({
      id: subject.id || null,
      subject_name: subject.subject_name,
      teaching_level: subject.teaching_level,
      is_major: subject.is_major
    });
    setEditingIndex(index);
    setShowEditModal(true);
  };

  const handleUpdateSubject = async () => {
    if (editingIndex === null) return;
    if (!editForm.subject_name) {
      addToast('Please select a subject', 'error');
      return;
    }
    
    const updatedSubjects = [...subjects];
    updatedSubjects[editingIndex] = {
      ...updatedSubjects[editingIndex],
      subject_name: editForm.subject_name,
      subject_code: editForm.subject_name.substring(0, 3).toUpperCase(),
      teaching_level: editForm.teaching_level,
      is_major: editForm.is_major
    };
    
    // Save to backend
    const success = await saveTeachingSubjects(updatedSubjects);
    
    if (success) {
      await loadTeachingSubjects(token!);
      setShowEditModal(false);
      setEditingIndex(null);
      setEditForm({
        id: null,
        subject_name: '',
        teaching_level: 'both',
        is_major: false
      });
      addToast('Teaching subject updated successfully!', 'success');
    }
  };

  const openDeleteModal = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;
    
    const subjectToDelete = subjects[deleteIndex];
    
    // If subject has an ID from backend, delete via API
    if (subjectToDelete.id) {
      const success = await deleteTeachingSubject(subjectToDelete.id);
      if (success) {
        await loadTeachingSubjects(token!);
        addToast('Teaching subject removed successfully!', 'success');
      }
    } else {
      // Fallback to local removal if no ID
      const updatedSubjects = subjects.filter((_, i) => i !== deleteIndex);
      const success = await saveTeachingSubjects(updatedSubjects);
      if (success) {
        await loadTeachingSubjects(token!);
        addToast('Teaching subject removed successfully!', 'success');
      }
    }
    
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const handleNext = async () => {
    if (subjects.length === 0) {
      addToast('Please add at least one teaching subject before continuing', 'error');
      return;
    }
    
    // Save one more time to ensure data is synced
    await saveTeachingSubjects(subjects);
    
    // Navigate to next page
    router.push('/application/next-of-kin');
  };

  const handleBack = () => {
    router.push('/application/msce-results');
  };

  const getTeachingLevelLabel = (level: string) => {
    const found = TEACHING_LEVELS.find(l => l.value === level);
    return found ? `${found.icon} ${found.label}` : level;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your teaching subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Toast Notifications */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg ${
                toast.type === 'success' 
                  ? 'bg-green-600 text-white' 
                  : toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : toast.type === 'warning'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : toast.type === 'warning' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 hover:opacity-80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-800">TEACHING SUBJECTS</h2>
              </div>
              {subjects.length > 0 && (
                <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">
                    {subjects.length} Subject{subjects.length !== 1 ? 's' : ''} Added
                  </span>
                </div>
              )}
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Please select the subjects you are qualified to teach at secondary school level.
                This information helps in placement and teaching practice assignments.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Note:</strong> Indicate whether you can teach at Junior Secondary (Forms 1-2), 
                Senior Secondary (Forms 3-4), or both levels.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Warning: No subjects */}
            {subjects.length === 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">No Teaching Subjects Added</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please add at least one teaching subject before continuing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Add Subject Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={saving}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                Add Teaching Subject
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Add all subjects you are qualified to teach
              </p>
            </div>

            {/* Subjects List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Your Teaching Subjects</h3>
                <span className="text-sm text-gray-500">
                  {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {subjects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No teaching subjects added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Add Teaching Subject" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjects.map((subject, index) => (
                    <div
                      key={subject.id || index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                            </div>
                            <h4 className="font-medium text-gray-800">{subject.subject_name}</h4>
                            {subject.is_major && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                Major Subject
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Teaching Level:</span>
                              <p className="text-gray-700">{getTeachingLevelLabel(subject.teaching_level)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Subject Code:</span>
                              <p className="text-gray-700 font-mono">{subject.subject_code}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(index)}
                            disabled={saving}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(index)}
                            disabled={saving}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
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
                disabled={saving}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-medium disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={subjects.length === 0 || saving}
                className={`px-8 py-3 rounded-lg flex items-center gap-2 font-medium ${
                  subjects.length > 0 && !saving
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            
            {/* Help text if no subjects */}
            {subjects.length === 0 && (
              <p className="text-sm text-red-500 text-center mt-4">
                Please add at least one teaching subject to continue
              </p>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Teaching subjects are required for Bachelor of Education programmes.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            You can add multiple subjects. Indicate major subjects that are your primary teaching areas.
          </p>
        </div>
      </div>

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">Add Teaching Subject</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddForm({
                    subject_name: '',
                    teaching_level: 'both',
                    is_major: false
                  });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teaching Subject *
                </label>
                <select
                  value={addForm.subject_name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, subject_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="">Select a subject</option>
                  {AVAILABLE_SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teaching Level *
                </label>
                <div className="space-y-2">
                  {TEACHING_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        addForm.teaching_level === level.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="teaching_level"
                        value={level.value}
                        checked={addForm.teaching_level === level.value}
                        onChange={(e) => setAddForm(prev => ({ 
                          ...prev, 
                          teaching_level: e.target.value as 'junior' | 'senior' | 'both' 
                        }))}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">
                          {level.icon} {level.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.is_major}
                    onChange={(e) => setAddForm(prev => ({ ...prev, is_major: e.target.checked }))}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Mark as <strong>Major Subject</strong> (Primary teaching area)
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Major subjects are your primary teaching qualification areas
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddForm({
                    subject_name: '',
                    teaching_level: 'both',
                    is_major: false
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubject}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Teaching Subject</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingIndex(null);
                  setEditForm({
                    id: null,
                    subject_name: '',
                    teaching_level: 'both',
                    is_major: false
                  });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teaching Subject *
                </label>
                <select
                  value={editForm.subject_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, subject_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="">Select a subject</option>
                  {AVAILABLE_SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teaching Level *
                </label>
                <div className="space-y-2">
                  {TEACHING_LEVELS.map((level) => (
                    <label
                      key={level.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        editForm.teaching_level === level.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="edit_teaching_level"
                        value={level.value}
                        checked={editForm.teaching_level === level.value}
                        onChange={(e) => setEditForm(prev => ({ 
                          ...prev, 
                          teaching_level: e.target.value as 'junior' | 'senior' | 'both' 
                        }))}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-800">
                          {level.icon} {level.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.is_major}
                    onChange={(e) => setEditForm(prev => ({ ...prev, is_major: e.target.checked }))}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Mark as <strong>Major Subject</strong> (Primary teaching area)
                  </span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingIndex(null);
                  setEditForm({
                    id: null,
                    subject_name: '',
                    teaching_level: 'both',
                    is_major: false
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubject}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteIndex(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
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
                Are you sure you want to remove this teaching subject?
              </p>
              <p className="text-center text-gray-500 text-sm">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteIndex(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
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
    </div>
  );
}