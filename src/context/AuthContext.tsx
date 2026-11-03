import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, StaffRole, InstitutionConfig, SystemStatus } from '../types';
import { Api, AuthService } from '../services/api';

interface AuthContextType {
  user: UserAccount | null;
  institution: InstitutionConfig | null;
  systemStatus: SystemStatus | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<UserAccount>;
  logout: () => Promise<void>;
  hasRole: (allowed: StaffRole[]) => boolean;
  refreshInstitution: () => Promise<void>;
  refreshSystemStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [institution, setInstitution] = useState<InstitutionConfig | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load account-specific appearance when logging in or restoring a session.
  // Institution colour preferences remain intentionally unused.
  useEffect(() => {
    const root = document.documentElement;
    const defaultPrimary = '#0284c7';
    const defaultTeal = '#5cc2bd';
    let primary = defaultPrimary;
    let teal = defaultTeal;
    if (user?.id) {
      try {
        const saved = JSON.parse(localStorage.getItem(`rehabpath360:personal-theme:${user.id}`) || '{}');
        if (typeof saved.primary === 'string' && /^#[0-9a-fA-F]{6}$/.test(saved.primary)) primary = saved.primary;
        if (typeof saved.teal === 'string' && /^#[0-9a-fA-F]{6}$/.test(saved.teal)) teal = saved.teal;
      } catch {
        // Invalid or blocked storage: use the default colours.
      }
    }
    root.style.setProperty('--acc', primary);
    root.style.setProperty('--teal', teal);
  }, [user?.id]);

  const refreshSystemStatus = async () => {
    try {
      const status = await Api.getSystemStatus();
      setSystemStatus(status);
      if (status.institution) {
        setInstitution(status.institution);
      }
    } catch (err) {
      console.warn('Failed to fetch system status:', err);
    }
  };

  const refreshInstitution = async () => {
    try {
      const res = await Api.getInstitution();
      if (res.institution) {
        setInstitution(res.institution);
      }
    } catch (err) {
      console.warn('Failed to fetch institution config:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshSystemStatus();
      const token = AuthService.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { user: currentStaff, institution: userInst } = await Api.getCurrentUser();
        setUser(currentStaff);
        if (userInst) {
          setInstitution(userInst);
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        AuthService.removeToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<UserAccount> => {
    setIsLoading(true);
    try {
      const { token, user: loggedInUser, institution: inst } = await Api.login(email, pass);
      AuthService.setToken(token);
      setUser(loggedInUser);
      if (inst) setInstitution(inst);
      await refreshSystemStatus();
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await Api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      AuthService.removeToken();
      setUser(null);
    }
  };

  const hasRole = (allowed: StaffRole[]): boolean => {
    if (!user) return false;
    return allowed.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        institution,
        systemStatus,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
        refreshInstitution,
        refreshSystemStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
