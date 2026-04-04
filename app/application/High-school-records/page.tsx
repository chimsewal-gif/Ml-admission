'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Trash2, Edit3, Save, ArrowRight } from 'lucide-react';
import ProgressIndicator from '@/componets/ProgressIndicator';
import Button2 from '@/componets/Button2';

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

const QUALIFICATION_OPTIONS = [
  'MSCE (Malawi School Certificate of Education)',
  'JCE (Junior Certificate of Education)',
  'O-Level',
  'A-Level',
  'IGCSE',
  'Other'
];

// Malawian Curriculum Subjects
const MALAWI_SUBJECTS = {
  'MSCE (Malawi School Certificate of Education)': [
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
  ],
  'JCE (Junior Certificate of Education)': [
    'English',
    'Chichewa',
    'Mathematics',
    'General Science',
    'Social Studies',
    'Life Skills',
    'Agriculture',
    'Home Economics',
    'Bible Knowledge',
    'French',
    'Computer Studies'
  ],
  'O-Level': [
    'English Language',
    'English Literature',
    'Mathematics',
    'Additional Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Geography',
    'History',
    'Commerce',
    'Accounts',
    'Economics',
    'Business Studies',
    'Computer Science',
    'French',
    'German',
    'Portuguese',
    'Arabic',
    'Religious Studies',
    'Art and Design'
  ],
  'A-Level': [
    'General Paper',
    'Mathematics',
    'Further Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Geography',
    'History',
    'Economics',
    'Business Studies',
    'Accounts',
    'Computer Science',
    'French',
    'German',
    'Portuguese',
    'Literature in English'
  ],
  'IGCSE': [
    'English First Language',
    'English Second Language',
    'Mathematics',
    'Additional Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Geography',
    'History',
    'Economics',
    'Business Studies',
    'Accounting',
    'Computer Science',
    'Information Technology',
    'French',
    'German',
    'Spanish',
    'Arabic',
    'Art and Design'
  ],
  'Other': [
    'English',
    'Mathematics',
    'Science',
    'Social Studies',
    'Other'
  ]
};

const GRADE_OPTIONS = {
  'MSCE (Malawi School Certificate of Education)': ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'U'],
  'JCE (Junior Certificate of Education)': ['1', '2', '3', '4', '5', '6', 'U'],
  'O-Level': ['A*', 'A', 'B', 'C', 'D', 'E', 'U'],
  'A-Level': ['A', 'B', 'C', 'D', 'E', 'U'],
  'IGCSE': ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'U'],
  'Other': ['A*', 'A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Distinction', 'Merit', 'Pass', 'Fail']
};

