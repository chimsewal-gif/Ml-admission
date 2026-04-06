'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, CreditCard, Receipt, Download, Trash2, Eye, File, Upload, CheckCircle, ArrowRight } from 'lucide-react';
import ProgressIndicator from '@/componets/ProgressIndicator';
import Button2 from '@/componets/Button2';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

type UploadedRecord = {
  id?: number;
  applicant_id?: number;
  msce?: string;
  msce_size?: number;
  msce_name?: string;
  id_card?: string;
  id_card_size?: number;
  id_card_name?: string;
  payment_proof?: string;
  payment_proof_size?: number;
  payment_proof_name?: string;
  created_at?: string;
  updated_at?: string;
};

type FileField = 'msce' | 'id_card' | 'payment_proof';

type DocumentInfo = {
  name: FileField;
  field: FileField;
  label: string;
  required: boolean;
  icon: React.ComponentType<any>;
  description: string;
};

const documentTypes: DocumentInfo[] = [
  { 
    name: 'msce', 
    field: 'msce', 
    label: 'MSCE/Equivalent Certificate', 
    required: true, 
    icon: FileText,
    description: 'Upload your Malawi School Certificate of Education or equivalent qualification certificate'
  },
  { 
    name: 'id_card', 
    field: 'id_card', 
    label: 'National ID or Passport', 
    required: true, 
    icon: CreditCard,
    description: 'Upload a clear copy of your National ID, Passport, or Birth Certificate'
  },
  { 
    name: 'payment_proof', 
    field: 'payment_proof', 
    label: 'Payment Proof', 
    required: false, 
    icon: Receipt,
    description: 'Upload proof of application fee payment (if already paid)'
  },
];

