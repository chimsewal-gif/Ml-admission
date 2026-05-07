'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  CheckCircle,
  Upload,
  AlertCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  programme_type?: string;
  study_mode?: string;
  school?: string;
  entry_requirements?: string;
  quota?: number;
  created_at?: string;
  updated_at?: string;
}

interface DisplayProgramme {
  id: number;
  name: string;
  department: string;
  study_mode: string;
  programme_type: string;
  duration: string;
  original_id: number;
  is_active: boolean;
}

export default function ProgrammesListPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStudyMode, setFilterStudyMode] = useState('all');
  const [filterProgrammeType, setFilterProgrammeType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const getDisplayProgrammes = (): DisplayProgramme[] => {
    const displayList: DisplayProgramme[] = [];
    
    programmes.forEach(prog => {
      const programmeName = prog.name;
      const department = prog.school || prog.department || 'Education';
      
      let studyMode = prog.study_mode || '';
      if (!studyMode) {
        if (prog.category === 'odl') {
          studyMode = 'odel';
        } else if (prog.programme_type === 'upgrading') {
          studyMode = 'weekend';
        } else {
          studyMode = 'full time';
        }
      }
      
      let programmeType = prog.programme_type || '';
      if (!programmeType) {
        if (prog.category === 'upgrading') {
          programmeType = 'upgrading';
        } else if (prog.category === 'odl') {
          programmeType = 'upgrading';
        } else if (prog.category === 'postgraduate') {
          programmeType = 'non-generic';
        } else {
          programmeType = 'upgrading';
        }
      }
      
      let duration = prog.duration || '';
      if (!duration) {
        if (programmeType === 'upgrading') {
          duration = '2-3 years';
        } else if (programmeType === 'non-generic') {
          duration = '2 years';
        } else {
          duration = '4 years';
        }
      }
      
      displayList.push({
        id: prog.id,
        name: programmeName,
        department: department,
        study_mode: studyMode,
        programme_type: programmeType,
        duration: duration,
        original_id: prog.id,
        is_active: prog.is_active,
      });
    });
    
    return displayList;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      
      const mappedData = parsedData.map((row: any) => ({
        name: row['Programme Name'] || row['name'] || row['PROGRAMME'] || '',
        description: row['Description'] || row['description'] || row['DESCRIPTION'] || '',
        department: row['Department'] || row['department'] || row['FACULTY'] || '',
        duration: row['Duration'] || row['duration'] || row['DURATION'] || '',
        category: row['Category'] || row['category'] || row['CATEGORY'] || 'generic',
        code: row['Code'] || row['code'] || row['PROGRAMME CODE'] || '',
        programme_type: row['Programme Type'] || row['programme_type'] || row['TYPE'] || '',
        study_mode: row['Study Mode'] || row['study_mode'] || row['MODE'] || '',
        school: row['School'] || row['school'] || row['SCHOOL'] || row['Department'] || row['department'] || '',
        entry_requirements: row['Entry Requirements'] || row['entry_requirements'] || row['REQUIREMENTS'] || '',
        quota: row['Quota'] || row['quota'] || row['QUOTA'] || null,
      }));
      
      setFileData(mappedData);
      setImportPreview(mappedData.slice(0, 5));
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Programme Name': 'Bachelor of Education (Arts)',
        'Description': 'This programme prepares students to become secondary school teachers in Arts subjects',
        'Department': 'Faculty of Education',
        'Duration': '4 Years',
        'Category': 'generic',
        'Code': 'BED-ARTS-001',
        'Programme Type': 'generic',
        'Study Mode': 'full time',
        'School': 'Faculty of Education',
        'Entry Requirements': 'MSCE with 6 credits including English and Mathematics',
        'Quota': 50,
      },
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Programmes Template');
    XLSX.writeFile(wb, 'programmes_template.xlsx');
  };

  const handleImportFromFile = async () => {
    if (fileData.length === 0) {
      setImportError('Please select a file to import');
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

    for (const prog of fileData) {
      if (!prog.name || !prog.code) {
        failed++;
        continue;
      }

      try {
        const existing = programmes.find(p => p.code === prog.code || p.name === prog.name);
        if (existing) {
          skipped++;
          continue;
        }

        let programmeType = prog.programme_type;
        if (!programmeType) {
          if (prog.category === 'upgrading') {
            programmeType = 'upgrading';
          } else {
            programmeType = 'generic';
          }
        }

        let studyMode = prog.study_mode;
        if (!studyMode) {
          studyMode = 'full time';
        }

        const programmeData: ProgrammeData = {
          name: prog.name,
          description: prog.description || `${prog.name} programme at Mzuzu University`,
          department: prog.department,
          duration: prog.duration,
          category: prog.category || 'generic',
          code: prog.code,
          is_active: true,
          programme_type: programmeType,
          study_mode: studyMode,
          school: prog.school || prog.department,
          entry_requirements: prog.entry_requirements || '',
          quota: prog.quota || undefined,
        };

        const response = await fetch(`${API_BASE_URL}/programmes/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(programmeData),
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
    setShowImportModal(false);
    setFileData([]);
    setImportPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => setImportSuccess(''), 5000);
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

  const handleViewProgramme = async (id: number) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/programmes/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedProgramme(data);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error('Failed to fetch programme details:', err);
    }
  };

  const handleDeleteProgramme = async () => {
    if (!selectedProgramme) return;

    try {
      const token = getToken();
      
      if (!token) {
        setError('Please login to delete programmes');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/programmes/${selectedProgramme.id}/`, {
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
      setShowDeleteModal(false);
      setSelectedProgramme(null);
      alert('Programme deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete programme:', err);
      alert(err.message || 'Failed to delete programme.');
    }
  };

  const openDeleteModal = (programme: Programme) => {
    setSelectedProgramme(programme);
    setShowDeleteModal(true);
  };

  const displayProgrammes = getDisplayProgrammes();
  
  const filteredProgrammes = displayProgrammes.filter(prog => {
    const matchesSearch = 
      prog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStudyMode = filterStudyMode === 'all' || prog.study_mode?.toLowerCase() === filterStudyMode.toLowerCase();
    const matchesProgrammeType = filterProgrammeType === 'all' || prog.programme_type?.toLowerCase() === filterProgrammeType.toLowerCase();
    
    return matchesSearch && matchesStudyMode && matchesProgrammeType;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProgrammes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProgrammes.length / itemsPerPage);

  const uniqueStudyModes = Array.from(new Set(displayProgrammes.map(p => p.study_mode))).filter(Boolean);
  const uniqueProgrammeTypes = Array.from(new Set(displayProgrammes.map(p => p.programme_type))).filter(Boolean);

  const getStudyModeBadgeStyle = (mode: string) => {
    switch (mode?.toLowerCase()) {
      case 'full time':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'odel':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'weekend':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'evening':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getProgrammeTypeBadgeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'upgrading':
        return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'non-generic':
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'generic':
        return 'bg-teal-100 text-teal-700 border border-teal-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

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

        {/* Admin Action Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import from Excel/CSV</span>
          </button>
          <button
            onClick={handleImportProgrammes}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>{importing ? 'Importing...' : 'Import Default Data'}</span>
          </button>
          <button
            onClick={handleAddProgramme}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Programme</span>
          </button>
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
            setShowImportModal(false);
            setFileData([]);
            setImportPreview([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}>
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Import Programmes from Excel/CSV</h2>
                  <p className="text-sm text-gray-500 mt-1">Upload an Excel or CSV file with programme data</p>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setFileData([]);
                    setImportPreview([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm mb-4"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Template</span>
                  </button>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white/50">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-3" />
                      <span className="text-sm text-gray-600">Click to upload Excel or CSV file</span>
                      <span className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</span>
                    </label>
                  </div>
                </div>

                {importPreview.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Preview (first 5 rows)</h3>
                    <div className="overflow-x-auto bg-white/50 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(importPreview[0]).map(key => (
                              <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {importPreview.map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((value: any, i) => (
                                <td key={i} className="px-3 py-2 text-gray-600">
                                  {typeof value === 'string' && value.length > 30 ? `${value.substring(0, 30)}...` : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Total rows to import: {fileData.length}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setFileData([]);
                    setImportPreview([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportFromFile}
                  disabled={fileData.length === 0 || importing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Import {fileData.length} Programmes</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedProgramme && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
            setShowDeleteModal(false);
            setSelectedProgramme(null);
          }}>
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Programme</h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete "{selectedProgramme.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedProgramme(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProgramme}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Programme Modal */}
        {showViewModal && selectedProgramme && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
            setShowViewModal(false);
            setSelectedProgramme(null);
          }}>
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md">
                <h2 className="text-xl font-semibold text-gray-900">Programme Details</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedProgramme(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Programme Name</label>
                  <p className="text-gray-900 mt-1">{selectedProgramme.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Code</label>
                  <p className="text-gray-900 mt-1">{selectedProgramme.code}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Department</label>
                  <p className="text-gray-900 mt-1">{selectedProgramme.department}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Duration</label>
                  <p className="text-gray-900 mt-1">{selectedProgramme.duration}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Programme Type</label>
                  <p className="text-gray-900 mt-1">{selectedProgramme.programme_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Study Mode</label>
                  <p className="text-gray-900 mt-1">{selectedProgramme.study_mode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                  <p className="text-gray-900 mt-1">{selectedProgramme.description || 'No description available'}</p>
                </div>
                {selectedProgramme.entry_requirements && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Entry Requirements</label>
                    <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedProgramme.entry_requirements}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedProgramme.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedProgramme.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white/95 backdrop-blur-md">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedProgramme(null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programmes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={filterStudyMode}
                  onChange={(e) => setFilterStudyMode(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Study Modes</option>
                  {uniqueStudyModes.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={filterProgrammeType}
                  onChange={(e) => setFilterProgrammeType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Programme Types</option>
                  {uniqueProgrammeTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PROGRAMME</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">TYPE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DURATION</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No programmes found</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm || filterStudyMode !== 'all' || filterProgrammeType !== 'all'
                            ? 'Try adjusting your search or filters' 
                            : 'No programmes available'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((prog, idx) => {
                    const fullProgramme = programmes.find(p => p.id === prog.original_id);
                    return (
                      <tr key={`${prog.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{prog.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{prog.department}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-row items-center gap-2 flex-wrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStudyModeBadgeStyle(prog.study_mode)}`}>
                              {prog.study_mode}
                            </span>
                            <span className="text-gray-300 text-xs">|</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getProgrammeTypeBadgeStyle(prog.programme_type)}`}>
                              {prog.programme_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{prog.duration}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewProgramme(prog.original_id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditProgramme(prog.original_id)}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => fullProgramme && openDeleteModal(fullProgramme)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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