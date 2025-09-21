'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useApi } from '@/hooks/useApi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const September2025AttendancePage = () => {
  const [classStats, setClassStats] = useState(null);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { request } = useApi();

  useEffect(() => {
    fetchClassStats();
    fetchLowAttendanceStudents();
  }, []);

  // Fallback mock data for testing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!classStats && !lowAttendanceStudents.length) {
        console.log('Loading mock data as fallback...');
        setClassStats({
          month: 'September 2025',
          overall: {
            totalRecords: 6710,
            presentRecords: 5570,
            absentRecords: 1140,
            percentage: 83.01
          },
          courseStats: [
            { _id: { courseCode: 'CS301', courseName: 'Data Structures and Algorithms' }, total: 1342, present: 1114, absent: 228, percentage: 83.01 },
            { _id: { courseCode: 'CS302', courseName: 'Database Management Systems' }, total: 1342, present: 1114, absent: 228, percentage: 83.01 },
            { _id: { courseCode: 'CS303', courseName: 'Computer Networks' }, total: 1342, present: 1114, absent: 228, percentage: 83.01 },
            { _id: { courseCode: 'CS304', courseName: 'Software Engineering' }, total: 1342, present: 1114, absent: 228, percentage: 83.01 },
            { _id: { courseCode: 'CS305', courseName: 'Operating Systems' }, total: 1342, present: 1114, absent: 228, percentage: 83.01 }
          ],
          dailyTrend: []
        });
        
        setLowAttendanceStudents([
          { _id: { studentId: '1', rollNumber: '310622148040', name: 'Sneha P M' }, total: 110, present: 65, absent: 45, percentage: 59.09 },
          { _id: { studentId: '2', rollNumber: '310622148030', name: 'Naveen Karthik R' }, total: 110, present: 65, absent: 45, percentage: 59.09 },
          { _id: { studentId: '3', rollNumber: '310622148050', name: 'Vinodhini K' }, total: 110, present: 70, absent: 40, percentage: 63.64 },
          { _id: { studentId: '4', rollNumber: '310622148001', name: 'Aallan Hrithick A.S' }, total: 110, present: 70, absent: 40, percentage: 63.64 },
          { _id: { studentId: '5', rollNumber: '310622148031', name: 'Poovarasan G' }, total: 110, present: 70, absent: 40, percentage: 63.64 }
        ]);
        
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [classStats, lowAttendanceStudents]);

  const fetchClassStats = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
      console.log('Fetching class stats from:', `${API_BASE_URL}/api/admin/attendance/september-2025/class-stats`);
      const response = await request(`${API_BASE_URL}/api/admin/attendance/september-2025/class-stats`);
      console.log('Class stats response:', response);
      setClassStats(response);
    } catch (error) {
      console.error('Error fetching class stats:', error);
    }
  };

  const fetchLowAttendanceStudents = async () => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
      console.log('Fetching low attendance students from:', `${API_BASE_URL}/api/admin/attendance/september-2025/low-attendance?threshold=75`);
      const response = await request(`${API_BASE_URL}/api/admin/attendance/september-2025/low-attendance?threshold=75`);
      console.log('Low attendance response:', response);
      setLowAttendanceStudents(response.lowAttendanceStudents || []);
    } catch (error) {
      console.error('Error fetching low attendance students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAttendance = async (studentId) => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';
      const response = await request(`${API_BASE_URL}/api/admin/attendance/september-2025/student/${studentId}`);
      if (response.success !== false) {
        setStudentAttendance(response.data || response);
        setSelectedStudent(studentId);
        setActiveTab('individual');
      }
    } catch (error) {
      console.error('Error fetching student attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'absent':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'late':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
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

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBgColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100';
    if (percentage >= 75) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Chart data for daily trend
  const getDailyTrendChartData = () => {
    if (!classStats?.dailyTrend) return null;

    return {
      labels: classStats.dailyTrend.map(item => item._id),
      datasets: [
        {
          label: 'Attendance %',
          data: classStats.dailyTrend.map(item => item.percentage),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // Chart data for course comparison
  const getCourseComparisonChartData = () => {
    if (!classStats?.courseStats) return null;

    return {
      labels: classStats.courseStats.map(item => item._id.courseCode),
      datasets: [
        {
          label: 'Attendance %',
          data: classStats.courseStats.map(item => item.percentage),
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(147, 51, 234, 0.8)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(251, 191, 36)',
            'rgb(239, 68, 68)',
            'rgb(147, 51, 234)'
          ],
          borderWidth: 2
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading September 2025 attendance data...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 flex items-center space-x-2">
            <CalendarDaysIcon className="h-8 w-8" />
            <span>September 2025 Attendance</span>
          </h1>
          <p className="text-secondary-600 mt-2">Class and individual attendance statistics</p>
        </div>
        <Button 
          onClick={() => setActiveTab('overview')}
          variant={activeTab === 'overview' ? 'primary' : 'outline'}
        >
          Overview
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Class Overview
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'individual'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Individual Students
          </button>
          <button
            onClick={() => setActiveTab('low-attendance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'low-attendance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Low Attendance
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && classStats && (
        <div className="space-y-6">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {classStats.overall?.totalRecords || 0}
              </div>
              <div className="text-sm text-gray-500">Total Records</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {classStats.overall?.presentRecords || 0}
              </div>
              <div className="text-sm text-gray-500">Present</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {classStats.overall?.absentRecords || 0}
              </div>
              <div className="text-sm text-gray-500">Absent</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">
                {classStats.overall?.percentage?.toFixed(1) || 0}%
              </div>
              <div className="text-sm text-gray-500">Overall Attendance</div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Attendance Trend</h3>
              <div style={{ height: '300px' }}>
                {getDailyTrendChartData() && (
                  <Line data={getDailyTrendChartData()} options={chartOptions} />
                )}
              </div>
            </Card>

            {/* Course Comparison */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Attendance by Course</h3>
              <div style={{ height: '300px' }}>
                {getCourseComparisonChartData() && (
                  <Bar data={getCourseComparisonChartData()} options={chartOptions} />
                )}
              </div>
            </Card>
          </div>

          {/* Course Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Course-wise Statistics</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classStats.courseStats?.map((course, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {course._id.courseCode}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course._id.courseName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {course.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {course.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAttendanceBgColor(course.percentage)} ${getAttendanceColor(course.percentage)}`}>
                          {course.percentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Individual Students Tab */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          {studentAttendance ? (
            <div className="space-y-6">
              {/* Student Info */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {studentAttendance.student?.name}
                    </h3>
                    <p className="text-gray-600">Roll Number: {studentAttendance.student?.rollNumber}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getAttendanceColor(studentAttendance.overall?.percentage || 0)}`}>
                      {studentAttendance.overall?.percentage?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Overall Attendance</div>
                  </div>
                </div>
              </Card>

              {/* Student Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {studentAttendance.overall?.totalClasses || 0}
                  </div>
                  <div className="text-sm text-gray-500">Total Classes</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {studentAttendance.overall?.presentClasses || 0}
                  </div>
                  <div className="text-sm text-gray-500">Present</div>
                </Card>
                
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {studentAttendance.overall?.absentClasses || 0}
                  </div>
                  <div className="text-sm text-gray-500">Absent</div>
                </Card>
              </div>

              {/* Course-wise Performance */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Course-wise Performance</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {studentAttendance.courseStats?.map((course, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {course.courseCode}
                              </div>
                              <div className="text-sm text-gray-500">
                                {course.courseName}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {course.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            {course.present}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            {course.absent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAttendanceBgColor(course.percentage)} ${getAttendanceColor(course.percentage)}`}>
                              {course.percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Daily Pattern */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Daily Attendance Pattern</h3>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(studentAttendance.dailyPattern || {}).map(([date, records]) => (
                    <div key={date} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(date).getDate()}
                      </div>
                      <div className="space-y-1">
                        {records.map((record, idx) => (
                          <div key={idx} className="flex items-center justify-center">
                            {getStatusIcon(record.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-6">
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Select a student to view individual attendance</p>
                <p className="text-sm text-gray-400">Click on a student from the Low Attendance tab</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Low Attendance Tab */}
      {activeTab === 'low-attendance' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Students with Low Attendance (&lt;75%)</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                <span>{lowAttendanceStudents.length} students need attention</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Present
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Absent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowAttendanceStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-red-600">
                              {student._id.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {student._id.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student._id.rollNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {student.present}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {student.absent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAttendanceBgColor(student.percentage)} ${getAttendanceColor(student.percentage)}`}>
                          {student.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchStudentAttendance(student._id.studentId)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {lowAttendanceStudents.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircleIcon className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <p className="text-gray-500">Great! No students with low attendance</p>
                  <p className="text-sm text-gray-400">All students are maintaining good attendance</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default September2025AttendancePage;
