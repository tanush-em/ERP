'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BookOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useStudentCourses, useStudentAttendance } from '@/hooks/useApi';
import { formatPercentage, formatDate, getAttendanceColor } from '@/lib/utils';

const StudentAttendancePage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: coursesData, isLoading: coursesLoading } = useStudentCourses();
  const { data: attendanceSummary, isLoading: summaryLoading } = useStudentAttendance({ summary: true });
  const { data: attendanceData, isLoading: attendanceLoading } = useStudentAttendance({
    courseId: selectedCourse || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const courses = coursesData?.courses || [];
  const summary = attendanceSummary?.summary || [];
  const attendanceRecords = attendanceData?.attendance || [];

  const getStatusIcon = (status: string) => {
    if (status === 'present') {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    if (status === 'present') {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else {
      return `${baseClasses} bg-red-100 text-red-800`;
    }
  };

  return (
    <Layout requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">My Attendance</h1>
        </div>

        {/* Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaryLoading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 mt-2">Loading attendance summary...</p>
            </div>
          ) : summary.length > 0 ? (
            summary.map((course) => (
              <Card key={course._id?.courseId} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-secondary-900 mb-1">
                        {course._id?.courseName || 'Unknown Course'}
                      </h3>
                      <p className="text-sm text-secondary-600 mb-3">
                        {course.presentClasses}/{course.totalClasses} classes attended
                      </p>
                      <div className="flex items-center">
                        <div className={`text-2xl font-bold ${getAttendanceColor(course.percentage)}`}>
                          {formatPercentage(course.percentage)}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <ChartBarIcon className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <ChartBarIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  No Attendance Records
                </h3>
                <p className="text-secondary-600">
                  Your attendance records will appear here once classes begin.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-600" />
              Filter Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={coursesLoading}
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.course?.courseCode} - {course.course?.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary-600" />
              Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-secondary-600 mt-2">Loading attendance records...</p>
              </div>
            ) : attendanceRecords.length > 0 ? (
              <div className="space-y-4">
                {attendanceRecords.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(record.status)}
                      <div>
                        <p className="font-medium text-secondary-900">
                          {record.course?.courseName || 'Unknown Course'}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {record.course?.courseCode} • {record.sessionType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-secondary-900">
                          {formatDate(record.date)}
                        </p>
                        <div className="flex items-center text-xs text-secondary-600">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {record.markedAt ? formatDate(record.markedAt) : 'N/A'}
                        </div>
                      </div>
                      <span className={getStatusBadge(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  No Attendance Records Found
                </h3>
                <p className="text-secondary-600">
                  {selectedCourse || startDate || endDate
                    ? 'No attendance records match your current filters.'
                    : 'Your attendance records will appear here once classes begin.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StudentAttendancePage;
