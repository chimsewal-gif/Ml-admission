'use client';

import { useState, useEffect } from 'react';
import CommitteeSidebar from '@/componets/CommitteeSidebar';

export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse state changes
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

  return (
    <div className="flex min-h-screen">
      <CommitteeSidebar />
      <main 
        className={`
          flex-1 p-6 bg-gray-50 min-h-screen overflow-x-auto
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
        `}
      >
        {children}
      </main>
    </div>
  );
}