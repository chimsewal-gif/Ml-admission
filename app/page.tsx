'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaGraduationCap, 
  FaEnvelope,
  FaPhoneAlt,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaClock
} from 'react-icons/fa';
import { useEffect, useState } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface ApplicationType {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function ApplyPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const backgroundImages = [
    '/images/mzuni3.jpeg',
    '/images/mzuni1.jpeg',
    '/images/mzuni2.jpeg',
    '/images/mzuni4.jpeg',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  useEffect(() => {
    fetchApplicationTypes();
  }, []);

  const fetchApplicationTypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/application-types`, {
        headers,
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setApplicationTypes(data.data);
      }
    } catch (err) {
      console.error('Error fetching application types:', err);
    } finally {
      setLoading(false);
    }
  };

  const isApplicationActive = (type: ApplicationType) => {
    const now = new Date();
    const startDate = new Date(type.start_date);
    const endDate = new Date(type.end_date);
    return now >= startDate && now <= endDate && type.is_active;
  };

  const getDaysRemaining = (type: ApplicationType) => {
    const endDate = new Date(type.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Only get active applications
  const activeApplications = applicationTypes.filter(isApplicationActive);
  const hasActiveApplications = activeApplications.length > 0;
  const firstActiveApplication = activeApplications[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gray-900 text-gray-300 text-sm py-3 px-6 flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <FaEnvelope className="w-3 h-3" />
            support@mzuni.ac.mw
          </span>
          <span className="flex items-center gap-2">
            <FaPhoneAlt className="w-3 h-3" />
            +265 887 138 538
          </span>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">
            <FaFacebook className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <FaTwitter className="w-4 h-4" />
          </a>
          <a href="#" className="hover:text-white transition-colors">
            <FaLinkedin className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
              <FaGraduationCap className="text-white text-xl" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-800">Mzuni e-Admission</h1>
              <p className="text-xs text-gray-500">Mzuzu University</p>
            </div>
          </Link>

          <Link 
            href="/login" 
            className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center text-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${backgroundImages[currentImageIndex]}')` }}
          />
        </AnimatePresence>
        
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-green-900/50"></div>
        
        <div className="relative max-w-4xl px-4 text-white z-10">
          {/* Dynamic Status Message */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`rounded-lg p-6 mb-8 inline-block mx-auto border border-white/20 backdrop-blur-md ${
              hasActiveApplications 
                ? 'bg-green-600/80' 
                : 'bg-red-600/80'
            }`}
          >
            <div className="text-center">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <p className="text-lg">Checking application status...</p>
                </div>
              ) : hasActiveApplications ? (
                <>
                  <p className="text-2xl font-bold mb-2">Applications are OPEN!</p>
                  <p className="text-lg">{activeApplications.length} application type(s) currently available</p>
                  <p className="text-sm mt-2">Apply now before deadlines close</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold mb-2">Applications are CLOSED</p>
                  <p className="text-lg">No active application types at this time</p>
                  <p className="text-sm mt-2">Please check back later for upcoming intakes</p>
                </>
              )}
            </div>
          </motion.div>

          {/* Application Name - Replaces TEACHER TRAINING COLLEGES */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {hasActiveApplications && firstActiveApplication ? (
              <>
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                  {firstActiveApplication.name.split(' ')[0]} {firstActiveApplication.name.split(' ')[1]}
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    {firstActiveApplication.name.split(' ').slice(2).join(' ') || 'APPLICATION'}
                  </span>
                </h1>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-lg">
                    <FaClock className="w-5 h-5 text-yellow-300" />
                    <span>Deadline: {new Date(firstActiveApplication.end_date).toLocaleDateString()}</span>
                  </div>
                  {getDaysRemaining(firstActiveApplication) > 0 && (
                    <div className="text-sm bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      {getDaysRemaining(firstActiveApplication)} days remaining to apply
                    </div>
                  )}
                </div>
              </>
            ) : (
              !loading && (
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                  NO ACTIVE
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    APPLICATIONS
                  </span>
                </h1>
              )
            )}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <Link 
              href={hasActiveApplications ? "/login" : "#"}
              onClick={(e) => {
                if (!hasActiveApplications) {
                  e.preventDefault();
                  alert("No applications are currently open. Please check back later.");
                }
              }}
              className={`inline-flex items-center gap-2 px-8 py-3 bg-white text-green-700 rounded-lg font-semibold hover:shadow-xl transition-all group ${
                !hasActiveApplications ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Apply Now
              <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FaGraduationCap className="text-white" />
                </div>
                <span className="font-bold text-white">Mzuni e-Admission</span>
              </div>
              <p className="text-sm">Smart admissions powered by AI and Machine Learning.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
                <li><Link href="/feedback" className="hover:text-white transition-colors">Feedback</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Contact Info</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <FaEnvelope className="w-3 h-3" />
                  support@mzuni.ac.mw
                </li>
                <li className="flex items-center gap-2">
                  <FaPhoneAlt className="w-3 h-3" />
                  +265 887 138 538
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Mzuzu University e-Admission System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}