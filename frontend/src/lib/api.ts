import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import {
  Course,
  Student,
  Enrollment,
  AttendanceRecord,
  Score,
  Fee,
  Notification,
  TimetableEntry,
  WeeklyTimetable,
  ApiResponse,
  ApiError,
} from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5005/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    // Handle errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    
    // Don't show toast for certain errors (like validation errors that are handled in forms)
    if (error.response?.status !== 400) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Admin API - Complete student management system
export const adminApi = {
  // Student Management
  getStudents: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    semester?: string; 
  }): Promise<{ students: Student[]; total: number; page: number; limit: number }> => {
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  createStudent: async (studentData: {
    email: string;
    firstName: string;
    lastName: string;
    rollNumber: string;
    semester?: number;
    department?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    address?: string;
    guardianName?: string;
    guardianPhone?: string;
  }): Promise<{ message: string; studentId: string }> => {
    const response = await api.post('/admin/students', studentData);
    return response.data;
  },

  getStudentById: async (studentId: string): Promise<{ student: Student }> => {
    const response = await api.get(`/admin/students/${studentId}`);
    return response.data;
  },

  updateStudent: async (studentId: string, studentData: Partial<Student>): Promise<{ message: string }> => {
    const response = await api.put(`/admin/students/${studentId}`, studentData);
    return response.data;
  },

  deleteStudent: async (studentId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/students/${studentId}`);
    return response.data;
  },

  // Course Management
  getCourses: async (): Promise<{ courses: Course[] }> => {
    const response = await api.get('/admin/courses');
    return response.data;
  },

  createCourse: async (courseData: {
    courseCode: string;
    courseName: string;
    credits: number;
    semester: number;
    department?: string;
    faculty?: string;
    description?: string;
  }): Promise<{ message: string; courseId: string }> => {
    const response = await api.post('/admin/courses', courseData);
    return response.data;
  },

  updateCourse: async (courseId: string, courseData: Partial<Course>): Promise<{ message: string }> => {
    const response = await api.put(`/admin/courses/${courseId}`, courseData);
    return response.data;
  },

  deleteCourse: async (courseId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/courses/${courseId}`);
    return response.data;
  },

  // Enrollment Management
  getEnrollments: async (): Promise<{ enrollments: Enrollment[] }> => {
    const response = await api.get('/admin/enrollments');
    return response.data;
  },

  createEnrollment: async (enrollmentData: {
    studentId: string;
    courseId: string;
    semester: string;
  }): Promise<{ message: string; enrollmentId: string }> => {
    const response = await api.post('/admin/enrollments', enrollmentData);
    return response.data;
  },

  // Attendance Management
  getAttendanceRecords: async (params?: {
    courseId?: string;
    studentId?: string;
    date?: string;
  }): Promise<{ attendance: AttendanceRecord[]; total: number }> => {
    const response = await api.get('/admin/attendance', { params });
    return response.data;
  },

  markAttendance: async (attendanceData: {
    courseId: string;
    date: string;
    attendanceRecords: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'late';
    }>;
  }): Promise<{ message: string; successCount: number }> => {
    const response = await api.post('/admin/attendance', attendanceData);
    return response.data;
  },

  // Score Management
  getScores: async (params?: {
    courseId?: string;
    studentId?: string;
    examType?: string;
  }): Promise<{ scores: Score[]; total: number }> => {
    const response = await api.get('/admin/scores', { params });
    return response.data;
  },

  addScores: async (scoreData: {
    courseId: string;
    examType: string;
    maxScore: number;
    scores: Array<{
      studentId: string;
      score: number;
    }>;
  }): Promise<{ message: string; successCount: number }> => {
    const response = await api.post('/admin/scores', scoreData);
    return response.data;
  },

  // Fee Management
  getFees: async (params?: {
    studentId?: string;
    academicYear?: string;
    status?: 'paid' | 'pending' | 'overdue';
  }): Promise<{ fees: Fee[]; total: number }> => {
    const response = await api.get('/admin/fees', { params });
    return response.data;
  },

  createFeeRecord: async (feeData: {
    studentId: string;
    feeType: string;
    amount: number;
    dueDate: string;
    academicYear?: string;
    semester?: string;
    description?: string;
  }): Promise<{ message: string; feeId: string }> => {
    const response = await api.post('/admin/fees', feeData);
    return response.data;
  },

  recordFeePayment: async (feeId: string, paymentData: {
    paymentMethod?: string;
    transactionId?: string;
    paidAmount?: number;
  }): Promise<{ message: string }> => {
    const response = await api.post(`/admin/fees/${feeId}/payment`, paymentData);
    return response.data;
  },

  // Timetable Management
  getTimetable: async (params?: {
    semester?: string;
    day?: string;
  }): Promise<{ timetable: TimetableEntry[] | WeeklyTimetable }> => {
    const response = await api.get('/admin/timetable', { params });
    return response.data;
  },

  createTimetableEntry: async (timetableData: {
    courseId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    faculty?: string;
    semester?: string;
  }): Promise<{ message: string; entryId: string }> => {
    const response = await api.post('/admin/timetable', timetableData);
    return response.data;
  },

  // Notification Management
  getNotifications: async (): Promise<{ notifications: Notification[]; total: number }> => {
    const response = await api.get('/admin/notifications');
    return response.data;
  },

  sendNotification: async (notificationData: {
    title: string;
    message: string;
    recipients: string[];
    type?: string;
  }): Promise<{ message: string; successCount: number }> => {
    const response = await api.post('/admin/notifications', notificationData);
    return response.data;
  },

  // Dashboard Stats
  getDashboardStats: async (): Promise<{
    totalStudents: number;
    totalCourses: number;
    pendingFees: number;
    overdueFees: number;
    semesterWiseStudents: Record<string, number>;
  }> => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
};

// Common API (shared utilities)
export const commonApi = {
  getCourses: async (params?: { semester?: number; search?: string }): Promise<{ courses: Course[]; total: number }> => {
    const response = await api.get('/common/courses', { params });
    return response.data;
  },

  getCourseDetails: async (courseId: string): Promise<{ course: Course }> => {
    const response = await api.get(`/common/courses/${courseId}`);
    return response.data;
  },

  getTimetable: async (params?: {
    semester?: string;
    courseId?: string;
    roomNumber?: string;
    faculty?: string;
    day?: string;
    weekly?: boolean;
  }): Promise<{ timetable: TimetableEntry[] | WeeklyTimetable }> => {
    const response = await api.get('/common/timetable', { params });
    return response.data;
  },

  getNotificationCategories: async (): Promise<{ categories: Array<{ value: string; label: string }> }> => {
    const response = await api.get('/common/notifications/categories');
    return response.data;
  },

  getAcademicInfo: async (): Promise<any> => {
    const response = await api.get('/common/academic-info');
    return response.data;
  },

  globalSearch: async (params: { q: string; type?: string; limit?: number }): Promise<any> => {
    const response = await api.get('/common/search', { params });
    return response.data;
  },

  healthCheck: async (): Promise<any> => {
    const response = await api.get('/common/health');
    return response.data;
  },
};

export default api;