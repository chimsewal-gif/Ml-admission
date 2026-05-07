'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, CheckCircle, Clock, Building2, AlertCircle, X, 
  Award, Plus, Edit, Trash2, Search, Filter, ChevronLeft, 
  ChevronRight, Save, Upload, Download, Eye, Power, 
  Calendar, Hash, Tag, FileText, RefreshCw
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

type Programme = {
  id: number;
  name: string;
  description?: string;
  department?: string;
  duration?: string;
  category?: string;
  code?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

type ApplicantChoice = {
  id: number;
  applicant_id: number;
  applicant_name: string;
  applicant_email: string;
  choices: {
    choice_number: number;
    programme_id: number;
    programme_name: string;
    department: string;
    duration: string;
    category: string;
  }[];
  submitted_at: string;
};

export default function AdminProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState<Programme[]>([]);
  const [applicantChoices, setApplicantChoices] = useState<ApplicantChoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error" | "warning">("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantChoice | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<Partial<Programme>>({
    name: "",
    description: "",
    department: "",
    duration: "",
    category: "",
    code: "",
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"programmes" | "selections">("programmes");
  
  const router = useRouter();

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Check if user is admin
  const isAdmin = () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          return userData.role === 'admin' || userData.is_staff === true;
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  };

  // Fetch programmes
  const fetchProgrammes = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/programmes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      let allProgrammes: Programme[] = [];
      if (response.data && response.data.success) {
        allProgrammes = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        allProgrammes = response.data;
      } else if (response.data && response.data.results) {
        allProgrammes = response.data.results;
      } else {
        allProgrammes = [];
      }

      setProgrammes(allProgrammes);
      setFilteredProgrammes(allProgrammes);
    } catch (err: any) {
      console.error("Failed to fetch programmes:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        setNotification("Failed to fetch programmes");
        setNotificationType("error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch applicant selections
  const fetchApplicantSelections = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/admin/applicant-choices/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.data && response.data.success) {
        setApplicantChoices(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setApplicantChoices(response.data);
      } else {
        setApplicantChoices([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch applicant selections:", err);
      setApplicantChoices([]);
    }
  };

  // Add new programme
  const addProgramme = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const response = await axios.post(`${API_BASE_URL}/programmes/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.success) {
        setNotification("Programme added successfully!");
        setNotificationType("success");
        setShowAddModal(false);
        resetForm();
        fetchProgrammes();
        setTimeout(() => setNotification(""), 3000);
      } else {
        throw new Error(response.data?.message || "Failed to add programme");
      }
    } catch (err: any) {
      setNotification(err.response?.data?.message || err.message || "Failed to add programme");
      setNotificationType("error");
      setTimeout(() => setNotification(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Update programme
  const updateProgramme = async () => {
    if (!selectedProgramme) return;
    setSaving(true);
    try {
      const token = getToken();
      const response = await axios.put(`${API_BASE_URL}/programmes/${selectedProgramme.id}/`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.success) {
        setNotification("Programme updated successfully!");
        setNotificationType("success");
        setShowEditModal(false);
        resetForm();
        fetchProgrammes();
        setTimeout(() => setNotification(""), 3000);
      } else {
        throw new Error(response.data?.message || "Failed to update programme");
      }
    } catch (err: any) {
      setNotification(err.response?.data?.message || err.message || "Failed to update programme");
      setNotificationType("error");
      setTimeout(() => setNotification(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Delete programme
  const deleteProgramme = async () => {
    if (!selectedProgramme) return;
    setSaving(true);
    try {
      const token = getToken();
      const response = await axios.delete(`${API_BASE_URL}/programmes/${selectedProgramme.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        setNotification("Programme deleted successfully!");
        setNotificationType("success");
        setShowDeleteModal(false);
        fetchProgrammes();
        setTimeout(() => setNotification(""), 3000);
      } else {
        throw new Error(response.data?.message || "Failed to delete programme");
      }
    } catch (err: any) {
      setNotification(err.response?.data?.message || err.message || "Failed to delete programme");
      setNotificationType("error");
      setTimeout(() => setNotification(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Toggle programme status
  const toggleStatus = async (programme: Programme) => {
    try {
      const token = getToken();
      const response = await axios.patch(`${API_BASE_URL}/programmes/${programme.id}/`, 
        { is_active: !programme.is_active },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.success) {
        setNotification(`Programme ${!programme.is_active ? 'activated' : 'deactivated'} successfully!`);
        setNotificationType("success");
        fetchProgrammes();
        setTimeout(() => setNotification(""), 3000);
      } else {
        throw new Error(response.data?.message || "Failed to update status");
      }
    } catch (err: any) {
      setNotification(err.response?.data?.message || err.message || "Failed to update status");
      setNotificationType("error");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  // Filter programmes
  useEffect(() => {
    let filtered = programmes;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.is_active === (statusFilter === "active"));
    }
    
    setFilteredProgrammes(filtered);
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, programmes]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      department: "",
      duration: "",
      category: "",
      code: "",
      is_active: true
    });
    setSelectedProgramme(null);
  };

  // Edit programme
  const handleEdit = (programme: Programme) => {
    setSelectedProgramme(programme);
    setFormData(programme);
    setShowEditModal(true);
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProgrammes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProgrammes.length / itemsPerPage);

  // Get unique categories for filter
  const categories = [...new Set(programmes.map(p => p.category).filter(Boolean))];

  useEffect(() => {
    if (!isAdmin()) {
      setNotification("Access denied. Admin privileges required.");
      setNotificationType("error");
      setTimeout(() => router.push('/'), 2000);
      return;
    }
    fetchProgrammes();
    fetchApplicantSelections();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage programmes and track applicant selections</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notificationType === "success" 
              ? "bg-green-50 border border-green-200 text-green-800" 
              : notificationType === "warning"
              ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}>
            {notificationType === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : notificationType === "warning" ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <X className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm">{notification}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab("programmes")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "programmes"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Programmes
            </button>
            <button
              onClick={() => setActiveTab("selections")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "selections"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Award className="w-4 h-4 inline mr-2" />
              Applicant Selections
            </button>
          </nav>
        </div>

        {activeTab === "programmes" && (
          <>
            {/* Filters and Actions */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search programmes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                {/* Add Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Programme
                </button>
              </div>
            </div>

            {/* Programmes Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading programmes...</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {currentItems.map((programme) => (
                          <tr key={programme.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="text-sm font-mono text-gray-600">{programme.code || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{programme.name}</div>
                              {programme.description && (
                                <div className="text-xs text-gray-500 mt-1">{programme.description.substring(0, 60)}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Building2 className="w-3 h-3" />
                                {programme.department || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                {programme.duration || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {programme.category || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => toggleStatus(programme)}
                                className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                                  programme.is_active
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                <Power className="w-3 h-3" />
                                {programme.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(programme)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProgramme(programme);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProgrammes.length)} of {filteredProgrammes.length} programmes
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === "selections" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programme Choices</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applicantChoices.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{applicant.applicant_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{applicant.applicant_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {applicant.choices.map((choice, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-semibold text-green-600">{choice.choice_number}:</span>{' '}
                              <span className="text-gray-700">{choice.programme_name}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(applicant.submitted_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedApplicant(applicant);
                            setShowViewModal(true);
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Programme Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  Add New Programme
                </h3>
              </div>
              
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programme Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      placeholder="e.g., 4 Years, 2 Semesters"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Category</option>
                      <option value="Bachelor">Bachelor</option>
                      <option value="Master">Master</option>
                      <option value="PhD">PhD</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Certificate">Certificate</option>
                      <option value="ODL">ODL</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addProgramme}
                    disabled={saving || !formData.name}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Programme
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Programme Modal */}
        {showEditModal && selectedProgramme && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" />
                  Edit Programme
                </h3>
              </div>
              
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Programme Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department || ''}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={formData.duration || ''}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Category</option>
                      <option value="Bachelor">Bachelor</option>
                      <option value="Master">Master</option>
                      <option value="PhD">PhD</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Certificate">Certificate</option>
                      <option value="ODL">ODL</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateProgramme}
                    disabled={saving || !formData.name}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Programme
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedProgramme && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="border-b border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Delete Programme
                </h3>
              </div>
              
              <div className="p-5">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete <strong className="text-gray-800">{selectedProgramme.name}</strong>?
                  This action cannot be undone.
                </p>
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedProgramme(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteProgramme}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Applicant Selections Modal */}
        {showViewModal && selectedApplicant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  Applicant Programme Selections
                </h3>
              </div>
              
              <div className="p-5">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Name:</strong> {selectedApplicant.applicant_name}</p>
                  <p className="text-sm mt-1"><strong>Email:</strong> {selectedApplicant.applicant_email}</p>
                  <p className="text-sm mt-1"><strong>Submitted:</strong> {new Date(selectedApplicant.submitted_at).toLocaleString()}</p>
                </div>
                
                <h4 className="font-semibold text-gray-700 mb-3">Programme Choices:</h4>
                <div className="space-y-3">
                  {selectedApplicant.choices.map((choice, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-green-600 min-w-[70px]">{choice.choice_number}{getRankSuffix(choice.choice_number)}:</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{choice.programme_name}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {choice.department || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {choice.duration || 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {choice.category || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedApplicant(null);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}