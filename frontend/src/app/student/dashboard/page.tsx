'use client';

import React from 'react';
import Layout from '@/components/Layout/Layout';
import { useStudentDashboard } from '@/hooks/useApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BellIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { formatPercentage, formatCurrency, formatDate, getStatusColor, getAttendanceColor } from '@/lib/utils';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color = 'text-primary-600', subtitle }) => (
  <Card className="card-hover">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-secondary-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-secondary-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-primary-100`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const StudentDashboard: React.FC = () => {
  const { data: dashboardData, isLoading, error } = useStudentDashboard();

  if (isLoading) {
    return (
      <Layout requiredRole="student">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-secondary-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
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
      <Layout requiredRole="student">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load dashboard</p>
            <p className="text-secondary-500">Please try refreshing the page</p>
          </div>
        </div>
      </Layout>
    );
  }

  const student = dashboardData?.student;
  const academicInfo = dashboardData?.academicInfo;
  const courses = dashboardData?.courses || [];
  const attendanceSummary = dashboardData?.attendanceSummary || [];
  const recentScores = dashboardData?.recentScores || [];
  const notifications = dashboardData?.notifications || {};
  const fees = dashboardData?.fees || {};

  return (
    <Layout requiredRole="student">
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">
            Welcome back, {student?.profile.firstName}!
          </h1>
          <p className="text-secondary-600">
            Here's an overview of your academic progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Enrolled Courses"
            value={academicInfo?.enrolledCourses || 0}
            icon={BookOpenIcon}
            subtitle={`${academicInfo?.currentSemester} Semester`}
          />
          
          <StatCard
            title="Current GPA"
            value={academicInfo?.currentGPA?.toFixed(2) || '0.00'}
            icon={ChartBarIcon}
            color="text-green-600"
            subtitle="Out of 10.0"
          />
          
          <StatCard
            title="Pending Fees"
            value={fees.summary?.pendingAmount ? formatCurrency(fees.summary.pendingAmount) : '₹0'}
            icon={CurrencyDollarIcon}
            color={fees.summary?.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'}
            subtitle={fees.overdueFees > 0 ? `${fees.overdueFees} overdue` : 'All up to date'}
          />
          
          <StatCard
            title="Notifications"
            value={notifications.unreadCount || 0}
            icon={BellIcon}
            color="text-blue-600"
            subtitle="Unread messages"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrolled Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpenIcon className="h-5 w-5 mr-2 text-primary-600" />
                Current Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {courses.length > 0 ? (
                  courses.slice(0, 5).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          {enrollment.course?.courseName}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {enrollment.course?.courseCode} • {enrollment.course?.credits} Credits
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`status-badge ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-secondary-500 text-center py-4">
                    No courses enrolled for this semester
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary-600" />
                Attendance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceSummary.length > 0 ? (
                  attendanceSummary.slice(0, 5).map((attendance) => (
                    <div key={attendance._id.courseId} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          {attendance._id.courseName}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {attendance.presentClasses}/{attendance.totalClasses} classes
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${getAttendanceColor(attendance.percentage)}`}>
                          {formatPercentage(attendance.percentage)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-secondary-500 text-center py-4">
                    No attendance records found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600" />
                Recent Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentScores.length > 0 ? (
                  recentScores.map((score) => (
                    <div key={score.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                      <div>
                        <p className="font-medium text-secondary-900">
                          {score.course?.courseCode}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {score.examType} • {formatDate(score.examDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-secondary-900">
                          {score.marks}/{score.maxMarks}
                        </p>
                        <p className="text-sm text-secondary-600">
                          Grade: {score.grade}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-secondary-500 text-center py-4">
                    No recent scores available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="h-5 w-5 mr-2 text-primary-600" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.recent && notifications.recent.length > 0 ? (
                  notifications.recent.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-3 bg-secondary-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-secondary-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-secondary-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-secondary-500 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="ml-2 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-secondary-500 text-center py-4">
                    No recent notifications
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
