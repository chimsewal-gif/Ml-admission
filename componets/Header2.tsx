// Updated Header2.tsx with notification support and full theme switching (Light/Dark/High Contrast)

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Bell,
  Moon,
  Sun,
  Settings as SettingsIcon,
  User as UserIcon,
  LogOut,
  Check,
  CheckCheck,
  X,
  Monitor,
  Eye,
} from 'lucide-react';
import Button from '@/componets/Button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Notification type definition
interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Helper for API calls with auth
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token');
    }
    
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Load notifications
  const loadNotifications = async () => {
    const token = getToken();
    if (!token) return;
    
    setLoadingNotifications(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/notifications/`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unread_count || 0);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/notifications/${notificationId}/read/`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/notifications/read-all/`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/notifications/${notificationId}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const deletedNotif = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deletedNotif && !deletedNotif.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return '📄';
      case 'payment':
        return '💰';
      case 'reminder':
        return '⏰';
      case 'system':
        return '⚙️';
      default:
        return '📌';
    }
  };

  useEffect(() => {
    loadUserData();
    
    const handleUserLogin = () => {
      console.log('Login event detected, reloading user data...');
      loadUserData();
      loadNotifications();
    };
    
    window.addEventListener('userLoggedIn', handleUserLogin);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
    };
  }, []);

  // Reload user data when route changes
  useEffect(() => {
    if (pathname !== '/login') {
      loadUserData();
    }
  }, [pathname]);

  // Load notifications when user is logged in
  useEffect(() => {
    if (user) {
      loadNotifications();
      
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      
      const localUser = localStorage.getItem('user');
      const token = getToken();
      
      if (localUser && token) {
        try {
          const parsed = JSON.parse(localUser);
          console.log('Loaded user from localStorage:', parsed);
          setUser(parsed);
          setIsLoading(false);
          verifyTokenInBackground(token);
          return;
        } catch (err) {
          console.error('Invalid user data in localStorage:', err);
          localStorage.removeItem('user');
        }
      }
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
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
          console.log('Token invalid');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else if (response.status === 401) {
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

  // Get current theme icon and name
  const getThemeInfo = () => {
    switch (theme) {
      case 'dark':
        return { icon: <Moon className="w-4 h-4" />, name: 'Dark' };
      case 'high-contrast':
        return { icon: <Eye className="w-4 h-4" />, name: 'High Contrast' };
      default:
        return { icon: <Sun className="w-4 h-4" />, name: 'Light' };
    }
  };

  const currentThemeInfo = getThemeInfo();

  // Handle theme change
  const changeTheme = (newTheme: string) => {
    setTheme(newTheme);
    setShowThemeMenu(false);
  };

  useEffect(() => {
    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hours = now.getHours();
      
      if (hours < 12) {
        setGreeting('Good morning');
      } else if (hours < 18) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }
      
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
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('applicationType');
      
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 py-4 shadow-md">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <h1 className="text-green-900 dark:text-green-400 font-bold text-lg sm:text-xl">
              Mzuzu University
            </h1>
            <div className="animate-pulse">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </header>
        <div className="h-16" />
      </>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 py-4 shadow-md dark:shadow-gray-800">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <h1 className="text-green-700 dark:text-green-400 font-bold text-lg sm:text-xl cursor-pointer hover:text-green-800 dark:hover:text-green-300 transition-colors">
                Mzuzu University
              </h1>
            </Link>
          </div>

          <nav className="flex items-center space-x-4">
            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (showMenu) setShowMenu(false);
                    if (showThemeMenu) setShowThemeMenu(false);
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          <div className="animate-pulse">Loading...</div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            <div className="p-3">
                              <div className="flex items-start gap-2">
                                <div className="text-xl">
                                  {getNotificationIcon(notification.notification_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                                      {notification.title}
                                    </p>
                                    <div className="flex items-center gap-1 ml-2">
                                      {!notification.is_read && (
                                        <button
                                          onClick={() => markAsRead(notification.id)}
                                          className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                                          title="Mark as read"
                                        >
                                          <Check className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                        title="Delete"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {formatRelativeTime(notification.created_at)}
                                  </p>
                                  {notification.link && (
                                    <Link
                                      href={notification.link}
                                      className="text-xs text-green-600 dark:text-green-400 hover:underline mt-1 inline-block"
                                      onClick={() => {
                                        if (!notification.is_read) {
                                          markAsRead(notification.id);
                                        }
                                        setShowNotifications(false);
                                      }}
                                    >
                                      View details →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Dropdown (replaces old Moon/Sun button) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowThemeMenu(!showThemeMenu);
                  if (showMenu) setShowMenu(false);
                  if (showNotifications) setShowNotifications(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Change theme"
              >
                {currentThemeInfo.icon}
                <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
                  {currentThemeInfo.name}
                </span>
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2">
                  <button
                    onClick={() => changeTheme('light')}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-left text-sm transition-colors ${
                      theme === 'light'
                        ? 'bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                    {theme === 'light' && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                  <button
                    onClick={() => changeTheme('dark')}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-left text-sm transition-colors ${
                      theme === 'dark'
                        ? 'bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                  <button
                    onClick={() => changeTheme('high-contrast')}
                    className={`flex items-center gap-3 w-full px-4 py-2 text-left text-sm transition-colors ${
                      theme === 'high-contrast'
                        ? 'bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>High Contrast</span>
                    {theme === 'high-contrast' && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                </div>
              )}
            </div>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMenu(!showMenu);
                    if (showNotifications) setShowNotifications(false);
                    if (showThemeMenu) setShowThemeMenu(false);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {currentTime}
                    </span>
                  </div>
                  
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-700 text-white font-bold flex items-center justify-center text-sm sm:text-base transition-colors">
                    {getUserInitials()}
                  </div>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>

                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              pathname !== '/login' && (
                <div className="hidden sm:block">
                  <Button
                    type="button"
                    title="Login"
                    icon="/user.svg"
                    variant="bg-gray-800 dark:bg-gray-700"
                    href="/login"
                  />
                </div>
              )
            )}
          </nav>
        </div>
      </header>

      <div className="h-16" />
    </>
  );
};

export default Header2;