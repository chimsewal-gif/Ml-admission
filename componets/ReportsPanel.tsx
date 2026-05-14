'use client';

import { useState, useEffect } from 'react';
import {
  Download, FileText, TrendingUp, Loader, RefreshCw, AlertCircle,
  Calendar, History, BarChart3, Eye, TrendingDown, Minus,
  Brain, PieChart, Activity, Target, Clock, Zap, Users,
  CheckCircle, XCircle, ThumbsUp, ThumbsDown, Award, Trophy,
  Home, ChevronRight, Printer, Filter, Settings, Building2,
  GraduationCap, BookOpen, Shield, Sparkles, Medal, Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Advanced Analytics Types
interface MLPerformanceMetrics {
  overall_accuracy: number;
  overall_precision: number;
  overall_recall: number;
  overall_f1_score: number;
  by_programme: ProgrammeMetrics[];
  confusion_matrix: {
    true_positives: number;
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
  };
}

interface ProgrammeMetrics {
  programme_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  samples: number;
}

interface RejectionDistribution {
  reason: string;
  count: number;
  percentage: number;
  icon: string;
}

interface VolumeData {
  date: string;
  applications: number;
  approvals: number;
  rejections: number;
  pending: number;
}

interface ProgrammeDemand {
  name: string;
  applicants: number;
  capacity: number;
  fill_rate: number;
  avg_score: number;
}

interface ProcessingStats {
  auto_approved: number;
  auto_rejected: number;
  manual_approved: number;
  manual_rejected: number;
  pending_review: number;
  auto_processing_rate: number;
  manual_review_rate: number;
}

interface ReportStats {
  totalApplicants: number;
  totalApplications: number;
  totalFees: number;
  totalProgrammes: number;
}

// API Client with auth
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
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
      'Accept': 'application/json',
    }
  });
};

