import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiService, User } from '../services/api';
import { tokenService } from '../services/tokenService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (loginData: any) => Promise<{ success: boolean; message: string }>;
  signup: (userData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (data: any) => Promise<{ success: boolean; message: string }>;
  changePassword: (data: any) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    // Check for stored token on app load
    const storedToken = tokenService.getToken();
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get user data
      apiService.getCurrentUser(storedToken).then((response) => {
        if (response.success && response.data) {
          setUser(response.data.user);
          // Schedule token refresh if needed
          tokenService.scheduleTokenRefresh(async () => {
            // Implement token refresh logic here if your API supports it
            console.log('Token refresh needed');
          });
        } else {
          // Token is invalid, remove it
          tokenService.clearToken();
          setToken(null);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (loginData: any) => {
    try {
      const response = await apiService.login(loginData);
      
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        setToken(authToken);
        setUser(userData);
        // Store token with proper expiration and remember me preference
        tokenService.setToken(authToken, 3600, loginData.rememberMe); // 1 hour default
        return { success: true, message: response.message };
      } else {
        return { 
          success: false, 
          message: response.message,
          requiresTwoFactor: (response as any).requiresTwoFactor 
        };
      }
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const signup = async (userData: any) => {
    try {
      const response = await apiService.signup(userData);
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    if (token) {
      await apiService.logout(token);
    }
    setUser(null);
    setToken(null);
    tokenService.clearToken();
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await apiService.forgotPassword({ email });
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await apiService.resetPassword(token, password);
      if (response.success && response.data) {
        const { token: authToken, user: userData } = response.data;
        setToken(authToken);
        setUser(userData);
        tokenService.setToken(authToken, 3600, false);
      }
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const updateProfile = async (data: any) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      const response = await apiService.updateProfile(data, token);
      if (response.success && response.data) {
        setUser(response.data.user);
      }
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const changePassword = async (data: any) => {
    if (!token) return { success: false, message: 'Not authenticated' };
    
    try {
      const response = await apiService.changePassword(data, token);
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: 'An unexpected error occurred' };
    }
  };
  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};