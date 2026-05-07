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
  Save,
  Building,
  Calendar,
  Tag,
  Layers,
  Clock,
  Shield,
  Award,
  GraduationCap,
  Target,
  Users,
  BarChart3,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

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

interface Department {
  id: number;
  name: string;
  code: string;
}

// Custom Styled Select Component for Filters
const FilterSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  icon: Icon 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[];
  placeholder: string;
  icon?: React.ElementType;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:border-green-400 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
      >
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <span className="text-sm text-gray-700">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    selectedOption?.value === option.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {selectedOption?.value === option.value && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Custom Styled Select Component for Forms
const StyledSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label,
  required 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { value: string; label: string }[];
  placeholder: string;
  label?: string;
  required?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center justify-between gap-2 hover:border-green-400 transition-all duration-200"
      >
        <span className={selectedOption ? "text-gray-800" : "text-gray-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    selectedOption?.value === option.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {selectedOption?.value === option.value && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ProgrammesListPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    duration: '',
    category: '',
    code: '',
    programme_type: 'generic',
    study_mode: 'full time',
    school: '',
    entry_requirements: '',
    quota: '',
    is_active: true
  });

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    fetchProgrammes();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/departments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setDepartments(data.data);
        } else if (Array.isArray(data)) {
          setDepartments(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

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
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      const data = await response.json();
      let programmesList: Programme[] = [];
      if (data?.success && Array.isArray(data.data)) programmesList = data.data;
      else if (Array.isArray(data)) programmesList = data;
      else if (data?.programmes && Array.isArray(data.programmes)) programmesList = data.programmes;
      else if (data?.results && Array.isArray(data.results)) programmesList = data.results;

      setProgrammes(programmesList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch programmes.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', department: '', duration: '', category: '', code: '',
      programme_type: 'generic', study_mode: 'full time', school: '', entry_requirements: '', quota: '', is_active: true
    });
    setEditingProgramme(null);
  };

  const handleAddProgramme = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditProgramme = (programme: Programme) => {
    setEditingProgramme(programme);
    setFormData({
      name: programme.name || '',
      description: programme.description || '',
      department: programme.department || '',
      duration: programme.duration || '',
      category: programme.category || '',
      code: programme.code || '',
      programme_type: programme.programme_type || 'generic',
      study_mode: programme.study_mode || 'full time',
      school: programme.school || '',
      entry_requirements: programme.entry_requirements || '',
      quota: programme.quota?.toString() || '',
      is_active: programme.is_active !== undefined ? programme.is_active : true
    });
    setShowEditModal(true);
  };

  const handleViewProgramme = (programme: Programme) => {
    setSelectedProgramme(programme);
    setShowViewModal(true);
  };

  const handleSaveProgramme = async () => {
    setSaving(true);
    const token = getToken();
    try {
      const programmeData = {
        name: formData.name, description: formData.description, department: formData.department,
        duration: formData.duration, category: formData.category, code: formData.code,
        is_active: formData.is_active, programme_type: formData.programme_type,
        study_mode: formData.study_mode, school: formData.school,
        entry_requirements: formData.entry_requirements, quota: formData.quota ? parseInt(formData.quota) : undefined,
      };

      const url = showEditModal && editingProgramme ? `${API_BASE_URL}/programmes/${editingProgramme.id}/` : `${API_BASE_URL}/programmes/`;
      const method = showEditModal && editingProgramme ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(programmeData),
      });

      if (response.ok) {
        await fetchProgrammes();
        setShowAddModal(false);
        setShowEditModal(false);
        resetForm();
        alert(showEditModal ? 'Programme updated successfully!' : 'Programme added successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to save programme');
      }
    } catch (err) {
      alert('Failed to save programme');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgramme = async () => {
    if (!selectedProgramme) return;
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE_URL}/programmes/${selectedProgramme.id}/`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchProgrammes();
        setShowDeleteModal(false);
        setSelectedProgramme(null);
        alert('Programme deleted successfully!');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete programme.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const workbook = XLSX.read(e.target?.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      const mappedData = parsedData.map((row: any) => ({
        name: row['Programme Name'] || row['name'] || row['PROGRAMME'] || '',
        description: row['Description'] || row['description'] || '',
        department: row['Department'] || row['department'] || '',
        duration: row['Duration'] || row['duration'] || '',
        category: row['Category'] || row['category'] || 'generic',
        code: row['Code'] || row['code'] || '',
        programme_type: row['Programme Type'] || row['programme_type'] || '',
        study_mode: row['Study Mode'] || row['study_mode'] || '',
        school: row['School'] || row['school'] || '',
        entry_requirements: row['Entry Requirements'] || row['entry_requirements'] || '',
        quota: row['Quota'] || row['quota'] || null,
      }));
      setFileData(mappedData);
      setImportPreview(mappedData.slice(0, 5));
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [{
      'Programme Name': 'Bachelor of Education (Arts)',
      'Description': 'This programme prepares students to become secondary school teachers',
      'Department': 'Faculty of Education',
      'Duration': '4 Years',
      'Category': 'generic',
      'Code': 'BED-ARTS',
      'Programme Type': 'generic',
      'Study Mode': 'full time',
      'School': 'Faculty of Education',
      'Entry Requirements': 'MSCE with 6 credits including English and Mathematics',
      'Quota': 50,
    }];
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

    let imported = 0, skipped = 0, failed = 0;
    for (const prog of fileData) {
      if (!prog.name || !prog.code) { failed++; continue; }
      try {
        const existing = programmes.find(p => p.code === prog.code || p.name === prog.name);
        if (existing) { skipped++; continue; }
        const response = await fetch(`${API_BASE_URL}/programmes/`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: prog.name, description: prog.description || `${prog.name} programme`,
            department: prog.department, duration: prog.duration, category: prog.category || 'generic',
            code: prog.code, is_active: true, programme_type: prog.programme_type || 'generic',
            study_mode: prog.study_mode || 'full time', school: prog.school || prog.department,
            entry_requirements: prog.entry_requirements || '', quota: prog.quota || undefined,
          }),
        });
        if (response.ok) imported++;
        else failed++;
      } catch { failed++; }
    }
    setImportSuccess(`Import completed! Added: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
    await fetchProgrammes();
    setImporting(false);
    setShowImportModal(false);
    setFileData([]);
    setImportPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImportSuccess(''), 5000);
  };

  const openDeleteModal = (programme: Programme) => {
    setSelectedProgramme(programme);
    setShowDeleteModal(true);
  };

  // Helper functions for styling
  const getStudyModeBadgeStyle = (mode: string) => {
    switch (mode?.toLowerCase()) {
      case 'full time': return 'bg-green-100 text-green-700 border-green-200';
      case 'odel': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'weekend': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'evening': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgrammeTypeBadgeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'upgrading': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'non-generic': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'generic': return 'bg-teal-100 text-teal-700 border-teal-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredProgrammes = programmes.filter(prog => {
    const studyMode = prog.study_mode || (prog.category === 'odl' ? 'odel' : 'full time');
    const programmeType = prog.programme_type || (prog.category === 'upgrading' ? 'upgrading' : 'generic');
    const matchesSearch = prog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStudyMode = filterStudyMode === 'all' || studyMode.toLowerCase() === filterStudyMode.toLowerCase();
    const matchesProgrammeType = filterProgrammeType === 'all' || programmeType.toLowerCase() === filterProgrammeType.toLowerCase();
    return matchesSearch && matchesStudyMode && matchesProgrammeType;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProgrammes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProgrammes.length / itemsPerPage);

  const uniqueStudyModes = Array.from(new Set(programmes.map(p => p.study_mode || (p.category === 'odl' ? 'odel' : 'full time'))));
  const uniqueProgrammeTypes = Array.from(new Set(programmes.map(p => p.programme_type || (p.category === 'upgrading' ? 'upgrading' : 'generic'))));

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/20 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Programme Management</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Programmes</h1>
          <p className="text-gray-600">View, edit, add, or import programmes from Excel/CSV</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3 justify-end">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleAddProgramme}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Programme</span>
          </button>
        </div>

        {/* Toast Messages */}
        <AnimatePresence>
          {(importError || importSuccess) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${importError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}
            >
              {importError ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
              <p className={`text-sm ${importError ? 'text-red-700' : 'text-green-700'}`}>{importError || importSuccess}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programmes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <FilterSelect
                value={filterStudyMode}
                onChange={setFilterStudyMode}
                options={[{ value: 'all', label: 'All Study Modes' }, ...uniqueStudyModes.map(m => ({ value: m, label: m }))]}
                placeholder="Study Mode"
                icon={Clock}
              />
              <FilterSelect
                value={filterProgrammeType}
                onChange={setFilterProgrammeType}
                options={[{ value: 'all', label: 'All Programme Types' }, ...uniqueProgrammeTypes.map(t => ({ value: t, label: t }))]}
                placeholder="Programme Type"
                icon={Tag}
              />
            </div>
          </div>
        </div>

        {/* Programmes Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PROGRAMME</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">TYPE</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DURATION</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No programmes found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((prog) => {
                    const studyMode = prog.study_mode || (prog.category === 'odl' ? 'odel' : 'full time');
                    const programmeType = prog.programme_type || (prog.category === 'upgrading' ? 'upgrading' : 'generic');
                    return (
                      <tr key={prog.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{prog.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{prog.department}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStudyModeBadgeStyle(studyMode)}`}>
                              {studyMode}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getProgrammeTypeBadgeStyle(programmeType)}`}>
                              {programmeType}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{prog.duration || '4 Years'} </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewProgramme(prog)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditProgramme(prog)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(prog)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* Pagination */}
          {filteredProgrammes.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProgrammes.length)} of {filteredProgrammes.length} results
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}
      {/* Import Modal - Same as before but keep the structure */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowImportModal(false); setFileData([]); setImportPreview([]); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-6 py-5 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Import Programmes</h2>
                    <p className="text-sm text-gray-500 mt-1">Upload Excel or CSV file to import programmes in bulk</p>
                  </div>
                  <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg mb-4">
                  <Download className="w-4 h-4" /> Download Template
                </button>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="text-sm text-gray-600">Click to upload Excel or CSV file</span>
                    <span className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv</span>
                  </label>
                </div>
                {importPreview.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Preview (first 5 rows)</h3>
                    <div className="overflow-x-auto bg-gray-50 rounded-xl">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            {Object.keys(importPreview[0]).map((key) => (
                              <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((val: any, i) => (
                                <td key={i} className="px-3 py-2 text-gray-600">
                                  {String(val).substring(0, 30)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Total rows to import: {fileData.length}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 flex-shrink-0 bg-white rounded-b-2xl">
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  Cancel
                </button>
                <button 
                  onClick={handleImportFromFile} 
                  disabled={fileData.length === 0 || importing}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                  Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Programme Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-6 py-5 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Add New Programme</h2>
                    <p className="text-sm text-gray-500 mt-1">Fill in the programme details below</p>
                  </div>
                  <button onClick={() => { setShowAddModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programme Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programme Code</label>
                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all uppercase" />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.duration}
                      onChange={(value) => setFormData({ ...formData, duration: value })}
                      options={[
                        { value: '1 Year', label: '1 Year' },
                        { value: '2 Years', label: '2 Years' },
                        { value: '3 Years', label: '3 Years' },
                        { value: '4 Years', label: '4 Years' },
                        { value: '5 Years', label: '5 Years' },
                      ]}
                      placeholder="Select Duration"
                      label="Duration"
                      required
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value })}
                      options={[
                        { value: 'undergraduate', label: 'Undergraduate' },
                        { value: 'postgraduate', label: 'Postgraduate' },
                        { value: 'diploma', label: 'Diploma' },
                        { value: 'certificate', label: 'Certificate' },
                      ]}
                      placeholder="Select Category"
                      label="Category"
                      required
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.programme_type}
                      onChange={(value) => setFormData({ ...formData, programme_type: value })}
                      options={[
                        { value: 'generic', label: 'Generic' },
                        { value: 'upgrading', label: 'Upgrading' },
                        { value: 'non-generic', label: 'Non-Generic' },
                      ]}
                      placeholder="Select Programme Type"
                      label="Programme Type"
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.study_mode}
                      onChange={(value) => setFormData({ ...formData, study_mode: value })}
                      options={[
                        { value: 'full time', label: 'Full Time' },
                        { value: 'weekend', label: 'Weekend' },
                        { value: 'evening', label: 'Evening' },
                        { value: 'odel', label: 'ODeL' },
                      ]}
                      placeholder="Select Study Mode"
                      label="Study Mode"
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.school}
                      onChange={(value) => setFormData({ ...formData, school: value })}
                      options={[
                        { value: 'Faculty of Education', label: 'Faculty of Education' },
                        { value: 'Faculty of Humanities and Social Sciences', label: 'Faculty of Humanities and Social Sciences' },
                        { value: 'Faculty of Environmental Sciences', label: 'Faculty of Environmental Sciences' },
                        { value: 'Faculty of Health Sciences', label: 'Faculty of Health Sciences' },
                        { value: 'Faculty of Science, Technology and Innovation', label: 'Faculty of Science, Technology and Innovation' },
                        { value: 'Faculty of Tourism, Hospitality and Management', label: 'Faculty of Tourism, Hospitality and Management' },
                      ]}
                      placeholder="Select School/Faculty"
                      label="School/Faculty"
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.department}
                      onChange={(value) => setFormData({ ...formData, department: value })}
                      options={departments.map(dept => ({ value: dept.name, label: dept.name }))}
                      placeholder="Select Department"
                      label="Department"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quota</label>
                    <input type="number" value={formData.quota} onChange={(e) => setFormData({ ...formData, quota: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
                      <span className="text-sm text-gray-700">Programme is active</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entry Requirements</label>
                    <textarea value={formData.entry_requirements} onChange={(e) => setFormData({ ...formData, entry_requirements: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0 bg-white rounded-b-2xl">
                <button onClick={() => { setShowAddModal(false); resetForm(); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveProgramme} disabled={saving || !formData.name || !formData.department || !formData.duration} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add Programme'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Programme Modal - Similar to Add Modal */}
      <AnimatePresence>
        {showEditModal && editingProgramme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowEditModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-6 py-5 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Edit Programme</h2>
                    <p className="text-sm text-gray-500 mt-1">Update programme details</p>
                  </div>
                  <button onClick={() => { setShowEditModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programme Name <span className="text-red-500">*</span></label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programme Code</label>
                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all uppercase" />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.duration}
                      onChange={(value) => setFormData({ ...formData, duration: value })}
                      options={[
                        { value: '1 Year', label: '1 Year' },
                        { value: '2 Years', label: '2 Years' },
                        { value: '3 Years', label: '3 Years' },
                        { value: '4 Years', label: '4 Years' },
                        { value: '5 Years', label: '5 Years' },
                      ]}
                      placeholder="Select Duration"
                      label="Duration"
                      required
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.category}
                      onChange={(value) => setFormData({ ...formData, category: value })}
                      options={[
                        { value: 'undergraduate', label: 'Undergraduate' },
                        { value: 'postgraduate', label: 'Postgraduate' },
                        { value: 'diploma', label: 'Diploma' },
                        { value: 'certificate', label: 'Certificate' },
                      ]}
                      placeholder="Select Category"
                      label="Category"
                      required
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.programme_type}
                      onChange={(value) => setFormData({ ...formData, programme_type: value })}
                      options={[
                        { value: 'generic', label: 'Generic' },
                        { value: 'upgrading', label: 'Upgrading' },
                        { value: 'non-generic', label: 'Non-Generic' },
                      ]}
                      placeholder="Select Programme Type"
                      label="Programme Type"
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.study_mode}
                      onChange={(value) => setFormData({ ...formData, study_mode: value })}
                      options={[
                        { value: 'full time', label: 'Full Time' },
                        { value: 'weekend', label: 'Weekend' },
                        { value: 'evening', label: 'Evening' },
                        { value: 'odel', label: 'ODeL' },
                      ]}
                      placeholder="Select Study Mode"
                      label="Study Mode"
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.school}
                      onChange={(value) => setFormData({ ...formData, school: value })}
                      options={[
                        { value: 'Faculty of Education', label: 'Faculty of Education' },
                        { value: 'Faculty of Humanities and Social Sciences', label: 'Faculty of Humanities and Social Sciences' },
                        { value: 'Faculty of Environmental Sciences', label: 'Faculty of Environmental Sciences' },
                        { value: 'Faculty of Health Sciences', label: 'Faculty of Health Sciences' },
                        { value: 'Faculty of Science, Technology and Innovation', label: 'Faculty of Science, Technology and Innovation' },
                        { value: 'Faculty of Tourism, Hospitality and Management', label: 'Faculty of Tourism, Hospitality and Management' },
                      ]}
                      placeholder="Select School/Faculty"
                      label="School/Faculty"
                    />
                  </div>
                  <div>
                    <StyledSelect
                      value={formData.department}
                      onChange={(value) => setFormData({ ...formData, department: value })}
                      options={departments.map(dept => ({ value: dept.name, label: dept.name }))}
                      placeholder="Select Department"
                      label="Department"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quota</label>
                    <input type="number" value={formData.quota} onChange={(e) => setFormData({ ...formData, quota: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
                      <span className="text-sm text-gray-700">Programme is active</span>
                    </label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entry Requirements</label>
                    <textarea value={formData.entry_requirements} onChange={(e) => setFormData({ ...formData, entry_requirements: e.target.value })} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all" />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0 bg-white rounded-b-2xl">
                <button onClick={() => { setShowEditModal(false); resetForm(); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveProgramme} disabled={saving || !formData.name || !formData.department || !formData.duration} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Programme'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Programme Modal */}
      <AnimatePresence>
        {showViewModal && selectedProgramme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowViewModal(false); setSelectedProgramme(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-6 py-5 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Programme Details</h2>
                    <p className="text-sm text-gray-500 mt-1">Complete programme information</p>
                  </div>
                  <button onClick={() => { setShowViewModal(false); setSelectedProgramme(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Programme Name</label>
                    <p className="text-gray-900 mt-1 font-medium text-lg">{selectedProgramme.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Code</label>
                    <p className="text-gray-900 mt-1 font-mono text-sm">{selectedProgramme.code || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Duration</label>
                    <p className="text-gray-900 mt-1">{selectedProgramme.duration}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
                    <p className="text-gray-900 mt-1 capitalize">{selectedProgramme.category}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Programme Type</label>
                    <p className="text-gray-900 mt-1 capitalize">{selectedProgramme.programme_type || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Study Mode</label>
                    <p className="text-gray-900 mt-1 capitalize">{selectedProgramme.study_mode || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Department</label>
                    <p className="text-gray-900 mt-1">{selectedProgramme.department}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">School/Faculty</label>
                    <p className="text-gray-900 mt-1">{selectedProgramme.school || selectedProgramme.department}</p>
                  </div>
                  {selectedProgramme.quota && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase">Quota</label>
                      <p className="text-gray-900 mt-1">{selectedProgramme.quota}</p>
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
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                    <p className="text-gray-700 mt-1 text-sm">{selectedProgramme.description || 'No description available'}</p>
                  </div>
                  {selectedProgramme.entry_requirements && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">Entry Requirements</label>
                      <p className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">{selectedProgramme.entry_requirements}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0 bg-white rounded-b-2xl">
                <button onClick={() => { setShowViewModal(false); setSelectedProgramme(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Close
                </button>
                <button onClick={() => { setShowViewModal(false); handleEditProgramme(selectedProgramme); }} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all">
                  Edit Programme
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedProgramme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => { setShowDeleteModal(false); setSelectedProgramme(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full"><Trash2 className="w-5 h-5 text-red-600" /></div>
                  <div><h2 className="text-lg font-semibold text-gray-900">Delete Programme</h2><p className="text-sm text-gray-500 mt-1">This action cannot be undone</p></div>
                </div>
              </div>
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div>
                <p className="text-gray-700 font-medium mb-2">Are you sure you want to delete this programme?</p>
                <p className="text-gray-500 text-sm">"{selectedProgramme.name}" will be permanently removed.</p>
              </div>
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setSelectedProgramme(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteProgramme} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}