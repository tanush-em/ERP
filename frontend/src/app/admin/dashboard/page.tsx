'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  UsersIcon, 
  BookOpenIcon, 
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  pendingFees: number;
  overdueFees: number;
  semesterWiseStudents: Array<{
    _id: number;
    count: number;
  }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { adminApi } = await import('@/lib/api');
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpenIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Pending Fees',
      value: stats?.pendingFees || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Overdue Fees',
      value: stats?.overdueFees || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
        <div className="text-sm text-secondary-500">
          Welcome back, Administrator
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-secondary-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Semester-wise Student Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Semester-wise Student Distribution
          </h2>
          <div className="space-y-3">
            {stats?.semesterWiseStudents?.map((semester) => (
              <div key={semester._id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-700">
                  Semester {semester._id}
                </span>
                <div className="flex items-center">
                  <div className="w-32 bg-secondary-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(semester.count / (stats?.totalStudents || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-secondary-900">
                    {semester.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
              <div className="flex items-center">
                <UsersIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-secondary-900">Add New Student</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
              <div className="flex items-center">
                <BookOpenIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-secondary-900">Create New Course</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-secondary-900">Mark Attendance</span>
              </div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium text-secondary-900">Add Scores</span>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
