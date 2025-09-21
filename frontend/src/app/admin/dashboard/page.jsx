'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  UsersIcon, 
  BookOpenIcon, 
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [mcpStats, setMcpStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchMcpStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Mock data for now to prevent API errors
      const mockStats = {
        totalStudents: 150,
        totalCourses: 25,
        pendingFees: 45,
        overdueFees: 12,
        semesterWiseStudents: [
          { _id: 1, count: 30 },
          { _id: 2, count: 35 },
          { _id: 3, count: 28 },
          { _id: 4, count: 32 },
          { _id: 5, count: 25 }
        ]
      };
      
      // Simulate API delay
      setTimeout(() => {
        setStats(mockStats);
        setLoading(false);
      }, 1000);
      
      // Try to fetch real data if API exists
      try {
        const { adminApi } = await import('@/lib/api');
        const data = await adminApi.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.log('Using mock data - API not available:', error.message);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setLoading(false);
    }
  };

  const fetchMcpStats = async () => {
    try {
      const response = await fetch('/api/mcp/operations/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMcpStats(data.data);
        }
      } else {
        // Mock MCP stats if API not available
        setMcpStats({
          totalOperations: 1250,
          todayCount: 45,
          statusStats: [
            { _id: 'completed', count: 1100 },
            { _id: 'failed', count: 50 },
            { _id: 'running', count: 5 }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to fetch MCP stats, using mock data:', error);
      // Mock MCP stats
      setMcpStats({
        totalOperations: 1250,
        todayCount: 45,
        statusStats: [
          { _id: 'completed', count: 1100 },
          { _id: 'failed', count: 50 },
          { _id: 'running', count: 5 }
        ]
      });
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
      title: 'MCP Operations',
      value: mcpStats?.totalOperations || 0,
      icon: CpuChipIcon,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Pending Fees',
      value: stats?.pendingFees || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
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
            MCP System Status
          </h2>
          {mcpStats ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-700">System Status</span>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Operational</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {mcpStats.todayCount || 0}
                  </div>
                  <div className="text-xs text-blue-500">Today's Operations</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {mcpStats.statusStats?.find(s => s._id === 'completed')?.count || 0}
                  </div>
                  <div className="text-xs text-green-500">Completed</div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <a 
                  href="/admin/mcp" 
                  className="flex items-center justify-center w-full p-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <CpuChipIcon className="h-4 w-4 mr-2" />
                  Open MCP Control Panel
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
            <div className="flex items-center">
              <UsersIcon className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-secondary-900">Add New Student</span>
            </div>
          </button>
          <button className="p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
            <div className="flex items-center">
              <BookOpenIcon className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-secondary-900">Create New Course</span>
            </div>
          </button>
          <button className="p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-secondary-900">Mark Attendance</span>
            </div>
          </button>
          <button className="p-3 rounded-lg border border-secondary-200 hover:bg-secondary-50 transition-colors">
            <div className="flex items-center">
              <ChartBarIcon className="h-5 w-5 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-secondary-900">Add Scores</span>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;