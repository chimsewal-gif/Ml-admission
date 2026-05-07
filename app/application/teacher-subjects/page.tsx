'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, Plus, Trash2, Edit3, Save, ArrowRight, 
  AlertCircle, CheckCircle, X, Sparkles, Users, 
  GraduationCap, ChevronLeft, Loader2, Award,
  Clock, BookMarked, Star, Shield, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const AVAILABLE_SUBJECTS = [
  'English', 'Chichewa', 'Mathematics', 'Physical Science', 
  'Biology', 'Chemistry', 'Physics', 'Geography', 'History',
  'Social Studies', 'Bible Knowledge', 'Agriculture', 
  'Home Economics', 'Commerce', 'Accounts', 'Computer Studies',
  'Expressive Arts', 'Physical Education', 'French', 'Life Skills'
];

const TEACHING_LEVELS = [
  { value: 'junior', label: 'Junior Secondary (Form 1-2)', icon: '📚', color: 'bg-blue-100 text-blue-700' },
  { value: 'senior', label: 'Senior Secondary (Form 3-4)', icon: '🎓', color: 'bg-purple-100 text-purple-700' },
  { value: 'both', label: 'Both Junior & Senior', icon: '⭐', color: 'bg-green-100 text-green-700' }
];

export default function TeacherSubjectsPage() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<TeachingSubject[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
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

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
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
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || `Request failed with status ${res.status}`);
    return data;
  };

  // Helper to update localStorage completion flag
  const updateCompletionFlag = (hasSubjects: boolean) => {
    if (typeof window !== 'undefined') {
      if (hasSubjects) {
        localStorage.setItem('teachingSubjectsCompleted', 'true');
        localStorage.setItem('teachingSubjectsSaved', 'true');
        sessionStorage.setItem('teachingSubjectsCompleted', 'true');
      } else {
        localStorage.removeItem('teachingSubjectsCompleted');
        localStorage.removeItem('teachingSubjectsSaved');
        sessionStorage.removeItem('teachingSubjectsCompleted');
      }
      window.dispatchEvent(new StorageEvent('storage', { key: 'teachingSubjectsCompleted' }));
    }
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

  const loadTeachingSubjects = async (authToken: string) => {
    try {
      setLoading(true);
      const response = await authFetch('/teaching-subjects/');
      
      let subjectsArray = [];
      if (response.success && Array.isArray(response.data)) {
        subjectsArray = response.data;
      } else if (Array.isArray(response)) {
        subjectsArray = response;
      } else if (response.data && Array.isArray(response.data.data)) {
        subjectsArray = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        subjectsArray = response.data;
      } else {
        subjectsArray = [];
      }
      
      setSubjects(subjectsArray);
      updateCompletionFlag(subjectsArray.length > 0);
      
    } catch (err: any) {
      console.error('Error loading teaching subjects:', err);
      setSubjects([]);
      updateCompletionFlag(false);
    } finally {
      setLoading(false);
    }
  };

  const saveTeachingSubjects = async (updatedSubjects: TeachingSubject[]) => {
    try {
      setSaving(true);
      const response = await authFetch('/teaching-subjects/', {
        method: 'POST',
        body: JSON.stringify({ subjects: updatedSubjects }),
      });
      
      if (response.success) {
        updateCompletionFlag(updatedSubjects.length > 0);
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
      id: Date.now(),
      subject_name: addForm.subject_name,
      subject_code: addForm.subject_name.substring(0, 3).toUpperCase(),
      teaching_level: addForm.teaching_level,
      is_major: addForm.is_major
    };
    
    const updatedSubjects = [...subjects, newSubject];
    const success = await saveTeachingSubjects(updatedSubjects);
    
    if (success) {
      setSubjects(updatedSubjects);
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
    
    const success = await saveTeachingSubjects(updatedSubjects);
    
    if (success) {
      setSubjects(updatedSubjects);
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
    
    if (subjectToDelete.id) {
      const success = await deleteTeachingSubject(subjectToDelete.id);
      if (success) {
        const updatedSubjects = subjects.filter((_, i) => i !== deleteIndex);
        setSubjects(updatedSubjects);
        updateCompletionFlag(updatedSubjects.length > 0);
        addToast('Teaching subject removed successfully!', 'success');
      }
    } else {
      const updatedSubjects = subjects.filter((_, i) => i !== deleteIndex);
      const success = await saveTeachingSubjects(updatedSubjects);
      if (success) {
        setSubjects(updatedSubjects);
        updateCompletionFlag(updatedSubjects.length > 0);
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
    
    await saveTeachingSubjects(subjects);
    if (typeof window !== 'undefined') {
      localStorage.setItem('teachingSubjectsCompleted', 'true');
      localStorage.setItem('teachingSubjectsSaved', 'true');
      sessionStorage.setItem('teachingSubjectsCompleted', 'true');
      window.dispatchEvent(new StorageEvent('storage', { key: 'teachingSubjectsCompleted' }));
    }
    
    addToast('Teaching subjects saved successfully!', 'success');
    
    setTimeout(() => {
      router.push('/application/documents');
    }, 500);
  };

  const handleBack = () => {
    router.push('/application/education');
  };

  const getTeachingLevelLabel = (level: string) => {
    const found = TEACHING_LEVELS.find(l => l.value === level);
    const levelData = found || TEACHING_LEVELS[2];
    return { icon: levelData.icon, label: levelData.label, color: levelData.color };
  };

  useEffect(() => {
    if (!loading) {
      updateCompletionFlag(subjects.length > 0);
    }
  }, [subjects, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your teaching subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Toast Notifications */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg ${
                  toast.type === 'success' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                    : toast.type === 'error'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
                    : toast.type === 'warning'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : toast.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="ml-2 hover:opacity-80 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm font-medium">Teaching Subjects</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Your Teaching Subjects</h1>
          <p className="text-gray-600">Indicate the subjects you are qualified to teach at secondary school level</p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Teaching Subjects</h2>
                  <p className="text-purple-200 text-sm">Select subjects you can teach</p>
                </div>
              </div>
              {subjects.length > 0 && (
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                  <Users className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">
                    {subjects.length} Subject{subjects.length !== 1 ? 's' : ''} Selected
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Info Banner */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    Please select the subjects you are qualified to teach at secondary school level.
                    This information helps in placement and teaching practice assignments.
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    <strong className="text-blue-700">Note:</strong> Indicate whether you can teach at Junior Secondary (Forms 1-2), 
                    Senior Secondary (Forms 3-4), or both levels.
                  </p>
                </div>
              </div>
            </div>

            {/* Warning for no subjects */}
            <AnimatePresence>
              {subjects.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-r-xl"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">No Teaching Subjects Added</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please add at least one teaching subject before continuing.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Add Teaching Subject
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Add all subjects you are qualified to teach
              </p>
            </div>

            {/* Subjects List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-purple-600" />
                  Your Teaching Subjects
                </h3>
                <span className="text-sm text-gray-500">
                  {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              {subjects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300"
                >
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No teaching subjects added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Add Teaching Subject" to get started</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {subjects.map((subject, index) => {
                    const levelInfo = getTeachingLevelLabel(subject.teaching_level);
                    return (
                      <motion.div
                        key={subject.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all duration-200 bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                              </div>
                              <h4 className="font-semibold text-gray-800">{subject.subject_name}</h4>
                              {subject.is_major && (
                                <span className="text-xs bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 px-2 py-1 rounded-full flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  Major Subject
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full ${levelInfo.color}`}>
                                {levelInfo.icon} {levelInfo.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Subject Code:</span>
                                <p className="text-gray-700 font-mono text-sm mt-0.5">{subject.subject_code}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Qualification Level:</span>
                                <p className="text-gray-700 text-sm mt-0.5">Secondary School Teaching</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(index)}
                              disabled={saving}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Edit subject"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(index)}
                              disabled={saving}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete subject"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between gap-4">
              <button
                onClick={handleBack}
                disabled={saving}
                className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 font-medium transition-all disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleNext}
                  disabled={subjects.length === 0 || saving}
                  className={`px-8 py-2.5 rounded-xl flex items-center gap-2 font-semibold transition-all ${
                    subjects.length > 0 && !saving
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
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
            </div>
            
            {subjects.length === 0 && (
              <p className="text-sm text-red-500 text-center mt-4 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Please add at least one teaching subject to continue
              </p>
            )}
          </div>
        </motion.div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Teaching subjects are required for Bachelor of Education programmes.
          </p>
          <p className="text-gray-400 text-xs mt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            You can add multiple subjects. Indicate major subjects that are your primary teaching areas.
          </p>
        </div>
      </div>

      {/* Add Subject Modal - Styled */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddModal(false);
              setAddForm({
                subject_name: '',
                teaching_level: 'both',
                is_major: false
              });
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Add Teaching Subject</h3>
                    <p className="text-purple-200 text-sm">Select a subject you can teach</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddForm({
                      subject_name: '',
                      teaching_level: 'both',
                      is_major: false
                    });
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teaching Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addForm.subject_name}
                    onChange={(e) => setAddForm(prev => ({ ...prev, subject_name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                  >
                    <option value="">Select a subject</option>
                    {AVAILABLE_SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teaching Level <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {TEACHING_LEVELS.map((level) => (
                      <label
                        key={level.value}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          addForm.teaching_level === level.value
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
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
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
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
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all">
                    <input
                      type="checkbox"
                      checked={addForm.is_major}
                      onChange={(e) => setAddForm(prev => ({ ...prev, is_major: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <div>
                      <span className="text-sm text-gray-700">
                        Mark as <strong className="text-amber-600">Major Subject</strong>
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Major subjects are your primary teaching qualification areas
                      </p>
                    </div>
                  </label>
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
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubject}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Subject
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Subject Modal - Styled */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Edit Teaching Subject</h3>
                    <p className="text-blue-200 text-sm">Update subject information</p>
                  </div>
                </div>
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
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teaching Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.subject_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject_name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white transition-all"
                  >
                    <option value="">Select a subject</option>
                    {AVAILABLE_SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teaching Level <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {TEACHING_LEVELS.map((level) => (
                      <label
                        key={level.value}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          editForm.teaching_level === level.value
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
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
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
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
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-300 transition-all">
                    <input
                      type="checkbox"
                      checked={editForm.is_major}
                      onChange={(e) => setEditForm(prev => ({ ...prev, is_major: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <div>
                      <span className="text-sm text-gray-700">
                        Mark as <strong className="text-amber-600">Major Subject</strong>
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Major subjects are your primary teaching qualification areas
                      </p>
                    </div>
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
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSubject}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal - Styled */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setDeleteIndex(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Confirm Delete</h3>
                    <p className="text-red-200 text-sm">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteIndex(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-10 h-10 text-red-600" />
                </div>
                <p className="text-gray-700 font-medium mb-2">
                  Are you sure you want to remove this teaching subject?
                </p>
                <p className="text-gray-500 text-sm">
                  This action cannot be undone and will be removed from your application.
                </p>
              </div>
              
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteIndex(null);
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}