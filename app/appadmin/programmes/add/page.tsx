'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  BookOpen,
  Building,
  Calendar,
  Tag,
  Hash,
  Save,
  ArrowLeft,
  ChevronDown,
  School,
  Clock,
  Layers,
  Upload,
  FileSpreadsheet,
  Download,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface Programme {
  id: number;
  name: string;
  description: string;
  department: string;
  department_id?: number;
  duration: string;
  category: string;
  code: string;
  is_active: boolean;
  study_mode?: string;
  programme_type?: string;
  school?: string;
  created_at?: string;
  updated_at?: string;
  entry_requirements?: string;
  quota?: number;
}

// School/Faculty mapping
const schoolMapping: Record<string, string> = {
  'Faculty of Education': 'Faculty of Education',
  'Education': 'Faculty of Education',
  'Faculty of Humanities and Social Sciences': 'Faculty of Humanities and Social Sciences',
  'Humanities and Social Sciences': 'Faculty of Humanities and Social Sciences',
  'Faculty of Environmental Sciences': 'Faculty of Environmental Sciences',
  'Environmental Sciences': 'Faculty of Environmental Sciences',
  'Faculty of Health Sciences': 'Faculty of Health Sciences',
  'Health Sciences': 'Faculty of Health Sciences',
  'Faculty of Science, Technology and Innovation': 'Faculty of Science, Technology and Innovation',
  'Science, Technology and Innovation': 'Faculty of Science, Technology and Innovation',
  'Faculty of Tourism, Hospitality and Management': 'Faculty of Tourism, Hospitality and Management',
  'Tourism, Hospitality and Management': 'Faculty of Tourism, Hospitality and Management',
};

// Determine programme type from name
const determineProgrammeType = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('upgrading') || lowerName.includes('upgrad')) {
    return 'upgrading';
  }
  if (lowerName.includes('honours') || lowerName.includes('honors')) {
    return 'non-generic';
  }
  return 'generic';
};

// Determine study mode from name or default
const determineStudyMode = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('weekend')) return 'weekend';
  if (lowerName.includes('evening')) return 'evening';
  if (lowerName.includes('online') || lowerName.includes('odel')) return 'odel';
  return 'full time';
};

// Extract category from programme name and type
const determineCategory = (programmeType: string, duration: string): string => {
  if (programmeType === 'upgrading') return 'undergraduate';
  if (duration && (duration === '5 Years' || duration === '5 years')) return 'postgraduate';
  return 'undergraduate';
};

