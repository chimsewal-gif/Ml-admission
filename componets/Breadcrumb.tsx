'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BreadcrumbItem {
  name: string;
  path: string;
  isClickable: boolean;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    if (!pathname) return;

    // Split the path into segments
    const segments = pathname.split('/').filter(segment => segment !== '');
    
    // Build breadcrumb items
    const items: BreadcrumbItem[] = [];
    
    // Add Home as first item
    items.push({
      name: 'Home',
      path: '/',
      isClickable: true
    });
    
    // Build path progressively
    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      currentPath += `/${segment}`;
      
      // Format the segment name for display
      let displayName = formatSegmentName(segment, segments, i);
      
      // Check if this is the last segment (current page)
      const isLast = i === segments.length - 1;
      
      items.push({
        name: displayName,
        path: currentPath,
        isClickable: !isLast
      });
    }
    
    setBreadcrumbs(items);
  }, [pathname]);

  // Format segment names for better display based on your folder structure
  const formatSegmentName = (segment: string, allSegments: string[], index: number): string => {
    // Handle special cases based on your actual routes
    const specialCases: Record<string, string> = {
      // Admin routes
      'appadmin': 'Admin Dashboard',
      'programmes': 'Programmes',
      'departments': 'Departments',
      'applications': 'Applications',
      
      // Application routes
      'application': 'Application',
      'select-type': 'Select Application Type',
      'program-selection': 'Programme Selection',
      'personal-details': 'Personal Details',
      'contact-details': 'Contact Details',
      'academicHistory': 'Academic History',
      'High-school-records': 'High School Records',
      'next-of-kin': 'Next of Kin',
      'postrecords': 'Postgraduate Records',
      'referee': 'Referees',
      'work': 'Work History',
      'education': 'Education History',
      'essay': 'Motivation Essay',
      'publication': 'Publications',
      'documents': 'Upload Documents',
      'application-fees': 'Application Fees',
      'submit': 'Submit Application',
      'dashboard': 'Dashboard',
      'profile': 'Profile',
      
      // Committee routes
      'commitee': 'Committee Dashboard',
      'evaluations': 'Evaluations',
      'applicantions': 'Applications Review',
      'reports': 'Reports',
      
      // Auth routes
      'login': 'Login',
      'forgot-password': 'Forgot Password',
      'forgot': 'Reset Password',
      'security': 'Security',
      
      // Other
      'status': 'Application Status',
      'apply': 'New Application',
      'types': 'Application Types',
      
      // Programme types
      'postgraduate': 'Postgraduate',
      'diploma': 'Diploma',
      'international': 'International',
      'odl': 'ODL',
    };
    
    if (specialCases[segment]) {
      return specialCases[segment];
    }
    
    // Handle ID segments (numbers)
    if (/^\d+$/.test(segment)) {
      // Check if previous segment was 'programmes' or 'applications'
      if (index > 0 && allSegments[index - 1] === 'programmes') {
        return `Programme ${segment}`;
      }
      if (index > 0 && allSegments[index - 1] === 'applications') {
        return `Application ${segment}`;
      }
      if (index > 0 && allSegments[index - 1] === 'departments') {
        return `Department ${segment}`;
      }
      return `Item ${segment}`;
    }
    
    // Convert kebab-case or camelCase to Title Case
    let formatted = segment
      .replace(/([A-Z])/g, ' $1') // Split camelCase
      .split('-') // Split kebab-case
      .join(' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return formatted;
  };

  const handleNavigate = (path: string, isClickable: boolean) => {
    if (isClickable) {
      router.push(path);
    }
  };

  // Don't show breadcrumb on home page, login page, or certain routes
  if (breadcrumbs.length <= 1 || pathname === '/login' || pathname === '/forgot-password') {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <div key={item.path} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <button
                onClick={() => handleNavigate(item.path, item.isClickable)}
                className={`
                  flex items-center gap-1 transition-colors
                  ${item.isClickable 
                    ? 'text-gray-600 hover:text-green-600 cursor-pointer' 
                    : 'text-gray-900 font-medium cursor-default'
                  }
                `}
                disabled={!item.isClickable}
              >
                {index === 0 && <Home className="w-4 h-4" />}
                <span>{item.name}</span>
              </button>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}