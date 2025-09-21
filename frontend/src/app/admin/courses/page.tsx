'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon 
} from '@heroicons/react/24/outline';

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  faculty: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    courseCode: '',
    courseName: '',
    credits: 3,
    semester: 1,
    faculty: '',
    description: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCourse),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewCourse({
          courseCode: '',
          courseName: '',
          credits: 3,
          semester: 1,
          faculty: '',
          description: ''
        });
        fetchCourses();
      }
    } catch (error) {
      console.error('Failed to add course:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchCourses();
        }
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
  };

  const filteredCourses = courses.filter(course =>
    course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.faculty.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold text-secondary-900">Courses Management</h1>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Course
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                  {course.courseName}
                </h3>
                <p className="text-sm text-secondary-600 mb-2">{course.courseCode}</p>
              </div>
              <div className="flex space-x-2">
                <button className="text-primary-600 hover:text-primary-900">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDeleteCourse(course._id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Credits:</span>
                <span className="font-medium text-secondary-900">{course.credits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Semester:</span>
                <span className="font-medium text-secondary-900">{course.semester}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-600">Faculty:</span>
                <span className="font-medium text-secondary-900">{course.faculty}</span>
              </div>
            </div>

            {course.description && (
              <p className="text-sm text-secondary-600 line-clamp-3">
                {course.description}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-secondary-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddCourse}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                    Add New Course
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="text"
                        placeholder="Course Code"
                        value={newCourse.courseCode}
                        onChange={(e) => setNewCourse({...newCourse, courseCode: e.target.value})}
                        required
                      />
                      <Input
                        type="number"
                        placeholder="Credits"
                        value={newCourse.credits}
                        onChange={(e) => setNewCourse({...newCourse, credits: parseInt(e.target.value)})}
                        min="1"
                        max="6"
                        required
                      />
                    </div>
                    <Input
                      type="text"
                      placeholder="Course Name"
                      value={newCourse.courseName}
                      onChange={(e) => setNewCourse({...newCourse, courseName: e.target.value})}
                      required
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        type="number"
                        placeholder="Semester"
                        value={newCourse.semester}
                        onChange={(e) => setNewCourse({...newCourse, semester: parseInt(e.target.value)})}
                        min="1"
                        max="8"
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Faculty"
                        value={newCourse.faculty}
                        onChange={(e) => setNewCourse({...newCourse, faculty: e.target.value})}
                        required
                      />
                    </div>
                    <textarea
                      placeholder="Course Description"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button type="submit" className="w-full sm:ml-3 sm:w-auto">
                    Add Course
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

export default CoursesPage;
