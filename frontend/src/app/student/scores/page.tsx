'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { 
  ChartBarIcon, 
  AcademicCapIcon, 
  TrophyIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  StarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useStudentScores, useStudentGPA, useStudentCourses } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';

const StudentScoresPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');

  const { data: coursesData, isLoading: coursesLoading } = useStudentCourses();
  const { data: scoresData, isLoading: scoresLoading } = useStudentScores({
    courseId: selectedCourse || undefined,
    examType: selectedExamType || undefined,
  });
  const { data: gpaData, isLoading: gpaLoading } = useStudentGPA();

  const courses = coursesData?.courses || [];
  const scores = scoresData?.scores || [];
  
  const examTypes = [
    'Internal-1', 'Internal-2', 'Internal-3',
    'Assignment-1', 'Assignment-2',
    'Lab-1', 'Lab-2',
    'Project', 'Final Exam'
  ];

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

  const calculatePercentage = (marks: number, maxMarks: number) => {
    return ((marks / maxMarks) * 100).toFixed(1);
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
    if (percentage >= 80) return <StarIcon className="h-5 w-5 text-green-500" />;
    if (percentage >= 70) return <AcademicCapIcon className="h-5 w-5 text-blue-500" />;
    return <ChartBarIcon className="h-5 w-5 text-secondary-500" />;
  };

  // Calculate average score
  const averageScore = scores.length > 0 
    ? scores.reduce((sum, score) => sum + (score.marks / score.maxMarks * 100), 0) / scores.length 
    : 0;

  return (
    <Layout requiredRole="student">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-secondary-900">My Scores</h1>
        </div>

        {/* GPA and Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Current GPA</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {gpaLoading ? '...' : (gpaData?.gpa?.toFixed(2) || '0.00')}
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">Out of 10.0</p>
                </div>
                <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Average Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {averageScore.toFixed(1)}%
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">{scores.length} exams</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">Best Performance</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {scores.length > 0 
                      ? Math.max(...scores.map(s => (s.marks / s.maxMarks * 100))).toFixed(1) + '%'
                      : '0%'
                    }
                  </p>
                  <p className="text-xs text-secondary-500 mt-1">Highest score</p>
                </div>
                <TrophyIcon className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-600" />
              Filter Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Exam Type
                </label>
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Exam Types</option>
                  {examTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scores List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-primary-600" />
              Academic Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scoresLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-secondary-600 mt-2">Loading scores...</p>
              </div>
            ) : scores.length > 0 ? (
              <div className="space-y-4">
                {scores.map((score, index) => {
                  const percentage = parseFloat(calculatePercentage(score.marks, score.maxMarks));
                  
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg hover:bg-secondary-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {getPerformanceIcon(percentage)}
                        <div>
                          <p className="font-medium text-secondary-900">
                            {score.course?.courseName || 'Unknown Course'}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-secondary-600">
                            <span>{score.course?.courseCode}</span>
                            <span>•</span>
                            <span>{score.examType}</span>
                            <span>•</span>
                            <div className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {formatDate(score.examDate)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-secondary-900">
                              {score.marks}
                            </span>
                            <span className="text-sm text-secondary-600">
                              / {score.maxMarks}
                            </span>
                          </div>
                          <div className="flex items-center justify-end space-x-2 mt-1">
                            <span className="text-sm font-medium text-secondary-700">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        
                        {score.grade && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(score.grade)}`}>
                            {score.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <ChartBarIcon className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900 mb-2">
                  No Scores Found
                </h3>
                <p className="text-secondary-600">
                  {selectedCourse || selectedExamType
                    ? 'No scores match your current filters.'
                    : 'Your scores will appear here once exams are conducted and results are published.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Analysis */}
        {scores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2 text-primary-600" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {scores.filter(s => (s.marks / s.maxMarks * 100) >= 90).length}
                  </div>
                  <div className="text-sm text-green-700 mt-1">A+ Grades (90%+)</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {scores.filter(s => {
                      const pct = (s.marks / s.maxMarks * 100);
                      return pct >= 80 && pct < 90;
                    }).length}
                  </div>
                  <div className="text-sm text-blue-700 mt-1">A Grades (80-89%)</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {scores.filter(s => {
                      const pct = (s.marks / s.maxMarks * 100);
                      return pct >= 70 && pct < 80;
                    }).length}
                  </div>
                  <div className="text-sm text-yellow-700 mt-1">B+ Grades (70-79%)</div>
                </div>
                
                <div className="text-center p-4 bg-secondary-50 rounded-lg">
                  <div className="text-2xl font-bold text-secondary-600">
                    {scores.filter(s => (s.marks / s.maxMarks * 100) < 70).length}
                  </div>
                  <div className="text-sm text-secondary-700 mt-1">Below B+ (&lt;70%)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default StudentScoresPage;
