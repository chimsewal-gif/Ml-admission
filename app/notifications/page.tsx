'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, AlertCircle, FileText, CreditCard, CheckCheck, X, ArrowLeft, Trash2, Trash, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
  time_ago: string;
}

// Warning Modal Component
const WarningModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger"
}: { 
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          buttonBg: "bg-red-600 hover:bg-red-700",
          buttonFocus: "focus:ring-red-500"
        };
      case "warning":
        return {
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          buttonBg: "bg-yellow-600 hover:bg-yellow-700",
          buttonFocus: "focus:ring-yellow-500"
        };
      default:
        return {
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          buttonBg: "bg-blue-600 hover:bg-blue-700",
          buttonFocus: "focus:ring-blue-500"
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all">
          <div className="p-6">
            {/* Icon */}
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} mb-4`}>
              {type === "danger" ? (
                <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
              ) : (
                <AlertCircle className={`h-6 w-6 ${styles.iconColor}`} />
              )}
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {title}
            </h3>
            
            {/* Message */}
            <p className="text-sm text-gray-500 text-center mb-6">
              {message}
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${styles.buttonBg} focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.buttonFocus}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal states
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    type: "danger" as "danger" | "warning" | "info",
    title: "",
    message: "",
    confirmText: "Delete",
    onConfirm: () => {}
  });

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchNotifications = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unread_count || 0);
        }
      } else if (response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
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

  const markAllAsRead = async () => {
    if (isProcessing) return;
    
    const token = getToken();
    if (!token) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successMsg.innerText = 'All notifications marked as read';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const deletedNotif = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deletedNotif && !deletedNotif.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        // Remove from selection if selected
        if (selectedNotifications.has(notificationId)) {
          setSelectedNotifications(prev => {
            const newSet = new Set(prev);
            newSet.delete(notificationId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const confirmDeleteNotification = (notificationId: number, notificationTitle: string) => {
    setWarningModal({
      isOpen: true,
      type: "danger",
      title: "Delete Notification",
      message: `Are you sure you want to delete "${notificationTitle}"? This action cannot be undone.`,
      confirmText: "Delete",
      onConfirm: () => {
        deleteNotification(notificationId);
        setWarningModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const confirmDeleteSelected = () => {
    const count = selectedNotifications.size;
    setWarningModal({
      isOpen: true,
      type: "danger",
      title: "Delete Selected Notifications",
      message: `Are you sure you want to delete ${count} selected notification${count > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: `Delete ${count}`,
      onConfirm: async () => {
        await deleteSelectedNotifications();
        setWarningModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.size === 0) return;
    
    const token = getToken();
    if (!token) return;

    setIsProcessing(true);
    let deletedCount = 0;
    let errorCount = 0;

    for (const id of selectedNotifications) {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/${id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          deletedCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error('Error deleting notification:', error);
      }
    }

    // Refresh the list
    await fetchNotifications();
    setSelectedNotifications(new Set());
    setSelectMode(false);
    setIsProcessing(false);
    
    // Show result message
    const resultMsg = document.createElement('div');
    resultMsg.className = `fixed top-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg z-50 ${errorCount > 0 ? 'bg-yellow-500' : 'bg-green-500'}`;
    resultMsg.innerText = `${deletedCount} notification${deletedCount > 1 ? 's' : ''} deleted${errorCount > 0 ? `, ${errorCount} failed` : ''}`;
    document.body.appendChild(resultMsg);
    setTimeout(() => resultMsg.remove(), 3000);
  };

  const confirmMarkAllAsRead = () => {
    setWarningModal({
      isOpen: true,
      type: "info",
      title: "Mark All as Read",
      message: `Are you sure you want to mark all ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''} as read?`,
      confirmText: "Mark All Read",
      onConfirm: () => {
        markAllAsRead();
        setWarningModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const confirmClearAll = () => {
    setWarningModal({
      isOpen: true,
      type: "danger",
      title: "Clear All Notifications",
      message: `Are you sure you want to delete all ${notifications.length} notifications? This action cannot be undone.`,
      confirmText: "Clear All",
      onConfirm: async () => {
        await deleteAllNotifications();
        setWarningModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const deleteAllNotifications = async () => {
    const token = getToken();
    if (!token) return;

    setIsProcessing(true);
    let deletedCount = 0;
    let errorCount = 0;

    for (const notification of notifications) {
      try {
        const response = await fetch(`${API_BASE_URL}/notifications/${notification.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          deletedCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error('Error deleting notification:', error);
      }
    }

    // Refresh the list
    await fetchNotifications();
    setSelectedNotifications(new Set());
    setSelectMode(false);
    setIsProcessing(false);
    
    // Show result message
    const resultMsg = document.createElement('div');
    resultMsg.className = `fixed top-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg z-50 ${errorCount > 0 ? 'bg-yellow-500' : 'bg-green-500'}`;
    resultMsg.innerText = `${deletedCount} notification${deletedCount > 1 ? 's' : ''} cleared${errorCount > 0 ? `, ${errorCount} failed` : ''}`;
    document.body.appendChild(resultMsg);
    setTimeout(() => resultMsg.remove(), 3000);
  };

  const toggleSelectNotification = (id: number) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'application':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close warning modal on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && warningModal.isOpen) {
        setWarningModal(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [warningModal.isOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Warning Modal */}
        <WarningModal
          isOpen={warningModal.isOpen}
          onClose={() => setWarningModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={warningModal.onConfirm}
          title={warningModal.title}
          message={warningModal.message}
          confirmText={warningModal.confirmText}
          type={warningModal.type}
        />

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isProcessing}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {notifications.length > 0 && (
              <>
                {!selectMode ? (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={confirmMarkAllAsRead}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setSelectMode(true)}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                      Select
                    </button>
                    {notifications.length > 0 && (
                      <button
                        onClick={confirmClearAll}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {selectedNotifications.size === notifications.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedNotifications.size > 0 && (
                      <button
                        onClick={confirmDeleteSelected}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete ({selectedNotifications.size})
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectMode(false);
                        setSelectedNotifications(new Set());
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
              <p className="text-sm text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read && !selectMode ? 'bg-blue-50/30 cursor-pointer' : ''
                  } ${selectMode ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (selectMode) {
                      toggleSelectNotification(notification.id);
                    } else if (!notification.is_read) {
                      markAsRead(notification.id);
                      if (notification.link) {
                        router.push(notification.link);
                      }
                    } else if (notification.link) {
                      router.push(notification.link);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    {selectMode && (
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.has(notification.id)}
                          onChange={() => toggleSelectNotification(notification.id)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notification.time_ago}
                          </p>
                        </div>
                        
                        {!selectMode && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteNotification(notification.id, notification.title);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center text-xs text-gray-400">
            Notifications are stored for 30 days
          </div>
        )}
      </div>
    </div>
  );
}