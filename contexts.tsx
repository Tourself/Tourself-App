
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Language, AuthUser } from './types';
import { TEXTS } from './constants';
import { authService } from './services';

// --- LANGUAGE CONTEXT ---

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    let translation = TEXTS[language][key] || key;
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            translation = translation.replace(`{${rKey}}`, replacements[rKey]);
        });
    }
    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


// --- AUTH CONTEXT ---

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser | null>;
  logout: () => void;
  register: (userData: any) => Promise<AuthUser | null>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for logged-in user on initial load
        const loggedInUser = authService.getCurrentUser();
        if (loggedInUser) {
            setUser(loggedInUser);
        }
        setLoading(false);
    }, []);

    const login = async (username: string, password: string): Promise<AuthUser | null> => {
        const loggedInUser = await authService.login(username, password);
        setUser(loggedInUser);
        return loggedInUser;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const register = async (userData: any): Promise<AuthUser | null> => {
        const newUser = await authService.register(userData);
        // Do not auto-login after registration
        return newUser;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {!loading && children}
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