export default function ReportsPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'ml_metrics' | 'rejections' | 'volume' | 'demand' | 'auto_processing'>('overview');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);

  // Advanced Analytics State
  const [mlMetrics, setMlMetrics] = useState<MLPerformanceMetrics | null>(null);
  const [rejectionDist, setRejectionDist] = useState<RejectionDistribution[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [programmeDemand, setProgrammeDemand] = useState<ProgrammeDemand[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Fetch dashboard stats
  const fetchStats = async () => {
    const token = getToken();
    if (!token) {
      setError('Please login to view reports');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const client = apiClient();
      if (!client) {
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      const response = await client.get('/dashboard/stats/');

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Unable to load report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch ML performance metrics
  const fetchMLMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const client = apiClient();
      if (!client) return;

      const response = await client.get('/analytics/ml-performance/');
      if (response.data.success && response.data.data) {
        setMlMetrics(response.data.data);
      } else {
        console.log('No ML metrics available');
        setMlMetrics(null);
      }
    } catch (err) {
      console.error('Error fetching ML metrics:', err);
      setMlMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Fetch rejection distribution
  const fetchRejectionDistribution = async () => {
    try {
      const client = apiClient();
      if (!client) return;

      const response = await client.get('/analytics/rejection-distribution/');
      if (response.data.success) {
        setRejectionDist(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching rejection distribution:', err);
      setRejectionDist([]);
    }
  };

  // Fetch volume trends
  const fetchVolumeTrends = async () => {
    try {
      const client = apiClient();
      if (!client) return;

      const response = await client.get('/analytics/volume-trends/');
      if (response.data.success) {
        setVolumeData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching volume trends:', err);
      setVolumeData([]);
    }
  };

  // Fetch programme demand
  const fetchProgrammeDemand = async () => {
    try {
      const client = apiClient();
      if (!client) return;

      const response = await client.get('/analytics/programme-demand/');
      if (response.data.success) {
        setProgrammeDemand(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching programme demand:', err);
      setProgrammeDemand([]);
    }
  };

  // Fetch processing stats
  const fetchProcessingStats = async () => {
    try {
      const client = apiClient();
      if (!client) return;

      const response = await client.get('/analytics/processing-stats/');
      if (response.data.success) {
        setProcessingStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching processing stats:', err);
      setProcessingStats(null);
    }
  };

  // Fetch all analytics data
  const fetchAllAnalytics = async () => {
    await Promise.all([
      fetchMLMetrics(),
      fetchRejectionDistribution(),
      fetchVolumeTrends(),
      fetchProgrammeDemand(),
      fetchProcessingStats()
    ]);
  };

  // Refresh all data
  const handleRefresh = async () => {
    await fetchStats();
    await fetchAllAnalytics();
  };

  useEffect(() => {
    fetchStats();
    fetchAllAnalytics();
  }, []);

  // Handle export
  const handleExport = async (format: string) => {
    setGenerating(true);
    setError(null);

    try {
      if (format === 'csv') {
        let csvContent = '';

        if (activeTab === 'ml_metrics' && mlMetrics) {
          csvContent = 'ML Performance Metrics\n';
          csvContent += `Overall Accuracy,${(mlMetrics.overall_accuracy * 100).toFixed(1)}%\n`;
          csvContent += `Overall Precision,${(mlMetrics.overall_precision * 100).toFixed(1)}%\n`;
          csvContent += `Overall Recall,${(mlMetrics.overall_recall * 100).toFixed(1)}%\n`;
          csvContent += `Overall F1 Score,${(mlMetrics.overall_f1_score * 100).toFixed(1)}%\n\n`;
          csvContent += 'Confusion Matrix\n';
          csvContent += `True Positives,${mlMetrics.confusion_matrix.true_positives}\n`;
          csvContent += `True Negatives,${mlMetrics.confusion_matrix.true_negatives}\n`;
          csvContent += `False Positives,${mlMetrics.confusion_matrix.false_positives}\n`;
          csvContent += `False Negatives,${mlMetrics.confusion_matrix.false_negatives}\n\n`;
          csvContent += 'Programme,Accuracy,Precision,Recall,F1 Score,Samples\n';
          mlMetrics.by_programme.forEach(p => {
            csvContent += `${p.programme_name},${(p.accuracy * 100).toFixed(1)}%,${(p.precision * 100).toFixed(1)}%,${(p.recall * 100).toFixed(1)}%,${(p.f1_score * 100).toFixed(1)}%,${p.samples}\n`;
          });
        } else if (activeTab === 'rejections' && rejectionDist.length) {
          csvContent = 'Rejection Reason,Count,Percentage\n';
          rejectionDist.forEach(r => {
            csvContent += `${r.reason},${r.count},${r.percentage.toFixed(1)}%\n`;
          });
        } else if (activeTab === 'volume' && volumeData.length) {
          csvContent = 'Month,Applications,Approvals,Rejections,Pending\n';
          volumeData.forEach(v => {
            csvContent += `${v.date},${v.applications},${v.approvals},${v.rejections},${v.pending}\n`;
          });
        } else if (activeTab === 'demand' && programmeDemand.length) {
          csvContent = 'Programme,Applicants,Capacity,Fill Rate,Avg Score\n';
          programmeDemand.forEach(p => {
            csvContent += `${p.name},${p.applicants},${p.capacity},${p.fill_rate}%,${p.avg_score}\n`;
          });
        } else if (activeTab === 'auto_processing' && processingStats) {
          csvContent = 'Auto-Processing Statistics\n';
          csvContent += `Auto Approved,${processingStats.auto_approved}\n`;
          csvContent += `Auto Rejected,${processingStats.auto_rejected}\n`;
          csvContent += `Manual Approved,${processingStats.manual_approved}\n`;
          csvContent += `Manual Rejected,${processingStats.manual_rejected}\n`;
          csvContent += `Pending Review,${processingStats.pending_review}\n`;
          csvContent += `Auto Processing Rate,${processingStats.auto_processing_rate}%\n`;
          csvContent += `Manual Review Rate,${processingStats.manual_review_rate}%\n`;
        } else {
          csvContent = 'Report Type,Generated Date\n';
          csvContent += `${activeTab},${new Date().toLocaleString()}\n`;
          csvContent += `Total Applications,${stats?.totalApplications || 0}\n`;
          csvContent += `Total Programmes,${stats?.totalProgrammes || 0}\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert('Report exported successfully!');
      } else {
        alert(`Export as ${format.toUpperCase()} feature coming soon.`);
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/committee/dashboard')}
              className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Analytics & Reports</span>
          </nav>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Analytics Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">ML performance, trend analysis, and processing insights</p>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">ML Accuracy</p>
                <p className="text-3xl font-bold text-green-600">{Math.round((mlMetrics?.overall_accuracy || 0) * 100)}%</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Auto-Processing Rate</p>
                <p className="text-3xl font-bold text-orange-600">{processingStats?.auto_processing_rate || 0}%</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Programmes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalProgrammes || 0}</p>
              </div>
              <Target className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'ml_metrics', label: 'ML Performance', icon: Brain },
              { id: 'rejections', label: 'Rejection Analysis', icon: PieChart },
              { id: 'volume', label: 'Volume Trends', icon: Activity },
              { id: 'demand', label: 'Programme Demand', icon: Users },
              { id: 'auto_processing', label: 'Auto vs Manual', icon: Zap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">{error}</p>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  ML Model Performance
                </h3>
                {loadingMetrics ? (
                  <div className="flex justify-center py-8">
                    <Loader className="animate-spin h-8 w-8 text-green-600" />
                  </div>
                ) : mlMetrics ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Accuracy</span>
                        <span className="font-medium text-gray-900">{Math.round(mlMetrics.overall_accuracy * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${mlMetrics.overall_accuracy * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Precision</span>
                        <span className="font-medium text-gray-900">{Math.round(mlMetrics.overall_precision * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${mlMetrics.overall_precision * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Recall</span>
                        <span className="font-medium text-gray-900">{Math.round(mlMetrics.overall_recall * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${mlMetrics.overall_recall * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">F1 Score</span>
                        <span className="font-medium text-gray-900">{Math.round(mlMetrics.overall_f1_score * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${mlMetrics.overall_f1_score * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No ML performance data available yet</p>
                    <p className="text-sm mt-1">Start processing applications to see metrics</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-red-500" />
                  Top Rejection Reasons
                </h3>
                {rejectionDist.length > 0 && rejectionDist[0]?.count > 0 ? (
                  <div className="space-y-4">
                    {rejectionDist.slice(0, 4).map(reason => (
                      <div key={reason.reason}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{reason.icon} {reason.reason.length > 30 ? reason.reason.substring(0, 30) + '...' : reason.reason}</span>
                          <span className="font-medium text-gray-900">{reason.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-red-600 h-2 rounded-full" style={{ width: `${reason.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <PieChart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No rejection data available</p>
                    <p className="text-sm mt-1">Rejection reasons will appear here when applications are rejected</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Application Volume Trend (Last 6 Months)
              </h3>
              {volumeData.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="flex items-end justify-between h-48 mb-2 gap-2 min-w-[400px]">
                    {volumeData.slice(-6).map((item, idx) => {
                      const maxApplications = Math.max(...volumeData.map(v => v.applications), 1);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t hover:from-green-600 hover:to-green-500 transition-all cursor-pointer"
                            style={{ height: `${(item.applications / maxApplications) * 120}px`, maxHeight: '120px' }}
                            title={`${item.date}: ${item.applications} applications`}
                          />
                          <span className="text-xs text-gray-600 mt-2 font-medium">{item.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No volume data available</p>
                  <p className="text-sm mt-1">Data will appear as applications are submitted</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ML Performance Tab */}
        {activeTab === 'ml_metrics' && (
          <div className="space-y-6">
            {loadingMetrics ? (
              <div className="flex justify-center py-12">
                <Loader className="animate-spin h-8 w-8 text-green-600" />
              </div>
            ) : mlMetrics ? (
              <>
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Confusion Matrix</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                      <p className="text-sm text-gray-600">True Positives</p>
                      <p className="text-2xl font-bold text-green-700">{mlMetrics.confusion_matrix.true_positives}</p>
                      <p className="text-xs text-gray-500">Correctly approved</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
                      <p className="text-sm text-gray-600">False Positives</p>
                      <p className="text-2xl font-bold text-red-700">{mlMetrics.confusion_matrix.false_positives}</p>
                      <p className="text-xs text-gray-500">Wrongly approved</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
                      <p className="text-sm text-gray-600">False Negatives</p>
                      <p className="text-2xl font-bold text-red-700">{mlMetrics.confusion_matrix.false_negatives}</p>
                      <p className="text-xs text-gray-500">Wrongly rejected</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
                      <p className="text-sm text-gray-600">True Negatives</p>
                      <p className="text-2xl font-bold text-green-700">{mlMetrics.confusion_matrix.true_negatives}</p>
                      <p className="text-xs text-gray-500">Correctly rejected</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-700">ML Performance by Programme</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Programme</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Accuracy</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Precision</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Recall</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">F1 Score</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Samples</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {mlMetrics.by_programme.slice(0, 10).map((prog, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{prog.programme_name}</td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${prog.accuracy * 100}%` }}></div>
                                </div>
                                <span className="text-sm text-gray-600">{Math.round(prog.accuracy * 100)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">{Math.round(prog.precision * 100)}%</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{Math.round(prog.recall * 100)}%</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{Math.round(prog.f1_score * 100)}%</td>
                            <td className="px-6 py-3 text-sm text-gray-600">{prog.samples}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ML Performance Data</h3>
                <p className="text-gray-500">Start processing applications with ML to see performance metrics</p>
              </div>
            )}
          </div>
        )}

        {/* Rejection Analysis Tab */}
        {activeTab === 'rejections' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rejection Reason Distribution</h3>
            {rejectionDist.length > 0 && rejectionDist[0]?.count > 0 ? (
              <div className="space-y-4">
                {rejectionDist.map(reason => (
                  <div key={reason.reason}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{reason.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{reason.reason}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{reason.count}</span>
                        <span className="text-xs text-gray-500 ml-1">({reason.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-red-500 to-orange-500 h-3 rounded-full transition-all"
                        style={{ width: `${reason.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Total Rejected: {rejectionDist.reduce((sum, r) => sum + r.count, 0)} applications
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No rejection data available</p>
                <p className="text-sm mt-1">Rejection reasons will appear when applications are rejected</p>
              </div>
            )}
          </div>
        )}

        {/* Volume Trends Tab */}
        {activeTab === 'volume' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Volume Over Time (Monthly)</h3>
            {volumeData.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="flex items-end justify-between h-64 mb-2 gap-2 min-w-[600px]">
                  {volumeData.map((item, idx) => {
                    const maxApplications = Math.max(...volumeData.map(v => v.applications), 1);
                    const maxApprovals = Math.max(...volumeData.map(v => v.approvals), 1);
                    const maxRejections = Math.max(...volumeData.map(v => v.rejections), 1);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="relative w-full flex justify-center gap-1">
                          <div
                            className="w-8 bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer group relative"
                            style={{ height: `${(item.applications / maxApplications) * 180}px` }}
                          >
                            <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap z-10">
                              Apps: {item.applications}
                            </div>
                          </div>
                          <div
                            className="w-8 bg-green-500 rounded-t hover:bg-green-600 transition-all cursor-pointer group relative"
                            style={{ height: `${(item.approvals / maxApprovals) * 180}px` }}
                          >
                            <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap z-10">
                              Approvals: {item.approvals}
                            </div>
                          </div>
                          <div
                            className="w-8 bg-red-500 rounded-t hover:bg-red-600 transition-all cursor-pointer group relative"
                            style={{ height: `${(item.rejections / maxRejections) * 180}px` }}
                          >
                            <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 hidden group-hover:block whitespace-nowrap z-10">
                              Rejections: {item.rejections}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-2 font-medium">{item.date}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 text-sm mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div><span className="text-gray-600">Applications Received</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span className="text-gray-600">Approved</span></div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded"></div><span className="text-gray-600">Rejected</span></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No volume data available</p>
                <p className="text-sm mt-1">Data will appear as applications are submitted</p>
              </div>
            )}
          </div>
        )}

        {/* Programme Demand Tab */}
        {activeTab === 'demand' && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700">Programme Demand & Competition</h3>
            </div>
            {programmeDemand.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Programme</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applicants</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fill Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Competition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {programmeDemand.map((prog, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{prog.name}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{prog.applicants}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{prog.capacity}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${prog.fill_rate >= 100 ? 'text-red-600' : 'text-green-600'}`}>{prog.fill_rate}%</span>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${prog.fill_rate >= 100 ? 'bg-red-600' : 'bg-green-600'}`} style={{ width: `${Math.min(prog.fill_rate, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${getScoreColor(prog.avg_score)}`}>{prog.avg_score}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${getScoreBgColor(prog.avg_score)}`} style={{ width: `${prog.avg_score}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            prog.applicants > prog.capacity * 1.5 ? 'bg-red-100 text-red-800' :
                            prog.applicants > prog.capacity ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {prog.applicants > prog.capacity ? `${Math.round((prog.applicants / prog.capacity) * 100)}% over capacity` : 'Under capacity'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No programme demand data available</p>
                <p className="text-sm mt-1">Data will appear as applications are submitted</p>
              </div>
            )}
          </div>
        )}

        {/* Auto-Processing Tab */}
        {activeTab === 'auto_processing' && processingStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Processing vs Manual Review</h3>
                <div className="flex justify-center mb-6">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r="45" fill="none"
                        stroke="#10b981" strokeWidth="10"
                        strokeDasharray={`${processingStats.auto_processing_rate * 2.83} ${(100 - processingStats.auto_processing_rate) * 2.83}`}
                        strokeDashoffset="0"
                        transform="rotate(-90 50 50)"
                      />
                      <text x="50" y="45" textAnchor="middle" className="text-2xl font-bold fill-gray-900">{processingStats.auto_processing_rate}%</text>
                      <text x="50" y="60" textAnchor="middle" className="text-xs fill-gray-500">Auto</text>
                    </svg>
                  </div>
                </div>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full inline-block mr-1"></div>
                    <span className="text-sm text-gray-600">Auto-Processed</span>
                    <p className="text-xl font-bold text-gray-900">{processingStats.auto_processing_rate}%</p>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full inline-block mr-1"></div>
                    <span className="text-sm text-gray-600">Manual Review</span>
                    <p className="text-xl font-bold text-gray-900">{processingStats.manual_review_rate}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Auto-Approved</span>
                    </div>
                    <span className="font-bold text-green-700">{processingStats.auto_approved}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-gray-700">Auto-Rejected</span>
                    </div>
                    <span className="font-bold text-red-700">{processingStats.auto_rejected}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">Manual Approved</span>
                    </div>
                    <span className="font-bold text-blue-700">{processingStats.manual_approved}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="w-5 h-5 text-orange-600" />
                      <span className="text-gray-700">Manual Rejected</span>
                    </div>
                    <span className="font-bold text-orange-700">{processingStats.manual_rejected}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-gray-700">Pending Review</span>
                    </div>
                    <span className="font-bold text-yellow-700">{processingStats.pending_review}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Impact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg text-center border border-purple-200">
                  <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Time Saved</p>
                  <p className="text-2xl font-bold text-purple-700">~{Math.round(processingStats.auto_processing_rate * 0.65)}%</p>
                  <p className="text-xs text-gray-500">vs manual processing</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg text-center border border-blue-200">
                  <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Accuracy Improvement</p>
                  <p className="text-2xl font-bold text-blue-700">+{Math.round((mlMetrics?.overall_accuracy || 0) * 100)}%</p>
                  <p className="text-xs text-gray-500">in decision consistency</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg text-center border border-green-200">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Committee Workload</p>
                  <p className="text-2xl font-bold text-green-700">-{Math.round(processingStats.auto_processing_rate * 0.8)}%</p>
                  <p className="text-xs text-gray-500">reduction in manual reviews</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => handleExport('csv')}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {generating ? 'Exporting...' : `Export ${activeTab.replace('_', ' ')} Data`}
          </button>
        </div>
      </div>
    </div>
  );
}