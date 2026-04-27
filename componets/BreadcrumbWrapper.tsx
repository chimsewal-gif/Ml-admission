'use client';

import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BreadcrumbWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Don't show breadcrumb on home page or login page
  if (!pathname || pathname === '/' || pathname === '/login' || pathname === '/register') {
    return null;
  }
  
  const segments = pathname.split('/').filter(s => s);
  
  const getDisplayName = (segment: string): string => {
    const names: Record<string, string> = {
      'appadmin': 'Admin Dashboard',
      'programmes': 'Programmes',
      'application': 'Application',
      'select-type': 'Select Application Type',
      'programme-selection': 'Programme Selection',
      'personal-info': 'Personal Information',
      'academic-info': 'Academic Information',
      'upload-documents': 'Upload Documents',
      'documents': 'Documents',
      'review': 'Review Application',
      'payment': 'Payment',
      'submission': 'Submission',
      'profile': 'Profile',
      'settings': 'Settings',
      'users': 'Users',
      'departments': 'Departments',
      'applications': 'Applications',
      'add': 'Add New',
      'edit': 'Edit',
      'view': 'View',
      'dashboard': 'Dashboard',
      'notifications': 'Notifications',
      'reports': 'Reports',
      'analytics': 'Analytics'
    };
    
    if (names[segment]) {
      return names[segment];
    }
    
    // Handle ID segments (numbers)
    if (/^\d+$/.test(segment)) {
      return `Item ${segment}`;
    }
    
    // Convert kebab-case to Title Case
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const buildPath = (index: number) => {
    return '/' + segments.slice(0, index + 1).join('/');
  };
  
  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          <button
            onClick={() => handleNavigation('/')}
            className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const displayName = getDisplayName(segment);
            const path = buildPath(index);
            
            return (
              <div key={segment} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                {isLast ? (
                  <span className="text-gray-900 font-medium">
                    {displayName}
                  </span>
                ) : (
                  <button
                    onClick={() => handleNavigation(path)}
                    className="text-gray-600 hover:text-green-600 transition-colors"
                  >
                    {displayName}
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}