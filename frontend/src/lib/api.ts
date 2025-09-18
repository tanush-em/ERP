import axios, { AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import {
  AuthResponse,
  LoginCredentials,
  User,
  StudentDashboard,
  AdminDashboard,
  Course,
  Enrollment,
  AttendanceRecord,
  Score,
  Fee,
  Notification,
  TimetableEntry,
  WeeklyTimetable,
  CreateStudentForm,
  CreateCourseForm,
  AttendanceForm,
  ScoreForm,
  NotificationForm,
  ApiResponse,
  ApiError,
} from '@/types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          const { accessToken } = response.data;
          Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    
    // Don't show toast for certain errors (like validation errors that are handled in forms)
    if (error.response?.status !== 400) {
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Store tokens and user data
    const { accessToken, refreshToken, user } = response.data;
    Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
    Cookies.set('refreshToken', refreshToken, { expires: 30 }); // 30 days
    Cookies.set('user', JSON.stringify(user), { expires: 30 });
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear stored data regardless of API response
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('user');
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.data.user;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<{ user: User }>('/auth/profile', data);
    
    // Update stored user data
    Cookies.set('user', JSON.stringify(response.data.user), { expires: 30 });
    
    return response.data.user;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await api.put('/auth/change-password', data);
  },
};

// Dashboard API
export const dashboardApi = {
  getStudentDashboard: async (studentId?: string): Promise<StudentDashboard> => {
    const params = studentId ? { studentId } : {};
    const response = await api.get<StudentDashboard>('/dashboard/student', { params });
    return response.data;
  },

  getAdminDashboard: async (): Promise<AdminDashboard> => {
    const response = await api.get<AdminDashboard>('/dashboard/admin');
    return response.data;
  },

  getQuickStats: async (): Promise<any> => {
    const response = await api.get('/dashboard/quick-stats');
    return response.data;
  },

  getRecentActivities: async (params?: { limit?: number; days?: number }): Promise<any> => {
    const response = await api.get('/dashboard/recent-activities', { params });
    return response.data;
  },
};

// Student API
export const studentApi = {
  getCourses: async (params?: { studentId?: string; semester?: string; status?: string }): Promise<{ courses: Enrollment[]; total: number }> => {
    const response = await api.get('/student/courses', { params });
    return response.data;
  },

  getTimetable: async (params?: { studentId?: string; semester?: string }): Promise<{ timetable: WeeklyTimetable; semester: string }> => {
    const response = await api.get('/student/timetable', { params });
    return response.data;
  },

  getAttendance: async (params?: {
    studentId?: string;
    courseId?: string;
    startDate?: string;
    endDate?: string;
    summary?: boolean;
  }): Promise<{ attendance?: AttendanceRecord[]; summary?: any; percentage?: any; total?: number }> => {
    const response = await api.get('/student/attendance', { params });
    return response.data;
  },

  getScores: async (params?: { studentId?: string; courseId?: string; examType?: string }): Promise<{ scores: Score[]; total: number }> => {
    const response = await api.get('/student/scores', { params });
    return response.data;
  },

  getGPA: async (params?: { studentId?: string; semester?: string }): Promise<any> => {
    const response = await api.get('/student/gpa', { params });
    return response.data;
  },

  getTranscript: async (params?: { studentId?: string }): Promise<any> => {
    const response = await api.get('/student/transcript', { params });
    return response.data;
  },

  getFees: async (params?: { studentId?: string; academicYear?: string; summary?: boolean }): Promise<any> => {
    const response = await api.get('/student/fees', { params });
    return response.data;
  },

  getPendingFees: async (params?: { studentId?: string }): Promise<any> => {
    const response = await api.get('/student/fees/pending', { params });
    return response.data;
  },

  getNotifications: async (params?: { studentId?: string; isRead?: boolean; limit?: number }): Promise<{ notifications: Notification[]; unreadCount: number; total: number }> => {
    const response = await api.get('/student/notifications', { params });
    return response.data;
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    await api.put(`/student/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: async (): Promise<{ count: number }> => {
    const response = await api.put('/student/notifications/mark-all-read');
    return response.data;
  },
};

// Admin API
export const adminApi = {
  // Student Management
  getStudents: async (params?: { page?: number; limit?: number; semester?: number; search?: string }): Promise<any> => {
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  createStudent: async (data: CreateStudentForm): Promise<{ student: User }> => {
    const response = await api.post('/admin/students', data);
    return response.data;
  },

  updateStudent: async (studentId: string, data: Partial<CreateStudentForm>): Promise<{ student: User }> => {
    const response = await api.put(`/admin/students/${studentId}`, data);
    return response.data;
  },

  deactivateStudent: async (studentId: string): Promise<void> => {
    await api.delete(`/admin/students/${studentId}`);
  },

  // Course Management
  getCourses: async (params?: { semester?: number; search?: string }): Promise<{ courses: Course[]; total: number }> => {
    const response = await api.get('/admin/courses', { params });
    return response.data;
  },

  createCourse: async (data: CreateCourseForm): Promise<{ course: Course }> => {
    const response = await api.post('/admin/courses', data);
    return response.data;
  },

  updateCourse: async (courseId: string, data: Partial<CreateCourseForm>): Promise<{ course: Course }> => {
    const response = await api.put(`/admin/courses/${courseId}`, data);
    return response.data;
  },

  // Enrollment Management
  bulkEnrollStudents: async (data: {
    studentIds: string[];
    courseId: string;
    semester: string;
    academicYear: string;
  }): Promise<{ enrolledCount: number }> => {
    const response = await api.post('/admin/enrollments', data);
    return response.data;
  },

  // Attendance Management
  markAttendance: async (data: AttendanceForm): Promise<{ markedCount: number }> => {
    const response = await api.post('/admin/attendance', data);
    return response.data;
  },

  getAttendanceReport: async (params: {
    courseId: string;
    startDate: string;
    endDate: string;
  }): Promise<any> => {
    const response = await api.get('/admin/attendance/report', { params });
    return response.data;
  },

  // Score Management
  addScores: async (data: ScoreForm): Promise<{ addedCount: number }> => {
    const response = await api.post('/admin/scores', data);
    return response.data;
  },

  // Fee Management
  createFees: async (data: {
    studentIds: string[];
    feeData: {
      feeType: string;
      amount: number;
      dueDate: string;
      academicYear: string;
      description?: string;
    };
  }): Promise<{ createdCount: number }> => {
    const response = await api.post('/admin/fees', data);
    return response.data;
  },

  updateFeePayment: async (feeId: string, data: {
    paymentMethod: string;
    transactionId: string;
    paymentReference?: string;
  }): Promise<{ fee: Fee }> => {
    const response = await api.put(`/admin/fees/${feeId}/payment`, data);
    return response.data;
  },

  // Notification Management
  broadcastNotification: async (data: NotificationForm): Promise<{ sentCount: number }> => {
    const response = await api.post('/admin/notifications/broadcast', data);
    return response.data;
  },

  // Statistics
  getSystemStatistics: async (): Promise<any> => {
    const response = await api.get('/admin/statistics/overview');
    return response.data;
  },
};

// Common API
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