export default function DocumentsUploadPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<number | null>(null);
  const [files, setFiles] = useState<{ [K in FileField]: File | null }>({
    msce: null,
    id_card: null,
    payment_proof: null,
  });
  const [uploadResult, setUploadResult] = useState<UploadedRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchCurrentUser(storedToken);
  }, [router]);

  // First, get the current user to get the applicant ID
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
        // The user ID is directly in the response
        const userId = userData.id;
        setApplicantId(userId);
        fetchExistingDocuments(authToken, userId);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      setError('Failed to load user information');
      setLoading(false);
    }
  };

  const fetchExistingDocuments = async (authToken: string, applicantId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/applicants/${applicantId}/documents/`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setUploadResult(result.data as UploadedRecord);
        }
      } else if (res.status === 404) {
        // No documents found yet, this is normal
        console.log('No existing documents found');
      } else {
        console.error('Failed to fetch documents:', res.status);
      }
    } catch (err) {
      console.error('Error fetching existing documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles((prev) => ({ ...prev, [name as FileField]: selectedFiles[0] }));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !applicantId) {
      setError('User not authenticated or applicant ID missing');
      return;
    }

    // Check if required files are provided
    if (!files.msce && !uploadResult?.msce) {
      setError('MSCE certificate is required');
      return;
    }
    if (!files.id_card && !uploadResult?.id_card) {
      setError('National ID or Passport is required');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    if (files.msce) formData.append('msce', files.msce);
    if (files.id_card) formData.append('id_card', files.id_card);
    if (files.payment_proof) formData.append('payment_proof', files.payment_proof);

    try {
      const res = await fetch(`${API_BASE_URL}/applicants/${applicantId}/documents/`, {
        method: 'POST',
        body: formData,
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      let result;

      if (contentType?.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        try {
          result = JSON.parse(text);
        } catch {
          result = { error: text };
        }
      }

      if (!res.ok) {
        throw new Error(result?.error || result?.message || result?.detail || 'Upload failed');
      }

      if (result.success && result.data) {
        setUploadResult(result.data as UploadedRecord);
      } else if (result.data) {
        setUploadResult(result.data as UploadedRecord);
      } else if (result.record) {
        setUploadResult(result.record as UploadedRecord);
      } else {
        setUploadResult(result as UploadedRecord);
      }
      
      setSuccess('Documents uploaded successfully! Redirecting to application fees...');
      setFiles({ msce: null, id_card: null, payment_proof: null });
      
      setTimeout(() => {
        router.push('/application/application-fees');
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Something went wrong during upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (field: FileField) => {
    if (!token || !applicantId || !uploadResult || !uploadResult[field]) return;
    
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/applicants/${applicantId}/documents/${field}/`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Delete failed');
      }

      setSuccess('Document deleted successfully!');
      // Refresh the documents list
      fetchExistingDocuments(token, applicantId);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete document.');
    }
  };

  const getFileUrl = (filePath: string) => {
    if (!filePath) return '';
    // If it's already a full URL, return it
    if (filePath.startsWith('http')) return filePath;
    // Otherwise, construct the URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${filePath}`;
  };

  const handleDownload = async (field: FileField, filename: string) => {
    if (!token || !applicantId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/applicants/${applicantId}/documents/${field}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback to direct file access
        const fileUrl = getFileUrl(uploadResult?.[field] as string);
        if (fileUrl) {
          window.open(fileUrl, '_blank');
        } else {
          throw new Error('No file URL available');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download document');
    }
  };

  const handleView = (field: FileField) => {
    if (!token || !applicantId) return;
    
    const apiUrl = `${API_BASE_URL}/applicants/${applicantId}/documents/${field}/?download=false`;
    const directUrl = getFileUrl(uploadResult?.[field] as string);
    
    // Try API endpoint first
    fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(response => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('API view failed');
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        // Fallback to direct URL
        if (directUrl) {
          window.open(directUrl, '_blank');
        } else {
          setError('Unable to view document');
        }
      });
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const getFileName = (document: UploadedRecord, field: FileField): string => {
    const nameField = `${field}_name` as keyof UploadedRecord;
    const value = document[nameField];
    if (typeof value === 'string' && value) return value;
    const filePath = document[field];
    if (typeof filePath === 'string' && filePath) {
      return filePath.split('/').pop() || `document.${getFileExtension(filePath).toLowerCase()}`;
    }
    return `document.${getFileExtension((document[field] as string) || '').toLowerCase()}`;
  };

  const hasUploadedDocuments = uploadResult && 
    (uploadResult.msce || uploadResult.id_card || uploadResult.payment_proof);

  const allRequiredDocumentsUploaded = uploadResult?.msce && uploadResult?.id_card;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={8} />

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Document Upload
                </h1>
                <p className="text-green-100 text-lg">
                  Step 4 of 4 - Upload your required documents
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Form Section */}
              <div>
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Upload Required Documents
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {documentTypes.map((docType) => {
                      const Icon = docType.icon;
                      const currentFile = files[docType.field];
                      const hasExistingFile = uploadResult?.[docType.field];
                      
                      return (
                        <div key={docType.name} className="border border-gray-200 rounded-xl p-4 bg-white">
                          <div className="flex items-start space-x-3 mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Icon className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <label htmlFor={docType.name} className="block font-semibold text-gray-700">
                                {docType.label} {docType.required && '*'}
                              </label>
                              <p className="text-sm text-gray-500 mt-1">
                                {docType.description}
                              </p>
                            </div>
                            {hasExistingFile && (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-5 h-5 mr-1" />
                                <span className="text-sm font-medium">Uploaded</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <input
                              type="file"
                              name={docType.name}
                              id={docType.name}
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileChange}
                              required={docType.required && !hasExistingFile && !currentFile}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            />
                            
                            {currentFile && (
                              <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg">
                                <File className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-800 font-medium">
                                  {currentFile.name} ({formatFileSize(currentFile.size)})
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-2">
                            Accepted formats: PDF, JPG, JPEG, PNG (Max: 5MB)
                          </p>
                        </div>
                      );
                    })}

                    {/* Upload Button */}
                    <div className="pt-4">
                      <Button2
                        type="submit"
                        disabled={uploading}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                      >
                        {uploading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading Documents...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Documents
                          </div>
                        )}
                      </Button2>
                    </div>
                  </form>
                </div>
              </div>

              {/* Uploaded Documents Section */}
              <div>
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                      Uploaded Documents
                    </h2>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {uploadResult ? Object.values(uploadResult).filter(val => val && typeof val === 'string' && (val.includes('/') || val.includes('.pdf') || val.includes('.jpg'))).length : 0} files
                    </span>
                  </div>

                  {!hasUploadedDocuments ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No documents uploaded yet</p>
                      <p className="text-gray-400 text-sm">
                        Upload your required documents using the form
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {documentTypes.map((docType) => {
                        const filePath = uploadResult[docType.field];
                        if (!filePath) return null;
                        
                        const Icon = docType.icon;
                        const fileSize = uploadResult[`${docType.field}_size` as keyof UploadedRecord] as number;
                        const fileName = getFileName(uploadResult, docType.field);
                        const fileExtension = getFileExtension(fileName);
                        
                        return (
                          <div
                            key={docType.field}
                            className="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-all duration-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <Icon className="w-4 h-4 text-green-600" />
                                  </div>
                                  <h3 className="font-semibold text-gray-800">
                                    {docType.label}
                                  </h3>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                    {fileExtension}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                  <div className="col-span-2">
                                    <span className="font-medium">File:</span> {fileName}
                                  </div>
                                  <div>
                                    <span className="font-medium">Size:</span> {formatFileSize(fileSize)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Status:</span> 
                                    <span className="text-green-600 font-medium ml-1">Uploaded</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleView(docType.field)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                  title="View document"
                                  type="button"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownload(docType.field, fileName)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                  title="Download document"
                                  type="button"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(docType.field)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                  title="Delete document"
                                  type="button"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Progress Status */}
                  {hasUploadedDocuments && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-3">Upload Progress</h3>
                      <div className="space-y-3">
                        {documentTypes.map((docType) => {
                          const isUploaded = !!uploadResult?.[docType.field];
                          const isRequired = docType.required;
                          
                          return (
                            <div key={docType.field} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{docType.label}</span>
                              <div className="flex items-center">
                                {isUploaded ? (
                                  <span className="flex items-center text-green-600 text-sm font-medium">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Uploaded
                                  </span>
                                ) : (
                                  <span className="text-red-600 text-sm font-medium">Pending</span>
                                )}
                                {isRequired && !isUploaded && (
                                  <span className="ml-2 text-xs text-red-500">*Required</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {allRequiredDocumentsUploaded && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <span className="text-green-800 font-medium text-sm">
                              All required documents uploaded! You can proceed to the next step.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-6 flex gap-4">
                  <Button2
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white"
                    disabled={uploading}
                  >
                    Back
                  </Button2>
                  
                  {allRequiredDocumentsUploaded && (
                    <Button2
                      onClick={() => router.push('/application/application-fees')}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                    >
                      <div className="flex items-center justify-center">
                        Continue to Fees
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </div>
                    </Button2>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Upload clear, readable copies of your documents. Files must be in PDF, JPG, JPEG, or PNG format (Max: 5MB each).
          </p>
        </div>
      </div>
    </div>
  );
}