'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import { Calendar, Edit, Trash2, Plus, Save, X, ChevronDown, ChevronRight, Check } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function AdminApplicationTypes() {
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editedType, setEditedType] = useState<Partial<ApplicationType> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectionName, setSelectionName] = useState('');
  const [newType, setNewType] = useState({
    name: '',
    description: '',
    requirements: [''],
    start_date: '',
    end_date: '',
  });

  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchApplicationTypes();
  }, [router]);

  const fetchApplicationTypes = async () => {
    try {
      const token = Cookies.get('token');
      const res = await axios.get(`${API_BASE_URL}/admin/application-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setApplicationTypes(res.data.data || res.data);
    } catch (err: any) {
      console.error('Error fetching application types:', err);
      setError('Failed to load application types');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (typeId: string) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeId)) {
        newSet.delete(typeId);
      } else {
        newSet.add(typeId);
      }
      return newSet;
    });
  };

  const handleSelectType = (typeId: string) => {
    setSelectedType(typeId);
    setSelectionName('');
  };

  const handleConfirmSelection = async () => {
    if (!selectedType || !selectionName.trim()) {
      setError('Please enter a selection name');
      return;
    }

    try {
      const token = Cookies.get('token');
      // Here you would typically send this to your backend
      // For now, we'll just show a success message
      setSuccess(`Successfully selected "${selectionName}" for application type`);
      setTimeout(() => {
        setSuccess('');
        setSelectedType(null);
        setSelectionName('');
      }, 3000);
    } catch (err: any) {
      console.error('Error confirming selection:', err);
      setError('Failed to confirm selection');
    }
  };

  const handleEdit = (type: ApplicationType) => {
    setEditingType(type.id);
    setEditedType({ ...type });
  };

  const handleSave = async (id: string) => {
    try {
      const token = Cookies.get('token');
      await axios.put(
        `${API_BASE_URL}/admin/application-types/${id}`,
        editedType,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setApplicationTypes(prev =>
        prev.map(type => type.id === id ? { ...type, ...editedType } : type)
      );
      setEditingType(null);
      setEditedType(null);
      setSuccess('Application type updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating application type:', err);
      setError('Failed to update application type');
    }
  };

  const handleCancel = () => {
    setEditingType(null);
    setEditedType(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application type?')) {
      return;
    }

    try {
      const token = Cookies.get('token');
      await axios.delete(`${API_BASE_URL}/admin/application-types/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      setApplicationTypes(prev => prev.filter(type => type.id !== id));
      setSuccess('Application type deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting application type:', err);
      setError('Failed to delete application type');
    }
  };

  const handleAddType = async () => {
    try {
      const token = Cookies.get('token');
      const res = await axios.post(
        `${API_BASE_URL}/admin/application-types`,
        {
          ...newType,
          requirements: newType.requirements.filter(req => req.trim() !== ''),
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setApplicationTypes(prev => [...prev, res.data.data || res.data]);
      setShowAddForm(false);
      setNewType({
        name: '',
        description: '',
        requirements: [''],
        start_date: '',
        end_date: '',
      });
      setSuccess('Application type added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error adding application type:', err);
      setError('Failed to add application type');
    }
  };

  const addRequirement = () => {
    setNewType(prev => ({
      ...prev,
      requirements: [...prev.requirements, ''],
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setNewType(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req),
    }));
  };

  const removeRequirement = (index: number) => {
    setNewType(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const isApplicationActive = (type: ApplicationType) => {
    const now = new Date();
    const startDate = new Date(type.start_date);
    const endDate = new Date(type.end_date);
    return now >= startDate && now <= endDate && type.is_active;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-green-900">Manage Application Types</h1>
              <p className="text-gray-600">Set deadlines and manage application availability</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Type
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Selection Modal */}
          {selectedType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Confirm Selection</h3>
                <p className="text-gray-600 mb-4">
                  You are selecting: <strong>{applicationTypes.find(t => t.id === selectedType)?.name}</strong>
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter selection name:
                  </label>
                  <input
                    type="text"
                    value={selectionName}
                    onChange={(e) => setSelectionName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., My Application Selection"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setSelectedType(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add New Type Form */}
          {showAddForm && (
            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">Add New Application Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newType.name}
                    onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g., ODL Student Application"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newType.description}
                    onChange={(e) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newType.start_date}
                    onChange={(e) => setNewType(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newType.end_date}
                    onChange={(e) => setNewType(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                {newType.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2"
                      placeholder="Enter requirement"
                    />
                    {newType.requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRequirement}
                  className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Add Requirement
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddType}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Application Types List */}
          <div className="space-y-4">
            {applicationTypes.map((type) => (
              <div key={type.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Header - Always Visible */}
                <div className="bg-gray-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleExpand(type.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {expandedTypes.has(type.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-800">{type.name}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isApplicationActive(type)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isApplicationActive(type) ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handleSelectType(type.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Select
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(type)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Content */}
                {expandedTypes.has(type.id) && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Basic Information</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Start Date:</span>
                            <span className="font-medium">
                              {new Date(type.start_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">End Date:</span>
                            <span className="font-medium">
                              {new Date(type.end_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className={`font-medium ${
                              isApplicationActive(type) ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isApplicationActive(type) ? 'Currently Active' : 'Not Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Requirements</h4>
                        <ul className="space-y-1">
                          {type.requirements.map((requirement, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-600">{requirement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Edit Form (when editing) */}
                    {editingType === type.id && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-3">Edit Application Type</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              type="text"
                              value={editedType?.name || ''}
                              onChange={(e) => setEditedType(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              value={editedType?.description || ''}
                              onChange={(e) => setEditedType(prev => ({ ...prev, description: e.target.value }))}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={editedType?.start_date || ''}
                              onChange={(e) => setEditedType(prev => ({ ...prev, start_date: e.target.value }))}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                              type="date"
                              value={editedType?.end_date || ''}
                              onChange={(e) => setEditedType(prev => ({ ...prev, end_date: e.target.value }))}
                              className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleSave(type.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {applicationTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No application types found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}