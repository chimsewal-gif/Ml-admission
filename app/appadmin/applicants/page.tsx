'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, BookOpen, Search, Filter, Download, Eye, MoreVertical, Users, GraduationCap } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

type Applicant = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  program: string;
  status?: 'pending' | 'approved' | 'rejected' | 'under_review' | 'admin' | 'staff' | 'applicant' | 'user';
  application_date?: string;
};

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        console.log('Fetching applicants from:', `${API_BASE_URL}/applicants`);
        
        const response = await fetch(`${API_BASE_URL}/applicants`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('API Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please login to view applicants');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response data:', data);

        if (data && data.success) {
          setApplicants(data.data || []);
          setError('');
        } else {
          console.error('Unexpected response format:', data);
          setApplicants([]);
          setError(data.message || 'Failed to load applicants');
        }
        
      } catch (err: any) {
        console.error('Failed to fetch applicants:', err);
        const errorMessage = err.message || 'Failed to fetch applicants';
        setError(errorMessage);
        
        if (err.message.includes('login')) {
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  // Filter applicants based on search and status
  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = 
      applicant.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.program.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || applicant.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'staff':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'applicant':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'user':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'under_review':
        return 'Under Review';
      case 'admin':
        return 'Administrator';
      case 'staff':
        return 'Staff';
      case 'applicant':
        return 'Applicant';
      case 'user':
        return 'User';
      default:
        return 'Pending';
    }
  };

  const getProgramDisplayName = (program: string) => {
    const programMap: { [key: string]: string } = {
      'odl': 'ODL Student Application',
      'postgraduate': 'Postgraduate Application',
      'diploma': 'Diploma/Certificate Programs',
      'international': 'International Student Application',
      'Not specified': 'No Program Selected'
    };
    
    return programMap[program] || program;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600 text-lg">
                Manage and view all system users
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">{error}</p>
                </div>
                {error.includes('login') && (
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Users</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{applicants.length}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Applicants</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {applicants.filter(a => a.status === 'applicant').length}
                  </h3>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <User className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Administrators</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {applicants.filter(a => a.status === 'admin').length}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Staff</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {applicants.filter(a => a.status === 'staff').length}
                  </h3>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name, email, or program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="applicant">Applicant</option>
                  <option value="admin">Administrator</option>
                  <option value="staff">Staff</option>
                  <option value="user">User</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Program
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplicants.length > 0 ? (
                  filteredApplicants.map((applicant, idx) => (
                    <tr
                      key={applicant.id}
                      className="hover:bg-blue-50/30 transition-all duration-200 group"
                    >
                      {/* User Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {applicant.firstname} {applicant.lastname}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {applicant.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Information */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-900 truncate max-w-[200px]">
                              {applicant.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600">
                              {applicant.phone || 'Not provided'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 font-medium">
                            {getProgramDisplayName(applicant.program)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(applicant.status || 'user')}`}>
                          {getStatusText(applicant.status || 'user')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedApplicant(applicant)}
                            className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all duration-200 group-hover:shadow-md text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users className="w-12 h-12 text-gray-300" />
                        <div>
                          <p className="text-lg font-medium text-gray-900">No users found</p>
                          <p className="text-gray-500 text-sm mt-1">
                            {searchTerm || filterStatus !== 'all' 
                              ? 'Try adjusting your search or filters' 
                              : 'There are no users to display at this time.'
                            }
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {filteredApplicants.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredApplicants.length}</span> of{' '}
                  <span className="font-medium">{applicants.length}</span> users
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="font-medium">{selectedApplicant.firstname} {selectedApplicant.lastname}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{selectedApplicant.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium">{selectedApplicant.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Program</label>
                    <p className="font-medium">{getProgramDisplayName(selectedApplicant.program)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <p className="font-medium">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApplicant.status || 'user')}`}>
                        {getStatusText(selectedApplicant.status || 'user')}
                      </span>
                    </p>
                  </div>
                  {selectedApplicant.application_date && (
                    <div>
                      <label className="text-sm text-gray-500">Join Date</label>
                      <p className="font-medium">
                        {new Date(selectedApplicant.application_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Edit User
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}