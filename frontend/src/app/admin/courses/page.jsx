'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data for now
    setTimeout(() => {
      setCourses([
        {
          _id: '1',
          courseCode: 'CS101',
          courseName: 'Introduction to Computer Science',
          credits: 3,
          semester: 1,
          faculty: 'Dr. Smith',
          description: 'Basic concepts of computer science',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          courseCode: 'CS201',
          courseName: 'Data Structures and Algorithms',
          credits: 4,
          semester: 2,
          faculty: 'Dr. Johnson',
          description: 'Advanced data structures and algorithms',
          createdAt: new Date().toISOString()
        },
        {
          _id: '3',
          courseCode: 'CS301',
          courseName: 'Database Management Systems',
          credits: 3,
          semester: 3,
          faculty: 'Dr. Brown',
          description: 'Database design and management',
          createdAt: new Date().toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCourses = courses.filter(course => 
    course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.faculty.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <BookOpenIcon className="h-8 w-8" />
            <span>Courses Management</span>
          </h1>
          <p className="text-secondary-600 mt-2">Manage course catalog and information</p>
        </div>
        <Button className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Course</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2">
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
          </select>
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <AcademicCapIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{course.courseCode}</h3>
                  <p className="text-sm text-gray-500">Semester {course.semester}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="outline" size="sm">
                  <PencilIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">{course.courseName}</h4>
              <p className="text-sm text-gray-600">{course.description}</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-500">Faculty: </span>
                  <span className="font-medium">{course.faculty}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Credits: </span>
                  <span className="font-medium">{course.credits}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpenIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No courses found</p>
          <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
        </Card>
      )}
    </div>
  );
};

export default CoursesPage;
