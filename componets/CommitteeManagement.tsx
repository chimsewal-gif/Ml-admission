'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Mail, UserCheck, UserX, Loader, RefreshCw } from 'lucide-react';
import MemberModal from './MemberModal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface CommitteeMember {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  phone?: string;
  bio?: string;
  order: number;
  is_active: boolean;
}

export function CommitteeManagement() {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchMembers = async () => {
    const token = getToken();
    if (!token) {
      setError('Please login to view committee members');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Use Django backend URL, not Next.js API route
      const response = await fetch(`${API_BASE_URL}/committee/members/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setMembers([]);
        setError('Committee management feature is not yet available.');
        setLoading(false);
        return;
      }

      if (response.status === 404) {
        setMembers([]);
        setError('Committee endpoint not found. Please check back later.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMembers(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch committee members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Unable to load committee members. Please try again later.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (memberData: Partial<CommitteeMember>) => {
    const token = getToken();
    if (!token) {
      setError('Please login to add members');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/committee/members/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(memberData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        await fetchMembers();
        setShowModal(false);
      } else {
        setError(data.message || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Unable to add member. Please try again.');
    }
  };

  const handleUpdateMember = async (memberData: Partial<CommitteeMember>) => {
    if (!editingMember) return;
    
    const token = getToken();
    if (!token) {
      setError('Please login to update members');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/committee/members/${editingMember.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(memberData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        await fetchMembers();
        setEditingMember(null);
        setShowModal(false);
      } else {
        setError(data.message || 'Failed to update member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      setError('Unable to update member. Please try again.');
    }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('Are you sure you want to remove this committee member?')) return;
    
    const token = getToken();
    if (!token) {
      setError('Please login to delete members');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/committee/members/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        await fetchMembers();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      setError('Unable to delete member. Please try again.');
    }
  };

  const getRoleColor = (role: string) => {
    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case 'chair':
      case 'chairperson':
        return 'bg-red-100 text-red-800';
      case 'vice-chair':
      case 'vice chairperson':
        return 'bg-orange-100 text-orange-800';
      case 'secretary':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading committee members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Committee Management</h1>
            <p className="text-gray-600 mt-2">Manage selection committee members and their assignments</p>
          </div>
          <div className="flex space-x-3">
          
            <button
              onClick={() => {
                setEditingMember(null);
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Member
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">{error}</p>
            {error.includes('coming soon') && (
              <p className="text-sm text-yellow-600 mt-2">
                This feature is currently under development.
              </p>
            )}
          </div>
        )}

        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {member.department && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Department:</span> {member.department}
                      </p>
                    )}
                    {member.phone && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {member.phone}
                      </p>
                    )}
                    {member.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Bio:</span> {member.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.location.href = `mailto:${member.email}`}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Send email"
                      >
                        <Mail className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingMember(member);
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                        title="Edit member"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !error ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Committee Members</h3>
            <p className="text-gray-500">Click the "Add Member" button to add your first committee member.</p>
          </div>
        ) : null}
      </div>

      {showModal && (
        <MemberModal
          onClose={() => {
            setShowModal(false);
            setEditingMember(null);
          }}
          onSave={editingMember ? handleUpdateMember : handleAddMember}
          editingMember={editingMember}
        />
      )}
    </div>
  );
}