export default function AddOrEditProgrammePage() {
  const router = useRouter();
  const params = useParams();
  const programmeId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [code, setCode] = useState('');
  const [school, setSchool] = useState('');
  const [studyMode, setStudyMode] = useState('');
  const [programmeType, setProgrammeType] = useState('');
  const [entryRequirements, setEntryRequirements] = useState('');
  const [quota, setQuota] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [fileData, setFileData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Authentication check using JWT
  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Checking authentication with JWT...');
      
      const token = getToken();
      
      if (!token) {
        console.log('❌ No token found');
        setCheckingAuth(false);
        handleAuthFailure();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 Auth response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('📊 User data:', userData);
        
        if (userData.is_authenticated || userData.id) {
          console.log('✅ User authenticated');
          setUser(userData);
          setCheckingAuth(false);
          await fetchDepartments(token);
          if (programmeId) {
            await fetchProgramme(token);
          }
        } else {
          console.log('❌ User not authenticated');
          setCheckingAuth(false);
          handleAuthFailure();
        }
      } else if (response.status === 401) {
        console.log('❌ Token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCheckingAuth(false);
        handleAuthFailure();
      } else {
        console.log('❌ Auth failed with status:', response.status);
        setCheckingAuth(false);
        handleAuthFailure();
      }
    } catch (error: any) {
      console.error('💥 Auth error:', error);
      setError('Unable to connect to server. Please ensure Django is running on port 8000.');
      setCheckingAuth(false);
    }
  };

  const handleAuthFailure = () => {
    setError('Please log in to continue');
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  const fetchDepartments = async (token: string) => {
    try {
      setDepartmentsLoading(true);
      console.log('📚 Fetching departments...');
      
      const response = await fetch(`${API_BASE_URL}/departments/`, {
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
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch departments: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.success && Array.isArray(data.data)) {
        setDepartments(data.data);
      } else if (data && Array.isArray(data)) {
        setDepartments(data);
      } else if (data && data.departments && Array.isArray(data.departments)) {
        setDepartments(data.departments);
      } else {
        console.error('Unexpected departments response format:', data);
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments. Please try again.');
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const fetchProgramme = async (token: string) => {
    if (!programmeId) return;
    
    setIsEditing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/programmes/${programmeId}/`, {
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
        handleAuthFailure();
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch programme: ${response.status}`);
      }

      const data = await response.json();
      const programme = data.data || data;
      
      setName(programme.name || '');
      setDescription(programme.description || '');
      setDepartment(programme.department || '');
      setDuration(programme.duration || '');
      setCategory(programme.category || '');
      setCode(programme.code || '');
      setSchool(programme.school || '');
      setStudyMode(programme.study_mode || '');
      setProgrammeType(programme.programme_type || '');
      setEntryRequirements(programme.entry_requirements || '');
      setQuota(programme.quota || '');
      setIsActive(programme.is_active !== undefined ? programme.is_active : true);
    } catch (error: any) {
      console.error('Error fetching programme details:', error);
      setError('Failed to fetch programme details.');
    }
  };

  // Smart file upload handler - detects column format
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
      
      if (parsedData.length === 0) {
        setImportError('No data found in file');
        return;
      }
      
      // Detect which format is being used
      const firstRow = parsedData[0] as any;
      const columns = Object.keys(firstRow);
      
      console.log('📊 Detected columns:', columns);
      
      // Format 1: Template format (Programme Name, Department, Duration, etc.)
      const isTemplateFormat = columns.some(col => 
        col.toLowerCase().includes('programme name')
      );
      
      // Format 2: S/N format (Programme, Duration, Programme Code, etc.)
      const isSNFormat = columns.some(col => 
        col === 'S/N' || col === 'SN' || col === 'Programme'
      );
      
      const mappedData = parsedData.map((row: any) => {
        if (isTemplateFormat) {
          // Map Template format
          return {
            name: row['Programme Name'] || row['name'] || row['PROGRAMME'] || '',
            description: row['Description'] || row['description'] || row['DESCRIPTION'] || '',
            department: row['Department'] || row['department'] || row['FACULTY'] || 'Faculty of Education',
            duration: row['Duration'] || row['duration'] || row['DURATION'] || '4 Years',
            category: row['Category'] || row['category'] || row['CATEGORY'] || 'undergraduate',
            code: row['Code'] || row['code'] || row['PROGRAMME CODE'] || '',
            programme_type: row['Programme Type'] || row['programme_type'] || row['TYPE'] || 'generic',
            study_mode: row['Study Mode'] || row['study_mode'] || row['MODE'] || 'full time',
            school: row['School'] || row['school'] || row['SCHOOL'] || row['Department'] || row['department'] || 'Faculty of Education',
            entry_requirements: row['Entry Requirements'] || row['entry_requirements'] || row['REQUIREMENTS'] || '',
            quota: row['Quota'] || row['quota'] || row['QUOTA'] || null,
          };
        } else {
          // Map S/N format
          let programmeName = row['Programme'] || row['PROGRAMME'] || '';
          let programmeCode = row['Programme Code'] || row['PROGRAMME CODE'] || row['Code'] || '';
          let programmeDuration = row['Duration'] || row['DURATION'] || '4 Years';
          let entryReq = row['Entry Requirements'] || row['ENTRY REQUIREMENTS'] || row['Requirements'] || '';
          let programmeQuota = row['Quota'] || row['QUOTA'] || null;
          
          // Determine faculty/department from programme name
          let faculty = 'Faculty of Education';
          if (programmeName.toLowerCase().includes('nursing')) faculty = 'Faculty of Health Sciences';
          else if (programmeName.toLowerCase().includes('politics') || programmeName.toLowerCase().includes('international') || 
                   programmeName.toLowerCase().includes('development') || programmeName.toLowerCase().includes('theology')) 
            faculty = 'Faculty of Humanities and Social Sciences';
          else if (programmeName.toLowerCase().includes('forestry') || programmeName.toLowerCase().includes('fisheries') ||
                   programmeName.toLowerCase().includes('surveying') || programmeName.toLowerCase().includes('estate') ||
                   programmeName.toLowerCase().includes('planning') || programmeName.toLowerCase().includes('water')) 
            faculty = 'Faculty of Environmental Sciences';
          else if (programmeName.toLowerCase().includes('renewable') || programmeName.toLowerCase().includes('ict')) 
            faculty = 'Faculty of Science, Technology and Innovation';
          else if (programmeName.toLowerCase().includes('tourism') || programmeName.toLowerCase().includes('hospitality') ||
                   programmeName.toLowerCase().includes('culinary') || programmeName.toLowerCase().includes('sports')) 
            faculty = 'Faculty of Tourism, Hospitality and Management';
          
          // Determine programme type from name
          let progType = determineProgrammeType(programmeName);
          let studyModeVal = determineStudyMode(programmeName);
          
          return {
            name: programmeName,
            description: entryReq ? `${programmeName} programme. Entry requirements: ${entryReq}` : `${programmeName} programme at Mzuzu University`,
            department: faculty,
            duration: programmeDuration,
            category: determineCategory(progType, programmeDuration),
            code: programmeCode,
            programme_type: progType,
            study_mode: studyModeVal,
            school: faculty,
            entry_requirements: entryReq,
            quota: programmeQuota,
          };
        }
      });
      
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
        'Category': 'undergraduate',
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
      if (!prog.name) {
        failed++;
        continue;
      }

      try {
        let programmeCode = prog.code;
        if (!programmeCode) {
          const words = prog.name.split(' ');
          programmeCode = words.map((word: string) => word[0]?.toUpperCase() || '').join('');
          if (programmeCode.length < 3) {
            programmeCode = prog.name.substring(0, 3).toUpperCase();
          }
        }

        const programmeData = {
          name: prog.name,
          description: prog.description || `${prog.name} programme at Mzuzu University`,
          department: prog.department,
          duration: prog.duration,
          category: prog.category || 'undergraduate',
          code: programmeCode.toUpperCase(),
          is_active: true,
          programme_type: prog.programme_type || determineProgrammeType(prog.name),
          study_mode: prog.study_mode || determineStudyMode(prog.name),
          school: schoolMapping[prog.school] || prog.department || 'Faculty of Education',
        };

        console.log(`📤 Importing programme: ${prog.name}`);

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
          console.log(`✅ Imported: ${prog.name}`);
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to import ${prog.name}:`, errorText);
          failed++;
        }
      } catch (err) {
        console.error(`❌ Error importing ${prog.name}:`, err);
        failed++;
      }
    }

    setImportSuccess(`Import completed! Added: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
    setImporting(false);
    setShowImportModal(false);
    setFileData([]);
    setImportPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => setImportSuccess(''), 5000);
    
    router.push('/appadmin/programmes');
  };

  const generateCode = (programmeName: string) => {
    const words = programmeName.split(' ');
    let code = words.map(word => word[0]?.toUpperCase() || '').join('');
    if (code.length < 3) {
      code = programmeName.substring(0, 3).toUpperCase();
    }
    return code;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!isEditing && !code) {
      setCode(generateCode(newName));
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = getToken();
    if (!token) {
      setError('Please log in to continue');
      router.push('/login');
      return;
    }

    try {
      const payload: any = { 
        name, 
        description, 
        department, 
        duration, 
        category,
        is_active: isActive,
      };
      
      if (code) payload.code = code;
      if (school) payload.school = school;
      if (studyMode) payload.study_mode = studyMode;
      if (programmeType) payload.programme_type = programmeType;

      console.log('🚀 Submitting programme data:', payload);

      let url = `${API_BASE_URL}/programmes/`;
      let method = 'POST';

      if (isEditing && programmeId) {
        url = `${API_BASE_URL}/programmes/${programmeId}/`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
        setTimeout(() => router.push('/login'), 2000);
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || data.detail || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      alert(isEditing ? 'Programme updated successfully!' : 'Programme added successfully!');
      router.push('/appadmin/programmes');

    } catch (error: any) {
      console.error('Error saving programme:', error);
      setError(`Failed to save programme: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Checking Authentication...</h2>
          <p className="text-gray-600 mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/appadmin/programmes')}
            className="inline-flex items-center space-x-2 text-green-700 hover:text-green-800 font-medium mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Programmes</span>
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? 'Edit Programme' : 'Add New Programme'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditing
                    ? 'Update the programme details below.'
                    : 'Fill in the details to create a new programme.'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!isEditing && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Import Excel/CSV</span>
                </button>
              )}
              
              {user && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Welcome, {user.username || user.email || user.first_name}!
                </div>
              )}
            </div>
          </div>
        </div>

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

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
            setShowImportModal(false);
            setFileData([]);
            setImportPreview([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}>
            <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Import Programmes from Excel/CSV</h2>
                  <p className="text-sm text-gray-500 mt-1">Supports both Template format and S/N format with Programme column</p>
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
                      <span className="text-xs text-green-600 mt-2">Accepts Template format OR S/N format with Programme column</span>
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
                            {Object.keys(importPreview[0]).map((key) => (
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

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-md">
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

        {/* Form */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-1 bg-gradient-to-r from-green-600 to-green-700"></div>
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <BookOpen className="w-4 h-4 text-green-600" />
                    <span>Programme Name *</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    required
                    placeholder="Enter programme name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span>Programme Code</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g., BED-ARTS (auto-generated if empty)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition-all duration-200 uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <School className="w-4 h-4 text-green-600" />
                    <span>School / Faculty *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select School/Faculty</option>
                      <option value="Faculty of Education">Faculty of Education</option>
                      <option value="Faculty of Humanities and Social Sciences">Faculty of Humanities and Social Sciences</option>
                      <option value="Faculty of Environmental Sciences">Faculty of Environmental Sciences</option>
                      <option value="Faculty of Health Sciences">Faculty of Health Sciences</option>
                      <option value="Faculty of Science, Technology and Innovation">Faculty of Science, Technology and Innovation</option>
                      <option value="Faculty of Tourism, Hospitality and Management">Faculty of Tourism, Hospitality and Management</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Building className="w-4 h-4 text-green-600" />
                    <span>Department *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      disabled={departmentsLoading || departments.length === 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a department</option>
                      {departmentsLoading ? (
                        <option value="" disabled>Loading departments...</option>
                      ) : (
                        departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  {departments.length === 0 && !departmentsLoading && (
                    <p className="text-sm text-red-600 mt-1">
                      No departments found. Please add departments first.
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span>Duration *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select duration</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                      <option value="3 Years">3 Years</option>
                      <option value="4 Years">4 Years</option>
                      <option value="5 Years">5 Years</option>
                      <option value="6 Years">6 Years</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Layers className="w-4 h-4 text-green-600" />
                    <span>Category *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select category</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="diploma">Diploma</option>
                      <option value="certificate">Certificate</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span>Study Mode *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={studyMode}
                      onChange={(e) => setStudyMode(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select study mode</option>
                      <option value="full time">Full Time</option>
                      <option value="weekend">Weekend</option>
                      <option value="evening">Evening</option>
                      <option value="online">Online</option>
                      <option value="odel">ODeL</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">How the programme is delivered</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <Tag className="w-4 h-4 text-green-600" />
                    <span>Programme Type *</span>
                  </label>
                  <div className="relative">
                    <select
                      value={programmeType}
                      onChange={(e) => setProgrammeType(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="">Select programme type</option>
                      <option value="generic">Generic (4 years)</option>
                      <option value="upgrading">Upgrading (2-3 years)</option>
                      <option value="non-generic">Non-Generic</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Type of programme (Generic, Upgrading, or Non-Generic)</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Status</span>
                  </label>
                  <div className="relative">
                    <select
                      value={isActive ? "active" : "inactive"}
                      onChange={(e) => setIsActive(e.target.value === "active")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Hash className="w-4 h-4 text-green-600" />
                  <span>Programme Description</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter programme description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition-all duration-200 resize-none"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/appadmin/programmes')}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || departmentsLoading || departments.length === 0}
                  className="inline-flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? 'Update Programme' : 'Add Programme'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {departments.length === 0 && !departmentsLoading && user && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>No departments found.</strong> Please{' '}
              <button
                type="button"
                onClick={() => router.push('/appadmin/departments')}
                className="text-green-600 hover:text-green-700 underline font-medium"
              >
                add departments first
              </button>{' '}
              before creating programmes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}