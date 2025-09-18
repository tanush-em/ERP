import { User } from '@/types';
import Cookies from 'js-cookie';

export const getStoredUser = (): User | null => {
  try {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return Cookies.get('accessToken') || null;
};

export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  const user = getStoredUser();
  return !!(token && user);
};

export const isAdmin = (): boolean => {
  const user = getStoredUser();
  return user?.role === 'admin';
};

export const isStudent = (): boolean => {
  const user = getStoredUser();
  return user?.role === 'student';
};

export const clearAuth = (): void => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
  Cookies.remove('user');
};

export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Unknown User';
  
  const { profile } = user;
  if (profile.firstName && profile.lastName) {
    return `${profile.firstName} ${profile.lastName}`;
  }
  
  return user.username;
};

export const getUserInitials = (user: User | null): string => {
  if (!user) return 'U';
  
  const { profile } = user;
  if (profile.firstName && profile.lastName) {
    return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
  }
  
  return user.username[0].toUpperCase();
};

export const formatUserRole = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'student':
      return 'Student';
    default:
      return role;
  }
};

// Permission checks
export const canAccessStudentData = (currentUser: User | null, targetStudentId: string): boolean => {
  if (!currentUser) return false;
  
  // Admin can access any student's data
  if (currentUser.role === 'admin') return true;
  
  // Student can only access their own data
  if (currentUser.role === 'student') {
    return currentUser.id === targetStudentId;
  }
  
  return false;
};

export const canModifySystemData = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const canViewAllStudents = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const canMarkAttendance = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const canManageCourses = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const canManageFees = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const canSendNotifications = (user: User | null): boolean => {
  return user?.role === 'admin';
};