export default function HighSchoolRecordsPage() {
  const router = useRouter();
  
  // Get token from localStorage instead of Cookies
  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subjectRecords, setSubjectRecords] = useState<SubjectRecord[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<SubjectRecord>({
    qualification: 'MSCE (Malawi School Certificate of Education)',
    centre_number: '',
    exam_number: '',
    subject: '',
    grade: '',
    year: new Date().getFullYear().toString(),
  });

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  // Check for token on mount
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
      Accept: 'application/json',
      Authorization: `Bearer ${currentToken}`,
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

  useEffect(() => {
    // Update available subjects and grades when qualification changes
    const subjects = MALAWI_SUBJECTS[form.qualification as keyof typeof MALAWI_SUBJECTS] || [];
    const grades = GRADE_OPTIONS[form.qualification as keyof typeof GRADE_OPTIONS] || [];
    
    setAvailableSubjects(subjects);
    setAvailableGrades(grades);

    // Reset subject and grade when qualification changes
    if (!subjects.includes(form.subject)) {
      setForm(prev => ({ ...prev, subject: '', grade: '' }));
    } else if (!grades.includes(form.grade)) {
      setForm(prev => ({ ...prev, grade: '' }));
    }
  }, [form.qualification]);

  const fetchSubjectRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authFetch('/subject-records');
      setSubjectRecords(data.data || data || []);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      qualification: 'MSCE (Malawi School Certificate of Education)',
      centre_number: '',
      exam_number: '',
      subject: '',
      grade: '',
      year: new Date().getFullYear().toString(),
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!form.qualification || !form.centre_number || !form.exam_number || !form.subject || !form.grade || !form.year) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    const examYear = parseInt(form.year);
    if (examYear < 1950 || examYear > currentYear + 1) {
      setError('Please enter a valid exam year');
      return;
    }

    try {
      setSaving(true);
      
      if (editingId) {
        // Update existing record
        await authFetch(`/subject-records/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        setSuccess('Subject record updated successfully');
      } else {
        // Create new record
        await authFetch('/subject-records', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        setSuccess('Subject record added successfully');
      }

      resetForm();
      await fetchSubjectRecords(); // Refresh the list
    } catch (err: any) {
      console.error('Error saving subject record:', err);
      setError(err.message || 'Failed to save subject record');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: SubjectRecord) => {
    setForm(record);
    setEditingId(record.id || null);
    setError(null);
    setSuccess(null);
    
    // Scroll to form
    document.getElementById('subject-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subject record?')) return;

    try {
      setError(null);
      await authFetch(`/subject-records/${id}`, {
        method: 'DELETE',
      });
      setSuccess('Subject record deleted successfully');
      await fetchSubjectRecords(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting subject record:', err);
      setError(err.message || 'Failed to delete subject record');
    }
  };

  const handleNext = () => {
    if (subjectRecords.length === 0) {
      setError('Please add at least one subject record before continuing');
      return;
    }
    router.push('/application/program-selection');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your academic records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={6} />

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  High School Records
                </h1>
                <p className="text-green-100 text-lg">
                  Step 3 of 4 - Add your Malawian high school qualifications
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Section */}
              <div id="subject-form">
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    {editingId ? 'Edit Subject Record' : 'Add New Subject'}
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Qualification */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Qualification *
                        </label>
                        <select
                          name="qualification"
                          value={form.qualification}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                        >
                          {QUALIFICATION_OPTIONS.map(qual => (
                            <option key={qual} value={qual}>{qual}</option>
                          ))}
                        </select>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Subject *
                        </label>
                        <select
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                        >
                          <option value="">Select Subject</option>
                          {availableSubjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                      </div>

                      {/* Grade */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Grade *
                        </label>
                        <select
                          name="grade"
                          value={form.grade}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
                        >
                          <option value="">Select Grade</option>
                          {availableGrades.map(grade => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Year */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Exam Year *
                          </label>
                          <input
                            type="number"
                            name="year"
                            value={form.year}
                            onChange={handleChange}
                            required
                            min="1950"
                            max={new Date().getFullYear() + 1}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                            placeholder="e.g., 2023"
                          />
                        </div>

                        {/* Centre Number */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Centre Number *
                          </label>
                          <input
                            type="text"
                            name="centre_number"
                            value={form.centre_number}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                            placeholder="e.g., UG123"
                          />
                        </div>
                      </div>

                      {/* Exam Number */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Exam Number *
                        </label>
                        <input
                          type="text"
                          name="exam_number"
                          value={form.exam_number}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                          placeholder="Your examination number"
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button2
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            {editingId ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            {editingId ? 'Update Record' : 'Add Subject'}
                          </div>
                        )}
                      </Button2>
                      
                      {editingId && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Records List */}
              <div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      Your Subject Records
                    </h2>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {subjectRecords.length} records
                    </span>
                  </div>

                  {subjectRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No subject records yet</p>
                      <p className="text-gray-400 text-sm">
                        Add your first subject record using the form
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {subjectRecords.map((record) => (
                        <div
                          key={record.id}
                          className="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-800">
                                  {record.subject}
                                </h3>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {record.grade}
                                </span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                  {record.qualification}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Year:</span> {record.year}
                                </div>
                                <div>
                                  <span className="font-medium">Centre:</span> {record.centre_number}
                                </div>
                                <div>
                                  <span className="font-medium">Exam No:</span> {record.exam_number}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEdit(record)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="Edit record"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id!)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete record"
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

                {/* Next Button */}
                {subjectRecords.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <Button2
                      onClick={handleNext}
                      className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <div className="flex items-center justify-center">
                        Continue to Program Selection
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </div>
                    </Button2>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Add all your Malawian high school subjects and qualifications. Fields marked with * are required.
          </p>
        </div>
      </div>
    </div>
  );
}