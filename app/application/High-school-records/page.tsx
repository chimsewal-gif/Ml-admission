'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Plus, Trash2, Edit3, Save, ArrowRight, AlertCircle, CheckCircle, 
  X, Sparkles, Brain, TrendingUp, Shield, Loader2, Search, ChevronDown, 
  BookOpen, Award, Target, Zap, BarChart3, Star, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface SubjectRecord {
  id?: number;
  qualification: string;
  centre_number: string;
  exam_number: string;
  subject: string;
  grade: string;
  year: string;
}

interface MLPrediction {
  success: boolean;
  average_points: number;
  prediction: number;
  probability: number;
  message: string;
  using_ml: boolean;
}

const QUALIFICATION = 'MSCE (Malawi School Certificate of Education)';

const MSCE_SUBJECTS = [
  'English', 'Chichewa', 'Mathematics', 'Physical Science', 'Biology', 'Chemistry',
  'Physics', 'Geography', 'History', 'Social Studies', 'Bible Knowledge', 'Life Skills',
  'Agriculture', 'Home Economics', 'Commerce', 'Accounts', 'Computer Studies',
  'French', 'German', 'Portuguese', 'Arabic'
];

const MSCE_GRADES = [
  { value: '1', label: '1', description: 'Excellent', points: 1, color: 'bg-green-100 text-green-700' },
  { value: '2', label: '2', description: 'Very Good', points: 2, color: 'bg-green-100 text-green-700' },
  { value: '3', label: '3', description: 'Good', points: 3, color: 'bg-blue-100 text-blue-700' },
  { value: '4', label: '4', description: 'Credit', points: 4, color: 'bg-blue-100 text-blue-700' },
  { value: '5', label: '5', description: 'Credit', points: 5, color: 'bg-yellow-100 text-yellow-700' },
  { value: '6', label: '6', description: 'Pass', points: 6, color: 'bg-yellow-100 text-yellow-700' },
  { value: '7', label: '7', description: 'Pass', points: 7, color: 'bg-orange-100 text-orange-700' },
  { value: '8', label: '8', description: 'Weak Pass', points: 8, color: 'bg-orange-100 text-orange-700' },
  { value: '9', label: '9', description: 'Fail', points: 9, color: 'bg-red-100 text-red-700' },
  { value: 'U', label: 'U', description: 'Ungraded', points: 10, color: 'bg-red-100 text-red-700' }
];

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Custom Styled Select Component for Subjects
const StyledSubjectSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder,
  disabled 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(subject =>
    subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (subject: string) => {
    onChange(subject);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center justify-between gap-2 transition-all ${
          !disabled ? 'hover:border-green-300 cursor-pointer' : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <span className={`truncate ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No subjects found
                </div>
              ) : (
                filteredOptions.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSelect(subject)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-all flex items-center justify-between ${
                      value === subject ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-500" />
                      <span className={`text-sm ${value === subject ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
                        {subject}
                      </span>
                    </div>
                    {value === subject && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Custom Styled Select Component for Grades
const StyledGradeSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder,
  disabled 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: typeof MSCE_GRADES;
  placeholder: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedGrade = options.find(g => g.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (gradeValue: string) => {
    onChange(gradeValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center justify-between gap-2 transition-all ${
          !disabled ? 'hover:border-green-300 cursor-pointer' : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-2">
          {selectedGrade ? (
            <>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedGrade.color}`}>
                {selectedGrade.label}
              </span>
              <span className="text-gray-600 text-sm">- {selectedGrade.description}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto">
              {options.map((grade) => (
                <button
                  key={grade.value}
                  onClick={() => handleSelect(grade.value)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-all flex items-center justify-between ${
                    value === grade.value ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${grade.color}`}>
                      {grade.label}
                    </span>
                    <span className="text-sm text-gray-600">- {grade.description}</span>
                    <span className="text-xs text-gray-400">({grade.points} point{grade.points !== 1 ? 's' : ''})</span>
                  </div>
                  {value === grade.value && <CheckCircle className="w-4 h-4 text-green-600" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function MSCEResultsPage() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Form state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  
  // ML Prediction state
  const [isPredicting, setIsPredicting] = useState(false);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [autoPredictEnabled, setAutoPredictEnabled] = useState(true);
  
  // Popup state
  const [showAIPopup, setShowAIPopup] = useState(false);
  const popupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const predictionCardRef = useRef<HTMLDivElement | null>(null);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    subject: '',
    grade: '',
    id: null as number | null
  });

  // Add toast notification
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
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
    
    const savedAutoPredict = localStorage.getItem('auto_ml_predict');
    if (savedAutoPredict !== null) {
      setAutoPredictEnabled(savedAutoPredict === 'true');
    }
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
      fetchSubjectRecords();
    }
  }, [token]);

  // Auto-predict when subjects change
  useEffect(() => {
    if (autoPredictEnabled && subjectRecords.length >= 6 && !isPredicting && !showPrediction) {
      const timer = setTimeout(() => {
        getMLPredictionAutomatically();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [subjectRecords, autoPredictEnabled]);

  // Popup timer
  useEffect(() => {
    popupTimerRef.current = setTimeout(() => {
      setShowAIPopup(true);
    }, 7000);
    return () => {
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  const fetchSubjectRecords = async () => {
    try {
      setLoading(true);
      const data = await authFetch('/subject-records');
      const records = data.data || data || [];
      const msceRecords = records.filter((r: any) => r.qualification === QUALIFICATION);
      setSubjectRecords(msceRecords);
    } catch (err: any) {
      console.error('Error fetching subject records:', err);
      if (err.message.includes('authenticated')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const createRecord = async (subject: string, grade: string) => {
    const currentYear = new Date().getFullYear();
    const recordData = {
      qualification: QUALIFICATION,
      centre_number: '',
      exam_number: '',
      subject: subject,
      grade: grade,
      year: currentYear.toString(),
    };
    const data = await authFetch('/subject-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
    return data.data;
  };

  const updateRecord = async (id: number, subject: string, grade: string) => {
    const currentYear = new Date().getFullYear();
    const recordData = {
      qualification: QUALIFICATION,
      centre_number: '',
      exam_number: '',
      subject: subject,
      grade: grade,
      year: currentYear.toString(),
    };
    const data = await authFetch(`/subject-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
    return data.data;
  };

  const deleteRecord = async (id: number) => {
    await authFetch(`/subject-records/${id}`, {
      method: 'DELETE',
    });
  };

  const getMLPrediction = async () => {
    const subjects = subjectRecords.map(record => ({
      subject: record.subject,
      grade: record.grade
    }));

    if (subjects.length < 6) {
      addToast(`You need at least 6 subjects (you have ${subjects.length}) to get a prediction`, 'error');
      return false;
    }

    setIsPredicting(true);
    
    try {
      const response = await authFetch('/ml/predict/', {
        method: 'POST',
        body: JSON.stringify({ subjects }),
      });
      
      if (response.success) {
        setMlPrediction({
          success: true,
          average_points: response.average_points,
          prediction: response.prediction,
          probability: response.probability,
          message: response.message,
          using_ml: response.using_ml
        });
        setShowPrediction(true);
        addToast(`Prediction complete! ${response.message}`, 'success');
        return true;
      } else {
        addToast(response.error || 'Prediction failed', 'error');
        return false;
      }
    } catch (err: any) {
      console.error('Prediction error:', err);
      addToast(err.message || 'Failed to get prediction', 'error');
      return false;
    } finally {
      setIsPredicting(false);
    }
  };

  const getMLPredictionAutomatically = async () => {
    const subjects = subjectRecords.map(record => ({
      subject: record.subject,
      grade: record.grade
    }));

    if (subjects.length < 6) {
      setShowPrediction(false);
      setMlPrediction(null);
      return;
    }

    setIsPredicting(true);
    
    try {
      const response = await authFetch('/ml/predict/', {
        method: 'POST',
        body: JSON.stringify({ subjects }),
      });
      
      if (response.success) {
        setMlPrediction({
          success: true,
          average_points: response.average_points,
          prediction: response.prediction,
          probability: response.probability,
          message: response.message,
          using_ml: response.using_ml
        });
        setShowPrediction(true);
      } else {
        setShowPrediction(false);
        setMlPrediction(null);
      }
    } catch (err: any) {
      console.error('Auto prediction error:', err);
      setShowPrediction(false);
      setMlPrediction(null);
    } finally {
      setIsPredicting(false);
    }
  };

  const refreshPrediction = () => {
    if (subjectRecords.length >= 6) {
      getMLPredictionAutomatically();
    }
  };

  const handleAddSubject = async () => {
    if (!selectedSubject) {
      addToast('Please select a subject', 'error');
      return;
    }
    if (!selectedGrade) {
      addToast('Please select a grade', 'error');
      return;
    }
    
    if (subjectRecords.some(r => r.subject === selectedSubject)) {
      addToast(`Subject "${selectedSubject}" has already been added`, 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      const newRecord = await createRecord(selectedSubject, selectedGrade);
      
      const newSubjectRecord: SubjectRecord = {
        id: newRecord.id,
        qualification: QUALIFICATION,
        centre_number: '',
        exam_number: '',
        subject: selectedSubject,
        grade: selectedGrade,
        year: new Date().getFullYear().toString(),
      };
      
      setSubjectRecords(prev => [...prev, newSubjectRecord]);
      setMlPrediction(null);
      setShowPrediction(false);
      setSelectedSubject('');
      setSelectedGrade('');
      
      addToast('Subject added successfully!', 'success');
    } catch (err: any) {
      console.error('Error adding subject:', err);
      addToast(err.message || 'Failed to add subject', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (index: number) => {
    const record = subjectRecords[index];
    setEditForm({
      subject: record.subject,
      grade: record.grade,
      id: record.id || null
    });
    setEditingIndex(index);
    setShowEditModal(true);
  };

  const handleUpdateSubject = async () => {
    if (!editForm.subject) {
      addToast('Please select a subject', 'error');
      return;
    }
    if (!editForm.grade) {
      addToast('Please select a grade', 'error');
      return;
    }
    
    if (editingIndex === null) return;
    
    if (subjectRecords.some((r, i) => i !== editingIndex && r.subject === editForm.subject)) {
      addToast(`Subject "${editForm.subject}" has already been added`, 'error');
      return;
    }
    
    if (!editForm.id) {
      addToast('Cannot update: Record ID not found', 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      await updateRecord(editForm.id, editForm.subject, editForm.grade);
      
      const updatedRecords = [...subjectRecords];
      updatedRecords[editingIndex] = {
        ...updatedRecords[editingIndex],
        subject: editForm.subject,
        grade: editForm.grade,
      };
      
      setSubjectRecords(updatedRecords);
      setMlPrediction(null);
      setShowPrediction(false);
      
      setShowEditModal(false);
      setEditingIndex(null);
      setEditForm({ subject: '', grade: '', id: null });
      addToast('Subject updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error updating subject:', err);
      addToast(err.message || 'Failed to update subject', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (index: number) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;
    
    const record = subjectRecords[deleteIndex];
    
    setSaving(true);
    
    try {
      if (record.id) {
        await deleteRecord(record.id);
      }
      
      const updatedRecords = subjectRecords.filter((_, i) => i !== deleteIndex);
      setSubjectRecords(updatedRecords);
      setMlPrediction(null);
      setShowPrediction(false);
      
      addToast('Subject removed successfully!', 'success');
    } catch (err: any) {
      console.error('Error deleting subject:', err);
      addToast(err.message || 'Failed to delete subject', 'error');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setDeleteIndex(null);
    }
  };

  const handleNext = () => {
    if (subjectRecords.length === 0) {
      addToast('Please add at least one MSCE subject result before continuing', 'error');
      return;
    }
    
    if (subjectRecords.length < 6) {
      addToast(`You need at least 6 subjects to proceed. Currently you have ${subjectRecords.length}. Please add ${6 - subjectRecords.length} more subject(s).`, 'error');
      return;
    }
    
    router.push('/application/program-selection');
  };

  const getGradeDescription = (grade: string) => {
    const gradeInfo = MSCE_GRADES.find(g => g.value === grade);
    return gradeInfo?.description || '';
  };

  const getAdmissionPoint = (grade: string): string => {
    const gradeInfo = MSCE_GRADES.find(g => g.value === grade);
    if (grade === '1') return 'A* (1)';
    if (grade === '2') return 'A (2)';
    if (grade === '3') return 'B (3)';
    if (grade === '4' || grade === '5') return 'C (5)';
    if (grade === '6' || grade === '7') return 'D (7)';
    if (grade === '8' || grade === '9') return 'EFG (8)';
    return 'Not counted';
  };

  const getPredictionColor = (prediction: number) => {
    if (prediction >= 70) return 'text-green-600';
    if (prediction >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (probability: number) => {
    if (probability >= 0.7) return 'bg-green-500';
    if (probability >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const toggleAutoPredict = () => {
    const newValue = !autoPredictEnabled;
    setAutoPredictEnabled(newValue);
    localStorage.setItem('auto_ml_predict', String(newValue));
    
    if (newValue && subjectRecords.length >= 6) {
      refreshPrediction();
    }
    
    addToast(newValue ? 'Auto-prediction enabled' : 'Auto-prediction disabled', 'info');
  };

  const handleViewPrediction = () => {
    if (predictionCardRef.current) {
      predictionCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (subjectRecords.length >= 6) {
      getMLPredictionAutomatically();
      setTimeout(() => {
        if (predictionCardRef.current) {
          predictionCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
    setShowAIPopup(false);
  };

  const handleCancelPopup = () => {
    setShowAIPopup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your MSCE results...</p>
        </div>
      </div>
    );
  }

  const hasEnoughSubjects = subjectRecords.length >= 6;

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
                  : 'bg-blue-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Brain className="w-5 h-5" />
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

        {/* AI Popup */}
        <AnimatePresence>
          {showAIPopup && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Brain className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">AI Admission Prediction</h3>
                    </div>
                    <button
                      onClick={handleCancelPopup}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Our AI model can analyze your MSCE results and predict your chances of admission to various programs.
                    </p>
                    
                    {hasEnoughSubjects ? (
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-purple-700">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-sm font-medium">You have {subjectRecords.length} subjects – ready for analysis!</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-yellow-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Add {6 - subjectRecords.length} more subject(s) to enable AI prediction.</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleCancelPopup}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleViewPrediction}
                        disabled={!hasEnoughSubjects}
                        className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                          hasEnoughSubjects
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Brain className="w-4 h-4" />
                        View Prediction
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-800">MSCE RESULTS</h2>
              </div>
              <div className="flex items-center gap-2">
                {hasEnoughSubjects && (
                  <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">ML Ready ({subjectRecords.length}/6+)</span>
                  </div>
                )}
                <button
                  onClick={toggleAutoPredict}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    autoPredictEnabled 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {autoPredictEnabled ? '🤖 Auto-ML ON' : '🤖 Auto-ML OFF'}
                </button>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Enter all MSCE results exactly as they appear on your certificate. Do not omit any subjects.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Qualifications comparable to O-Level/IGCSE shall be interpreted as follows: 
                <strong> A* = 1; A = 2; B = 3; C = 5; D = 7; EFG = 8.</strong>
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Auto-Prediction Status */}
            {autoPredictEnabled && hasEnoughSubjects && (
              <div className="mb-4 text-center">
                <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  AI predictions update automatically as you add subjects
                </span>
              </div>
            )}

            {/* Warning: Not enough subjects */}
            {!hasEnoughSubjects && subjectRecords.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Need More Subjects</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      You have added {subjectRecords.length} subject(s). You need at least 6 subjects to proceed.
                      Please add {6 - subjectRecords.length} more subject(s).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ML Prediction Card */}
            {hasEnoughSubjects && showPrediction && mlPrediction && (
              <motion.div
                ref={predictionCardRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      {isPredicting ? (
                        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                      ) : (
                        <Brain className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        AI Admission Prediction
                      </h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        ML Powered
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Average Points:</span>
                        <span className="font-bold text-xl text-purple-700">{mlPrediction.average_points?.toFixed(2) || 'N/A'}</span>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-600">Admission Probability:</span>
                          <span className={`font-bold ${getPredictionColor(mlPrediction.prediction)}`}>
                            {mlPrediction.prediction}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressBarColor(mlPrediction.probability)}`}
                            style={{ width: `${mlPrediction.prediction}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">{mlPrediction.message}</p>
                      </div>
                      
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Based on {subjectRecords.length} subjects
                        </span>
                        {mlPrediction.using_ml && (
                          <span className="text-purple-600">✓ Using Machine Learning Model</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Add Subject Form */}
            <div className="bg-gray-50 rounded-lg p-5 mb-8">
              <h3 className="font-medium text-gray-800 mb-4">Add MSCE Result</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <StyledSubjectSelect
                    value={selectedSubject}
                    onChange={setSelectedSubject}
                    options={MSCE_SUBJECTS}
                    placeholder="Select a subject"
                    disabled={saving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <StyledGradeSelect
                    value={selectedGrade}
                    onChange={setSelectedGrade}
                    options={MSCE_GRADES}
                    placeholder="Select grade"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddSubject}
                  disabled={saving || !selectedSubject || !selectedGrade}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Result
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">MSCE Results</h3>
                <span className={`text-sm ${subjectRecords.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                  {subjectRecords.length}/6+ subjects added
                </span>
              </div>
              
              {subjectRecords.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No MSCE Results added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a new record to get started</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">SUBJECT</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">GRADE</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">INTERPRETATION</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subjectRecords.map((record, index) => {
                        const gradeInfo = MSCE_GRADES.find(g => g.value === record.grade);
                        return (
                          <tr key={record.id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-800 font-medium">{record.subject}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeInfo?.color || 'bg-gray-100 text-gray-800'}`}>
                                {record.grade}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-sm">{getAdmissionPoint(record.grade)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => openEditModal(index)}
                                  disabled={saving}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(index)}
                                  disabled={saving}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {hasEnoughSubjects && (
                    <div className="bg-purple-50 px-4 py-2 text-right">
                      <span className="text-xs text-purple-600 flex items-center justify-end gap-1">
                        <Sparkles className="w-3 h-3" />
                        Auto-ML analysis active - Prediction updates automatically
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Continue Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleNext}
                disabled={!hasEnoughSubjects || subjectRecords.length === 0}
                className={`px-8 py-3 rounded-lg flex items-center gap-2 font-medium ${
                  hasEnoughSubjects && subjectRecords.length > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-green-500" />
            Add all your MSCE subjects and results. You need at least 6 subjects to proceed.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            🤖 AI predictions update automatically when Auto-ML is enabled (default)
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Edit Subject Result</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingIndex(null);
                    setEditForm({ subject: '', grade: '', id: null });
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <StyledSubjectSelect
                    value={editForm.subject}
                    onChange={(val) => setEditForm(prev => ({ ...prev, subject: val }))}
                    options={MSCE_SUBJECTS}
                    placeholder="Select subject"
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <StyledGradeSelect
                    value={editForm.grade}
                    onChange={(val) => setEditForm(prev => ({ ...prev, grade: val }))}
                    options={MSCE_GRADES}
                    placeholder="Select grade"
                    disabled={saving}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingIndex(null);
                    setEditForm({ subject: '', grade: '', id: null });
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
            >
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
                  Are you sure you want to remove this subject?
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}