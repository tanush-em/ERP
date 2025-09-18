'use client';

import React from 'react';
import Layout from '@/components/Layout/Layout';
import { useAdminDashboard } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '@/lib/utils';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}> = ({ title, value, icon: Icon, color = 'text-primary-600', subtitle, trend, trendValue }) => (
  <Card className="card-hover">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-secondary-500 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center mt-1">
              {trend === 'up' && <TrendingUpIcon className="h-3 w-3 text-green-500 mr-1" />}
              {trend === 'down' && <TrendingDownIcon className="h-3 w-3 text-red-500 mr-1" />}
              <span className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-secondary-500'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-primary-100`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const { data: dashboardData, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <Layout requiredRole="admin">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-secondary-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-secondary-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout requiredRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load dashboard</p>
            <p className="text-secondary-500">Please try refreshing the page</p>
          </div>
        </div>
      </Layout>
    );
  }

  const overview = dashboardData?.overview || {};
  const studentStats = dashboardData?.studentStats || {};
  const courseStats = dashboardData?.courseStats || {};
  const enrollmentStats = dashboardData?.enrollmentStats || {};
  const recentActivities = dashboardData?.recentActivities || {};
  const alerts = dashboardData?.alerts || {};

  return (
    <Layout requiredRole="admin">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">
            Admin Dashboard
          </h1>
          <p className="text-secondary-600">
            System overview and management tools
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={overview.totalStudents || 0}
            icon={UserGroupIcon}
            subtitle="Active students"
          />
          
          <StatCard
            title="Total Courses"
            value={overview.totalCourses || 0}
            icon={BookOpenIcon}
            color="text-green-600"
            subtitle="Active courses"
          />
          
          <StatCard
            title="Total Enrollments"
            value={overview.totalEnrollments || 0}
            icon={ClipboardDocumentListIcon}
            color="text-blue-600"
            subtitle="Current semester"
          />
          
          <StatCard
            title="Fee Defaulters"
            value={overview.feeDefaulters || 0}
            icon={CurrencyDollarIcon}
            color={overview.feeDefaulters > 0 ? 'text-red-600' : 'text-green-600'}
            subtitle="Pending payments"
          />
        </div>

        {/* Alerts Section */}
        {(alerts.lowAttendanceStudents?.length > 0 || alerts.feeDefaulters?.length > 0) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.lowAttendanceStudents?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Low Attendance</h4>
                    <p className="text-sm text-yellow-700">
                      {alerts.lowAttendanceStudents.length} students have attendance below 75%
                    </p>
                  </div>
                )}
                
                {alerts.feeDefaulters?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Fee Defaulters</h4>
                    <p className="text-sm text-yellow-700">
                      {alerts.feeDefaulters.length} students have pending fee payments
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-primary-600" />
                Student Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Total Students</span>
                  <span className="font-semibold text-secondary-900">
                    {studentStats.totalStudents || 0}
                  </span>
                </div>
                
                {studentStats.semesterWise && studentStats.semesterWise.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary-700 mb-2">By Semester:</p>
                    <div className="space-y-2">
                      {studentStats.semesterWise.map((stat) => (
                        <div key={stat._id} className="flex items-center justify-between text-sm">
                          <span className="text-secondary-600">Semester {stat._id}</span>
                          <span className="font-medium text-secondary-900">{stat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Course Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2 text-primary-600" />
                Course Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Total Courses</span>
                  <span className="font-semibold text-secondary-900">
                    {courseStats.totalCourses || 0}
                  </span>
                </div>
                
                {courseStats.semesterWise && courseStats.semesterWise.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary-700 mb-2">By Semester:</p>
                    <div className="space-y-2">
                      {courseStats.semesterWise.map((stat) => (
                        <div key={stat._id} className="flex items-center justify-between text-sm">
                          <span className="text-secondary-600">Semester {stat._id}</span>
                          <div className="text-right">
                            <span className="font-medium text-secondary-900">{stat.count}</span>
                            <p className="text-xs text-secondary-500">{stat.totalCredits} credits</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enrollment Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary-600" />
                Enrollment Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">Total Enrollments</span>
                  <span className="font-semibold text-secondary-900">
                    {enrollmentStats.totalEnrollments || 0}
                  </span>
                </div>
                
                {enrollmentStats.statusWise && enrollmentStats.statusWise.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary-700 mb-2">By Status:</p>
                    <div className="space-y-2">
                      {enrollmentStats.statusWise.map((stat) => (
                        <div key={stat._id} className="flex items-center justify-between text-sm">
                          <span className="text-secondary-600 capitalize">{stat._id}</span>
                          <span className="font-medium text-secondary-900">{stat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-secondary-900 mb-2">New Enrollments</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {recentActivities.newEnrollments || 0}
                  </p>
                  <p className="text-sm text-secondary-500">Last 7 days</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-secondary-900 mb-2">Fee Payments</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {recentActivities.feePayments || 0}
                  </p>
                  <p className="text-sm text-secondary-500">Last 7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Attendance Alert */}
          {alerts.lowAttendanceStudents?.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  Low Attendance Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.lowAttendanceStudents.slice(0, 5).map((student, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-red-700">
                        {student._id?.name || 'Unknown Student'}
                      </span>
                      <span className="font-medium text-red-800">
                        {student.percentage?.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {alerts.lowAttendanceStudents.length > 5 && (
                    <p className="text-xs text-red-600 mt-2">
                      +{alerts.lowAttendanceStudents.length - 5} more students
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
