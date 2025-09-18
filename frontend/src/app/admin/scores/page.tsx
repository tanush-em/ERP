'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ChartBarIcon, 
  PlusIcon, 
  PencilIcon,
  BookOpenIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useCourses, useStudents, useAddScores } from '@/hooks/useApi';
import { toast } from 'react-hot-toast';

interface ScoreEntry {
  studentId: string;
  marks: number;
  maxMarks: number;
}

const AdminScoresPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [examType, setExamType] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxMarks, setMaxMarks] = useState(100);
  const [scoreEntries, setScoreEntries] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScoreEntry, setShowScoreEntry] = useState(false);

  const { data: coursesData, isLoading: coursesLoading } = useCourses();
  const { data: studentsData, isLoading: studentsLoading } = useStudents();
  const addScoresMutation = useAddScores();

  const courses = coursesData?.courses || [];
  const students = studentsData?.students || [];

  // Filter students enrolled in selected course (simplified for demo)
  const enrolledStudents = students.filter(() => true);

  const examTypes = [
    'Internal-1',
    'Internal-2',
    'Internal-3',
    'Assignment-1',
    'Assignment-2',
    'Lab-1',
    'Lab-2',
    'Project',
    'Final Exam'
  ];

  const handleScoreChange = (studentId: string, marks: string) => {
    const numericMarks = parseFloat(marks) || 0;
    if (numericMarks >= 0 && numericMarks <= maxMarks) {
      setScoreEntries(prev => ({
        ...prev,
        [studentId]: numericMarks
      }));
    }
  };

  const handleSubmitScores = async () => {
    if (!selectedCourse || !examType || Object.keys(scoreEntries).length === 0) {
      toast.error('Please fill in all required fields and enter scores');
      return;
    }

    setIsSubmitting(true);

    try {
      const scoresData = Object.entries(scoreEntries).map(([studentId, marks]) => ({
        studentId,
        courseId: selectedCourse,
        examType,
        marks,
        maxMarks,
        examDate: examDate
      }));

      await addScoresMutation.mutateAsync({
        scores: scoresData
      });

      toast.success(`Scores added for ${scoresData.length} students`);
      setScoreEntries({});
      setShowScoreEntry(false);
    } catch (error) {
      toast.error('Failed to add scores');
      console.error('Score submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateGrade = (marks: number, maxMarks: number) => {
    const percentage = (marks / maxMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600 bg-green-100';
      case 'B+':
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-secondary-600 bg-secondary-100';
    }
  };

  return (
    <Layout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">Score Management</h1>
          <Button
            onClick={() => setShowScoreEntry(!showScoreEntry)}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Scores
          </Button>
        </div>

        {/* Add Scores Form */}
        {showScoreEntry && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PencilIcon className="h-5 w-5 mr-2 text-primary-600" />
                Add New Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.courseCode} - {course.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Exam Type
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Exam Type</option>
                    {examTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Max Marks
                  </label>
                  <Input
                    type="number"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
                    min="1"
                    max="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Exam Date
                  </label>
                  <Input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedCourse && examType && (
                <>
                  <div className="bg-secondary-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-5 w-5 text-primary-600 mr-2" />
                          <span className="text-sm font-medium text-secondary-700">
                            Students: {enrolledStudents.length}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <AcademicCapIcon className="h-5 w-5 text-primary-600 mr-2" />
                          <span className="text-sm font-medium text-secondary-700">
                            Scores Entered: {Object.keys(scoreEntries).length}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={handleSubmitScores}
                        disabled={isSubmitting || Object.keys(scoreEntries).length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? 'Saving...' : 'Save All Scores'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-secondary-900">Enter Scores</h3>
                    {studentsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="text-secondary-600 mt-2">Loading students...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {enrolledStudents.map((student) => {
                          const studentMarks = scoreEntries[student.id] || 0;
                          const grade = calculateGrade(studentMarks, maxMarks);
                          
                          return (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-4 bg-white border border-secondary-200 rounded-lg"
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

                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={scoreEntries[student.id] || ''}
                                    onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                    min="0"
                                    max={maxMarks}
                                    className="w-20 text-center"
                                  />
                                  <span className="text-sm text-secondary-600">/ {maxMarks}</span>
                                </div>

                                {scoreEntries[student.id] && (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-secondary-600">
                                      {((scoreEntries[student.id] / maxMarks) * 100).toFixed(1)}%
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
                                      {grade}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Total Courses</p>
                  <p className="text-2xl font-bold text-primary-600">{courses.length}</p>
                </div>
                <BookOpenIcon className="h-8 w-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Total Students</p>
                  <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Exam Types</p>
                  <p className="text-2xl font-bold text-green-600">{examTypes.length}</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-primary-600" />
              Score Management Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-secondary-600">
              <p>• Select a course and exam type to begin entering scores</p>
              <p>• Enter marks for each student (0 to maximum marks)</p>
              <p>• Grades are automatically calculated based on percentage</p>
              <p>• Click "Save All Scores" to submit all entries at once</p>
              <p>• Students will be able to view their scores immediately after submission</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminScoresPage;
