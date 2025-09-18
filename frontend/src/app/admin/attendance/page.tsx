'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ClipboardDocumentListIcon, 
  CheckIcon, 
  XMarkIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { useCourses, useStudents, useMarkAttendance } from '@/hooks/useApi';
import { toast } from 'react-hot-toast';

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent';
}

const AdminAttendancePage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent'>>({});
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);

  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const markAttendanceMutation = useMarkAttendance();

  const courses = coursesData?.courses || [];
  const students = studentsData?.students || [];

  // Filter students enrolled in selected course
  const enrolledStudents = students.filter(student => 
    // This would need to be enhanced with actual enrollment data
    // For now, showing all students as a demo
    true
  );

  useEffect(() => {
    // Initialize attendance records when students change
    const initialRecords: Record<string, 'present' | 'absent'> = {};
    enrolledStudents.forEach(student => {
      initialRecords[student.id] = 'present'; // Default to present
    });
    setAttendanceRecords(initialRecords);
  }, [enrolledStudents.length, selectedCourse]);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedCourse || !selectedDate) {
      toast.error('Please select a course and date');
      return;
    }

    setIsMarkingAttendance(true);

    try {
      const attendanceData = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        courseId: selectedCourse,
        date: selectedDate,
        status,
        sessionType: 'theory'
      }));

      await markAttendanceMutation.mutateAsync({
        attendanceRecords: attendanceData
      });

      toast.success(`Attendance marked for ${attendanceData.length} students`);
    } catch (error) {
      toast.error('Failed to mark attendance');
      console.error('Attendance marking error:', error);
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const presentCount = Object.values(attendanceRecords).filter(status => status === 'present').length;
  const absentCount = Object.values(attendanceRecords).filter(status => status === 'absent').length;

  return (
    <Layout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">Attendance Management</h1>
        </div>

        {/* Course and Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-600" />
              Mark Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={coursesLoading}
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {selectedCourse && (
              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-700">
                        Present: {presentCount}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <XMarkIcon className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-700">
                        Absent: {absentCount}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmitAttendance}
                    disabled={isMarkingAttendance || !selectedCourse}
                    className="bg-primary-600 hover:bg-primary-700"
                  >
                    {isMarkingAttendance ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Attendance List */}
        {selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-primary-600" />
                Student Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-secondary-600 mt-2">Loading students...</p>
                </div>
              ) : enrolledStudents.length === 0 ? (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                  <p className="text-secondary-600">No students found for this course</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {student.profile?.firstName?.charAt(0)}{student.profile?.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900">
                            {student.profile?.firstName} {student.profile?.lastName}
                          </p>
                          <p className="text-sm text-secondary-600">
                            {student.profile?.rollNumber}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            attendanceRecords[student.id] === 'present'
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <CheckIcon className="h-4 w-4 mr-1 inline" />
                          Present
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            attendanceRecords[student.id] === 'absent'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          <XMarkIcon className="h-4 w-4 mr-1 inline" />
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminAttendancePage;
