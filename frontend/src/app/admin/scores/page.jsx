'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  DocumentTextIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const ScoresPage = () => {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');

  useEffect(() => {
    // Mock data for now
    setTimeout(() => {
      setScores([
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
          examType: 'midterm',
          marks: 85,
          maxMarks: 100,
          grade: 'A',
          examDate: new Date().toISOString()
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
          examType: 'midterm',
          marks: 92,
          maxMarks: 100,
          grade: 'A+',
          examDate: new Date().toISOString()
        },
        {
          _id: '3',
          student: {
            profile: {
              firstName: 'Bob',
              lastName: 'Wilson',
              rollNumber: 'CS003'
            }
          },
          course: {
            courseCode: 'CS201',
            courseName: 'Data Structures'
          },
          examType: 'final',
          marks: 78,
          maxMarks: 100,
          grade: 'B+',
          examDate: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      case 'F':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredScores = scores.filter(score => {
    const matchesSearch = 
      score.student.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.student.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.student.profile.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !selectedCourse || score.course.courseCode === selectedCourse;
    const matchesExamType = !selectedExamType || score.examType === selectedExamType;
    
    return matchesSearch && matchesCourse && matchesExamType;
  });

  const calculateStats = () => {
    if (filteredScores.length === 0) return { avg: 0, highest: 0, lowest: 0 };
    
    const marks = filteredScores.map(s => s.marks);
    return {
      avg: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
      highest: Math.max(...marks),
      lowest: Math.min(...marks)
    };
  };

  const stats = calculateStats();

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
            <ChartBarIcon className="h-8 w-8" />
            <span>Scores Management</span>
          </h1>
          <p className="text-secondary-600 mt-2">Manage student scores and grades</p>
        </div>
        <Button className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Scores</span>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.avg}</div>
          <div className="text-sm text-gray-500">Average Score</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.highest}</div>
          <div className="text-sm text-gray-500">Highest Score</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.lowest}</div>
          <div className="text-sm text-gray-500">Lowest Score</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{filteredScores.length}</div>
          <div className="text-sm text-gray-500">Total Records</div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Courses</option>
            <option value="CS101">CS101 - Introduction to CS</option>
            <option value="CS201">CS201 - Data Structures</option>
            <option value="CS301">CS301 - Database Systems</option>
          </select>
          
          <select 
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Exam Types</option>
            <option value="quiz">Quiz</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="assignment">Assignment</option>
          </select>
          
          <Button variant="outline">
            Export Results
          </Button>
        </div>
      </Card>

      {/* Scores Table */}
      <Card className="p-6">
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
                  Exam Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScores.map((score) => (
                <tr key={score._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {score.student.profile.firstName[0]}{score.student.profile.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {score.student.profile.firstName} {score.student.profile.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {score.student.profile.rollNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {score.course.courseCode}
                    </div>
                    <div className="text-sm text-gray-500">
                      {score.course.courseName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {score.examType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{score.marks}</span>
                      <span className="text-gray-500">/ {score.maxMarks}</span>
                      <span className="text-gray-400">
                        ({Math.round((score.marks / score.maxMarks) * 100)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(score.grade)}`}>
                      {score.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(score.examDate).toLocaleDateString()}
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
          
          {filteredScores.length === 0 && (
            <div className="text-center py-12">
              <TrophyIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No scores found</p>
              <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ScoresPage;
