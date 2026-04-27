'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Cookies from 'js-cookie';
import {
  BookOpen,
  Building,
  Calendar,
  Tag,
  Hash,
  Save,
  ArrowLeft,
  ChevronDown,
  Users,
  DollarSign,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function EditProgrammePage() {
  const router = useRouter();
  const params = useParams();
  const programmeId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [tuitionFee, setTuitionFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentsLoading(true);
        const token = Cookies.get('token');
        const response = await axios.get(`${API_BASE_URL}/admin/departments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        // Handle different response formats
        if (response.data && response.data.data) {
          setDepartments(response.data.data); // Paginated response
        } else if (Array.isArray(response.data)) {
          setDepartments(response.data); // Direct array response
        } else {
          console.error('Unexpected departments response format:', response.data);
          setDepartments([]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch programme details
  useEffect(() => {
    const fetchProgramme = async () => {
      if (!programmeId) {
        setFetchLoading(false);
        return;
      }

      try {
        const token = Cookies.get('token');
        const response = await axios.get(`${API_BASE_URL}/admin/programmes/${programmeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        // Handle different response formats
        let programmeData;
        if (response.data && response.data.data) {
          programmeData = response.data.data; // Single programme response
        } else if (response.data) {
          programmeData = response.data; // Direct object response
        } else {
          throw new Error('Invalid programme data format');
        }

        if (!programmeData) {
          throw new Error('Programme not found');
        }

        setName(programmeData.name || '');
        setDescription(programmeData.description || '');
        setDepartment(programmeData.department || '');
        setDuration(programmeData.duration || '');
        setCategory(programmeData.category || '');
        setLevel(programmeData.level || '');
        setCapacity(programmeData.capacity?.toString() || '');
        setTuitionFee(programmeData.tuition_fee?.toString() || '');
      } catch (error: any) {
        console.error('Error fetching programme details:', error);
        alert(`Failed to fetch programme details: ${error.response?.data?.message || error.message}`);
        router.push('/appadmin/programmes');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProgramme();
  }, [programmeId, router]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = Cookies.get('token');
      const payload = { 
        name, 
        description, 
        department, 
        duration, 
        category,
        level,
        capacity: capacity ? parseInt(capacity) : null,
        tuition_fee: tuitionFee ? parseFloat(tuitionFee) : null
      };

      await axios.put(`${API_BASE_URL}/admin/programmes/${programmeId}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      alert('Programme updated successfully!');
      router.push('/appadmin/programmes');
    } catch (error: any) {
      console.error('Error updating programme:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to update programme: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading programme details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/appadmin/programmes')}
            className="inline-flex items-center space-x-2 text-green-700 hover:text-green-800 font-medium mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Programmes</span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Programme</h1>
              <p className="text-gray-600 mt-1">Update the programme details below.</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-green-600 to-green-700"></div>
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div>
              <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span>Programme Name *</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter programme name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
              />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
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
                  <Tag className="w-4 h-4 text-green-600" />
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
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Foundation">Foundation</option>
                    <option value="Professional">Professional</option>
                    <option value="PhD">PhD</option>
                    <option value="Masters">Masters</option>
                    <option value="Weekend">Weekend</option>
                    <option value="Online">Online</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Tag className="w-4 h-4 text-green-600" />
                  <span>Level</span>
                </label>
                <div className="relative">
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white transition-all duration-200"
                  >
                    <option value="">Select level</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Foundation">Foundation</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>Capacity</span>
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Enter student capacity"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3 text-sm font-semibold text-gray-700">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Tuition Fee ($)</span>
                </label>
                <input
                  type="number"
                  value={tuitionFee}
                  onChange={(e) => setTuitionFee(e.target.value)}
                  placeholder="Enter tuition fee"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading || departmentsLoading || departments.length === 0}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 min-w-[200px]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Update Programme</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        {departments.length === 0 && !departmentsLoading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>No departments found.</strong> Please{' '}
              <button
                type="button"
                onClick={() => router.push('/appadmin/department')}
                className="text-green-600 hover:text-green-700 underline font-medium"
              >
                add departments first
              </button>{' '}
              before editing programmes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}