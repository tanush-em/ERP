import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      try {
        // Check if we're in the browser
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken');
          if (token) {
            // In a real app, you'd validate the token with the backend
            // For now, we'll assume the token is valid if it exists
            const userData = localStorage.getItem('userData');
            if (userData) {
              setUser(JSON.parse(userData));
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      // In a real app, this would make an API call to your backend
      // For demo purposes, we'll use a simple check
      if (email === 'admin@college.edu' && password === 'admin123') {
        const userData = {
          id: '1',
          email: 'admin@college.edu',
          role: 'admin',
          profile: {
            firstName: 'Admin',
            lastName: 'User'
          }
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', 'demo-token');
          localStorage.setItem('userData', JSON.stringify(userData));
        }
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };
};

export const useRequireAuth = (requiredRole) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requiredRole && user?.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  return {
    isLoading,
    isAuthorized: isAuthenticated && (!requiredRole || user?.role === requiredRole),
    user
  };
};
