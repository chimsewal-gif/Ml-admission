'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, User, Calendar, Eye, Edit, Check, X, MoreVertical, 
  RefreshCw, Brain, Zap, BarChart3, Filter, TrendingUp, 
  Shield, AlertTriangle, Award, Clock, Users, Download,
  PieChart, Activity, Target, ThumbsUp, ThumbsDown, AlertCircle,
  Sparkles, MessageCircle, Flag, Info, FileCheck, Loader,
  Image as ImageIcon, XCircle, CheckCircle, Home, ChevronRight,
  Building2, GraduationCap, BookOpen, Crown, Medal, Trophy,
  Phone, Mail, MapPin, Globe, CreditCard, DollarSign, Search,
  SlidersHorizontal, Printer, Share2, CalendarDays, History
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

type MLPrediction = {
  decision: 'approve' | 'reject' | 'review';
  confidence: number;
  probability: number;
  factors: { factor: string; impact: string }[];
  recommendation: string;
  priority_level: 'High' | 'Medium' | 'Low';
};

type ApplicantSubmission = {
  id: number;
  applicant_name: string;
  programme: string;
  reference_number?: string;
  status: string;
  submitted_at: string;
  ml_prediction?: MLPrediction;
  auto_processed?: boolean;
  last_analyzed_at?: string;
  eligibility_verified?: boolean;
  documents_valid?: boolean;
  priority_level?: 'High' | 'Medium' | 'Low';
  rejection_reason?: string;
  rejection_details?: {
    reason: string;
    factors: string[];
    recommendation: string;
    reviewed_by?: string;
    reviewed_at?: string;
  };
  programme_choices?: {
    first_choice: string;
    second_choice?: string;
    third_choice?: string;
    fourth_choice?: string;
    fifth_choice?: string;
    sixth_choice?: string;
  };
};

interface Document {
  id: number;
  file: string;
  name: string;
  type: string;
  uploaded_at: string;
  mime_type?: string;
}

interface ApplicationDetails {
  id: number;
  applicant_name: string;
  email: string;
  phone: string;
  programme: string;
  reference_number: string;
  status: string;
  submitted_at: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  national_id?: string;
  home_district?: string;
  physical_address?: string;
  next_of_kin?: Array<{
    title: string;
    first_name: string;
    last_name: string;
    relationship: string;
    mobile1: string;
    email?: string;
  }>;
  subject_records?: Array<{
    subject: string;
    grade: string;
    year: string;
  }>;
  ml_prediction?: MLPrediction;
}

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'under_review', label: 'Under Review', color: 'bg-purple-100 text-purple-800' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' }
];

