import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  dashboardApi,
  studentApi,
  adminApi,
  commonApi,
} from '@/lib/api';
import { LoadingState } from '@/types';

// Generic API hook
export const useApiCall = <T, P = any>(
  apiFunction: (params?: P) => Promise<T>,
  params?: P,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  }
) => {
  return useQuery({
    queryKey: [apiFunction.name, params],
    queryFn: () => apiFunction(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};

// Dashboard hooks
export const useStudentDashboard = (studentId?: string) => {
  return useQuery({
    queryKey: ['studentDashboard', studentId],
    queryFn: () => dashboardApi.getStudentDashboard(studentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['adminDashboard'],
    queryFn: dashboardApi.getAdminDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useQuickStats = () => {
  return useQuery({
    queryKey: ['quickStats'],
    queryFn: dashboardApi.getQuickStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Student hooks
export const useStudentCourses = (params?: { 
  studentId?: string; 
  semester?: string; 
  status?: string; 
}) => {
  return useQuery({
    queryKey: ['studentCourses', params],
    queryFn: () => studentApi.getCourses(params),
  });
};

export const useStudentTimetable = (params?: { 
  studentId?: string; 
  semester?: string; 
}) => {
  return useQuery({
    queryKey: ['studentTimetable', params],
    queryFn: () => studentApi.getTimetable(params),
  });
};

export const useStudentAttendance = (params?: {
  studentId?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
  summary?: boolean;
}) => {
  return useQuery({
    queryKey: ['studentAttendance', params],
    queryFn: () => studentApi.getAttendance(params),
  });
};

export const useStudentScores = (params?: { 
  studentId?: string; 
  courseId?: string; 
  examType?: string; 
}) => {
  return useQuery({
    queryKey: ['studentScores', params],
    queryFn: () => studentApi.getScores(params),
  });
};

export const useStudentNotifications = (params?: { 
  studentId?: string; 
  isRead?: boolean; 
  limit?: number; 
}) => {
  return useQuery({
    queryKey: ['studentNotifications', params],
    queryFn: () => studentApi.getNotifications(params),
    refetchInterval: 60000, // Refresh every minute
  });
};

// Admin hooks
export const useStudents = (params?: { 
  page?: number; 
  limit?: number; 
  semester?: number; 
  search?: string; 
}) => {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () => adminApi.getStudents(params),
  });
};

export const useCourses = (params?: { 
  semester?: number; 
  search?: string; 
}) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => adminApi.getCourses(params),
  });
};

// Mutation hooks
export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create student';
      toast.error(errorMessage);
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ studentId, data }: { studentId: string; data: any }) =>
      adminApi.updateStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update student';
      toast.error(errorMessage);
    },
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to create course';
      toast.error(errorMessage);
    },
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.markAttendance,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studentAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceReport'] });
      toast.success(`Attendance marked for ${data.markedCount} records`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(errorMessage);
    },
  });
};

export const useAddScores = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.addScores,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studentScores'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
      toast.success(`Added ${data.addedCount} score records`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to add scores';
      toast.error(errorMessage);
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: studentApi.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboard'] });
    },
    onError: (error: any) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
};

export const useBroadcastNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminApi.broadcastNotification,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['studentNotifications'] });
      toast.success(`Notification sent to ${data.sentCount} users`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to send notification';
      toast.error(errorMessage);
    },
  });
};

// Custom hook for handling loading states
export const useLoadingState = (initialState: LoadingState = 'idle') => {
  const [state, setState] = useState<LoadingState>(initialState);

  const setLoading = useCallback(() => setState('loading'), []);
  const setSuccess = useCallback(() => setState('success'), []);
  const setError = useCallback(() => setState('error'), []);
  const setIdle = useCallback(() => setState('idle'), []);

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    setLoading,
    setSuccess,
    setError,
    setIdle,
  };
};

// Custom hook for pagination
export const usePagination = (initialPage = 1, initialLimit = 20) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage(prev => prev + 1), []);
  const prevPage = useCallback(() => setPage(prev => Math.max(1, prev - 1)), []);
  const goToPage = useCallback((pageNumber: number) => setPage(pageNumber), []);
  const reset = useCallback(() => setPage(initialPage), [initialPage]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    reset,
  };
};

// Custom hook for search and filters
export const useFilters = <T extends Record<string, any>>(initialFilters: T) => {
  const [filters, setFilters] = useState<T>(initialFilters);

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters(prev => ({ ...prev, [key]: initialFilters[key] }));
  }, [initialFilters]);

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    clearFilter,
  };
};
