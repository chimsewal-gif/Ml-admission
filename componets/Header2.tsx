'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Moon,
  Sun,
  Settings as SettingsIcon,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import Button from '@/componets/Button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

const Header2 = () => {
  const [user, setUser] = useState<{ 
    id?: number;
    first_name: string; 
    last_name: string; 
    email: string;
    username: string;
    role?: string;
  } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    // Load user data on component mount
    loadUserData();
    
    // Listen for login events from login page
    const handleUserLogin = () => {
      console.log('Login event detected, reloading user data...');
      loadUserData();
    };
    
    window.addEventListener('userLoggedIn', handleUserLogin);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, []);

  // Also reload user data when route changes
  useEffect(() => {
    if (pathname !== '/login') {
      loadUserData();
    }
  }, [pathname]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      // Try to get from localStorage (fastest)
      const localUser = localStorage.getItem('user');
      const token = getToken();
      
      if (localUser && token) {
        try {
          const parsed = JSON.parse(localUser);
          console.log('Loaded user from localStorage:', parsed);
          setUser(parsed);
          setIsLoading(false);
          
          // Verify token in background
          verifyTokenInBackground(token);
          return;
        } catch (err) {
          console.error('Invalid user data in localStorage:', err);
          localStorage.removeItem('user');
        }
      }
      
      // If no token, user is not logged in
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Verify token with backend
      await verifyToken(token);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsLoading(false);
    }
  };

  const verifyTokenInBackground = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-token/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.log('Token verification failed in background');
        // Don't clear user immediately, let the main verification handle it
      }
    } catch (error) {
      console.error('Error verifying token in background:', error);
    }
  };

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-token/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.user) {
          const userData = {
            id: data.user.id,
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            email: data.user.email || '',
            username: data.user.username || '',
            role: data.user.role || 'user'
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          // Token invalid
          console.log('Token invalid');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        console.log('Token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Get time-based greeting and current time
  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hours = now.getHours();
      
      // Set greeting based on time of day
      if (hours < 12) {
        setGreeting('Good morning');
      } else if (hours < 18) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }
      
      // Format current time
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTime(timeString);
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get user initials safely
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const firstInitial = user.first_name?.[0]?.toUpperCase() || '';
    const lastInitial = user.last_name?.[0]?.toUpperCase() || '';
    
    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`;
    } else if (firstInitial) {
      return firstInitial;
    } else if (user.email?.[0]) {
      return user.email[0].toUpperCase();
    } else if (user.username?.[0]) {
      return user.username[0].toUpperCase();
    }
    
    return 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    } else if (user.first_name) {
      return user.first_name;
    } else if (user.username) {
      return user.username;
    } else if (user.email) {
      return user.email.split('@')[0];
    }
    
    return '';
  };

  const handleLogout = async () => {
    const token = getToken();
    
    try {
      if (token) {
        // Call logout endpoint
        await fetch(`${API_BASE_URL}/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all user data
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('applicationType');
      
      // Redirect to login
      router.push('/login');
    }
  };

  // Show loading state only briefly when first loading
  if (isLoading) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white py-4 shadow-md">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-green-900 font-bold text-lg sm:text-xl">
              Mzuzu University
            </h1>
            <div className="animate-pulse">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </header>
        <div className="h-16" />
      </>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white py-4 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Left Section - Logo and Greeting */}
          <div className="flex items-center space-x-4">
            <h1 className="text-green-900 font-bold text-lg sm:text-xl">
              Mzuzu University
            </h1>
            
            {/* Greeting and Time - Only show when user is logged in */}
            {user && getUserDisplayName() && (
              <div className="hidden md:flex flex-col">
                <span className="text-sm text-gray-600 font-medium">
                  {greeting}, {getUserDisplayName()}!
                </span>
                <span className="text-xs text-gray-500">
                  {currentTime}
                </span>
              </div>
            )}
          </div>

          <nav className="flex items-center space-x-4">
            {/* Notifications - Hidden on mobile */}
            {user && (
              <Link
                href="#"
                className="hidden sm:flex relative items-center text-green-900 font-bold hover:underline transition-colors"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                {/* User info and avatar */}
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* User info - Hidden on mobile */}
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {greeting}
                    </span>
                  </div>
                  
                  {/* User avatar */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-700 text-white font-bold flex items-center justify-center text-sm sm:text-base transition-colors">
                    {getUserInitials()}
                  </div>
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                    {/* User info in dropdown */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setDarkMode(!darkMode);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {darkMode ? (
                        <>
                          <Sun className="w-4 h-4" />
                          <span>Light Mode</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          <span>Dark Mode</span>
                        </>
                      )}
                    </button>

                    <div className="border-t border-gray-200 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Show Login button only on non-login pages */
              pathname !== '/login' && (
                <div className="hidden sm:block">
                  <Button
                    type="button"
                    title="Login"
                    icon="/user.svg"
                    variant="bg-gray-800"
                    href="/login"
                  />
                </div>
              )
            )}
          </nav>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
};

export default Header2;