const PRIORITY_OPTIONS = [
  { value: 'High', label: 'High Priority', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
  { value: 'Medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
  { value: 'Low', label: 'Low Priority', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' }
];

const ML_FILTER_OPTIONS = {
  ALL: 'all',
  HIGH_PRIORITY: 'high_priority',
  MEDIUM_PRIORITY: 'medium_priority',
  LOW_PRIORITY: 'low_priority',
  AUTO_APPROVED: 'auto_approved',
  AUTO_REJECTED: 'auto_rejected',
  NEEDS_REVIEW: 'needs_review',
  ELIGIBLE: 'eligible',
  INELIGIBLE: 'ineligible',
  NOT_ANALYZED: 'not_analyzed'
};

const REJECTION_REASONS = [
  { value: 'academic_requirements', label: 'Does not meet academic requirements', icon: '📚', color: 'bg-red-50 border-red-200', description: 'MSCE points below cutoff or missing prerequisites' },
  { value: 'incomplete_documents', label: 'Incomplete or missing documents', icon: '📄', color: 'bg-orange-50 border-orange-200', description: 'Missing MSCE certificate, ID, or incomplete form' },
  { value: 'low_msce_scores', label: 'Low MSCE scores', icon: '📊', color: 'bg-amber-50 border-amber-200', description: 'Below minimum grade requirements' },
  { value: 'programme_full', label: 'Programme capacity reached', icon: '🚫', color: 'bg-gray-50 border-gray-200', description: 'No available slots in selected programme' },
  { value: 'ineligible_qualification', label: 'Ineligible qualifications', icon: '🎓', color: 'bg-purple-50 border-purple-200', description: 'Qualification not recognized for this programme' },
  { value: 'application_deadline', label: 'Submitted after deadline', icon: '⏰', color: 'bg-yellow-50 border-yellow-200', description: 'Late submission or payment' },
  { value: 'payment_issue', label: 'Payment not verified', icon: '💰', color: 'bg-pink-50 border-pink-200', description: 'Payment not confirmed or insufficient' },
  { value: 'duplicate_application', label: 'Duplicate application', icon: '🔄', color: 'bg-indigo-50 border-indigo-200', description: 'Multiple applications from same applicant' },
  { value: 'fraudulent_documents', label: 'Fraudulent documents', icon: '⚠️', color: 'bg-red-50 border-red-200', description: 'Tampered or forged documents detected' },
  { value: 'other', label: 'Other reason', icon: '📝', color: 'bg-gray-50 border-gray-200', description: 'Custom reason' },
];

// ---------- Document Verification Modal ----------
function DocumentVerificationModal({ isOpen, applicationId, applicantName, currentStatus, onClose, onUpdate }: any) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  const apiClient = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    return axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` }
    });
  }, []);

  useEffect(() => {
    if (isOpen && applicationId) fetchDocuments();
  }, [isOpen, applicationId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    const client = apiClient();
    if (!client) { setError('Authentication required'); setLoading(false); return; }
    try {
      const res = await client.get(`/applicant-submissions/${applicationId}/documents/`);
      const docsArray: Document[] = [];
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        if (typeof data === 'object' && !Array.isArray(data)) {
          if (data.msce) docsArray.push({ id: 1, file: data.msce, name: data.msce_name || 'MSCE Certificate', type: 'msce', uploaded_at: new Date().toISOString(), mime_type: 'application/pdf' });
          if (data.id_card) docsArray.push({ id: 2, file: data.id_card, name: data.id_card_name || 'ID Card', type: 'id_card', uploaded_at: new Date().toISOString(), mime_type: 'image/jpeg' });
          if (data.payment_proof) docsArray.push({ id: 3, file: data.payment_proof, name: data.payment_proof_name || 'Payment Proof', type: 'payment_proof', uploaded_at: new Date().toISOString(), mime_type: 'application/pdf' });
        } else if (Array.isArray(data)) docsArray.push(...data);
      }
      setDocuments(docsArray);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.response?.data?.message || 'Could not load documents');
    } finally { setLoading(false); }
  };

  const updateDocumentValidation = async (newStatus: boolean) => {
    setSubmitting(true);
    setError(null);
    const client = apiClient();
    if (!client) { setError('Authentication required'); setSubmitting(false); return; }
    try {
      const res = await client.patch(`/applicant-submissions/${applicationId}/documents`, {
        documents_valid: newStatus,
        verification_notes: verificationNotes
      });
      if (res.data.success) {
        onUpdate(newStatus);
        onClose();
      } else setError(res.data.message || 'Update failed');
    } catch (err: any) {
      console.error('Failed to update document validation:', err);
      setError(err.response?.data?.message || err.message || 'Server error');
    } finally { setSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FileCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Document Verification</h2>
              <p className="text-sm text-gray-500">{applicantName} (ID: {applicationId})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            {currentStatus === true ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4" /> Verified
              </span>
            ) : currentStatus === false ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <XCircle className="w-4 h-4" /> Invalid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-4 h-4" /> Pending
              </span>
            )}
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Uploaded Documents ({documents.length})
              </h3>
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader className="animate-spin w-8 h-8 text-blue-600" /></div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No documents found for this application.</p>
              </div>
            ) : (
              <div className="divide-y">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {doc.mime_type?.startsWith('image/') ? <ImageIcon className="w-6 h-6 text-blue-500" /> : <FileText className="w-6 h-6 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.type} • {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => setSelectedDoc(doc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Notes (Optional)</label>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about document verification..."
            />
          </div>
        </div>

        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={() => updateDocumentValidation(false)} disabled={submitting} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-all">
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Mark Invalid
          </button>
          <button onClick={() => updateDocumentValidation(true)} disabled={submitting} className="px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-all">
            {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Mark Verified
          </button>
        </div>
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4" onClick={() => setSelectedDoc(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-3 border-b bg-gray-50"><span className="font-medium">{selectedDoc.name}</span><button onClick={() => setSelectedDoc(null)} className="p-1 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button></div>
              <div className="p-2">
                {selectedDoc.mime_type?.startsWith('image/') ? (
                  <img src={selectedDoc.file} alt={selectedDoc.name} className="max-w-full max-h-[70vh] object-contain" />
                ) : (
                  <iframe src={selectedDoc.file} className="w-full h-[70vh]" title={selectedDoc.name} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------- Application Details Modal ----------
function ApplicationDetailsModal({ isOpen, applicationId, onClose }: { isOpen: boolean; applicationId: number; onClose: () => void }) {
  const [details, setDetails] = useState<ApplicationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiClient = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    return axios.create({ baseURL: API_BASE_URL, headers: { Authorization: `Bearer ${token}` } });
  }, []);

  useEffect(() => {
    if (isOpen && applicationId) fetchDetails();
  }, [isOpen, applicationId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    const client = apiClient();
    if (!client) { setError('Authentication required'); setLoading(false); return; }
    try {
      const res = await client.get(`/applicant-submissions/${applicationId}`);
      if (res.data.success) setDetails(res.data.data);
      else setError(res.data.message || 'Failed to load details');
    } catch (err: any) {
      console.error('Failed to fetch details:', err);
      setError(err.response?.data?.message || 'Could not load application details');
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl"><User className="w-5 h-5 text-green-600" /></div>
            <div><h2 className="text-xl font-bold text-gray-900">Application Details</h2><p className="text-sm text-gray-500">Complete applicant information</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12"><Loader className="animate-spin w-8 h-8 text-green-600" /></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-center">{error}</div>
          ) : details ? (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-semibold text-gray-800 flex items-center gap-2"><User className="w-4 h-4" /> Personal Information</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div><p className="text-xs text-gray-500">Full Name</p><p className="font-medium">{details.first_name} {details.middle_name} {details.last_name}</p></div>
                  <div><p className="text-xs text-gray-500">Email</p><p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {details.email}</p></div>
                  <div><p className="text-xs text-gray-500">Phone</p><p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {details.phone || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Date of Birth</p><p>{details.date_of_birth ? new Date(details.date_of_birth).toLocaleDateString() : 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Gender</p><p>{details.gender || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">National ID</p><p>{details.national_id || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Nationality</p><p>{details.nationality || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Home District</p><p>{details.home_district || 'N/A'}</p></div>
                  <div className="md:col-span-2"><p className="text-xs text-gray-500">Physical Address</p><p>{details.physical_address || 'N/A'}</p></div>
                </div>
              </div>

              {/* Programme Information */}
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-semibold text-gray-800 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Programme Information</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  <div><p className="text-xs text-gray-500">Reference Number</p><p className="font-mono text-sm">{details.reference_number || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500">Programme</p><p className="font-medium">{details.programme}</p></div>
                  <div><p className="text-xs text-gray-500">Status</p><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_OPTIONS.find(s => s.value === details.status)?.color || 'bg-gray-100'}`}>{details.status}</span></div>
                  <div><p className="text-xs text-gray-500">Submitted Date</p><p>{new Date(details.submitted_at).toLocaleString()}</p></div>
                </div>
              </div>

              {/* Next of Kin */}
              {details.next_of_kin && details.next_of_kin.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-semibold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4" /> Next of Kin</h3></div>
                  <div className="divide-y">
                    {details.next_of_kin.map((kin, idx) => (
                      <div key={idx} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div><p className="text-xs text-gray-500">Name</p><p>{kin.title} {kin.first_name} {kin.last_name}</p></div>
                        <div><p className="text-xs text-gray-500">Relationship</p><p>{kin.relationship}</p></div>
                        <div><p className="text-xs text-gray-500">Phone</p><p>{kin.mobile1}</p></div>
                        <div><p className="text-xs text-gray-500">Email</p><p>{kin.email || 'N/A'}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MSCE Subjects */}
              {details.subject_records && details.subject_records.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b"><h3 className="font-semibold text-gray-800 flex items-center gap-2"><BookOpen className="w-4 h-4" /> MSCE Subjects</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Subject</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Grade</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Year</th></tr></thead>
                      <tbody className="divide-y">
                        {details.subject_records.map((subj, idx) => (
                          <tr key={idx} className="hover:bg-gray-50"><td className="px-4 py-2">{subj.subject}</td><td className="px-4 py-2"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100">{subj.grade}</span></td><td className="px-4 py-2">{subj.year}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="p-5 border-t bg-gray-50 flex justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all">Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- ML Prediction Details Modal ----------
function MLPredictionModal({ isOpen, application, onClose }: { isOpen: boolean; application: ApplicantSubmission | null; onClose: () => void }) {
  if (!isOpen || !application || !application.ml_prediction) return null;

  const prediction = application.ml_prediction;
  const confidencePercent = Math.round(prediction.confidence * 100);
  const probabilityPercent = Math.round(prediction.probability * 100);
  const priorityIcon = PRIORITY_OPTIONS.find(p => p.value === prediction.priority_level)?.icon || '⚪';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-2xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className={`p-5 rounded-t-2xl ${prediction.decision === 'approve' ? 'bg-gradient-to-r from-green-50 to-emerald-50' : prediction.decision === 'reject' ? 'bg-gradient-to-r from-red-50 to-rose-50' : 'bg-gradient-to-r from-yellow-50 to-amber-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${prediction.decision === 'approve' ? 'bg-green-100' : prediction.decision === 'reject' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                {prediction.decision === 'approve' ? <ThumbsUp className="w-6 h-6 text-green-600" /> : prediction.decision === 'reject' ? <ThumbsDown className="w-6 h-6 text-red-600" /> : <AlertCircle className="w-6 h-6 text-yellow-600" />}
              </div>
              <div><h2 className="text-xl font-bold text-gray-900">ML Prediction Analysis</h2><p className="text-sm text-gray-500">{application.applicant_name}</p></div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-2xl font-bold text-gray-900">{priorityIcon}</p><p className="text-xs text-gray-500">Priority</p><p className="font-medium">{prediction.priority_level}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-2xl font-bold text-gray-900">{confidencePercent}%</p><p className="text-xs text-gray-500">Confidence</p><div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className={`h-1.5 rounded-full ${prediction.decision === 'approve' ? 'bg-green-500' : prediction.decision === 'reject' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${confidencePercent}%` }}></div></div></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-2xl font-bold text-gray-900">{probabilityPercent}%</p><p className="text-xs text-gray-500">Success Probability</p></div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b"><h3 className="font-semibold text-gray-800 flex items-center gap-2"><Target className="w-4 h-4" /> Key Factors</h3></div>
            <div className="divide-y">
              {prediction.factors.map((factor, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-700">{factor.factor}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${factor.impact === 'positive' ? 'bg-green-100 text-green-700' : factor.impact === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {factor.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div><p className="text-sm font-medium text-blue-800">Recommendation</p><p className="text-sm text-blue-700">{prediction.recommendation}</p></div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-200">
            <p className="text-xs text-amber-700">This prediction is generated by AI and should be reviewed by admissions committee.</p>
          </div>
        </div>

        <div className="p-5 border-t bg-gray-50 flex justify-end rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700">Close</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Rejection Reason Modal ----------
function RejectionReasonModal({ isOpen, application, onClose, onSubmit, isSubmitting }: any) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (!isOpen) { setSelectedReason(''); setCustomReason(''); setError(''); } }, [isOpen]);

  if (!isOpen || !application) return null;

  const getRejectionFactors = (reasonValue: string): string[] => {
    const factorsMap: Record<string, string[]> = {
      'academic_requirements': ['MSCE points below cutoff', 'Missing prerequisite subjects', 'Grades below minimum requirement'],
      'incomplete_documents': ['Missing MSCE certificate', 'Missing identification document', 'Incomplete application form'],
      'low_msce_scores': ['Low average points', 'Poor performance in key subjects'],
      'programme_full': ['Programme capacity reached', 'Limited spaces available'],
      'ineligible_qualification': ['Qualification not recognized', 'Wrong qualification level'],
      'application_deadline': ['Submitted after closing date', 'Late payment'],
      'payment_issue': ['Payment not confirmed', 'Insufficient amount'],
      'duplicate_application': ['Multiple applications detected'],
      'fraudulent_documents': ['Document tampering detected', 'Verification failed'],
    };
    return factorsMap[reasonValue] || ['Does not meet admission criteria'];
  };

  const getRejectionRecommendation = (reasonValue: string): string => {
    const recommendationsMap: Record<string, string> = {
      'academic_requirements': 'Consider improving grades or apply for a different programme',
      'incomplete_documents': 'Submit all required documents next cycle',
      'low_msce_scores': 'Improve academic performance or consider foundation programmes',
      'programme_full': 'Consider alternative programmes',
      'ineligible_qualification': 'Obtain recognized qualification',
      'application_deadline': 'Submit earlier in the next intake',
      'payment_issue': 'Verify payment details before submitting',
      'duplicate_application': 'Submit only one complete application',
      'fraudulent_documents': 'Submit only authentic documents',
    };
    return recommendationsMap[reasonValue] || 'Review admission requirements before reapplying';
  };

  const selectedReasonData = REJECTION_REASONS.find(r => r.value === selectedReason);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b bg-gradient-to-r from-red-50 to-rose-50 rounded-t-2xl">
          <div className="p-2 bg-red-100 rounded-xl"><Flag className="w-5 h-5 text-red-600" /></div>
          <div><h3 className="text-xl font-bold text-gray-800">Reject Application</h3><p className="text-sm text-gray-500">{application.applicant_name} - {application.programme}</p></div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Reason for Rejection <span className="text-red-500">*</span></label>
            <div className="space-y-2">
              {REJECTION_REASONS.map(reason => (
                <label key={reason.value} className={`flex items-start p-3 border rounded-xl cursor-pointer transition-all ${selectedReason === reason.value ? reason.color : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <input type="radio" name="rejectionReason" value={reason.value} checked={selectedReason === reason.value} onChange={(e) => setSelectedReason(e.target.value)} className="mt-0.5 mr-3 text-red-600 focus:ring-red-500" />
                  <div className="flex-1"><div className="flex items-center gap-2"><span className="text-lg">{reason.icon}</span><span className="font-medium text-gray-800">{reason.label}</span></div><p className="text-xs text-gray-500 mt-1">{reason.description}</p></div>
                </label>
              ))}
            </div>
          </div>
          {selectedReason === 'other' && (
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Custom Reason <span className="text-red-500">*</span></label>
              <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500" placeholder="Provide detailed reason for rejection..." />
            </div>
          )}
          {selectedReason && selectedReason !== 'other' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2"><Info className="w-4 h-4 text-amber-600 mt-0.5" /><div className="text-sm text-amber-800"><p className="font-medium mb-1">Rejection notice includes:</p><ul className="text-xs space-y-1 list-disc list-inside"><li><strong>Reason:</strong> {selectedReasonData?.label}</li><li><strong>Factors:</strong> {getRejectionFactors(selectedReason).join(', ')}</li><li><strong>Recommendation:</strong> {getRejectionRecommendation(selectedReason)}</li></ul></div></div>
            </div>
          )}
        </div>

        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={() => onSubmit(selectedReason, customReason)} disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || isSubmitting} className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-all">
            {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
            Confirm Rejection
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Bulk Action Modal ----------
function BulkActionModal({ isOpen, selectedCount, onClose, onConfirm, action }: any) {
  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Bulk Action</h3>
          <p className="text-gray-600 mb-4">You are about to {action} {selectedCount} application{selectedCount !== 1 ? 's' : ''}. This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors">Confirm</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Export Modal ----------
function ExportModal({ isOpen, onClose, onExport, count }: any) {
  const [format, setFormat] = useState('csv');

  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-xl"><Download className="w-5 h-5 text-green-600" /></div>
            <div><h3 className="text-xl font-bold text-gray-900">Export Applications</h3><p className="text-sm text-gray-500">Export {count} applications to file</p></div>
          </div>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${format === 'csv' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={(e) => setFormat(e.target.value)} className="sr-only" />
                  <FileText className="w-4 h-4" /><span>CSV</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${format === 'excel' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="format" value="excel" checked={format === 'excel'} onChange={(e) => setFormat(e.target.value)} className="sr-only" />
                  <FileText className="w-4 h-4" /><span>Excel</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${format === 'pdf' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="format" value="pdf" checked={format === 'pdf'} onChange={(e) => setFormat(e.target.value)} className="sr-only" />
                  <FileText className="w-4 h-4" /><span>PDF</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={() => onExport(format)} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700">Export</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Filters Modal (Mobile) ----------
function FiltersModal({ isOpen, onClose, priorityFilter, setPriorityFilter, dateRange, setDateRange, mlFilter, setMlFilter }: any) {
  if (!isOpen) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-2"><Filter className="w-5 h-5 text-gray-600" /><h2 className="text-xl font-bold text-gray-900">Filters</h2></div>
          <button onClick={onClose} className="p-1 hover:bg-white rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
            <div className="flex flex-wrap gap-2">
              {['all', 'High', 'Medium', 'Low'].map(option => (
                <button key={option} onClick={() => setPriorityFilter(option)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${priorityFilter === option ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {option === 'all' ? 'All' : option}
                </button>
              ))}
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">ML Filter</label>
            <select value={mlFilter} onChange={(e) => setMlFilter(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500">
              <option value="all">All Applications</option>
              <option value="high_priority">High Priority</option>
              <option value="medium_priority">Medium Priority</option>
              <option value="low_priority">Low Priority</option>
              <option value="auto_approved">Auto-Approved</option>
              <option value="auto_rejected">Auto-Rejected</option>
              <option value="needs_review">Needs Review</option>
              <option value="not_analyzed">Not Analyzed</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="grid grid-cols-2 gap-3"><input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="border border-gray-300 rounded-xl px-3 py-2" /><input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="border border-gray-300 rounded-xl px-3 py-2" /></div>
          </div>
        </div>
        <div className="p-5 border-t bg-gray-50 flex gap-3 rounded-b-2xl">
          <button onClick={() => { setPriorityFilter('all'); setDateRange({ start: '', end: '' }); setMlFilter('all'); }} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100">Clear All</button>
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700">Apply Filters</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------- Helper Functions ----------
const getToken = () => { if (typeof window !== 'undefined') return localStorage.getItem('token'); return null; };
const getUser = () => { if (typeof window !== 'undefined') { const userStr = localStorage.getItem('user'); if (userStr) try { return JSON.parse(userStr); } catch (e) { return null; } } return null; };

// ---------- Main Component ----------
export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicantSubmission[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicantSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState<{id: number, status: string} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMlModal, setShowMlModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState<{show: boolean, application: ApplicantSubmission | null}>({ show: false, application: null });
  const [showDocModal, setShowDocModal] = useState<{show: boolean, applicationId: number, applicantName: string, currentStatus: boolean | null}>({ show: false, applicationId: 0, applicantName: '', currentStatus: null });
  const [showDetailsModal, setShowDetailsModal] = useState<{show: boolean, applicationId: number}>({ show: false, applicationId: 0 });
  const [showPredictionModal, setShowPredictionModal] = useState<{show: boolean, application: ApplicantSubmission | null}>({ show: false, application: null });
  const [showBulkModal, setShowBulkModal] = useState<{show: boolean, action: string, count: number}>({ show: false, action: '', count: 0 });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [rejectionSubmitting, setRejectionSubmitting] = useState(false);
  const [mlFilter, setMlFilter] = useState(ML_FILTER_OPTIONS.ALL);
  const [analysisInProgress, setAnalysisInProgress] = useState<number[]>([]);
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingRef = useRef(false);

  const apiClient = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    return axios.create({ baseURL: API_BASE_URL, headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' } });
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) { router.push('/login'); return; }
      const client = apiClient();
      if (!client) { router.push('/login'); return; }
      const res = await client.get('/applicant-submissions');
      let applicationsData: ApplicantSubmission[] = [];
      if (res.data.success && Array.isArray(res.data.data)) applicationsData = res.data.data;
      else if (Array.isArray(res.data)) applicationsData = res.data;
      else if (res.data.data && Array.isArray(res.data.data)) applicationsData = res.data.data;
      else setError('Unexpected response format from server');
      const enrichedData = applicationsData.map(app => ({ ...app, priority_level: app.ml_prediction?.priority_level || 'Medium', rejection_reason: app.rejection_reason || (app.status === 'rejected' ? 'Not specified' : undefined) }));
      setApplications(enrichedData);
      setFilteredApplications(enrichedData);
      return enrichedData;
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
      if (err.response?.status === 401) { setError('Session expired. Please log in again.'); localStorage.removeItem('token'); localStorage.removeItem('user'); setTimeout(() => router.push('/login'), 2000); }
      else setError('Failed to fetch applications. Please try again.');
      return [];
    } finally { setLoading(false); }
  };

  const updateStatus = async (id: number, newStatus: string, rejectionReason?: string, rejectionDetails?: any) => {
    try {
      setUpdatingId(id);
      const client = apiClient();
      if (!client) { router.push('/login'); return; }
      const payload: any = { status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) { payload.rejection_reason = rejectionReason; payload.rejection_details = rejectionDetails; }
      else if (newStatus !== 'rejected') { payload.rejection_reason = null; payload.rejection_details = null; }
      const res = await client.patch(`/applicant-submissions/${id}/status`, payload);
      if (res.data.success) {
        setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus, rejection_reason: newStatus === 'rejected' ? rejectionReason : undefined } : app));
        setEditingStatus(null);
        setShowRejectionModal({ show: false, application: null });
        setSuccess(newStatus === 'rejected' ? 'Application rejected with reason recorded' : 'Status updated successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else throw new Error(res.data.error || 'Status update failed');
    } catch (err: any) { console.error('Failed to update status:', err); setError(err.response?.data?.error || 'Failed to update status.'); }
    finally { setUpdatingId(null); }
  };

  const openRejectionModal = (application: ApplicantSubmission) => setShowRejectionModal({ show: true, application });
  const closeRejectionModal = () => { setShowRejectionModal({ show: false, application: null }); setRejectionSubmitting(false); };
  const openDetailsModal = (id: number) => setShowDetailsModal({ show: true, applicationId: id });
  const openPredictionModal = (app: ApplicantSubmission) => setShowPredictionModal({ show: true, application: app });

  const submitRejection = async (reason: string, customReason?: string) => {
    if (!showRejectionModal.application) return;
    setRejectionSubmitting(true);
    const finalReason = reason === 'other' && customReason ? customReason : REJECTION_REASONS.find(r => r.value === reason)?.label || reason;
    const rejectionDetails = { reason: finalReason, factors: [], recommendation: '', reviewed_by: getUser()?.first_name || 'Committee Member', reviewed_at: new Date().toISOString() };
    await updateStatus(showRejectionModal.application.id, 'rejected', finalReason, rejectionDetails);
    setRejectionSubmitting(false);
    closeRejectionModal();
  };

  const predictApplication = async (application: ApplicantSubmission) => {
    try {
      setProcessingId(application.id);
      setAnalysisInProgress(prev => [...prev, application.id]);
      const client = apiClient();
      if (!client) return null;
      const response = await client.post(`/ml/predict-submission/${application.id}/`);
      if (response.data.success) {
        const prediction: MLPrediction = { decision: response.data.decision, confidence: response.data.confidence, probability: response.data.probability, factors: response.data.factors, recommendation: response.data.recommendation, priority_level: response.data.priority_level };
        await client.patch(`/applicant-submissions/${application.id}/ml-prediction`, { ml_prediction: prediction, last_analyzed_at: new Date().toISOString() });
        setApplications(prev => prev.map(app => app.id === application.id ? { ...app, ml_prediction: prediction, last_analyzed_at: new Date().toISOString(), priority_level: prediction.priority_level } : app));
        setSuccess(`ML analysis completed: ${prediction.decision.toUpperCase()} (${Math.round(prediction.confidence * 100)}% confidence)`);
        setTimeout(() => setSuccess(null), 5000);
        return prediction;
      } else throw new Error(response.data.error || 'Prediction failed');
    } catch (err: any) { console.error('ML prediction failed:', err); setError(err.response?.data?.error || 'Failed to get ML prediction.'); return null; }
    finally { setProcessingId(null); setAnalysisInProgress(prev => prev.filter(id => id !== application.id)); }
  };

  const batchPredictApplications = async () => {
    try {
      setAutoProcessing(true);
      const unanalyzedApps = applications.filter(app => (app.status === 'submitted' || app.status === 'pending') && !app.ml_prediction);
      if (unanalyzedApps.length === 0) { setSuccess('All applications have been analyzed already.'); setTimeout(() => setSuccess(null), 3000); return; }
      const client = apiClient();
      if (!client) return;
      const applicantIds = unanalyzedApps.map(app => app.id);
      const response = await client.post('/ml/batch-predict-admissions/', { applicant_ids: applicantIds });
      if (response.data.success) {
        for (const result of response.data.results) {
          if (result.success) {
            const prediction: MLPrediction = { decision: result.priority === 'High' ? 'approve' : result.priority === 'Medium' ? 'review' : 'reject', confidence: result.confidence, probability: result.probability, factors: result.factors || [], recommendation: result.recommendation, priority_level: result.priority };
            await client.patch(`/applicant-submissions/${result.applicant_id}/ml-prediction`, { ml_prediction: prediction, last_analyzed_at: new Date().toISOString() });
          }
        }
        await fetchApplications();
        setSuccess(`Batch analysis completed! ${response.data.results.filter(r => r.success).length} applications analyzed.`);
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) { console.error('Batch prediction failed:', err); setError('Failed to run batch analysis.'); }
    finally { setAutoProcessing(false); }
  };

  const autoAnalyzeApplication = async (application: ApplicantSubmission) => {
    if (isAnalyzingRef.current || analysisInProgress.includes(application.id) || application.ml_prediction) return;
    isAnalyzingRef.current = true;
    try {
      console.log(`Auto-analyzing #${application.id}: ${application.applicant_name}`);
      const prediction = await predictApplication(application);
      if (prediction && prediction.confidence > 0.75) {
        const client = apiClient(); if (!client) return;
        let newStatus = '';
        if (prediction.decision === 'approve') newStatus = 'approved';
        else if (prediction.decision === 'reject') newStatus = 'rejected';
        if (newStatus) {
          await client.patch(`/applicant-submissions/${application.id}/status`, { status: newStatus, auto_processed: true });
          setApplications(prev => prev.map(app => app.id === application.id ? { ...app, status: newStatus, auto_processed: true } : app));
        }
      }
    } catch (err) { console.error(`Auto-analyze failed for #${application.id}:`, err); }
    finally { isAnalyzingRef.current = false; }
  };

  const checkAndAnalyzeNewApplications = useCallback(async () => {
    if (isPolling) return;
    try {
      const currentApplications = await fetchApplications();
      if (!currentApplications?.length) return;
      const unanalyzedApps = currentApplications.filter(app => (app.status === 'submitted' || app.status === 'pending') && !app.ml_prediction);
      for (const app of unanalyzedApps) { await autoAnalyzeApplication(app); await new Promise(resolve => setTimeout(resolve, 1000)); }
      await fetchApplications();
    } catch (err) { console.error('Error checking for new applications:', err); }
  }, [fetchApplications, autoAnalyzeApplication]);

  const startPolling = useCallback(() => { if (pollingIntervalRef.current) return; setIsPolling(true); pollingIntervalRef.current = setInterval(() => { checkAndAnalyzeNewApplications(); }, 15000); }, [checkAndAnalyzeNewApplications]);
  const stopPolling = useCallback(() => { if (pollingIntervalRef.current) { clearInterval(pollingIntervalRef.current); pollingIntervalRef.current = null; setIsPolling(false); } }, []);

  useEffect(() => { fetchApplications(); startPolling(); return () => stopPolling(); }, []);

  useEffect(() => {
    let filtered = [...applications];
    if (mlFilter === ML_FILTER_OPTIONS.HIGH_PRIORITY) filtered = filtered.filter(app => app.priority_level === 'High');
    else if (mlFilter === ML_FILTER_OPTIONS.MEDIUM_PRIORITY) filtered = filtered.filter(app => app.priority_level === 'Medium');
    else if (mlFilter === ML_FILTER_OPTIONS.LOW_PRIORITY) filtered = filtered.filter(app => app.priority_level === 'Low');
    else if (mlFilter === ML_FILTER_OPTIONS.AUTO_APPROVED) filtered = filtered.filter(app => app.auto_processed && app.ml_prediction?.decision === 'approve');
    else if (mlFilter === ML_FILTER_OPTIONS.AUTO_REJECTED) filtered = filtered.filter(app => app.auto_processed && app.ml_prediction?.decision === 'reject');
    else if (mlFilter === ML_FILTER_OPTIONS.NEEDS_REVIEW) filtered = filtered.filter(app => !app.ml_prediction || app.ml_prediction?.decision === 'review');
    else if (mlFilter === ML_FILTER_OPTIONS.NOT_ANALYZED) filtered = filtered.filter(app => !app.ml_prediction);
    if (priorityFilter !== 'all') filtered = filtered.filter(app => app.priority_level === priorityFilter);
    if (dateRange.start) filtered = filtered.filter(app => new Date(app.submitted_at) >= new Date(dateRange.start));
    if (dateRange.end) filtered = filtered.filter(app => new Date(app.submitted_at) <= new Date(dateRange.end));
    setFilteredApplications(filtered);
  }, [applications, mlFilter, priorityFilter, dateRange]);

  const startEditing = (id: number, currentStatus: string) => setEditingStatus({ id, status: currentStatus });
  const cancelEditing = () => setEditingStatus(null);

  const exportApplications = (format: string) => {
    const headers = ['ID', 'Applicant Name', 'Programme', 'Reference', 'Status', 'Priority', 'ML Decision', 'Confidence', 'Documents Valid', 'Rejection Reason', 'Submitted Date'];
    const csvData = filteredApplications.map(app => [app.id, app.applicant_name, app.programme, app.reference_number || 'N/A', app.status, app.priority_level || 'N/A', app.ml_prediction?.decision || 'Not Analyzed', app.ml_prediction ? `${Math.round(app.ml_prediction.confidence * 100)}%` : 'N/A', app.documents_valid === true ? 'Valid' : app.documents_valid === false ? 'Invalid' : 'Pending', app.rejection_reason || 'N/A', new Date(app.submitted_at).toLocaleDateString()]);
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `applications_${new Date().toISOString().split('T')[0]}.${format}`; a.click(); window.URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const getStatusColor = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  const formatStatus = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getPriorityIcon = (priority: string) => { switch (priority) { case 'High': return '🔴'; case 'Medium': return '🟡'; case 'Low': return '🟢'; default: return '⚪'; } };
  const handleDocumentUpdate = (appId: number, newStatus: boolean) => { setApplications(prev => prev.map(app => app.id === appId ? { ...app, documents_valid: newStatus } : app)); setSuccess(`Document verification status updated to ${newStatus ? 'Verified' : 'Invalid'}`); setTimeout(() => setSuccess(null), 3000); };

  const stats = { total: applications.length, highPriority: applications.filter(a => a.priority_level === 'High').length, mediumPriority: applications.filter(a => a.priority_level === 'Medium').length, lowPriority: applications.filter(a => a.priority_level === 'Low').length, approved: applications.filter(a => a.status === 'approved' || a.status === 'accepted').length, rejected: applications.filter(a => a.status === 'rejected').length, pending: applications.filter(a => a.status === 'pending' || a.status === 'submitted').length, analyzed: applications.filter(a => a.ml_prediction).length, autoProcessed: applications.filter(a => a.auto_processed).length, avgConfidence: applications.filter(a => a.ml_prediction).reduce((acc, a) => acc + (a.ml_prediction?.confidence || 0), 0) / (applications.filter(a => a.ml_prediction).length || 1) };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6"><nav className="flex items-center gap-2 text-sm"><button onClick={() => router.push('/committee/dashboard')} className="flex items-center gap-1 text-gray-600 hover:text-green-600"><Home className="w-4 h-4" /><span>Dashboard</span></button><ChevronRight className="w-4 h-4 text-gray-400" /><span className="text-gray-900 font-medium">Applicant Submissions</span></nav></div>

        {/* Header */}
        <div className="text-center mb-8"><div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4"><Users className="w-4 h-4" /><span className="text-sm font-medium">ML-Powered Application Management</span></div><h1 className="text-3xl font-bold text-gray-900">Applicant Submissions</h1><p className="text-gray-600 mt-2">Review, analyze, and manage student applications with AI assistance</p></div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 text-center shadow-md border"><div className="text-2xl font-bold text-gray-900">{stats.total}</div><div className="text-xs text-gray-500">Total</div></div>
          <div className="bg-red-50 rounded-xl p-3 text-center shadow-sm border border-red-200"><div className="text-2xl font-bold text-red-700">{stats.highPriority}</div><div className="text-xs text-red-600">High Priority</div></div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center shadow-sm border border-yellow-200"><div className="text-2xl font-bold text-yellow-700">{stats.mediumPriority}</div><div className="text-xs text-yellow-600">Medium Priority</div></div>
          <div className="bg-green-50 rounded-xl p-3 text-center shadow-sm border border-green-200"><div className="text-2xl font-bold text-green-700">{stats.lowPriority}</div><div className="text-xs text-green-600">Low Priority</div></div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center shadow-sm border border-emerald-200"><div className="text-2xl font-bold text-emerald-700">{stats.approved}</div><div className="text-xs text-emerald-600">Approved</div></div>
          <div className="bg-red-50 rounded-xl p-3 text-center shadow-sm border border-red-200"><div className="text-2xl font-bold text-red-700">{stats.rejected}</div><div className="text-xs text-red-600">Rejected</div></div>
          <div className="bg-purple-50 rounded-xl p-3 text-center shadow-sm border border-purple-200"><div className="text-2xl font-bold text-purple-700">{Math.round(stats.avgConfidence * 100)}%</div><div className="text-xs text-purple-600">Avg. Confidence</div></div>
          <div className="bg-orange-50 rounded-xl p-3 text-center shadow-sm border border-orange-200"><div className="text-2xl font-bold text-orange-700">{stats.pending}</div><div className="text-xs text-orange-600">Pending</div></div>
          <div className="bg-blue-50 rounded-xl p-3 text-center shadow-sm border border-blue-200"><div className="text-2xl font-bold text-blue-700">{stats.analyzed}</div><div className="text-xs text-blue-600">ML Analyzed</div></div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-md border p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowMlModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg shadow-sm"><Brain className="w-4 h-4" />ML Analytics</button>
              <button onClick={batchPredictApplications} disabled={autoProcessing} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">{autoProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}Batch Analyze</button>
              <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"><Filter className="w-4 h-4" />{showFilters ? 'Hide Filters' : 'Show Filters'}</button>
              <button onClick={() => setShowFiltersModal(true)} className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"><SlidersHorizontal className="w-4 h-4" />Filters</button>
              <button onClick={() => setShowExportModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"><Download className="w-4 h-4" />Export CSV</button>
            </div>
            <div className="hidden lg:flex items-center gap-2"><span className="text-sm text-gray-500">Filter by:</span>
              <select value={mlFilter} onChange={(e) => setMlFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500">
                <option value="all">All Applications</option><option value="high_priority">High Priority</option><option value="medium_priority">Medium Priority</option><option value="low_priority">Low Priority</option><option value="auto_approved">Auto-Approved</option><option value="auto_rejected">Auto-Rejected</option><option value="needs_review">Needs Review</option><option value="not_analyzed">Not Analyzed</option>
              </select>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label><select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="all">All Priorities</option><option value="High">High Priority</option><option value="Medium">Medium Priority</option><option value="Low">Low Priority</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full border rounded-lg px-3 py-2" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full border rounded-lg px-3 py-2" /></div>
                <div className="flex items-end"><button onClick={() => { setPriorityFilter('all'); setDateRange({ start: '', end: '' }); setMlFilter('all'); }} className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Clear Filters</button></div>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <AnimatePresence>{success && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><p className="text-green-700 text-sm font-medium">{success}</p></div><button onClick={() => setSuccess(null)}><X className="w-4 h-4 text-green-500" /></button></div></motion.div>}</AnimatePresence>
        <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" /><p className="text-red-700 text-sm font-medium">{error}</p></div><button onClick={() => setError(null)}><X className="w-4 h-4 text-red-500" /></button></div></motion.div>}</AnimatePresence>

        {/* Main Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center"><Loader className="animate-spin h-8 w-8 text-green-600 mx-auto mb-4" /><p className="text-gray-600">Loading submissions...</p></div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <tr><th className="px-4 py-3 text-left text-sm font-semibold">#</th><th className="px-4 py-3 text-left text-sm font-semibold">Applicant</th><th className="px-4 py-3 text-left text-sm font-semibold">Programme</th><th className="px-4 py-3 text-left text-sm font-semibold">Priority</th><th className="px-4 py-3 text-left text-sm font-semibold">Status</th><th className="px-4 py-3 text-left text-sm font-semibold">Documents</th><th className="px-4 py-3 text-left text-sm font-semibold">ML Analysis</th><th className="px-4 py-3 text-left text-sm font-semibold">Submitted</th><th className="px-4 py-3 text-left text-sm font-semibold">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplications.map((app, idx) => (
                    <tr key={app.id} className="hover:bg-green-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full text-xs font-medium">{idx + 1}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-green-600" /></div><div><span className="text-sm font-medium text-gray-900">{app.applicant_name}</span>{app.rejection_reason && <div className="flex items-center gap-1 mt-0.5"><MessageCircle className="w-3 h-3 text-red-400" /><span className="text-xs text-red-500 truncate max-w-[150px]">{app.rejection_reason}</span></div>}</div></div></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-700">{app.programme}</span></div></td>
                      <td className="px-4 py-3 whitespace-nowrap">{app.priority_level && <div className="flex items-center gap-1"><span className="text-lg">{getPriorityIcon(app.priority_level)}</span><span className={`text-xs font-medium px-2 py-1 rounded-full ${PRIORITY_OPTIONS.find(p => p.value === app.priority_level)?.color}`}>{app.priority_level}</span></div>}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{editingStatus?.id === app.id ? (<div className="flex items-center gap-2"><select value={editingStatus.status} onChange={(e) => setEditingStatus({ ...editingStatus, status: e.target.value })} className="text-sm border rounded px-2 py-1" disabled={updatingId === app.id}>{STATUS_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select><button onClick={() => updateStatus(app.id, editingStatus.status)} disabled={updatingId === app.id} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button><button onClick={cancelEditing} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button></div>) : (<div className="flex items-center gap-2"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>{formatStatus(app.status)}</span><button onClick={() => startEditing(app.id, app.status)} className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"><Edit className="w-3 h-3" /></button>{app.status !== 'rejected' && app.status !== 'approved' && <button onClick={() => openRejectionModal(app)} className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50" title="Reject"><ThumbsDown className="w-3 h-3" /></button>}</div>)}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><button onClick={() => setShowDocModal({ show: true, applicationId: app.id, applicantName: app.applicant_name, currentStatus: app.documents_valid ?? null })} className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${app.documents_valid === true ? 'bg-green-100 text-green-700 hover:bg-green-200' : app.documents_valid === false ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FileCheck className="w-4 h-4" />{app.documents_valid === true ? 'Verified' : app.documents_valid === false ? 'Invalid' : 'Pending'}</button></td>
                      <td className="px-4 py-3 whitespace-nowrap">{app.ml_prediction ? (<div className="space-y-1"><button onClick={() => openPredictionModal(app)} className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${app.ml_prediction.decision === 'approve' ? 'bg-green-100 text-green-800 hover:bg-green-200' : app.ml_prediction.decision === 'reject' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}>{app.ml_prediction.decision.toUpperCase()} ({Math.round(app.ml_prediction.confidence * 100)}%)</button></div>) : (<button onClick={() => predictApplication(app)} disabled={analysisInProgress.includes(app.id)} className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs">{analysisInProgress.includes(app.id) ? <Loader className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}<span>Analyze</span></button>)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(app.submitted_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><div className="flex items-center gap-1"><button onClick={() => openDetailsModal(app.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Details"><Eye className="w-4 h-4" /></button><Link href={`/commitee/applicant-submissions/${app.id}`} className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"><Eye className="w-3 h-3" /><span>View</span></Link></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3 p-3">
              {filteredApplications.map((app, idx) => (
                <div key={app.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-green-600" /></div><div><p className="font-medium text-gray-900">{app.applicant_name}</p><p className="text-xs text-gray-500">#{idx + 1}</p></div></div>{app.priority_level && <div className="flex items-center gap-1"><span className="text-lg">{getPriorityIcon(app.priority_level)}</span><span className={`text-xs px-2 py-1 rounded-full ${PRIORITY_OPTIONS.find(p => p.value === app.priority_level)?.color}`}>{app.priority_level}</span></div>}</div>
                  <div className="mb-2"><p className="text-xs text-gray-500">Programme</p><p className="text-sm text-gray-700">{app.programme}</p></div>
                  <div className="mb-2"><p className="text-xs text-gray-500">Status</p><div className="flex items-center gap-2 flex-wrap"><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>{formatStatus(app.status)}</span>{app.status !== 'rejected' && app.status !== 'approved' && <button onClick={() => openRejectionModal(app)} className="text-red-500 text-xs flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Reject</button>}</div></div>
                  <div className="mb-2"><p className="text-xs text-gray-500">Documents</p><button onClick={() => setShowDocModal({ show: true, applicationId: app.id, applicantName: app.applicant_name, currentStatus: app.documents_valid ?? null })} className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded ${app.documents_valid === true ? 'bg-green-100 text-green-700' : app.documents_valid === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}><FileCheck className="w-4 h-4" />{app.documents_valid === true ? 'Verified' : app.documents_valid === false ? 'Invalid' : 'Pending'}</button></div>
                  {app.status === 'rejected' && app.rejection_reason && (<div className="mb-2 p-2 bg-red-50 rounded-lg"><p className="text-xs text-red-600 font-medium">Rejection Reason:</p><p className="text-xs text-red-700">{app.rejection_reason}</p></div>)}
                  <div className="mb-2"><p className="text-xs text-gray-500">ML Analysis</p>{app.ml_prediction ? (<button onClick={() => openPredictionModal(app)} className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${app.ml_prediction.decision === 'approve' ? 'bg-green-100 text-green-800' : app.ml_prediction.decision === 'reject' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{app.ml_prediction.decision.toUpperCase()} ({Math.round(app.ml_prediction.confidence * 100)}%)</button>) : (<button onClick={() => predictApplication(app)} disabled={analysisInProgress.includes(app.id)} className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs">{analysisInProgress.includes(app.id) ? <Loader className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}<span>Analyze</span></button>)}</div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t"><span className="text-xs text-gray-500">{formatDate(app.submitted_at)}</span><div className="flex gap-2"><button onClick={() => openDetailsModal(app.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Details"><Eye className="w-4 h-4" /></button><Link href={`/commitee/applicant-submissions/${app.id}`} className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"><Eye className="w-3 h-3" />View</Link></div></div>
                </div>
              ))}
              {filteredApplications.length === 0 && (<div className="text-center py-8 bg-white rounded-lg border"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No applications found</p></div>)}
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center"><p className="text-sm text-gray-600">Showing {filteredApplications.length} of {applications.length} applications</p><div className="text-sm text-gray-500">{isPolling && <span className="flex items-center gap-1 mr-3 text-green-600"><Sparkles className="w-3 h-3 animate-pulse" />Auto-analyzing...</span>}</div></div>
          </div>
        )}
      </div>

      {/* All Modals */}
      <AnimatePresence>{showMlModal && <MLAnalyticsModal isOpen={showMlModal} onClose={() => setShowMlModal(false)} stats={stats} applications={applications} />}</AnimatePresence>
      <AnimatePresence><RejectionReasonModal isOpen={showRejectionModal.show} application={showRejectionModal.application} onClose={closeRejectionModal} onSubmit={submitRejection} isSubmitting={rejectionSubmitting} /></AnimatePresence>
      <AnimatePresence><DocumentVerificationModal isOpen={showDocModal.show} applicationId={showDocModal.applicationId} applicantName={showDocModal.applicantName} currentStatus={showDocModal.currentStatus} onClose={() => setShowDocModal({ show: false, applicationId: 0, applicantName: '', currentStatus: null })} onUpdate={(newStatus: boolean) => handleDocumentUpdate(showDocModal.applicationId, newStatus)} /></AnimatePresence>
      <AnimatePresence>{showDetailsModal.show && <ApplicationDetailsModal isOpen={showDetailsModal.show} applicationId={showDetailsModal.applicationId} onClose={() => setShowDetailsModal({ show: false, applicationId: 0 })} />}</AnimatePresence>
      <AnimatePresence>{showPredictionModal.show && <MLPredictionModal isOpen={showPredictionModal.show} application={showPredictionModal.application} onClose={() => setShowPredictionModal({ show: false, application: null })} />}</AnimatePresence>
      <AnimatePresence><BulkActionModal isOpen={showBulkModal.show} selectedCount={showBulkModal.count} onClose={() => setShowBulkModal({ show: false, action: '', count: 0 })} onConfirm={() => {}} action={showBulkModal.action} /></AnimatePresence>
      <AnimatePresence><ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onExport={exportApplications} count={filteredApplications.length} /></AnimatePresence>
      <AnimatePresence><FiltersModal isOpen={showFiltersModal} onClose={() => setShowFiltersModal(false)} priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter} dateRange={dateRange} setDateRange={setDateRange} mlFilter={mlFilter} setMlFilter={setMlFilter} /></AnimatePresence>
    </div>
  );
}

// ---------- ML Analytics Modal (imported component placeholder) ----------
function MLAnalyticsModal({ isOpen, onClose, stats, applications }: any) {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-2xl"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-xl"><Brain className="w-6 h-6 text-purple-600" /></div><div><h2 className="text-xl font-bold">ML Analytics Dashboard</h2><p className="text-sm text-gray-500">Real-time insights and predictions</p></div></div><button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl"><X className="w-5 h-5" /></button></div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="bg-blue-50 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-blue-700">{stats.total}</div><div className="text-sm text-blue-600">Total Apps</div></div><div className="bg-green-50 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-green-700">{stats.analyzed}</div><div className="text-sm text-green-600">Analyzed by ML</div></div><div className="bg-purple-50 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-purple-700">{stats.autoProcessed}</div><div className="text-sm text-purple-600">Auto-Processed</div></div><div className="bg-yellow-50 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-yellow-700">{Math.round(stats.avgConfidence * 100)}%</div><div className="text-sm text-yellow-600">Avg Confidence</div></div></div>
          <div className="grid grid-cols-3 gap-4"><div className="text-center"><div className="text-xl font-bold text-red-600">{stats.highPriority}</div><div className="text-xs text-gray-500">High Priority</div></div><div className="text-center"><div className="text-xl font-bold text-yellow-600">{stats.mediumPriority}</div><div className="text-xs text-gray-500">Medium Priority</div></div><div className="text-center"><div className="text-xl font-bold text-green-600">{stats.lowPriority}</div><div className="text-xs text-gray-500">Low Priority</div></div></div>
          <div className="border-t pt-4"><h3 className="font-semibold mb-3">Recent ML Predictions</h3><div className="space-y-2 max-h-64 overflow-y-auto">{applications.filter(a => a.ml_prediction).slice(0, 10).map(app => (<div key={app.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><div><p className="font-medium">{app.applicant_name}</p><p className="text-xs text-gray-500">{app.programme}</p></div><div className="text-right"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${app.ml_prediction!.decision === 'approve' ? 'bg-green-100 text-green-800' : app.ml_prediction!.decision === 'reject' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{app.ml_prediction!.decision.toUpperCase()}</span><p className="text-xs text-gray-500 mt-1">Confidence: {Math.round(app.ml_prediction!.confidence * 100)}%</p></div></div>))}</div></div>
        </div>
        <div className="p-5 border-t bg-gray-50 flex justify-end rounded-b-2xl"><button onClick={onClose} className="px-5 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700">Close</button></div>
      </motion.div>
    </motion.div>
  );
}