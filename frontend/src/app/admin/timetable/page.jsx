'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CalendarDaysIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const TimetablePage = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('3');

  const timeSlots = [
    '09:00 - 10:00',
    '10:00 - 11:00', 
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00'
  ];

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    // Mock data for now
    setTimeout(() => {
      setTimetable([
        {
          _id: '1',
          day: 'Monday',
          time: '09:00 - 10:00',
          course: { courseCode: 'CS101', courseName: 'Introduction to CS' },
          faculty: 'Dr. Smith',
          room: 'Room 101',
          semester: 3
        },
        {
          _id: '2',
          day: 'Monday',
          time: '10:00 - 11:00',
          course: { courseCode: 'CS201', courseName: 'Data Structures' },
          faculty: 'Dr. Johnson',
          room: 'Room 102',
          semester: 3
        },
        {
          _id: '3',
          day: 'Tuesday',
          time: '09:00 - 10:00',
          course: { courseCode: 'CS301', courseName: 'Database Systems' },
          faculty: 'Dr. Brown',
          room: 'Room 103',
          semester: 3
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [selectedSemester]);

  const getTimetableForSlot = (day, time) => {
    return timetable.find(t => t.day === day && t.time === time);
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
            <CalendarDaysIcon className="h-8 w-8" />
            <span>Timetable Management</span>
          </h1>
          <p className="text-secondary-600 mt-2">Manage class schedules and room assignments</p>
        </div>
        <Button className="flex items-center space-x-2">
          <PlusIcon className="h-4 w-4" />
          <span>Add Schedule</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <select 
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button variant="outline">
              Export Timetable
            </Button>
          </div>
        </div>
      </Card>

      {/* Timetable Grid */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Weekly Schedule - Semester {selectedSemester}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                {weekDays.map(day => (
                  <th key={day} className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 bg-gray-50 font-medium text-sm text-gray-900">
                    {time}
                  </td>
                  {weekDays.map(day => {
                    const classInfo = getTimetableForSlot(day, time);
                    return (
                      <td key={`${day}-${time}`} className="border border-gray-200 px-2 py-3 h-20 align-top">
                        {classInfo ? (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-2 h-full">
                            <div className="text-xs font-medium text-primary-800 mb-1">
                              {classInfo.course.courseCode}
                            </div>
                            <div className="text-xs text-primary-600 mb-1">
                              {classInfo.course.courseName}
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              {classInfo.room}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {classInfo.faculty}
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <PlusIcon className="h-4 w-4" />
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <ClockIcon className="h-8 w-8 mx-auto text-blue-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{timetable.length}</div>
          <div className="text-sm text-gray-500">Scheduled Classes</div>
        </Card>
        
        <Card className="p-6 text-center">
          <BookOpenIcon className="h-8 w-8 mx-auto text-green-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {new Set(timetable.map(t => t.course.courseCode)).size}
          </div>
          <div className="text-sm text-gray-500">Active Courses</div>
        </Card>
        
        <Card className="p-6 text-center">
          <MapPinIcon className="h-8 w-8 mx-auto text-purple-600 mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {new Set(timetable.map(t => t.room)).size}
          </div>
          <div className="text-sm text-gray-500">Rooms Used</div>
        </Card>
      </div>
    </div>
  );
};

export default TimetablePage;
