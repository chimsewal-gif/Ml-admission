'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, CheckCircle, XCircle, AlertCircle, Eye, FileText, Image as ImageIcon, Loader } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

interface Document {
  id: number;
  file: string;          // URL to the file
  name: string;
  type: string;          // e.g., 'certificate', 'transcript', 'payment_slip'
  uploaded_at: string;
  mime_type?: string;
}

interface Props {
  isOpen: boolean;
  applicationId: number;
  applicantName: string;
  currentStatus: boolean | null; // true=valid, false=invalid, null=pending
  onClose: () => void;
  onUpdate: (newStatus: boolean) => void;
}

export default function DocumentVerificationModal({
  isOpen,
  applicationId,
  applicantName,
  currentStatus,
  onClose,
  onUpdate,
}: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const getToken = () => localStorage.getItem('token');

  // Fetch documents when modal opens
  useEffect(() => {
    if (isOpen && applicationId) {
      fetchDocuments();
    }
  }, [isOpen, applicationId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/applicant-submissions/${applicationId}/documents/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setDocuments(res.data.data || []);
      } else {
        setDocuments([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.response?.data?.message || 'Could not load documents');
    } finally {
      setLoading(false);
    }
  };

  const updateDocumentValidation = async (newStatus: boolean) => {
    setSubmitting(true);
    setError(null);
    const token = getToken();
    if (!token) {
      setError('Authentication required');
      setSubmitting(false);
      return;
    }

    try {
      const res = await axios.patch(
        `${API_BASE_URL}/applicant-submissions/${applicationId}/documents`,
        { documents_valid: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        onUpdate(newStatus);
        onClose();
      } else {
        setError(res.data.message || 'Update failed');
      }
    } catch (err: any) {
      console.error('Failed to update document validation:', err);
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (currentStatus === true) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Accepted</span>;
    } else if (currentStatus === false) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Invalid</span>;
    } else {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    return <FileText className="w-8 h-8 text-gray-500" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Document Verification</h2>
            <p className="text-sm text-gray-500">{applicantName} (ID: {applicationId})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            {getStatusBadge()}
          </div>

          <div className="border-t pt-3">
            <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader className="animate-spin w-6 h-6 text-green-600" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-gray-500 text-sm">No documents found for this application.</p>
            ) : (
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                    {getFileIcon(doc.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.type} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={() => updateDocumentValidation(false)}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader className="animate-spin w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            Mark as Invalid
          </button>
          <button
            onClick={() => updateDocumentValidation(true)}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            Mark as Valid
          </button>
        </div>
      </div>

      {/* Simple preview modal for selected document */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={() => setSelectedDoc(null)}>
          <div className="max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b">
              <span className="font-medium">{selectedDoc.name}</span>
              <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              {selectedDoc.mime_type?.startsWith('image/') ? (
                <img src={selectedDoc.file} alt={selectedDoc.name} className="max-w-full max-h-[70vh] object-contain" />
              ) : (
                <iframe src={selectedDoc.file} className="w-full h-[70vh]" title={selectedDoc.name} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}