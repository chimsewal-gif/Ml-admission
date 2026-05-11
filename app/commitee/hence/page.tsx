'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Brain, TrendingUp, Users, Award, Flame, Star, ClipboardList, 
  BarChart3, PieChart, Activity, Clock, CheckCircle, AlertCircle,
  Loader2, RefreshCw, ExternalLink, Eye, Filter, Search, X,
  User, Mail, Phone, MapPin, Calendar, BookOpen, FileText, GraduationCap,
  Building, Award as AwardIcon, ChevronRight, Download, Printer,
  ThumbsUp, ThumbsDown, Info, AlertTriangle, Shield, Zap,
  TrendingDown, TrendingUp as TrendingUpIcon, Minus, Grid3x3, List,
  SortAsc, SortDesc, FileWarning, CheckSquare, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Priority Badge Component
const PriorityBadge = ({ priority, probability, confidence, size = 'md' }: { 
  priority: string; 
  probability?: number; 
  confidence?: number; 
  size?: 'sm' | 'md' | 'lg' 
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'High':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          text: 'text-white',
          icon: <Flame className="w-3 h-3" />,
          label: 'High Priority',
          badgeColor: 'bg-red-100 text-red-700',
          borderColor: 'border-red-200'
        };
      case 'Medium':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
          text: 'text-white',
          icon: <Star className="w-3 h-3" />,
          label: 'Medium Priority',
          badgeColor: 'bg-yellow-100 text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
          text: 'text-white',
          icon: <ClipboardList className="w-3 h-3" />,
          label: 'Low Priority',
          badgeColor: 'bg-gray-100 text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getPriorityConfig();
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${config.bg} ${config.text} shadow-sm`}>
        {config.icon}
        <span>{config.label}</span>
      </div>
      {probability !== undefined && (
        <div className="text-xs text-gray-500">
          <span className="font-medium">Match Score:</span> {(probability * 100).toFixed(0)}%
          {confidence && <span className="ml-2">• Confidence: {(confidence * 100).toFixed(0)}%</span>}
        </div>
      )}
    </div>
  );
};

// Explanation Card Component
const ExplanationCard = ({ prediction }: { prediction: any }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 0.7) return <TrendingUpIcon className="w-4 h-4 text-green-600" />;
    if (score >= 0.4) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Why this ranking?</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600">
            {expanded ? 'Show less' : 'Show explanation'}
          </span>
          <ChevronRight className={`w-4 h-4 text-blue-600 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3"
          >
            {/* Score Breakdown */}
            <div className="bg-white rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Score Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Admission Probability</span>
                  <div className="flex items-center gap-2">
                    {getScoreIcon(prediction.probability || prediction.ml_probability || 0.5)}
                    <span className={`font-semibold ${getScoreColor(prediction.probability || prediction.ml_probability || 0.5)}`}>
                      {((prediction.probability || prediction.ml_probability || 0.5) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                    className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${((prediction.probability || prediction.ml_probability || 0.5) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Key Factors */}
            {(prediction.ml_factors?.factors || prediction.factors) && (
              <div className="bg-white rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Key Factors</h4>
                <div className="space-y-2">
                  {(prediction.ml_factors?.factors || prediction.factors || []).map((factor: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      {factor.impact === 'positive' ? (
                        <ThumbsUp className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : factor.impact === 'negative' ? (
                        <ThumbsDown className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-gray-800">{factor.factor}</p>
                        {factor.details && <p className="text-xs text-gray-500">{factor.details}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* MSCE Performance */}
            {prediction.subject_records && prediction.subject_records.length > 0 && (
              <div className="bg-white rounded-lg p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">MSCE Performance</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Subjects:</span>
                    <p className="font-medium">{prediction.subject_records.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Average Grade:</span>
                    <p className="font-medium">
                      {prediction.average_grade || 
                        (prediction.subject_records.reduce((acc: number, s: any) => {
                          const gradeMap: { [key: string]: number } = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };
                          return acc + (gradeMap[s.grade] || 5);
                        }, 0) / prediction.subject_records.length).toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recommendation */}
            {(prediction.ml_recommendation || prediction.recommendation) && (
              <div className="bg-blue-100 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-blue-800 mb-1">AI Recommendation</h4>
                <p className="text-sm text-blue-900">{prediction.ml_recommendation || prediction.recommendation}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced Applicant Card Component (for grid view)
const ApplicantCard = ({ applicant, onViewDetails, index }: { applicant: any; onViewDetails: (id: number) => void; index: number }) => {
  const priority = applicant.ml_priority || applicant.priority || 'Medium';
  const probability = applicant.probability || applicant.ml_probability || 0.5;
  
  const getBorderColor = () => {
    if (priority === 'High') return 'border-l-4 border-l-red-500';
    if (priority === 'Medium') return 'border-l-4 border-l-yellow-500';
    return 'border-l-4 border-l-gray-400';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all ${getBorderColor()}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{applicant.name || applicant.applicant_name || `${applicant.first_name} ${applicant.last_name}`}</h3>
            <p className="text-xs text-gray-500">{applicant.email}</p>
          </div>
          <PriorityBadge priority={priority} size="sm" />
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Programme</span>
            <span className="font-medium text-gray-800 truncate max-w-[150px]">{applicant.programme || applicant.selected_programme || 'Not specified'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Match Score</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    probability >= 0.7 ? 'bg-green-500' : probability >= 0.4 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${probability * 100}%` }}
                />
              </div>
              <span className="font-medium">{(probability * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Submitted</span>
            <span className="text-gray-500 text-xs">
              {applicant.submitted_at ? new Date(applicant.submitted_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
        
        <ExplanationCard prediction={applicant} />
        
        <button
          onClick={() => onViewDetails(applicant.id)}
          className="w-full mt-3 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Full Application
        </button>
      </div>
    </motion.div>
  );
};

// Enhanced Table Row Component (for list view)
const ApplicantTableRow = ({ applicant, onViewDetails, index }: { applicant: any; onViewDetails: (id: number) => void; index: number }) => {
  const priority = applicant.ml_priority || applicant.priority || 'Medium';
  const probability = applicant.probability || applicant.ml_probability || 0.5;
  const [showExplanation, setShowExplanation] = useState(false);
  
  const getPriorityColor = () => {
    if (priority === 'High') return 'bg-red-50 border-l-red-500';
    if (priority === 'Medium') return 'bg-yellow-50 border-l-yellow-500';
    return 'bg-gray-50 border-l-gray-400';
  };
  
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor()}`}
    >
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-gray-900">{applicant.name || applicant.applicant_name || `${applicant.first_name} ${applicant.last_name}`}</p>
          <p className="text-xs text-gray-500">{applicant.email}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm text-gray-700 max-w-[200px] truncate">{applicant.programme || applicant.selected_programme || 'Not specified'}</p>
      </td>
      <td className="px-6 py-4">
        <PriorityBadge priority={priority} size="sm" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                probability >= 0.7 ? 'bg-green-500' : probability >= 0.4 ? 'bg-yellow-500' : 'bg-gray-500'
              }`}
              style={{ width: `${probability * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium min-w-[45px]">
            {(probability * 100).toFixed(0)}%
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Show explanation"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewDetails(applicant.id)}
            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="View Full Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

// Main Committee Dashboard Component
export default function CommitteeDashboard() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<any>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [originalApplicants, setOriginalApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [showFullApplicationModal, setShowFullApplicationModal] = useState(false);
  const [fullApplicationData, setFullApplicationData] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedApplicants, setSelectedApplicants] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>('');

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchPredictions = async () => {
    setLoadingPredictions(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/ml/predictions/dashboard/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPredictions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const fetchApplicantsByPriority = async (priority: string = 'all') => {
    setLoadingApplicants(true);
    try {
      const token = getToken();
      let url = `${API_BASE_URL}/applicant-submissions/`;
      if (priority !== 'all') {
        url = `${API_BASE_URL}/ml/predictions/priority/${priority}/`;
      }
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      let applicantsList = [];
      if (priority !== 'all' && data.success && data.applicants) {
        applicantsList = data.applicants;
      } else if (data.success && data.data) {
        applicantsList = data.data;
      } else {
        applicantsList = [];
      }
      
      setOriginalApplicants(applicantsList);
      sortAndFilterApplicants(applicantsList, sortBy, sortOrder);
    } catch (err) {
      console.error('Failed to fetch applicants:', err);
      setOriginalApplicants([]);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const sortAndFilterApplicants = (list: any[], sortField: string, order: string) => {
    let sorted = [...list];
    
    // Apply priority filter first
    if (selectedPriority !== 'all') {
      sorted = sorted.filter(a => (a.ml_priority || a.priority) === selectedPriority);
    }
    
    // Apply sorting
    sorted.sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'score') {
        aVal = a.probability || a.ml_probability || 0;
        bVal = b.probability || b.ml_probability || 0;
      } else if (sortField === 'name') {
        aVal = (a.name || a.applicant_name || '').toLowerCase();
        bVal = (b.name || b.applicant_name || '').toLowerCase();
      } else {
        aVal = a.submitted_at || '';
        bVal = b.submitted_at || '';
      }
      
      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setApplicants(sorted);
  };

  const handleSort = (field: 'score' | 'name' | 'date') => {
    const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
    sortAndFilterApplicants(originalApplicants, field, newOrder);
  };

  const runBatchPredictions = async () => {
    setBatchProcessing(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      let applicantIds = [];
      if (data.success && data.data) {
        applicantIds = data.data.map((a: any) => a.id);
      }
      
      if (applicantIds.length > 0) {
        const batchResponse = await fetch(`${API_BASE_URL}/ml/batch-predict-admissions/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ applicant_ids: applicantIds })
        });
        
        const batchData = await batchResponse.json();
        if (batchData.success) {
          alert(`✅ Batch prediction completed!\n\n📊 Summary:\n- High Priority: ${batchData.summary.high_priority}\n- Medium Priority: ${batchData.summary.medium_priority}\n- Low Priority: ${batchData.summary.low_priority}\n- Total Processed: ${batchData.summary.successful}`);
          await fetchPredictions();
          await fetchApplicantsByPriority(selectedPriority);
        }
      }
    } catch (err) {
      console.error('Batch prediction failed:', err);
      alert('Failed to run batch predictions. Please try again.');
    } finally {
      setBatchProcessing(false);
    }
  };

  const viewFullApplication = async (applicantId: number) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/${applicantId}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFullApplicationData(data.data);
        setShowFullApplicationModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch full application:', err);
      alert('Failed to load application details');
    }
  };

  const toggleSelectApplicant = (id: number) => {
    const newSelected = new Set(selectedApplicants);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApplicants(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedApplicants.size === applicants.length) {
      setSelectedApplicants(new Set());
    } else {
      setSelectedApplicants(new Set(applicants.map(a => a.id)));
    }
  };

  useEffect(() => {
    fetchPredictions();
    fetchApplicantsByPriority(selectedPriority);
  }, []);

  useEffect(() => {
    fetchApplicantsByPriority(selectedPriority);
  }, [selectedPriority]);

  const filteredApplicants = applicants.filter(applicant => {
    if (!searchTerm) return true;
    const name = applicant.name || applicant.applicant_name || '';
    const programme = applicant.programme || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      programme.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Load view mode preference
  useEffect(() => {
    const savedViewMode = localStorage.getItem('committee_view_mode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, []);

  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    localStorage.setItem('committee_view_mode', newMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/20 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Committee Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admission Committee Dashboard</h1>
          <p className="text-gray-600">AI-powered applicant prioritization with detailed explanations</p>
        </div>

        {/* Stats Cards */}
        {loadingPredictions ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center mb-6">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading prediction data...</p>
          </div>
        ) : predictions?.priority_distribution ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Analyzed</p>
                  <p className="text-4xl font-bold">{predictions.total_predicted || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedPriority('High')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-200 text-sm">High Priority</p>
                  <p className="text-4xl font-bold">{predictions.priority_distribution.High || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
              </div>
              {predictions.average_probabilities?.High > 0 && (
                <p className="text-red-200 text-xs mt-2">
                  Avg Match: {(predictions.average_probabilities.High * 100).toFixed(0)}%
                </p>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedPriority('Medium')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm">Medium Priority</p>
                  <p className="text-4xl font-bold">{predictions.priority_distribution.Medium || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6" />
                </div>
              </div>
              {predictions.average_probabilities?.Medium > 0 && (
                <p className="text-yellow-200 text-xs mt-2">
                  Avg Match: {(predictions.average_probabilities.Medium * 100).toFixed(0)}%
                </p>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl p-6 text-white shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={() => setSelectedPriority('Low')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Low Priority</p>
                  <p className="text-4xl font-bold">{predictions.priority_distribution.Low || 0}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" />
                </div>
              </div>
              {predictions.average_probabilities?.Low > 0 && (
                <p className="text-gray-300 text-xs mt-2">
                  Avg Match: {(predictions.average_probabilities.Low * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center mb-6">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No prediction data available</p>
            <p className="text-sm text-gray-400 mt-1">Click "Run Batch Predictions" to analyze applicants</p>
          </div>
        )}

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={runBatchPredictions}
                disabled={batchProcessing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {batchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Run Batch Predictions</span>
              </button>
              <button
                onClick={() => {
                  fetchPredictions();
                  fetchApplicantsByPriority(selectedPriority);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleViewMode}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title={viewMode === 'list' ? 'Grid view' : 'List view'}
              >
                {viewMode === 'list' ? <Grid3x3 className="w-5 h-5" /> : <List className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applicants by name or programme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedPriority('all')}
                className={`px-4 py-2 rounded-xl transition-all ${selectedPriority === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Priority
              </button>
              <button
                onClick={() => setSelectedPriority('High')}
                className={`px-4 py-2 rounded-xl transition-all ${selectedPriority === 'High' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                High Priority
              </button>
              <button
                onClick={() => setSelectedPriority('Medium')}
                className={`px-4 py-2 rounded-xl transition-all ${selectedPriority === 'Medium' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Medium Priority
              </button>
              <button
                onClick={() => setSelectedPriority('Low')}
                className={`px-4 py-2 rounded-xl transition-all ${selectedPriority === 'Low' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Low Priority
              </button>
            </div>
          </div>
          
          {/* Sort Options */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Sort by:</span>
            <button
              onClick={() => handleSort('score')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all ${
                sortBy === 'score' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Match Score
              {sortBy === 'score' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
            </button>
            <button
              onClick={() => handleSort('name')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all ${
                sortBy === 'name' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Name
              {sortBy === 'name' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
            </button>
            <button
              onClick={() => handleSort('date')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-all ${
                sortBy === 'date' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Submission Date
              {sortBy === 'date' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
            </button>
          </div>
        </div>

        {/* Applicants Display */}
        {loadingApplicants ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading applicants...</p>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No applicants found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or run batch predictions</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplicants.map((applicant, idx) => (
              <ApplicantCard
                key={applicant.id}
                applicant={applicant}
                onViewDetails={viewFullApplication}
                index={idx}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1">
                        APPLICANT
                        {sortBy === 'name' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PROGRAMME</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PRIORITY</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <button onClick={() => handleSort('score')} className="flex items-center gap-1">
                        MATCH SCORE
                        {sortBy === 'score' && (sortOrder === 'desc' ? <SortDesc className="w-3 h-3" /> : <SortAsc className="w-3 h-3" />)}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplicants.map((applicant, idx) => (
                    <ApplicantTableRow
                      key={applicant.id}
                      applicant={applicant}
                      onViewDetails={viewFullApplication}
                      index={idx}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">How AI Rankings Work</p>
              <p className="text-xs text-blue-700 mt-1">
                The ML model analyzes MSCE results, subject combinations, grade patterns, and application completeness.
                Each application is scored on a 0-100% scale. Click the <Brain className="w-3 h-3 inline" /> icon on any applicant
                to see the detailed factors that influenced their ranking.
                <strong className="block mt-1">Note: AI predictions are advisory only. Final admission decisions are made by the committee.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Application Details Modal */}
      <AnimatePresence>
        {showFullApplicationModal && fullApplicationData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowFullApplicationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 sticky top-0 z-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-white">Full Application Details</h2>
                        <p className="text-purple-200 text-sm">Complete applicant information with AI analysis</p>
                      </div>
                    </div>
                    <button onClick={() => setShowFullApplicationModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Applicant Information</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-medium">{fullApplicationData.first_name} {fullApplicationData.last_name}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{fullApplicationData.email}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Programme</p>
                      <p className="font-medium">{fullApplicationData.programme || fullApplicationData.selected_programme}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Reference Number</p>
                      <p className="font-mono text-sm">{fullApplicationData.reference_number}</p>
                    </div>
                  </div>
                  
                  <ExplanationCard prediction={fullApplicationData} />
                  
                  {fullApplicationData.subject_records && fullApplicationData.subject_records.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">MSCE Results</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subject</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fullApplicationData.subject_records.map((record: any, idx: number) => (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 text-sm">{record.subject}</td>
                                <td className="px-4 py-2">
                                  <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                    {record.grade}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 px-6 py-4 flex gap-3 bg-gray-50 sticky bottom-0">
                  <button
                    onClick={() => setShowFullApplicationModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}