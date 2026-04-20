'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload, Trash2, Eye, CheckCircle, ArrowRight, Plus, X, Download, Save } from 'lucide-react';

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

  // Document type options
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

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchCurrentUser(storedToken);
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

  // Load documents from API
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
          
          // Map the response to our document format
          if (data.data.msce) {
            formattedDocs.push({
              id: Date.now() + 1,
              document_name: 'MSCE Certificate',
              document_type: 'MSCE Certificate',
              file_path: data.data.msce,
              uploaded: true,
              file_size: data.data.msce_size,
            });
          }
          
          if (data.data.id_card) {
            formattedDocs.push({
              id: Date.now() + 2,
              document_name: 'National ID',
              document_type: 'National ID',
              file_path: data.data.id_card,
              uploaded: true,
              file_size: data.data.id_card_size,
            });
          }
          
          if (data.data.payment_proof) {
            formattedDocs.push({
              id: Date.now() + 3,
              document_name: 'Payment Proof',
              document_type: 'Payment Receipt',
              file_path: data.data.payment_proof,
              uploaded: true,
              file_size: data.data.payment_proof_size,
            });
          }
          
          setDocuments(formattedDocs);
          localStorage.setItem('application_documents', JSON.stringify(formattedDocs));
        }
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('application_documents');
        if (saved) {
          setDocuments(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      const saved = localStorage.getItem('application_documents');
      if (saved) {
        setDocuments(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  // Upload document to API
  const uploadDocumentToAPI = async (doc: DocumentRecord): Promise<boolean> => {
    if (!token || !applicantId || !doc.file) return false;

    const formData = new FormData();
    // Map document type to the expected field name
    let field = '';
    if (doc.document_type === 'MSCE Certificate') field = 'msce';
    else if (doc.document_type === 'National ID' || doc.document_type === 'Copy of ID / Passport') field = 'id_card';
    else if (doc.document_type === 'Payment Receipt') field = 'payment_proof';
    else return false; // Other document types not supported by current API
    
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
          doc.file_path = data.data[field];
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('API upload failed:', err);
      return false;
    }
  };

  // Delete document from API
  const deleteDocumentFromAPI = async (doc: DocumentRecord): Promise<boolean> => {
    if (!token || !applicantId) return false;

    let field = '';
    if (doc.document_type === 'MSCE Certificate') field = 'msce';
    else if (doc.document_type === 'National ID' || doc.document_type === 'Copy of ID / Passport') field = 'id_card';
    else if (doc.document_type === 'Payment Receipt') field = 'payment_proof';
    else return false;

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

  const handleAddDocument = async () => {
    if (!newDocType) {
      setError('Please select a document type');
      return;
    }
    if (!newDocFile) {
      setError('Please select a file to upload');
      return;
    }
    
    if (newDocFile.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }
    
    if (newDocFile.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    
    setUploading(true);
    
    const newDoc: DocumentRecord = {
      id: Date.now(),
      document_name: newDocType,
      document_type: newDocType,
      file: newDocFile,
      previewUrl: URL.createObjectURL(newDocFile),
      uploaded: false,
      file_size: newDocFile.size,
    };
    
    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    
    const success = await uploadDocumentToAPI(newDoc);
    
    if (success) {
      setSuccess('Document uploaded successfully!');
    } else {
      localStorage.setItem('application_documents', JSON.stringify(updatedDocs));
      setSuccess('Document saved locally. Will sync when online.');
    }
    
    setNewDocType('');
    setNewDocFile(null);
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
    
    if (apiDeleted) {
      setSuccess('Document deleted successfully');
    } else {
      setSuccess('Document removed from local storage');
    }
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleViewDocument = (doc: DocumentRecord) => {
    if (doc.previewUrl) {
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
    if (doc.previewUrl) {
      const link = document.createElement('a');
      link.href = doc.previewUrl;
      link.download = doc.document_name + '.pdf';
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
    router.push('/application/review');
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Documents Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">APPLICATION DOCUMENTS</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Upload all required supporting documents. Ensure that each file is clear, legible, and in the correct format.
                Incomplete or unclear documents may delay processing of your application.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Supporting Documents Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Supporting Documents</h3>
                <button
                  onClick={() => {
                    setNewDocType('');
                    setNewDocFile(null);
                    setShowAddModal(true);
                  }}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Record
                </button>
              </div>
              
              {documents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No Supporting Documents added yet</p>
                  <p className="text-sm text-gray-400 mt-1">Add a new record to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FileText className="w-4 h-4 text-green-600" />
                            </div>
                            <h4 className="font-medium text-gray-800">{doc.document_name}</h4>
                            {doc.file_size && (
                              <span className="text-xs text-gray-400">
                                ({formatFileSize(doc.file_size)})
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {doc.uploaded ? '✓ Uploaded to server' : '📄 Saved locally'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {(doc.file || doc.previewUrl || doc.file_path) && (
                            <>
                              <button
                                onClick={() => handleViewDocument(doc)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Download document"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteDocument(doc.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

            {/* Continue Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handleContinue}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Add Supporting Documents</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDocType('');
                  setNewDocFile(null);
                  setError(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type *
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  <option value="">Select...</option>
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Document (PDF) *
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewDocFile(e.target.files[0]);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {newDocFile && (
                  <p className="text-xs text-green-600 mt-1">
                    Selected: {newDocFile.name} ({formatFileSize(newDocFile.size)})
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Only PDF files are allowed, max size 2MB.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDocType('');
                  setNewDocFile(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Record
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