'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Upload, Trash2, Eye, CheckCircle, ArrowRight, 
  Plus, X, Download, Save, Sparkles, Shield, AlertTriangle,
  Scan, Loader2, Smartphone, FileWarning, ChevronLeft,
  Menu, Grid3x3, List
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface DocumentRecord {
  id?: number;
  document_name: string;
  document_type: string;
  file_path?: string;
  file?: File | null;
  previewUrl?: string;
  uploaded?: boolean;
  file_size?: number;
  file_content?: string; // base64 content
  ml_classification?: {
    suggested_type: string;
    confidence: number;
    is_valid: boolean;
    extracted_info?: any;
  };
}

interface MLClassificationResult {
  success: boolean;
  document_type: string;
  confidence: number;
  is_valid: boolean;
  extracted_info?: {
    name?: string;
    date?: string;
    institution?: string;
    document_number?: string;
  };
  message?: string;
}

export default function ApplicationDocumentsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocType, setNewDocType] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // ML State
  const [mlProcessing, setMlProcessing] = useState(false);
  const [mlSuggestion, setMlSuggestion] = useState<MLClassificationResult | null>(null);
  const [showMLSuggestion, setShowMLSuggestion] = useState(false);
  const [autoClassifyEnabled, setAutoClassifyEnabled] = useState(true);

  // Document type options with ML hints
  const documentTypes = [
    'Curriculum Vitae (CV)',
    'Copy of ID / Passport',
    'MSCE Certificate',
    'Bachelor\'s Degree Certificate',
    'Master\'s Degree Certificate',
    'Transcript',
    'Recommendation Letter',
    'Other'
  ];

  // Map document type to field name for API
  const getDocumentFieldName = (docType: string): string | null => {
    if (docType === 'MSCE Certificate') return 'msce';
    if (docType === 'Copy of ID / Passport') return 'id_card';
    if (docType === 'Payment Receipt') return 'payment_proof';
    if (docType === 'Bachelor\'s Degree Certificate') return 'bachelor_certificate';
    if (docType === 'Master\'s Degree Certificate') return 'masters_certificate';
    if (docType === 'Transcript') return 'transcript';
    return null;
  };

  // Helper to update completion flag
  const updateCompletionFlag = (hasDocuments: boolean) => {
    if (hasDocuments) {
      localStorage.setItem('documentsCompleted', 'true');
      localStorage.setItem('documentsSaved', 'true');
      sessionStorage.setItem('documentsCompleted', 'true');
    } else {
      localStorage.removeItem('documentsCompleted');
      localStorage.removeItem('documentsSaved');
    }
  };

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchCurrentUser(storedToken);
    
    // Load ML preference
    const savedPref = localStorage.getItem('auto_classify_documents');
    if (savedPref !== null) {
      setAutoClassifyEnabled(savedPref === 'true');
    }
    
    // Load view mode preference
    const savedViewMode = localStorage.getItem('documents_view_mode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, [router]);

  // Fetch current user to get applicant ID
  const fetchCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        const userData = await res.json();
        const userId = userData.id;
        setApplicantId(userId);
        await loadDocuments(authToken, userId);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError('Failed to load user information');
      setLoading(false);
    }
  };

  // Load documents from API (database storage)
  const loadDocuments = async (authToken: string, applicantId: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/documents/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const formattedDocs: DocumentRecord[] = [];
          
          // Check for each document type in the database response
          if (data.data.msce && data.data.msce.base64) {
            formattedDocs.push({
              id: Date.now() + 1,
              document_name: 'MSCE Certificate',
              document_type: 'MSCE Certificate',
              file_path: data.data.msce.path,
              uploaded: true,
              file_size: data.data.msce.size,
              file_content: data.data.msce.base64,
            });
          }
          
          if (data.data.id_card && data.data.id_card.base64) {
            formattedDocs.push({
              id: Date.now() + 2,
              document_name: 'National ID',
              document_type: 'Copy of ID / Passport',
              file_path: data.data.id_card.path,
              uploaded: true,
              file_size: data.data.id_card.size,
              file_content: data.data.id_card.base64,
            });
          }
          
          if (data.data.payment_proof && data.data.payment_proof.base64) {
            formattedDocs.push({
              id: Date.now() + 3,
              document_name: 'Payment Proof',
              document_type: 'Payment Receipt',
              file_path: data.data.payment_proof.path,
              uploaded: true,
              file_size: data.data.payment_proof.size,
              file_content: data.data.payment_proof.base64,
            });
          }
          
          setDocuments(formattedDocs);
          localStorage.setItem('application_documents', JSON.stringify(formattedDocs));
          updateCompletionFlag(formattedDocs.length > 0);
        }
      } else {
        const saved = localStorage.getItem('application_documents');
        if (saved) {
          const savedDocs = JSON.parse(saved);
          setDocuments(savedDocs);
          updateCompletionFlag(savedDocs.length > 0);
        } else {
          updateCompletionFlag(false);
        }
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      const saved = localStorage.getItem('application_documents');
      if (saved) {
        const savedDocs = JSON.parse(saved);
        setDocuments(savedDocs);
        updateCompletionFlag(savedDocs.length > 0);
      } else {
        updateCompletionFlag(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // ML Document Classification
  const classifyDocumentWithML = async (file: File): Promise<MLClassificationResult | null> => {
    if (!autoClassifyEnabled) return null;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/ml/classify-document/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        console.error('ML classification failed:', response.status);
        const fileName = file.name.toLowerCase();
        let documentType = "unknown";
        if (fileName.includes('cv') || fileName.includes('resume')) documentType = "Curriculum Vitae (CV)";
        else if (fileName.includes('id') || fileName.includes('passport')) documentType = "Copy of ID / Passport";
        else if (fileName.includes('certificate')) documentType = "MSCE Certificate";
        else if (fileName.includes('transcript')) documentType = "Transcript";
        
        return {
          success: true,
          document_type: documentType,
          confidence: 0.5,
          is_valid: documentType !== "unknown",
          message: "Fallback classification based on filename"
        };
      }
      
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          document_type: data.document_type,
          confidence: data.confidence,
          is_valid: data.document_type !== 'unknown',
          extracted_info: data.extracted_preview,
          message: data.message
        };
      }
      return null;
    } catch (err) {
      console.error('ML classification error:', err);
      return null;
    }
  };

  // Document Validation
  const validateDocumentContent = async (file: File, expectedType: string): Promise<{ isValid: boolean; confidence: number; message: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('expected_type', expectedType);
      
      const response = await fetch(`${API_BASE_URL}/ml/validate-document/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        console.error('Validation failed:', response.status);
        const fileName = file.name.toLowerCase();
        let isValid = false;
        if (expectedType === "MSCE Certificate" && fileName.includes('certificate')) isValid = true;
        else if (expectedType === "Copy of ID / Passport" && (fileName.includes('id') || fileName.includes('passport'))) isValid = true;
        else if (expectedType === "Curriculum Vitae (CV)" && (fileName.includes('cv') || fileName.includes('resume'))) isValid = true;
        else isValid = true;
        
        return { isValid, confidence: 0.5, message: 'Validation based on filename' };
      }
      
      const data = await response.json();
      
      if (data.success) {
        return {
          isValid: data.is_valid,
          confidence: data.confidence,
          message: data.message
        };
      }
      return { isValid: false, confidence: 0, message: data.message || 'Validation failed' };
    } catch (err) {
      console.error('Document validation error:', err);
      return { isValid: true, confidence: 0.5, message: 'Validation service unavailable, accepting document' };
    }
  };

  // Upload document to API (database storage)
  const uploadDocumentToAPI = async (doc: DocumentRecord): Promise<boolean> => {
    if (!token || !applicantId || !doc.file) return false;

    const formData = new FormData();
    const field = getDocumentFieldName(doc.document_type);
    if (!field) return false;
    
    formData.append(field, doc.file);

    try {
      const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          doc.uploaded = true;
          // Store base64 content if returned
          if (data.data && data.data[field] && data.data[field].base64) {
            doc.file_content = data.data[field].base64;
          }
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('API upload failed:', err);
      return false;
    }
  };

  // Delete document from API (database storage)
  const deleteDocumentFromAPI = async (doc: DocumentRecord): Promise<boolean> => {
    if (!token || !applicantId) return false;

    const field = getDocumentFieldName(doc.document_type);
    if (!field) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/documents/${field}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (err) {
      console.error('API delete failed:', err);
      return false;
    }
  };

  // Handle file selection with ML classification
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        setError('File size must be less than 2MB');
        e.target.value = '';
        return;
      }
      
      setNewDocFile(file);
      setMlSuggestion(null);
      setShowMLSuggestion(false);
      setError(null);
      
      if (autoClassifyEnabled) {
        setMlProcessing(true);
        const classification = await classifyDocumentWithML(file);
        
        if (classification && classification.success && classification.confidence > 0.6) {
          setMlSuggestion(classification);
          setShowMLSuggestion(true);
          
          if (classification.confidence > 0.8 && documentTypes.includes(classification.document_type)) {
            setNewDocType(classification.document_type);
            setSuccess(`AI identified this as a ${classification.document_type} (${(classification.confidence * 100).toFixed(0)}% confidence)`);
            setTimeout(() => setSuccess(null), 3000);
          } else {
            setSuccess(`AI suggests this might be a ${classification.document_type}. Please confirm the document type.`);
            setTimeout(() => setSuccess(null), 4000);
          }
        } else if (classification && !classification.is_valid) {
          setError('This document does not appear to be a valid supporting document. Please check the file and try again.');
          setNewDocFile(null);
          e.target.value = '';
        }
        setMlProcessing(false);
      }
    }
  };

  const handleAddDocument = async () => {
    if (!newDocType) {
      setError('Please select a document type');
      return;
    }
    if (!newDocFile) {
      setError('Please select a file to upload');
      return;
    }
    
    const validation = await validateDocumentContent(newDocFile, newDocType);
    if (!validation.isValid && validation.confidence < 0.5) {
      setError(`Document validation failed: ${validation.message}. Please ensure you're uploading the correct document type.`);
      return;
    }
    
    setUploading(true);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(newDocFile);
    
    const newDoc: DocumentRecord = {
      id: Date.now(),
      document_name: newDocType,
      document_type: newDocType,
      file: newDocFile,
      previewUrl: previewUrl,
      uploaded: false,
      file_size: newDocFile.size,
      ml_classification: mlSuggestion ? {
        suggested_type: mlSuggestion.document_type,
        confidence: mlSuggestion.confidence,
        is_valid: mlSuggestion.is_valid,
        extracted_info: mlSuggestion.extracted_info
      } : undefined
    };
    
    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    
    const uploadSuccess = await uploadDocumentToAPI(newDoc);
    
    if (uploadSuccess) {
      setSuccess(`Document uploaded and verified as ${newDocType}!`);
      updateCompletionFlag(true);
    } else {
      localStorage.setItem('application_documents', JSON.stringify(updatedDocs));
      setSuccess('Document saved locally. Will sync when online.');
      updateCompletionFlag(true);
    }
    
    setNewDocType('');
    setNewDocFile(null);
    setMlSuggestion(null);
    setShowMLSuggestion(false);
    setShowAddModal(false);
    setUploading(false);
    
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteDocument = async (id: number) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    if (!confirm(`Delete "${doc.document_name}"?`)) return;
    
    const apiDeleted = await deleteDocumentFromAPI(doc);
    
    const updatedDocs = documents.filter(d => d.id !== id);
    setDocuments(updatedDocs);
    localStorage.setItem('application_documents', JSON.stringify(updatedDocs));
    
    updateCompletionFlag(updatedDocs.length > 0);
    
    if (apiDeleted) {
      setSuccess('Document deleted from database successfully');
    } else {
      setSuccess('Document removed from local storage');
    }
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleViewDocument = (doc: DocumentRecord) => {
    if (doc.file_content) {
      // Display from base64 data in database
      const byteCharacters = atob(doc.file_content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } else if (doc.previewUrl) {
      window.open(doc.previewUrl, '_blank');
    } else if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } else if (doc.file_path) {
      const fileUrl = `${API_BASE_URL.replace('/api', '')}/media/${doc.file_path}`;
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    if (doc.file_content) {
      // Download from base64 data
      const byteCharacters = atob(doc.file_content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.document_name.replace(/\s+/g, '_') + '.pdf';
      link.click();
      URL.revokeObjectURL(url);
    } else if (doc.previewUrl) {
      const link = document.createElement('a');
      link.href = doc.previewUrl;
      link.download = doc.document_name.replace(/\s+/g, '_') + '.pdf';
      link.click();
    } else if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file.name;
      link.click();
      URL.revokeObjectURL(url);
    } else if (doc.file_path) {
      const fileUrl = `${API_BASE_URL.replace('/api', '')}/media/${doc.file_path}`;
      window.open(fileUrl, '_blank');
    }
  };
  
  const handleContinue = () => {
    if (documents.length === 0) {
      setError('Please add at least one supporting document before continuing');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('documentsCompleted', 'true');
      localStorage.setItem('documentsSaved', 'true');
      sessionStorage.setItem('documentsCompleted', 'true');
      window.dispatchEvent(new StorageEvent('storage', { key: 'documentsCompleted' }));
    }
    router.push('/application/application-fees');
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    localStorage.setItem('documents_view_mode', newMode);
  };

  // ML Suggestion Modal Component
  const MLSuggestionModal = () => {
    if (!showMLSuggestion || !mlSuggestion) return null;
    
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full shadow-xl mx-4">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                mlSuggestion.confidence > 0.7 ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <Sparkles className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  mlSuggestion.confidence > 0.7 ? 'text-green-600' : 'text-yellow-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">AI Document Analysis</h3>
                <p className="text-xs sm:text-sm text-gray-500">We analyzed your document</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                  <span className="text-xs sm:text-sm text-gray-600">Suggested Document Type:</span>
                  <span className="font-semibold text-gray-800 text-sm sm:text-base">{mlSuggestion.document_type}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600">Confidence:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          mlSuggestion.confidence > 0.7 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${mlSuggestion.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-medium">
                      {(mlSuggestion.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-amber-800">
                  {mlSuggestion.confidence > 0.7 
                    ? "✓ High confidence match. This document appears to be correct."
                    : "⚠️ Low confidence. Please verify this is the correct document type."}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowMLSuggestion(false);
                  setNewDocFile(null);
                  const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                className="order-2 sm:order-1 flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Reject Suggestion
              </button>
              <button
                onClick={() => {
                  setNewDocType(mlSuggestion.document_type);
                  setShowMLSuggestion(false);
                  setSuccess(`Document type set to: ${mlSuggestion.document_type}`);
                  setTimeout(() => setSuccess(null), 2000);
                }}
                className="order-1 sm:order-2 flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Accept Suggestion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <MLSuggestionModal />
      
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Documents Header with ML Badge */}
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">APPLICATION DOCUMENTS</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  <span className="text-[10px] sm:text-xs font-medium text-purple-700">AI Document Classifier</span>
                </div>
                <button
                  onClick={() => {
                    const newValue = !autoClassifyEnabled;
                    setAutoClassifyEnabled(newValue);
                    localStorage.setItem('auto_classify_documents', String(newValue));
                  }}
                  className={`text-[10px] sm:text-xs px-2 py-1 rounded-full ${
                    autoClassifyEnabled 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {autoClassifyEnabled ? 'AI Auto-Classify ON' : 'AI Auto-Classify OFF'}
                </button>
                <button
                  onClick={toggleViewMode}
                  className="p-1.5 sm:p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title={viewMode === 'list' ? 'Grid view' : 'List view'}
                >
                  {viewMode === 'list' ? (
                    <Grid3x3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg mt-3">
              <p className="text-xs sm:text-sm text-gray-700">
                Upload all required supporting documents. Our AI will automatically classify and validate your documents.
                Ensure that each file is clear, legible, and in the correct format.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Alerts */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 sm:gap-3">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Supporting Documents Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="font-semibold text-gray-800">Supporting Documents</h3>
                <button
                  onClick={() => {
                    setNewDocType('');
                    setNewDocFile(null);
                    setMlSuggestion(null);
                    setShowMLSuggestion(false);
                    setShowAddModal(true);
                  }}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium disabled:opacity-50 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Document
                </button>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm sm:text-base text-gray-500">No supporting documents added yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Add a document to get started</p>
                </div>
              ) : viewMode === 'grid' ? (
                // Grid view for mobile
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-3 hover:border-green-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 mb-1">
                            <h4 className="font-medium text-gray-800 text-sm truncate">{doc.document_name}</h4>
                            {doc.file_size && (
                              <span className="text-[10px] text-gray-400">({formatFileSize(doc.file_size)})</span>
                            )}
                          </div>
                          {doc.ml_classification && doc.ml_classification.confidence > 0.7 && (
                            <span className="inline-flex text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full items-center gap-0.5">
                              <Sparkles className="w-2 h-2" />
                              AI Verified
                            </span>
                          )}
                          <p className="text-[10px] text-gray-500 mt-1">
                            {doc.uploaded ? '✓ Saved to database' : '📄 Saved locally'}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {(doc.file_content || doc.file || doc.previewUrl || doc.file_path) && (
                            <>
                              <button
                                onClick={() => handleViewDocument(doc)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Download document"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc.id!)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // List view for desktop
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-green-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FileText className="w-4 h-4 text-green-600" />
                            </div>
                            <h4 className="font-medium text-gray-800 text-sm sm:text-base">{doc.document_name}</h4>
                            {doc.file_size && (
                              <span className="text-[10px] sm:text-xs text-gray-400">
                                ({formatFileSize(doc.file_size)})
                              </span>
                            )}
                            {doc.ml_classification && doc.ml_classification.confidence > 0.7 && (
                              <span className="text-[10px] sm:text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Sparkles className="w-2 h-2 sm:w-3 sm:h-3" />
                                AI Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {doc.uploaded ? '✓ Saved to database' : '📄 Saved locally'}
                          </p>
                        </div>
                        <div className="flex gap-2 justify-start sm:justify-end">
                          {(doc.file_content || doc.file || doc.previewUrl || doc.file_path) && (
                            <>
                              <button
                                onClick={() => handleViewDocument(doc)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="Download document"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc.id!)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete document"
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

            {/* Navigation Buttons */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={() => router.push('/application/teacher-subjects')}
                className="px-4 py-2 sm:px-6 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 font-medium text-sm sm:text-base order-2 sm:order-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={documents.length === 0}
                className={`px-5 py-2 sm:px-8 sm:py-3 rounded-lg flex items-center justify-center gap-2 font-medium text-sm sm:text-base order-1 sm:order-2 ${
                  documents.length > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="w-4 h-5" />
              </button>
            </div>
            
            {documents.length === 0 && (
              <p className="text-sm text-red-500 text-center mt-4">
                Please add at least one supporting document to continue
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Document Modal - Mobile Responsive */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Add Supporting Document</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDocType('');
                  setNewDocFile(null);
                  setMlSuggestion(null);
                  setShowMLSuggestion(false);
                  setError(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                >
                  <option value="">Select...</option>
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Upload Document *
                </label>
                <div className={`mt-1 flex justify-center px-4 py-4 sm:px-6 sm:pt-5 sm:pb-6 border-2 border-dashed rounded-lg ${
                  mlProcessing 
                    ? 'border-purple-400 bg-purple-50' 
                    : 'border-gray-300 hover:border-green-400'
                }`}>
                  <div className="space-y-2 text-center">
                    {mlProcessing ? (
                      <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-purple-600 animate-spin" />
                        <p className="text-xs sm:text-sm text-purple-600 mt-2">AI analyzing document...</p>
                        <p className="text-[10px] sm:text-xs text-purple-500">Classifying document type</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                        <div className="flex flex-col sm:flex-row text-xs sm:text-sm text-gray-600">
                          <label
                            htmlFor="doc-file-input"
                            className="cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="doc-file-input"
                              name="document"
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileSelection}
                              className="sr-only"
                            />
                          </label>
                          <p className="sm:pl-1">or drag and drop</p>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          PDF, JPG, or PNG files, max size 2MB
                        </p>
                        {newDocFile && !mlProcessing && (
                          <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center justify-center gap-2">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                            <span className="text-xs sm:text-sm text-green-700 truncate max-w-[150px] sm:max-w-none">
                              {newDocFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setNewDocFile(null);
                                setMlSuggestion(null);
                                const input = document.getElementById('doc-file-input') as HTMLInputElement;
                                if (input) input.value = '';
                              }}
                              className="text-red-500 hover:text-red-700 text-[10px] sm:text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  AI will automatically classify your document and verify it's the correct type
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 pt-0">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDocType('');
                  setNewDocFile(null);
                  setMlSuggestion(null);
                  setShowMLSuggestion(false);
                  setError(null);
                }}
                className="order-2 sm:order-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={uploading || !newDocFile || !newDocType}
                className="order-1 sm:order-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Add Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}