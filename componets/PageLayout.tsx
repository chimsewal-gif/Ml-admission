'use client';

import { ReactNode } from 'react';
import Breadcrumb from './Breadcrumb';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
}

export default function PageLayout({ 
  children, 
  title, 
  subtitle, 
  showBreadcrumb = true 
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {showBreadcrumb && <Breadcrumb />}
        
        {(title || subtitle) && (
          <div className="mb-6">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            )}
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
}