import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { User, LoginCredentials } from '@/types';
import { authApi } from '@/lib/api';
import { 
  getStoredUser, 
  getStoredToken, 
  isAuthenticated as checkAuth, 
  clearAuth,
  isAdmin as checkIsAdmin,
  isStudent as checkIsStudent
} from '@/lib/auth';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      const storedUser = getStoredUser();
      const token = getStoredToken();
      
      if (storedUser && token) {
        setUser(storedUser);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      
      setUser(response.user);
      toast.success('Login successful!');
      
      // Redirect based on role
      if (response.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      setUser(null);
      setIsLoading(false);
      router.push('/login');
      toast.success('Logged out successfully');
    }
  }, [router]);

  const updateProfile = useCallback(async (data: Partial<User>): Promise<boolean> => {
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const changePassword = useCallback(async (data: { 
    currentPassword: string; 
    newPassword: string; 
  }): Promise<boolean> => {
    try {
      await authApi.changePassword(data);
      toast.success('Password changed successfully!');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const updatedUser = await authApi.getProfile();
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might be logged out
      if (error.response?.status === 401) {
        await logout();
      }
    }
  }, [logout]);

  return {
    user,
    isAuthenticated: checkAuth(),
    isLoading,
    isAdmin: checkIsAdmin(),
    isStudent: checkIsStudent(),
    login,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
  };
};

// Hook for protecting routes
export const useRequireAuth = (requiredRole?: 'admin' | 'student') => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        // Redirect to appropriate dashboard if user has wrong role
        if (user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user?.role === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/login');
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAuthorized: !requiredRole || user?.role === requiredRole,
  };
};
