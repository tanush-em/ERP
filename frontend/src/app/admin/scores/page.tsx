'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ChartBarIcon,
  PlusIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface ScoreRecord {
  _id: string;
  student: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      rollNumber: string;
    };
  };
  course: {
    _id: string;
    courseName: string;
    courseCode: string;
  };
  examType: string;
  marks: number;
  maxMarks: number;
  grade: string;
  examDate: string;
}

const ScoresPage = () => {
  const [scoreRecords, setScoreRecords] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newScore, setNewScore] = useState({
    studentId: '',
    courseId: '',
    examType: 'midterm',
    score: 0,
    maxScore: 100
  });

  useEffect(() => {
    fetchCourses();
    fetchStudents();
    fetchScoreRecords();
  }, []);

  useEffect(() => {
    fetchScoreRecords();
  }, [selectedCourse, selectedExamType]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchScoreRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCourse) params.append('courseId', selectedCourse);
      if (selectedExamType) params.append('examType', selectedExamType);

      const response = await fetch(`/api/admin/scores?${params}`);
      if (response.ok) {
        const data = await response.json();
        setScoreRecords(data.scores || []);
      }
    } catch (error) {
      console.error('Failed to fetch score records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: newScore.courseId,
          examType: newScore.examType,
          maxScore: newScore.maxScore,
          scores: [{
            studentId: newScore.studentId,
            score: newScore.score
          }]
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewScore({
          studentId: '',
          courseId: '',
          examType: 'midterm',
          score: 0,
          maxScore: 100
        });
        fetchScoreRecords();
      }
    } catch (error) {
      console.error('Failed to add score:', error);
    }
  };

  const getGradeColor = (grade: string) => {
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

  const averageScore = scoreRecords.length > 0 
    ? scoreRecords.reduce((sum, record) => sum + (record.marks / record.maxMarks * 100), 0) / scoreRecords.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-secondary-900">Scores Management</h1>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Score
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Total Records</p>
              <p className="text-2xl font-semibold text-secondary-900">{scoreRecords.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Average Score</p>
              <p className="text-2xl font-semibold text-secondary-900">{averageScore.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">Above 80%</p>
              <p className="text-2xl font-semibold text-secondary-900">
                {scoreRecords.filter(r => (r.marks / r.maxMarks * 100) >= 80).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseCode} - {course.courseName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Exams</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
              <option value="project">Project</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchScoreRecords} className="w-full">
              Filter Records
            </Button>
          </div>
        </div>
      </Card>

      {/* Score Records Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Exam Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {scoreRecords.map((record) => (
                <tr key={record._id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-secondary-900">
                        {record.student.profile.firstName} {record.student.profile.lastName}
                      </div>
                      <div className="text-sm text-secondary-500">
                        {record.student.profile.rollNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {record.course.courseCode}
                    </div>
                    <div className="text-sm text-secondary-500">
                      {record.course.courseName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 capitalize">
                    {record.examType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {record.marks} / {record.maxMarks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {((record.marks / record.maxMarks) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(record.grade)}`}>
                      {record.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Score Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-secondary-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddScore}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                    Add Score Record
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Student
                      </label>
                      <select
                        value={newScore.studentId}
                        onChange={(e) => setNewScore({...newScore, studentId: e.target.value})}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select Student</option>
                        {students.map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.profile.rollNumber} - {student.profile.firstName} {student.profile.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Course
                      </label>
                      <select
                        value={newScore.courseId}
                        onChange={(e) => setNewScore({...newScore, courseId: e.target.value})}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      >
                        <option value="">Select Course</option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.courseCode} - {course.courseName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Exam Type
                        </label>
                        <select
                          value={newScore.examType}
                          onChange={(e) => setNewScore({...newScore, examType: e.target.value})}
                          className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="midterm">Midterm</option>
                          <option value="final">Final</option>
                          <option value="quiz">Quiz</option>
                          <option value="assignment">Assignment</option>
                          <option value="project">Project</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Max Score
                        </label>
                        <Input
                          type="number"
                          placeholder="Max Score"
                          value={newScore.maxScore}
                          onChange={(e) => setNewScore({...newScore, maxScore: parseInt(e.target.value)})}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Score
                      </label>
                      <Input
                        type="number"
                        placeholder="Score"
                        value={newScore.score}
                        onChange={(e) => setNewScore({...newScore, score: parseInt(e.target.value)})}
                        min="0"
                        max={newScore.maxScore}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button type="submit" className="w-full sm:ml-3 sm:w-auto">
                    Add Score
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="mt-3 w-full sm:mt-0 sm:w-auto bg-white text-secondary-900 border border-secondary-300 hover:bg-secondary-50"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoresPage;
