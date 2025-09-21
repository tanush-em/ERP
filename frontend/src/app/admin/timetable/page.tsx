'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminApi, commonApi } from '@/lib/api';
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { TimetableEntry, Course } from '@/types';

const AdminTimetable = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '08:00-09:00',
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
  ];

  useEffect(() => {
    fetchData();
  }, [selectedSemester, selectedDay]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timetableData, coursesData] = await Promise.all([
        adminApi.getTimetable({ semester: selectedSemester, day: selectedDay }),
        adminApi.getCourses(),
      ]);
      
      setTimetable(Array.isArray(timetableData.timetable) ? timetableData.timetable : []);
      setCourses(coursesData.courses);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (entryData: any) => {
    try {
      await adminApi.createTimetableEntry(entryData);
      setShowAddForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to add timetable entry:', error);
    }
  };

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
        <h1 className="text-3xl font-bold text-secondary-900">Timetable Management</h1>
        <Button
          variant="primary"
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Time Slot</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem.toString()}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Day
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Days</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={fetchData} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Timetable Grid */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-secondary-900 mb-4">
          Weekly Timetable
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-secondary-200">
            <thead>
              <tr className="bg-secondary-50">
                <th className="border border-secondary-200 p-3 text-left font-medium text-secondary-900">
                  Time
                </th>
                {days.map((day) => (
                  <th key={day} className="border border-secondary-200 p-3 text-left font-medium text-secondary-900">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot}>
                  <td className="border border-secondary-200 p-3 bg-secondary-50 font-medium text-secondary-700">
                    {timeSlot}
                  </td>
                  {days.map((day) => {
                    const entry = timetable.find(
                      (t) => t.dayOfWeek === day && 
                      `${t.startTime}-${t.endTime}` === timeSlot
                    );
                    
                    return (
                      <td key={`${day}-${timeSlot}`} className="border border-secondary-200 p-3 h-20">
                        {entry ? (
                          <div className="bg-primary-100 p-2 rounded-lg text-sm">
                            <div className="font-medium text-primary-900">
                              {entry.course?.courseName || 'Unknown Course'}
                            </div>
                            <div className="text-primary-700 text-xs">
                              {entry.room}
                            </div>
                            <div className="text-primary-600 text-xs">
                              {entry.faculty}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-secondary-400 text-sm">
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Add Timetable Entry
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddEntry({
                  courseId: formData.get('courseId'),
                  dayOfWeek: formData.get('dayOfWeek'),
                  startTime: formData.get('startTime'),
                  endTime: formData.get('endTime'),
                  room: formData.get('room'),
                  faculty: formData.get('faculty'),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Course
                </label>
                <select
                  name="courseId"
                  required
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Day
                </label>
                <select
                  name="dayOfWeek"
                  required
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Day</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Start Time
                  </label>
                  <Input name="startTime" type="time" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    End Time
                  </label>
                  <Input name="endTime" type="time" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Room
                </label>
                <Input name="room" placeholder="e.g., Room 101" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Faculty
                </label>
                <Input name="faculty" placeholder="Faculty name" />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimetable;
