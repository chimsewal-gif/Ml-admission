import Link from 'next/link'
import { Metadata } from 'next'
import { Home, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-10">
          <div className="text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-2xl mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>

            {/* 404 Number */}
            <h1 className="text-8xl font-bold text-gray-900 mb-2">
              404
            </h1>
            
            {/* Message */}
            <div className="space-y-3 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Page Not Found
              </h2>
              
              <div className="h-1 w-12 bg-green-500 rounded-full mx-auto" />
              
              <p className="text-gray-600">
                Oops! The page you're looking for doesn't exist or has been moved.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-sm gap-2"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
              
            </div>

           
            {/* Error Code */}
            <div className="mt-6">
              <p className="text-xs text-gray-400 font-mono">
                Error Code: 404 | Resource not found
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}