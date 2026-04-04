// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FaClipboardList, 
  FaCalendarCheck, 
  FaChartLine, 
  FaHeadset,
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaUserCheck,
  FaGraduationCap,
  FaFileAlt,
  FaUniversity,
  FaUsers,
  FaLaptopCode,
  FaRegEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaYoutube,
  FaChevronRight
} from 'react-icons/fa';

const images = [
  '/images/mzuni.png',
  '/images/mzuni1.jpeg',
  '/images/mzuni3.jpeg',
];

const features = [
  {
    icon: FaClipboardList,
    title: 'Online Application',
    description: 'Submit your application online with ease. Fill out forms, upload documents, and track your submission status.',
    color: 'bg-blue-600'
  },
  {
    icon: FaCalendarCheck,
    title: 'Track Progress',
    description: 'Monitor your application status in real-time. Get instant updates on your admission process.',
    color: 'bg-green-600'
  },
  {
    icon: FaChartLine,
    title: 'Program Selection',
    description: 'Browse through various undergraduate and postgraduate programs offered at Mzuni.',
    color: 'bg-purple-600'
  },
  {
    icon: FaHeadset,
    title: '24/7 Support',
    description: 'Our dedicated support team is available round the clock to assist you with any queries.',
    color: 'bg-orange-600'
  }
];

const stats = [
  { value: '5,000+', label: 'Annual Applicants', icon: FaUsers },
  { value: '50+', label: 'Academic Programs', icon: FaGraduationCap },
  { value: '98%', label: 'Application Success', icon: FaCheckCircle },
  { value: '24/7', label: 'Support Available', icon: FaClock },
];

const programs = [
  { name: 'Bachelor of Science in ICT', duration: '4 Years', type: 'Undergraduate' },
  { name: 'Bachelor of Education', duration: '4 Years', type: 'Undergraduate' },
  { name: 'Master of Business Administration', duration: '2 Years', type: 'Postgraduate' },
  { name: 'Diploma in Nursing', duration: '3 Years', type: 'Diploma' },
];

