// app/commitee/application-window/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  Settings,
  Bell,
  Users,
  FileText,
  TrendingUp,
  Shield,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Send,
  Zap,
  Sparkles,
  Lock,
  Unlock,
  History,
  Award,
  Target,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Types matching Django backend response
interface ApplicationWindow {
  id: number;
  academic_year: string;
  intake_period: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  programmes_offered: string[];
  max_applications: number;
  current_applications: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface ApplicationStats {
  total_applications: number;
  pending_review: number;
  approved: number;
  rejected: number;
  completion_rate: number;
  average_score: number;
  active_windows_count: number;
}

interface ApplicationWindowFormData {
  academic_year: string;
  intake_period: string;
  start_date: string;
  end_date: string;
  programmes_offered: string[];
  max_applications: number;
}

const INTAKE_PERIODS = [
  'January Intake',
  'April Intake',
  'September Intake',
  'Summer Intake',
  'Winter Intake'
];

const PROGRAMMES = [
  'Bachelor of Medicine',
  'Bachelor of Surgery',
  'Bachelor of Science in Computer Science',
  'Bachelor of Business Administration',
  'Bachelor of Laws (LLB)',
  'Bachelor of Engineering',
  'Bachelor of Economics',
  'Bachelor of Nursing',
  'Bachelor of Pharmacy',
  'Bachelor of Education',
  'Master of Business Administration',
  'Master of Science in Computer Science',
  'Master of Public Health',
  'Master of Laws (LLM)',
  'Doctor of Philosophy (PhD)'
];

export default function ApplicationWindowPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeWindows, setActiveWindows] = useState<ApplicationWindow[]>([]);
  const [pastWindows, setPastWindows] = useState<ApplicationWindow[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState<ApplicationWindow | null>(null);
  const [editingWindow, setEditingWindow] = useState<ApplicationWindow | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ApplicationWindow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'past' | 'settings'>('current');

  // Form state
  const [formData, setFormData] = useState<ApplicationWindowFormData>({
    academic_year: new Date().getFullYear().toString(),
    intake_period: 'September Intake',
    start_date: '',
    end_date: '',
    programmes_offered: [],
    max_applications: 1000
  });

  // Helper functions
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const getUser = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  const apiClient = () => {
    const token = getToken();
    if (!token) return null;
    return axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  };

  // Fetch application windows
  const fetchApplicationWindows = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const client = apiClient();
      if (!client) {
        router.push('/login');
        return;
      }

      // Fetch all windows
      const allRes = await client.get('/application-windows/');
      
      if (allRes.data.success) {
        const allWindows = allRes.data.data || [];
        // Split into active and past windows
        const active = allWindows.filter((w: ApplicationWindow) => w.is_open === true);
        const past = allWindows.filter((w: ApplicationWindow) => w.is_open === false);
        setActiveWindows(active);
        setPastWindows(past);
      }
      
      // Fetch stats
      const statsRes = await client.get('/application-windows/stats/');
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      
    } catch (err: any) {
      console.error('Error fetching application windows:', err);
      setError(err.response?.data?.message || 'Failed to load application windows');
    } finally {
      setLoading(false);
    }
  };

  // Create new application window
  const createApplicationWindow = async () => {
    if (!formData.start_date || !formData.end_date) {
      setError('Please select start and end dates');
      return;
    }
    
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('End date must be after start date');
      return;
    }
    
    if (formData.programmes_offered.length === 0) {
      setError('Please select at least one programme');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const client = apiClient();
      if (!client) {
        router.push('/login');
        return;
      }
      
      const user = getUser();
      const payload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        created_by: user?.first_name ? `${user.first_name} ${user.last_name}` : 'Admin User'
      };
      
      const res = await client.post('/application-windows/', payload);
      
      if (res.data.success || res.data.id) {
        setSuccess('Application window created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchApplicationWindows();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(res.data.message || 'Failed to create application window');
      }
      
    } catch (err: any) {
      console.error('Error creating window:', err);
      setError(err.response?.data?.message || 'Failed to create application window');
    } finally {
      setSaving(false);
    }
  };

  // Update application window
  const updateApplicationWindow = async () => {
    if (!editingWindow) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const client = apiClient();
      if (!client) {
        router.push('/login');
        return;
      }
      
      const res = await client.put(`/application-windows/${editingWindow.id}/`, {
        academic_year: editingWindow.academic_year,
        intake_period: editingWindow.intake_period,
        start_date: new Date(editingWindow.start_date).toISOString(),
        end_date: new Date(editingWindow.end_date).toISOString(),
        programmes_offered: editingWindow.programmes_offered,
        max_applications: editingWindow.max_applications,
        is_active: true
      });
      
      if (res.data.success || res.data.id) {
        setSuccess('Application window updated successfully!');
        setEditingWindow(null);
        fetchApplicationWindows();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(res.data.message || 'Failed to update application window');
      }
      
    } catch (err: any) {
      console.error('Error updating window:', err);
      setError(err.response?.data?.message || 'Failed to update application window');
    } finally {
      setSaving(false);
    }
  };

  // Toggle window status (open/close)
  const toggleWindowStatus = async (window: ApplicationWindow) => {
    setSaving(true);
    setError(null);
    
    try {
      const client = apiClient();
      if (!client) {
        router.push('/login');
        return;
      }
      
      const newStatus = !window.is_open;
      const res = await client.patch(`/application-windows/${window.id}/toggle/`, {
        is_open: newStatus
      });
      
      if (res.data.success) {
        setSuccess(`Application window ${newStatus ? 'opened' : 'closed'} successfully!`);
        fetchApplicationWindows();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(res.data.message || 'Failed to toggle window status');
      }
      
    } catch (err: any) {
      console.error('Error toggling window:', err);
      setError(err.response?.data?.message || 'Failed to toggle window status');
    } finally {
      setSaving(false);
    }
  };

  // Delete application window
  const deleteApplicationWindow = async () => {
    if (!showDeleteConfirm) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const client = apiClient();
      if (!client) {
        router.push('/login');
        return;
      }
      
      const res = await client.delete(`/application-windows/${showDeleteConfirm.id}/`);
      
      if (res.data.success) {
        setSuccess('Application window deleted successfully!');
        setShowDeleteConfirm(null);
        fetchApplicationWindows();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(res.data.message || 'Failed to delete application window');
      }
      
    } catch (err: any) {
      console.error('Error deleting window:', err);
      setError(err.response?.data?.message || 'Failed to delete application window');
    } finally {
      setSaving(false);
    }
  };

  // Send notifications about window opening/closing
  const sendWindowNotification = async (window: ApplicationWindow, action: 'open' | 'close') => {
    setSaving(true);
    
    try {
      const client = apiClient();
      if (!client) return;
      
      await client.post('/application-windows/notify/', {
        window_id: window.id,
        action: action,
        message: action === 'open' 
          ? `The application window for ${window.intake_period} ${window.academic_year} is now OPEN. Apply now!`
          : `The application window for ${window.intake_period} ${window.academic_year} has CLOSED. Thank you for your applications.`
      });
      
      setSuccess(`Notification sent to all applicants about window ${action}`);
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err) {
      console.error('Error sending notification:', err);
      setError('Failed to send notifications. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      academic_year: new Date().getFullYear().toString(),
      intake_period: 'September Intake',
      start_date: '',
      end_date: '',
      programmes_offered: [],
      max_applications: 1000
    });
  };

  const handleProgrammeToggle = (programme: string) => {
    setFormData(prev => ({
      ...prev,
      programmes_offered: prev.programmes_offered.includes(programme)
        ? prev.programmes_offered.filter(p => p !== programme)
        : [...prev.programmes_offered, programme]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    setToken(token);
    fetchApplicationWindows();
  }, []);

  // Filter windows based on search
  const filteredActiveWindows = activeWindows.filter(window =>
    window.intake_period.toLowerCase().includes(searchQuery.toLowerCase()) ||
    window.academic_year.includes(searchQuery)
  );
  
  const filteredPastWindows = pastWindows.filter(window =>
    window.intake_period.toLowerCase().includes(searchQuery.toLowerCase()) ||
    window.academic_year.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Application Window Manager</h1>
                  <p className="text-gray-600 mt-1">Control and manage application intake periods</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all"
            >
              <Plus className="w-5 h-5" />
              Create New Window
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_applications}</p>
                  <p className="text-xs text-gray-500">Total Applications</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_review}</p>
                  <p className="text-xs text-gray-500">Pending Review</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  <p className="text-xs text-gray-500">Rejected</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.completion_rate}%</p>
                  <p className="text-xs text-gray-500">Completion Rate</p>
                </div>
                <Target className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-indigo-600">{stats.average_score}%</p>
                  <p className="text-xs text-gray-500">Avg. Score</p>
                </div>
                <Award className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('current')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'current'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Current Windows
                  {activeWindows.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                      {activeWindows.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'past'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Past Windows
                </div>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </div>
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by intake period or academic year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Current Windows Tab */}
          {activeTab === 'current' && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-gray-500">Loading application windows...</p>
                </div>
              ) : filteredActiveWindows.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Windows</h3>
                  <p className="text-gray-500 mb-4">There are currently no open application windows.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Window
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredActiveWindows.map((window) => {
                    const daysRemaining = getDaysRemaining(window.end_date);
                    const isExpiringSoon = daysRemaining <= 7;
                    const fillRate = (window.current_applications / window.max_applications) * 100;
                    
                    return (
                      <div key={window.id} className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`p-4 ${window.is_open ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {window.is_open ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    OPEN
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                    <Lock className="w-3 h-3" />
                                    CLOSED
                                  </span>
                                )}
                                {isExpiringSoon && window.is_open && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                    <Clock className="w-3 h-3" />
                                    Expires Soon
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {window.intake_period} {window.academic_year}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Created by {window.created_by || 'Admin'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingWindow(window)}
                                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                title="Edit Window"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleWindowStatus(window)}
                                disabled={saving}
                                className={`p-2 rounded-lg transition-colors ${
                                  window.is_open
                                    ? 'text-red-500 hover:bg-red-50'
                                    : 'text-green-500 hover:bg-green-50'
                                }`}
                                title={window.is_open ? 'Close Window' : 'Open Window'}
                              >
                                {window.is_open ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(window)}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Delete Window"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 space-y-4">
                          {/* Date Range */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Start Date</p>
                              <p className="text-sm font-medium text-gray-900">{formatDate(window.start_date)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">End Date</p>
                              <p className="text-sm font-medium text-gray-900">{formatDate(window.end_date)}</p>
                              {window.is_open && (
                                <p className="text-xs mt-1 text-orange-600">{daysRemaining} days remaining</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Capacity Progress */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Capacity</span>
                              <span className="text-gray-900 font-medium">
                                {window.current_applications} / {window.max_applications}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  fillRate > 90 ? 'bg-red-500' : fillRate > 70 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(fillRate, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{Math.round(fillRate)}% filled</p>
                          </div>
                          
                          {/* Programmes */}
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Programmes Offered</p>
                            <div className="flex flex-wrap gap-1">
                              {window.programmes_offered.slice(0, 3).map((prog, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {prog}
                                </span>
                              ))}
                              {window.programmes_offered.length > 3 && (
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                                  +{window.programmes_offered.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={() => sendWindowNotification(window, 'open')}
                              disabled={saving}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              <Mail className="w-4 h-4" />
                              Notify Applicants
                            </button>
                            <button
                              onClick={() => window.is_open && sendWindowNotification(window, 'close')}
                              disabled={!window.is_open || saving}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Bell className="w-4 h-4" />
                              Remind Applicants
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Past Windows Tab */}
          {activeTab === 'past' && (
            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                  <p className="text-gray-500">Loading past windows...</p>
                </div>
              ) : filteredPastWindows.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Windows</h3>
                  <p className="text-gray-500">No closed application windows found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPastWindows.map((window) => (
                    <div key={window.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                              <Lock className="w-3 h-3" />
                              CLOSED
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {window.intake_period} {window.academic_year}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(window.start_date)} - {formatDate(window.end_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{window.current_applications}</p>
                            <p className="text-xs text-gray-500">Applications Received</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {Math.round((window.current_applications / window.max_applications) * 100)}%
                            </p>
                            <p className="text-xs text-gray-500">Fill Rate</p>
                          </div>
                          <button
                            onClick={() => setSelectedWindow(window)}
                            className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                          >
                            View Report
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Default Settings Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Max Applications
                      </label>
                      <input
                        type="number"
                        defaultValue={1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum number of applications accepted per window</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Default Intake Periods
                      </label>
                      <div className="space-y-2">
                        {INTAKE_PERIODS.map(period => (
                          <label key={period} className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked={period === 'September Intake'} className="rounded text-green-600" />
                            <span className="text-sm text-gray-700">{period}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Auto-Closing Rules
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded text-green-600" />
                          <span className="text-sm text-gray-700">Auto-close window when capacity is reached</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded text-green-600" />
                          <span className="text-sm text-gray-700">Send reminder 7 days before closing</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded text-green-600" />
                          <span className="text-sm text-gray-700">Auto-notify applicants when window opens/closes</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Save Settings
                    </button>
                  </div>
                </div>
                
                {/* Notification Templates */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Templates</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Window Opening Template</label>
                      <textarea
                        rows={3}
                        defaultValue="Dear Applicant,

The application window for {intake_period} {academic_year} is now OPEN.
Apply before {end_date} to be considered.

Best regards,
Admissions Office"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Window Closing Reminder</label>
                      <textarea
                        rows={3}
                        defaultValue="Dear Applicant,

REMINDER: The application window for {intake_period} {academic_year} will close on {end_date}.
Please submit your application before the deadline.

Best regards,
Admissions Office"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-bold text-gray-900">Create Application Window</h2>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={formData.academic_year}
                      onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                      placeholder="e.g., 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intake Period</label>
                    <select
                      value={formData.intake_period}
                      onChange={(e) => setFormData({...formData, intake_period: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {INTAKE_PERIODS.map(period => (
                        <option key={period} value={period}>{period}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Applications</label>
                  <input
                    type="number"
                    value={formData.max_applications}
                    onChange={(e) => setFormData({...formData, max_applications: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Programmes Offered</label>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    <div className="space-y-2">
                      {PROGRAMMES.map(programme => (
                        <label key={programme} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.programmes_offered.includes(programme)}
                            onChange={() => handleProgrammeToggle(programme)}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{programme}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createApplicationWindow}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Create Window
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingWindow && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Edit Application Window</h2>
                <button onClick={() => setEditingWindow(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                    <input
                      type="text"
                      value={editingWindow.academic_year}
                      onChange={(e) => setEditingWindow({...editingWindow, academic_year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intake Period</label>
                    <select
                      value={editingWindow.intake_period}
                      onChange={(e) => setEditingWindow({...editingWindow, intake_period: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {INTAKE_PERIODS.map(period => (
                        <option key={period} value={period}>{period}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editingWindow.start_date.split('T')[0]}
                      onChange={(e) => setEditingWindow({...editingWindow, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={editingWindow.end_date.split('T')[0]}
                      onChange={(e) => setEditingWindow({...editingWindow, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Applications</label>
                  <input
                    type="number"
                    value={editingWindow.max_applications}
                    onChange={(e) => setEditingWindow({...editingWindow, max_applications: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Programmes Offered</label>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    <div className="space-y-2">
                      {PROGRAMMES.map(programme => (
                        <label key={programme} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingWindow.programmes_offered.includes(programme)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditingWindow({
                                  ...editingWindow,
                                  programmes_offered: [...editingWindow.programmes_offered, programme]
                                });
                              } else {
                                setEditingWindow({
                                  ...editingWindow,
                                  programmes_offered: editingWindow.programmes_offered.filter(p => p !== programme)
                                });
                              }
                            }}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{programme}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setEditingWindow(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={updateApplicationWindow}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete the application window for <br />
                  <strong>{showDeleteConfirm.intake_period} {showDeleteConfirm.academic_year}</strong>?
                </p>
                <p className="text-sm text-red-600 mb-6">This action cannot be undone.</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteApplicationWindow}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {saving ? 'Deleting...' : 'Delete Window'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}