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
  Upload,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Award,
  University,
} from 'lucide-react';
import { MZUNI_PROGRAMMES, ProgrammeData, getProgrammesCount } from '@/constants/programmesData';

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
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

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

  const handleImportProgrammes = async () => {
    const stats = getProgrammesCount();
    if (!confirm(`This will import ${stats.total} programmes from the Mzuzu University prospectus. Continue?`)) {
      return;
    }

    setImporting(true);
    setImportError('');
    setImportSuccess('');

    const token = getToken();
    if (!token) {
      setImportError('Please login to import programmes');
      setImporting(false);
      return;
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const prog of MZUNI_PROGRAMMES) {
      try {
        const existing = programmes.find(p => p.code === prog.code || p.name === prog.name);
        if (existing) {
          skipped++;
          continue;
        }

        const response = await fetch(`${API_BASE_URL}/programmes/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(prog),
        });

        if (response.ok) {
          imported++;
        } else {
          failed++;
        }
      } catch (err) {
        failed++;
      }
    }

    setImportSuccess(`Import completed! Added: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
    await fetchProgrammes();
    setImporting(false);
    setTimeout(() => setImportSuccess(''), 5000);
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
      case 'upgrading':
        return 'bg-orange-100 text-orange-800';
      case 'odl':
        return 'bg-indigo-100 text-indigo-800';
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProgrammes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProgrammes.length / itemsPerPage);

  const stats = getProgrammesCount();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Programmes</h1>
              <p className="text-green-100">Manage academic programmes from Mzuzu University prospectus</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleImportProgrammes}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{importing ? 'Importing...' : 'Import'}</span>
              </button>
              <button
                onClick={handleAddProgramme}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Programme</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Alerts */}
        {importError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{importError}</p>
            </div>
          </div>
        )}

        {importSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700">{importSuccess}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div>
                <p className="text-sm text-red-700 font-medium">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">Total Programmes</p>
            <p className="text-2xl font-bold text-gray-800">{programmes.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">Undergraduate</p>
            <p className="text-2xl font-bold text-blue-600">{programmes.filter(p => p.category === 'undergraduate').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">Upgrading</p>
            <p className="text-2xl font-bold text-orange-600">{programmes.filter(p => p.category === 'upgrading').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">ODeL</p>
            <p className="text-2xl font-bold text-indigo-600">{programmes.filter(p => p.category === 'odl').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase">Certificate</p>
            <p className="text-2xl font-bold text-green-600">{programmes.filter(p => p.category === 'certificate').length}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programmes by name, code, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="upgrading">Upgrading</option>
                  <option value="odl">ODeL</option>
                  <option value="certificate">Certificate</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Programmes Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Programme Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No programmes found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm || filterCategory !== 'all' 
                            ? 'Try adjusting your search or filters' 
                            : 'Click "Import" to load programmes from prospectus'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((prog) => (
                    <tr key={prog.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{prog.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{prog.code}</p>
                        </div>
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{prog.department || 'Not Assigned'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{prog.duration}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadgeColor(prog.category)}`}>
                          {prog.category?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${prog.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {prog.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {prog.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewProgramme(prog.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProgramme(prog.id)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProgramme(prog.id, prog.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
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

          {/* Pagination Footer */}
          {filteredProgrammes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProgrammes.length)} of {filteredProgrammes.length} results
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}