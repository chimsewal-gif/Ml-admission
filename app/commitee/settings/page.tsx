'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Eye, Download, RefreshCw, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: number;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip_address: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'backup'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/admin/users/', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setUsers(data.data);
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:8000/api/admin/audit-logs/', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.success) setLogs(data.data);
    setLoading(false);
  };

  const handleBackup = async () => {
    if (confirm('Trigger database backup?')) {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8000/api/admin/backup/', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      alert('Backup initiated');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">System Administration</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          {['users', 'logs', 'backup'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 font-medium ${activeTab === tab ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}>
              {tab === 'users' && <Users className="inline w-4 h-4 mr-1" />}
              {tab === 'logs' && <Eye className="inline w-4 h-4 mr-1" />}
              {tab === 'backup' && <Shield className="inline w-4 h-4 mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}><td className="px-6 py-4">{u.first_name} {u.last_name}</td><td>{u.email}</td><td>{u.role}</td><td>{u.is_active ? 'Active' : 'Inactive'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50"><tr><th className="px-6 py-3">User</th><th>Action</th><th>Target</th><th>Timestamp</th><th>IP</th></tr></thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}><td className="px-6 py-4">{log.user}</td><td>{log.action}</td><td>{log.target}</td><td>{new Date(log.timestamp).toLocaleString()}</td><td>{log.ip_address}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Database Backup</h3>
          <p className="text-gray-600 mb-4">Create a manual backup of all application data.</p>
          <button onClick={handleBackup} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
            <RefreshCw className="w-4 h-4" /> Run Backup Now
          </button>
        </div>
      )}
    </div>
  );
}