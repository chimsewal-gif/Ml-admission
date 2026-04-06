'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Building,
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface Programme {
  id: number;
  name: string;
  description: string;
  department: string;
  duration: string;
  category: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function ProgrammesListPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const router = useRouter();

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getToken();
      
      if (!token) {
        setError('Please login to view programmes');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/programmes/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Programmes response:', data);

      // Handle different response formats
      let programmesList: Programme[] = [];
      if (data && data.success && Array.isArray(data.data)) {
        programmesList = data.data;
      } else if (data && Array.isArray(data)) {
        programmesList = data;
      } else if (data && data.programmes && Array.isArray(data.programmes)) {
        programmesList = data.programmes;
      } else if (data && data.results && Array.isArray(data.results)) {
        programmesList = data.results;
      } else {
        console.error('Unexpected response format:', data);
        programmesList = [];
      }

      setProgrammes(programmesList);
    } catch (err: any) {
      console.error('Failed to fetch programmes:', err);
      setError(err.message || 'Failed to fetch programmes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgramme = () => {
    router.push('/appadmin/programmes/add');
  };

  const handleEditProgramme = (id: number) => {
    router.push(`/appadmin/programmes/${id}/edit`);
  };

  const handleViewProgramme = (id: number) => {
    router.push(`/appadmin/programmes/${id}`);
  };

  const handleDeleteProgramme = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete programme "${name}"?`)) {
      return;
    }

    try {
      const token = getToken();
      
      if (!token) {
        setError('Please login to delete programmes');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/programmes/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to delete programme: ${response.status}`);
      }

      // Refresh the list
      await fetchProgrammes();
      alert('Programme deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete programme:', err);
      alert(err.message || 'Failed to delete programme.');
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'undergraduate':
        return 'bg-blue-100 text-blue-800';
      case 'postgraduate':
        return 'bg-purple-100 text-purple-800';
      case 'diploma':
        return 'bg-yellow-100 text-yellow-800';
      case 'certificate':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProgrammes = programmes.filter(prog => {
    const matchesSearch = 
      prog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || prog.category?.toLowerCase() === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Programmes</h1>
                <p className="text-gray-600 mt-1">Manage your academic programmes</p>
              </div>
            </div>
            
            <button
              onClick={handleAddProgramme}
              className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Programme</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-red-700 font-medium">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search programmes by name, code, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="diploma">Diploma</option>
              <option value="certificate">Certificate</option>
            </select>
          </div>
        </div>

        {/* Programmes Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Programme Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProgrammes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No programmes found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm || filterCategory !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'Click the "Add Programme" button to create one.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProgrammes.map((prog) => (
                    <tr key={prog.id} className="hover:bg-green-50/30 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                          {prog.code || 'N/A'}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-gray-900">{prog.name}</span>
                        </div>
                        {prog.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{prog.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{prog.department || 'Not Assigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{prog.duration}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(prog.category)}`}>
                          <Tag className="w-3 h-3 mr-1" />
                          {prog.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          prog.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {prog.is_active ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {prog.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewProgramme(prog.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="View Programme"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProgramme(prog.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                            title="Edit Programme"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProgramme(prog.id, prog.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Delete Programme"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filteredProgrammes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredProgrammes.length}</span> of{' '}
                  <span className="font-medium">{programmes.length}</span> programmes
                </p>
                <button
                  onClick={fetchProgrammes}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}