import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../types';
import ApiService from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User } }
  | { type: 'AUTH_FAILURE'; payload: { error: string } }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: { user: User } };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'UPDATE_USER':
      return { ...state, user: action.payload.user };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isServiceProvider: boolean;
    dateOfBirth?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  devLoginClient: () => Promise<void>;
  devLoginProvider: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing auth token on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken'); // Fixed: use same key as API service
      if (token) {
        // Verify token is still valid by fetching user data
        const user = await ApiService.getCurrentUser();
        await AsyncStorage.setItem('currentUser', JSON.stringify(user)); // Fixed: use same key as API service
        dispatch({ type: 'AUTH_SUCCESS', payload: { user } });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: { error: 'No token found' } });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: { error: 'Authentication failed' } });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response: AuthResponse = await ApiService.login({ email, password });
      await AsyncStorage.setItem('currentUser', JSON.stringify(response.user));
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.user } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: { error: errorMessage } });
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isServiceProvider: boolean;
    dateOfBirth?: string;
  }) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response: AuthResponse = await ApiService.register(userData);
      await AsyncStorage.setItem('currentUser', JSON.stringify(response.user));
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.user } });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: { error: errorMessage } });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
      await AsyncStorage.multiRemove(['authToken', 'currentUser']);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await ApiService.updateProfile(userData);
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
      dispatch({ type: 'UPDATE_USER', payload: { user: updatedUser } });
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const devLoginClient = async () => {
    try {
      console.log('Starting dev login client...');
      dispatch({ type: 'AUTH_START' });
      const response: AuthResponse = await ApiService.devLoginClient();
      console.log('Dev login client response:', response);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.user } });
    } catch (error: any) {
      console.error('Dev login client error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Dev login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: { error: errorMessage } });
      throw error;
    }
  };

  const devLoginProvider = async () => {
    try {
      console.log('Starting dev login provider...');
      dispatch({ type: 'AUTH_START' });
      const response: AuthResponse = await ApiService.devLoginProvider();
      console.log('Dev login provider response:', response);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.user } });
    } catch (error: any) {
      console.error('Dev login provider error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Dev login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: { error: errorMessage } });
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
    devLoginClient,
    devLoginProvider,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
