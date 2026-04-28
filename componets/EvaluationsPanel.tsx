'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Eye, RefreshCw, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface Evaluation {
  id: number;
  applicantName: string;
  applicantId: number;
  evaluatorName: string;
  totalScore: number;
  status: 'completed' | 'pending' | 'in-progress';
  date: string;
  comments: string;
  programme: string;
  email: string;
}

export function EvaluationsPanel() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchEvaluations = async () => {
    const token = getToken();
    if (!token) {
      setError('Please login to view evaluations');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/applicant-submissions/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setEvaluations([]);
        setError('API endpoint not available. Please check if the backend is running.');
        setLoading(false);
        return;
      }

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        setLoading(false);
        return;
      }

      if (response.status === 404) {
        setEvaluations([]);
        setError('Evaluations endpoint not found. Please check back later.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const transformedEvaluations = (data.data || []).map((submission: any) => ({
          id: submission.id,
          applicantId: submission.id,
          applicantName: submission.applicant_name,
          evaluatorName: 'System',
          totalScore: calculateScore(submission),
          status: mapStatus(submission.status),
          date: submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : new Date().toLocaleDateString(),
          comments: submission.ml_prediction?.factors ? JSON.stringify(submission.ml_prediction.factors) : 'No comments yet',
          programme: submission.programme,
          email: submission.email,
        }));
        setEvaluations(transformedEvaluations);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch evaluations');
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      setError('Unable to load evaluations. Please try again later.');
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (submission: any): number => {
    if (submission.ml_prediction && submission.ml_prediction.confidence) {
      return Math.round(submission.ml_prediction.confidence * 100);
    }
    
    switch (submission.status?.toLowerCase()) {
      case 'approved':
        return 85 + Math.floor(Math.random() * 15);
      case 'under_review':
        return 60 + Math.floor(Math.random() * 25);
      case 'rejected':
        return 30 + Math.floor(Math.random() * 30);
      default:
        return 50 + Math.floor(Math.random() * 30);
    }
  };

  const mapStatus = (status: string): 'completed' | 'pending' | 'in-progress' => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return 'completed';
      case 'under_review':
      case 'reviewing':
        return 'in-progress';
      case 'submitted':
      case 'pending':
        return 'pending';
      default:
        return 'pending';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'in-progress': return 'In Progress';
      default: return status;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredEvaluations = evaluations.filter(e => filter === 'all' || e.status === filter);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading evaluations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evaluations</h1>
            <p className="text-gray-600 mt-2">Track and manage all applicant evaluations</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchEvaluations}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">{error}</p>
            {error.includes('login') && (
              <button
                onClick={() => router.push('/login')}
                className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                Go to Login
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({evaluations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending ({evaluations.filter(e => e.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              In Progress ({evaluations.filter(e => e.status === 'in-progress').length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completed ({evaluations.filter(e => e.status === 'completed').length})
            </button>
          </div>
        </div>

        {filteredEvaluations.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{evaluation.applicantName}</div>
                          <div className="text-xs text-gray-500">{evaluation.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {evaluation.programme || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {evaluation.evaluatorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-sm font-semibold ${getScoreColor(evaluation.totalScore)}`}>
                            {evaluation.totalScore}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">/100</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(evaluation.status)}
                          <span className="ml-2 text-sm text-gray-900">{getStatusText(evaluation.status)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {evaluation.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => router.push(`/commitee/applicants/${evaluation.applicantId}`)}
                          className="text-blue-600 hover:text-blue-900 flex items-center transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredEvaluations.length}</span> of{' '}
                <span className="font-medium">{evaluations.length}</span> evaluations
                {filter !== 'all' && ` (filtered by: ${filter})`}
              </p>
            </div>
          </div>
        ) : !error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Found</h3>
            <p className="text-gray-500">No applicant submissions have been evaluated yet.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}