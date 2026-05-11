'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import StudentSidebar from '@/componets/Studentsidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-close sidebar on mobile
      if (width < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Listen for sidebar collapse state changes from the sidebar component
  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        const isCollapsed = sidebar.classList.contains('w-20');
        setIsSidebarCollapsed(isCollapsed);
      }
    };

    // Initial check
    checkSidebarState();

    // Create a mutation observer to watch for class changes on the sidebar
    const observer = new MutationObserver(checkSidebarState);
    const sidebar = document.querySelector('aside');
    
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }

    return () => observer.disconnect();
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isSidebarOpen) {
        const sidebar = document.querySelector('aside');
        const toggleButton = document.querySelector('#sidebar-toggle');
        
        if (sidebar && !sidebar.contains(event.target as Node) && 
            toggleButton && !toggleButton.contains(event.target as Node)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isSidebarOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Get margin based on screen size and sidebar state
  const getMainMargin = () => {
    if (isMobile) {
      return 0; // Mobile uses overlay, no margin
    }
    return isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full z-50
          transition-all duration-300 ease-in-out
          ${isMobile 
            ? `${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-72`
            : `${isSidebarCollapsed ? 'w-20' : 'w-64'} translate-x-0`
          }
        `}
      >
        <StudentSidebar 
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main 
        className={`
          flex-1 min-h-screen
          transition-all duration-300 ease-in-out
          ${getMainMargin()}
          ${isMobile ? 'w-full' : ''}
        `}
      >
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              id="sidebar-toggle"
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            {/* Mobile Logo/Title */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">MZ</span>
              </div>
              <span className="font-semibold text-gray-800 text-sm">Mzuni Portal</span>
            </div>
            
            {/* Placeholder for balance */}
            <div className="w-8" />
          </div>
        </div>

        {/* Content Area with responsive padding */}
        <div className={`
          ${isMobile ? 'p-4' : 'p-6'}
          ${isTablet ? 'p-5' : ''}
        `}>
          {children}
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      {isMobile && !isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 z-30 p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all md:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}