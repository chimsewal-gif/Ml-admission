'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, Edit3, Save, ArrowRight, AlertCircle, CheckCircle, X, Sparkles, Brain, TrendingUp, Shield, Loader2 } from 'lucide-react';

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

// Fixed to MSCE only
const QUALIFICATION = 'MSCE (Malawi School Certificate of Education)';

// MSCE Subjects only
const MSCE_SUBJECTS = [
  'English',
  'Chichewa',
  'Mathematics',
  'Physical Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Geography',
  'History',
  'Social Studies',
  'Bible Knowledge',
  'Life Skills',
  'Agriculture',
  'Home Economics',
  'Commerce',
  'Accounts',
  'Computer Studies',
  'French',
  'German',
  'Portuguese',
  'Arabic'
];

// MSCE Grades only
const MSCE_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'U'];

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function MSCEResultsPage() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // ML Prediction state
  const [isPredicting, setIsPredicting] = useState(false);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [autoPredictEnabled, setAutoPredictEnabled] = useState(true);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  
  // Form state for editing
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

  // Remove toast
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
    
    // Load auto predict preference
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

  // Auto-predict when subjects change and we have enough subjects
  useEffect(() => {
    if (autoPredictEnabled && subjectRecords.length >= 6 && !isPredicting && !showPrediction) {
      // Debounce the prediction to avoid too many API calls
      const timer = setTimeout(() => {
        getMLPredictionAutomatically();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [subjectRecords, autoPredictEnabled]);

  const fetchSubjectRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authFetch('/subject-records');
      const records = data.data || data || [];
      const msceRecords = records.filter((r: any) => r.qualification === QUALIFICATION);
      setSubjectRecords(msceRecords);
    } catch (err: any) {
      console.error('Error fetching subject records:', err);
      setError(err.message || 'Failed to load subject records');
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

  // ML Prediction function - manual trigger
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

  // Auto ML Prediction - silent, no toast on success
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

  // Refresh prediction after data changes
  const refreshPrediction = () => {
    if (subjectRecords.length >= 6) {
      getMLPredictionAutomatically();
    }
  };

  const handleAddSubject = async () => {
    const formSubject = (document.getElementById('addSubject') as HTMLSelectElement)?.value;
    const formGrade = (document.getElementById('addGrade') as HTMLSelectElement)?.value;
    
    if (!formSubject) {
      addToast('Please select a subject', 'error');
      return;
    }
    if (!formGrade) {
      addToast('Please select a grade', 'error');
      return;
    }
    
    if (subjectRecords.some(r => r.subject === formSubject)) {
      addToast(`Subject "${formSubject}" has already been added`, 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      const newRecord = await createRecord(formSubject, formGrade);
      
      const newSubjectRecord: SubjectRecord = {
        id: newRecord.id,
        qualification: QUALIFICATION,
        centre_number: '',
        exam_number: '',
        subject: formSubject,
        grade: formGrade,
        year: new Date().getFullYear().toString(),
      };
      
      const updatedRecords = [...subjectRecords, newSubjectRecord];
      setSubjectRecords(updatedRecords);
      
      // Clear prediction when subjects change (will auto-recalculate)
      setMlPrediction(null);
      setShowPrediction(false);
      
      // Reset select values
      const subjectSelect = document.getElementById('addSubject') as HTMLSelectElement;
      const gradeSelect = document.getElementById('addGrade') as HTMLSelectElement;
      if (subjectSelect) subjectSelect.value = '';
      if (gradeSelect) gradeSelect.value = '';
      
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
      
      // Clear prediction when subjects change (will auto-recalculate)
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
      
      // Clear prediction when subjects change (will auto-recalculate)
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
    
    router.push('/application/teacher-subjects');
  };

  const getGradeDescription = (grade: string) => {
    const descriptions: Record<string, string> = {
      '1': 'Excellent',
      '2': 'Very Good',
      '3': 'Good',
      '4': 'Credit',
      '5': 'Credit',
      '6': 'Pass',
      '7': 'Pass',
      '8': 'Weak Pass',
      '9': 'Fail',
      'U': 'Ungraded'
    };
    return descriptions[grade] || '';
  };

  const getAdmissionPoint = (grade: string): string => {
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

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-gray-700" />
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

            {/* ML Prediction Card - Shows automatically when enough subjects */}
            {hasEnoughSubjects && showPrediction && mlPrediction && (
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5">
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
                        AI Admission Prediction (Auto-Updating)
                      </h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        ML Powered
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Average Points */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Average Points:</span>
                        <span className="font-bold text-xl text-purple-700">{mlPrediction.average_points?.toFixed(2) || 'N/A'}</span>
                      </div>
                      
                      {/* Success Probability */}
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
                      
                      {/* Message */}
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
              </div>
            )}

            {/* Manual Prediction Button - Only show if auto-predict is off */}
            {!autoPredictEnabled && hasEnoughSubjects && !showPrediction && (
              <div className="mb-6">
                <button
                  onClick={getMLPrediction}
                  disabled={isPredicting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Get AI Admission Prediction
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  AI analyzes your MSCE results to predict admission chances
                </p>
              </div>
            )}

            {/* Add Subject Form - Inline */}
            <div className="bg-gray-50 rounded-lg p-5 mb-8">
              <h3 className="font-medium text-gray-800 mb-4">Add MSCE Result</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    id="addSubject"
                    disabled={saving}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white disabled:bg-gray-100"
                  >
                    <option value="">Select Subject</option>
                    {MSCE_SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                  <select
                    id="addGrade"
                    disabled={saving}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white disabled:bg-gray-100"
                  >
                    <option value="">Select Grade</option>
                    {MSCE_GRADES.map(grade => (
                      <option key={grade} value={grade}>
                        {grade} - {getGradeDescription(grade)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAddSubject}
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
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
                      {subjectRecords.map((record, index) => (
                        <tr key={record.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-800 font-medium">{record.subject}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                      ))}
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
            
            {/* Help text if insufficient subjects */}
            {!hasEnoughSubjects && subjectRecords.length > 0 && (
              <p className="text-sm text-red-500 text-center mt-4">
                You need {6 - subjectRecords.length} more subject(s) to proceed
              </p>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Add all your MSCE subjects and results. You need at least 6 subjects to proceed.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            🤖 AI predictions update automatically when Auto-ML is enabled (default)
          </p>
        </div>
      </div>

      {/* Edit Modal - Fixed transparent background */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
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
                <select
                  value={editForm.subject}
                  onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="">Select Subject</option>
                  {MSCE_SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select
                  value={editForm.grade}
                  onChange={(e) => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="">Select Grade</option>
                  {MSCE_GRADES.map(grade => (
                    <option key={grade} value={grade}>
                      {grade} - {getGradeDescription(grade)}
                    </option>
                  ))}
                </select>
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Fixed transparent background */}
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
          </div>
        </div>
      )}
    </div>
  );
}