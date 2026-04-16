'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, FileText, Star, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalApplicants: number;
  pendingReviews: number;
  completedReviews: number;
  committeeMembers: number;
  avgScore: number;
  deadlineDays: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export function CommitteeDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplicants: 0,
    pendingReviews: 0,
    completedReviews: 0,
    committeeMembers: 0,
    avgScore: 0,
    deadlineDays: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/committee/dashboard');
      const data = await response.json();
      setStats(data.stats);
      setRecentActivities(data.recentActivities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { title: 'Total Applicants', value: stats.totalApplicants, icon: Users, color: 'bg-blue-500' },
    { title: 'Pending Reviews', value: stats.pendingReviews, icon: Clock, color: 'bg-yellow-500' },
    { title: 'Completed Reviews', value: stats.completedReviews, icon: CheckCircle, color: 'bg-green-500' },
    { title: 'Committee Members', value: stats.committeeMembers, icon: Users, color: 'bg-purple-500' },
    { title: 'Average Score', value: stats.avgScore.toFixed(1), icon: Star, color: 'bg-pink-500' },
    { title: 'Days to Deadline', value: stats.deadlineDays, icon: AlertCircle, color: 'bg-red-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Committee Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage applicants and track evaluation progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-full`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b">
                  <div className="flex-shrink-0">
                    {activity.type === 'review' && <Star className="h-5 w-5 text-yellow-500" />}
                    {activity.type === 'applicant' && <Users className="h-5 w-5 text-blue-500" />}
                    {activity.type === 'status' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/committee/applicants" 
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-blue-700 font-medium">Review Applicants</span>
                <span className="text-blue-500">→</span>
              </Link>
              <Link href="/committee/evaluations" 
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-green-700 font-medium">Submit Evaluations</span>
                <span className="text-green-500">→</span>
              </Link>
              <Link href="/committee" 
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-purple-700 font-medium">Manage Committee</span>
                <span className="text-purple-500">→</span>
              </Link>
              <Link href="/committee/reports" 
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <span className="text-orange-700 font-medium">Generate Reports</span>
                <span className="text-orange-500">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}