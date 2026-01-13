import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, setAuth, setUser, setLoading, logout } = useAuthStore();

  // Fetch current user
  const { refetch: fetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await authApi.getMe();
      setUser(response.data);
      return response.data;
    },
    enabled: isAuthenticated && !!localStorage.getItem('accessToken'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await authApi.login(data);
      return response.data as AuthResponse;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.access_token, data.tokens.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      navigate('/');
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await authApi.register(data);
      return response.data as AuthResponse;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.tokens.access_token, data.tokens.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      navigate('/');
    },
  });

  // Logout function
  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate('/login');
  };

  // Initialize auth state
  const initAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token && isAuthenticated) {
      try {
        await fetchUser();
      } catch {
        handleLogout();
      }
    }
    setLoading(false);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: handleLogout,
    initAuth,
    fetchUser,
  };
}
