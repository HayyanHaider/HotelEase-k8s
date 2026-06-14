import { useState, useEffect, useCallback } from 'react';
import AuthApiService from '../services/api/AuthApiService';

export const useAuth = () => {
 const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 const [isAuthenticated, setIsAuthenticated] = useState(false);

  const verifyStoredToken = useCallback(async () => {
   try {
      const token = sessionStorage.getItem('token');
     const userData = sessionStorage.getItem('user');

     if (token && userData) {
      try {
         const response = await AuthApiService.verifyToken();
        if (response.success && response.valid) {
          setUser(response.user);
           setIsAuthenticated(true);
          sessionStorage.setItem('user', JSON.stringify(response.user));
         } else {
           sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
           setUser(null);
          setIsAuthenticated(false);
         }
       } catch (error) {
        sessionStorage.removeItem('token');
         sessionStorage.removeItem('user');
        setUser(null);
         setIsAuthenticated(false);
       }
     } else {
      setUser(null);
       setIsAuthenticated(false);
     }
   } catch (error) {
     console.error('Token verification error:', error);
    setUser(null);
     setIsAuthenticated(false);
   } finally {
    setLoading(false);
   }
  }, []);

 const login = useCallback(async (email, password) => {
   try {
     setLoading(true);
    const response = await AuthApiService.login(email, password);
     
     if (response.success) {
      sessionStorage.setItem('token', response.token);
       sessionStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
       setIsAuthenticated(true);
      return { success: true, user: response.user };
     } else {
       return { success: false, message: response.message || 'Login failed' };
     }
   } catch (error) {
    return { success: false, message: error.message || 'Login failed' };
   } finally {
     setLoading(false);
   }
  }, []);

  const register = useCallback(async (userData) => {
   try {
     setLoading(true);
    const response = await AuthApiService.register(userData);
     
     if (response.success) {
      sessionStorage.setItem('token', response.token);
       sessionStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
       setIsAuthenticated(true);
      return { success: true, user: response.user };
     } else {
       return { success: false, message: response.message || 'Registration failed' };
     }
   } catch (error) {
    return { success: false, message: error.message || 'Registration failed' };
   } finally {
     setLoading(false);
   }
  }, []);

 const logout = useCallback(() => {
   sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
   setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
   try {
     setLoading(true);
    const response = await AuthApiService.updateProfile(profileData);
     
     if (response.success) {
      setUser(response.user);
       sessionStorage.setItem('user', JSON.stringify(response.user));
      return { success: true, user: response.user };
     } else {
       return { success: false, message: response.message || 'Update failed' };
     }
   } catch (error) {
    return { success: false, message: error.message || 'Update failed' };
   } finally {
     setLoading(false);
   }
  }, []);

 useEffect(() => {
   verifyStoredToken();
  }, [verifyStoredToken]);

  return {
   user,
    loading,
   isAuthenticated,
    login,
   register,
    logout,
   updateProfile,
    verifyToken: verifyStoredToken
  };
};
