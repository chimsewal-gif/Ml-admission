'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, Edit3, Save, ArrowRight, AlertCircle, CheckCircle, X } from 'lucide-react';

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
  type: 'success' | 'error';
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
  const addToast = (message: string, type: 'success' | 'error') => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">MSCE RESULTS</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Enter all MSCE results exactly as they appear on your certificate. Do not omit any subjects.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Qualifications comparable to O-Level/IGCSE shall be interpreted as follows for purposes of admission: 
                <strong> A* = 1; A = 2; B = 3; C = 5; D = 7; EFG = 8.</strong>
              </p>
            </div>
          </div>

          <div className="p-6">
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
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
                <span className="text-sm text-gray-500">{subjectRecords.length} subjects added</span>
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
                        <tr key={record.id || index} className="hover:bg-gray-50 transition-colors">
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
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(index)}
                                disabled={saving}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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

            {/* Continue Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Add all your MSCE subjects and results. Select subject and grade to add to your record.
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Edit Subject Result</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingIndex(null);
                  setEditForm({ subject: '', grade: '', id: null });
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubject}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteIndex(null);
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