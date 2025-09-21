'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const AttendancePage = () => {
  const router = useRouter();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    // Mock data for now
    setTimeout(() => {
      setAttendanceData([
        {
          _id: '1',
          student: {
            profile: {
              firstName: 'John',
              lastName: 'Doe',
              rollNumber: 'CS001'
            }
          },
          course: {
            courseCode: 'CS101',
            courseName: 'Introduction to Computer Science'
          },
          date: selectedDate,
          status: 'present'
        },
        {
          _id: '2',
          student: {
            profile: {
              firstName: 'Jane',
              lastName: 'Smith',
              rollNumber: 'CS002'
            }
          },
          course: {
            courseCode: 'CS101',
            courseName: 'Introduction to Computer Science'
          },
          date: selectedDate,
          status: 'absent'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [selectedDate]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'absent':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'late':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 flex items-center space-x-2">
            <ClipboardDocumentListIcon className="h-8 w-8" />
            <span>Attendance Management</span>
          </h1>
          <p className="text-secondary-600 mt-2">Track and manage student attendance</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex items-center space-x-2"
            onClick={() => router.push('/admin/attendance/september-2025')}
          >
            <ChartBarIcon className="h-4 w-4" />
            <span>September 2025 Stats</span>
          </Button>
          <Button className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-4 w-4" />
            <span>Mark Attendance</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select 
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Courses</option>
              <option value="CS101">CS101 - Introduction to Computer Science</option>
              <option value="CS201">CS201 - Data Structures</option>
              <option value="CS301">CS301 - Database Systems</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button className="w-full">
              Filter Attendance
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {attendanceData.length}
          </div>
          <div className="text-sm text-gray-500">Total Students</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {attendanceData.filter(a => a.status === 'present').length}
          </div>
          <div className="text-sm text-gray-500">Present</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {attendanceData.filter(a => a.status === 'absent').length}
          </div>
          <div className="text-sm text-gray-500">Absent</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {attendanceData.filter(a => a.status === 'late').length}
          </div>
          <div className="text-sm text-gray-500">Late</div>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {record.student?.profile?.firstName?.[0]}{record.student?.profile?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {record.student?.profile?.firstName} {record.student?.profile?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.student?.profile?.rollNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.course?.courseCode}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.course?.courseName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(record.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {record.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {attendanceData.length === 0 && (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No attendance records found</p>
              <p className="text-sm text-gray-400">Select a date and course to view attendance</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AttendancePage;