const announcements = [
  { title: '2024/2025 Academic Year Admissions Open', date: 'March 15, 2024', priority: 'High' },
  { title: 'Application Deadline Extended', date: 'March 10, 2024', priority: 'Urgent' },
  { title: 'New Scholarship Opportunities Available', date: 'March 5, 2024', priority: 'Normal' },
];

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    setIsLoaded(true);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                <FaGraduationCap className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Mzuni e-Admission</h1>
                <p className="text-xs text-gray-500">Mzuzu University</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition">Home</Link>
              <Link href="/programs" className="text-gray-700 hover:text-blue-600 transition">Programs</Link>
              <Link href="/how-to-apply" className="text-gray-700 hover:text-blue-600 transition">How to Apply</Link>
              <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition">Contact</Link>
              <Link href="/login" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Login
              </Link>
              <Link href="/register" className="px-5 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
                Register
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t">
              <div className="flex flex-col space-y-3">
                <Link href="/" className="text-gray-700 hover:text-blue-600 py-2">Home</Link>
                <Link href="/programs" className="text-gray-700 hover:text-blue-600 py-2">Programs</Link>
                <Link href="/how-to-apply" className="text-gray-700 hover:text-blue-600 py-2">How to Apply</Link>
                <Link href="/contact" className="text-gray-700 hover:text-blue-600 py-2">Contact</Link>
                <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-center">Login</Link>
                <Link href="/register" className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg text-center">Register</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Slider */}
      <section className="relative h-[600px] overflow-hidden">
        {/* Background Slider */}
        <div className="absolute inset-0">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <div className="inline-block mb-4 px-4 py-1 bg-blue-600/20 backdrop-blur-sm rounded-full border border-blue-400/30">
                <span className="text-blue-300 text-sm font-semibold">Welcome to Mzuzu University</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Your Future Starts
                <span className="text-blue-400"> Here</span>
              </h1>
              <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                Apply online for undergraduate and postgraduate programs at Mzuzu University. 
                Simple, fast, and secure admission process.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/apply"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center gap-2"
                >
                  Apply Now <FaArrowRight />
                </Link>
                <Link
                  href="/programs"
                  className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg font-semibold hover:bg-white/20 transition"
                >
                  View Programs
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl">
                      <Icon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-gray-300">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Slider Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentImageIndex ? 'w-8 bg-blue-500' : 'bg-white/50'
              }`}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose <span className="text-blue-600">Mzuni e-Admission</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience a seamless and efficient admission process with our online platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                >
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-5`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Our <span className="text-blue-600">Academic Programs</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from a wide range of programs across various disciplines
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {programs.map((program, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition">
                <FaGraduationCap className="text-blue-600 text-3xl mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{program.name}</h3>
                <p className="text-sm text-gray-500 mb-1">Duration: {program.duration}</p>
                <p className="text-sm text-gray-500 mb-3">Type: {program.type}</p>
                <Link href={`/program/${index}`} className="text-blue-600 text-sm font-medium hover:underline flex items-center gap-1">
                  Learn More <FaChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/programs" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
              View All Programs <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* How to Apply Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How to <span className="text-blue-600">Apply</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Follow these simple steps to complete your application
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Register with your email and basic details', icon: FaUserCheck },
              { step: '02', title: 'Choose Program', desc: 'Select your desired academic program', icon: FaGraduationCap },
              { step: '03', title: 'Fill Application', desc: 'Complete the application form with accurate info', icon: FaFileAlt },
              { step: '04', title: 'Submit & Track', desc: 'Submit and track your application status', icon: FaClipboardList }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative text-center">
                  <div className="text-5xl font-bold text-blue-100 mb-3">{item.step}</div>
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/4 right-0 transform translate-x-1/2">
                      <FaArrowRight className="text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Announcements & Info Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Announcements */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaClipboardList className="text-blue-600" /> Latest Announcements
              </h3>
              <div className="space-y-4">
                {announcements.map((announcement, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-600">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800">{announcement.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        announcement.priority === 'Urgent' ? 'bg-red-100 text-red-600' : 
                        announcement.priority === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {announcement.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{announcement.date}</p>
                  </div>
                ))}
              </div>
              <Link href="/announcements" className="inline-flex items-center gap-2 text-blue-600 mt-4 hover:underline">
                View All Announcements <FaChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FaLaptopCode className="text-blue-600" /> Quick Resources
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Application Guide', 'Fee Structure', 'Scholarships', 'Academic Calendar',
                  'Entry Requirements', 'FAQs', 'Student Handbook', 'Contact Admissions'
                ].map((item, index) => (
                  <Link key={index} href="#" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-white transition">
                    <FaChevronRight className="w-3 h-3" /> {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have chosen Mzuzu University for their higher education
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="px-8 py-3 bg-white text-blue-700 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105">
              Start Application
            </Link>
            <Link href="/contact" className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              Request Info
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* About */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FaGraduationCap className="text-blue-500 text-2xl" />
                <h3 className="text-xl font-bold text-white">Mzuni e-Admission</h3>
              </div>
              <p className="text-sm leading-relaxed">
                Mzuzu University's official online admission portal. Simplifying the admission process for future scholars.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-blue-400 transition">About University</Link></li>
                <li><Link href="/programs" className="hover:text-blue-400 transition">Academic Programs</Link></li>
                <li><Link href="/apply" className="hover:text-blue-400 transition">Apply Online</Link></li>
                <li><Link href="/status" className="hover:text-blue-400 transition">Check Status</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="hover:text-blue-400 transition">FAQs</Link></li>
                <li><Link href="/help" className="hover:text-blue-400 transition">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-blue-400 transition">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-blue-400" />
                  <span>Mzuzu University, Mzuzu, Malawi</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaPhoneAlt className="text-blue-400" />
                  <span>+265 1 123 456</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaRegEnvelope className="text-blue-400" />
                  <span>admissions@mzuni.ac.mw</span>
                </div>
              </div>
              <div className="flex space-x-4 mt-4">
                <Link href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <FaFacebookF className="text-sm" />
                </Link>
                <Link href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <FaTwitter className="text-sm" />
                </Link>
                <Link href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <FaLinkedinIn className="text-sm" />
                </Link>
                <Link href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                  <FaYoutube className="text-sm" />
                </Link>
              </div>
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