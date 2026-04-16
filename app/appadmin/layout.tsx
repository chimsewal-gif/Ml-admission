'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminSidebar from '@/componets/AdminSidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = w-64
  const [isHovering, setIsHovering] = useState(false);

  const updateSidebarWidth = useCallback(() => {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      const width = sidebar.offsetWidth;
      setSidebarWidth(width);
    }
  }, []);

  // Listen for sidebar hover state
  useEffect(() => {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      const handleMouseEnter = () => setIsHovering(true);
      const handleMouseLeave = () => setIsHovering(false);
      
      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  // Update sidebar width on resize and hover changes
  useEffect(() => {
    updateSidebarWidth();
    
    // Create a resize observer to watch for sidebar size changes
    const resizeObserver = new ResizeObserver(() => {
      updateSidebarWidth();
    });
    
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      resizeObserver.observe(sidebar);
    }

    // Also update on window resize
    window.addEventListener('resize', updateSidebarWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSidebarWidth);
    };
  }, [updateSidebarWidth, isHovering]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content - smoothly follows sidebar animation */}
      <main 
        className="flex-1 min-h-screen overflow-x-auto transition-all duration-300 ease-in-out"
        style={{ 
          marginLeft: `${sidebarWidth}px`,
          width: `calc(100% - ${sidebarWidth}px)`,
          padding: '1.5rem'
        }}
      >
        {children}
      </main>
    </div>
  );
}