'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  GraduationCap, 
  Banknote, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle,
  Home,
  LogOut,
  Activity,
  Shield,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

type Stats = {
  totalApplicants: number;
  totalApplications: number;
  totalFees: number;
  totalProgrammes: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalApplicants: 0,
    totalApplications: 0,
    totalFees: 0,
    totalProgrammes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Helper to get token from localStorage (JWT)
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchUserData = () => {
    const userData = localStorage.getItem('user');
    const token = getToken();
    
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    if (!token) {
      setError('No authentication token found. Please login again.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      
      if (!token) {
        setError('Please login to view dashboard');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        setLoading(false);
        return;
      }

      console.log('Fetching dashboard stats from API...');
      
      // Get user info to verify authentication
      try {
        const userResponse = await fetch(`${API_BASE_URL}/user/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData && userData.username) {
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } else if (userResponse.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please login again.');
        }
      } catch (userError) {
        console.log('Could not fetch user info:', userError);
      }

      // Fetch dashboard stats
      const response = await fetch(`${API_BASE_URL}/dashboard/stats/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('Dashboard stats response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Dashboard stats response:', data);

      if (data && data.success) {
        // Handle response format
        if (data.data) {
          setStats(data.data);
        } else if (data.totalApplicants !== undefined) {
          setStats(data);
        } else if (data.applicants !== undefined) {
          setStats({
            totalApplicants: data.applicants || 0,
            totalApplications: data.applications || 0,
            totalFees: data.fees || 0,
            totalProgrammes: data.programmes || 0
          });
        }
        setLastUpdated(new Date());
        setError('');
      } else {
        setError(data.message || 'Invalid data format received from server');
      }

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      
      if (error.message.includes('login') || error.message.includes('Session expired')) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if (error.message.includes('HTTP error! status: 404')) {
        setError('Dashboard endpoint not found. Please check API configuration.');
      } else if (error.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else {
        setError(error.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = getToken();
    
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('csrftoken');
      router.push('/login');
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MWK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={fetchStats}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Top Navigation */}
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.first_name || user?.username || 'Administrator'}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your admissions system today.
          </p>
          {lastUpdated && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {formatTime(lastUpdated)}</span>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Applicants Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Applicants</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(stats.totalApplicants)}
            </p>
          </div>

          {/* Applications Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Applications</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(stats.totalApplications)}
            </p>
          </div>

          {/* Fees Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                <Banknote className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Fees Collected</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalFees)}
            </p>
          </div>

          {/* Programmes Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Programmes</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(stats.totalProgrammes)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/appadmin/applicants">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg cursor-pointer transition-all duration-300 group hover:border-blue-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Applicants</h3>
                <p className="text-gray-500 text-sm">View and manage applicant profiles</p>
              </div>
            </Link>

            <Link href="/appadmin/applications">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg cursor-pointer transition-all duration-300 group hover:border-purple-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transform group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Applications</h3>
                <p className="text-gray-500 text-sm">Track and process applications</p>
              </div>
            </Link>

            <Link href="/appadmin/fees">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg cursor-pointer transition-all duration-300 group hover:border-green-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Banknote className="w-6 h-6 text-green-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transform group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Fee Management</h3>
                <p className="text-gray-500 text-sm">Monitor payments and deposits</p>
              </div>
            </Link>

            <Link href="/appadmin/programmes">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg cursor-pointer transition-all duration-300 group hover:border-orange-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <GraduationCap className="w-6 h-6 text-orange-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transform group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Programmes</h3>
                <p className="text-gray-500 text-sm">Manage academic programmes</p>
              </div>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-semibold">System Status</h3>
                <p className="text-blue-100 text-sm">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            Mzuzu University Administration System
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Secure JWT Authentication • Real-time Data
          </p>
        </div>
      </div>
    </div>
  );
}