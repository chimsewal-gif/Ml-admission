'use client';

import Link from 'next/link';
import { 
  FaGraduationCap, 
  FaFileAlt, 
  FaUpload, 
  FaCreditCard, 
  FaCheckCircle,
  FaArrowRight,
  FaEnvelope,
  FaPhoneAlt,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaCalendarAlt,
  FaUserCheck,
  FaClipboardList,
  FaRegClock
} from 'react-icons/fa';

export default function HowToApplyPage() {
  const steps = [
    {
      number: 1,
      title: "Create an Account",
      description: "Register for a new account on our e-admission portal. Provide your basic personal information and create a secure password.",
      icon: FaUserCheck,
      color: "blue",
      duration: "10 minutes",
      tips: "Use a valid email address that you check regularly"
    },
    {
      number: 2,
      title: "Fill Application Form",
      description: "Complete the online application form with your personal details, academic history, and choose your desired program.",
      icon: FaClipboardList,
      color: "green",
      duration: "30 minutes",
      tips: "Have your academic documents ready before starting"
    },
    {
      number: 3,
      title: "Upload Documents",
      description: "Upload required documents including your academic certificates, national ID, and recent passport photo.",
      icon: FaUpload,
      color: "purple",
      duration: "15 minutes",
      tips: "Accepted formats: PDF, JPG, PNG (Max 5MB per file)"
    },
    {
      number: 4,
      title: "Pay Application Fee",
      description: "Pay the non-refundable application fee through our secure payment gateway or bank deposit.",
      icon: FaCreditCard,
      color: "orange",
      duration: "10 minutes",
      tips: "Keep your payment receipt for reference"
    },
    {
      number: 5,
      title: "Submit Application",
      description: "Review all your information and submit your application. You'll receive a confirmation email with your application reference number.",
      icon: FaCheckCircle,
      color: "emerald",
      duration: "5 minutes",
      tips: "Double-check all information before final submission"
    }
  ];

  const requirements = [
    {
      category: "Academic Requirements",
      items: [
        "Malawi School Certificate of Education (MSCE) with at least 6 credits",
        "Cambridge Overseas School Certificate with at least 5 passes",
        "International Baccalaureate (IB) Diploma",
        "Equivalent qualifications recognized by Mzuzu University"
      ]
    },
    {
      category: "Supporting Documents",
      items: [
        "Certified copies of academic certificates",
        "National ID or passport copy",
        "Recent passport-size photograph",
        "Birth certificate",
        "Recommendation letters (for postgraduate programs)"
      ]
    },
    {
      category: "Application Fee",
      items: [
        "Application fee: MWK 25,000",
        "Payment can be made via bank deposit or mobile money",
        "Fee is non-refundable",
        "Keep payment receipt for reference"
      ]
    }
  ];

  const importantDates = [
    { event: "Application Opens", date: "January 15, 2025", status: "open" },
    { event: "Early Application Deadline", date: "March 30, 2025", status: "upcoming" },
    { event: "Regular Application Deadline", date: "May 30, 2025", status: "upcoming" },
    { event: "Late Application Deadline", date: "July 15, 2025", status: "upcoming" },
    { event: "Admission Results Release", date: "August 15, 2025", status: "upcoming" }
  ];

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
      <nav className="sticky top-0 z-50 bg-white shadow-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <FaGraduationCap className="text-white text-xl" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-800">Mzuni e-Admission</h1>
              <p className="text-xs text-gray-500">Mzuzu University</p>
            </div>
          </Link>

          <div className="hidden md:flex gap-8 text-gray-700 font-medium">
            {['Home', 'How to Apply', 'Programs', 'Guidelines', 'FAQ'].map((item) => (
              <Link 
                key={item} 
                href={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="relative group"
              >
                <span className="hover:text-green-600 transition-colors">{item}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          <Link 
            href="/login" 
            className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How to Apply
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Follow our simple step-by-step guide to complete your application to Mzuzu University
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Application Process
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto">
              Complete your application in 5 simple steps
            </p>
          </div>

          <div className="relative">
            {/* Vertical line connector */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>

            {steps.map((step, index) => (
              <div key={index} className={`relative flex flex-col md:flex-row items-start mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Step Number Circle */}
                <div className={`absolute left-0 md:relative md:left-auto w-16 h-16 rounded-full bg-gradient-to-r from-${step.color}-500 to-${step.color}-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg z-10`}>
                  {step.number}
                </div>

                {/* Content */}
                <div className={`ml-20 md:ml-0 md:w-5/12 ${index % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}>
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-${step.color}-100 text-${step.color}-600`}>
                        <step.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">{step.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-500">
                        <FaRegClock className="w-3 h-3" />
                        {step.duration}
                      </span>
                      <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded">
                        Tip: {step.tips}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Admission Requirements
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-6 max-w-2xl mx-auto">
              What you need to prepare before starting your application
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {requirements.map((req, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">{req.category}</h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {req.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <FaCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Dates */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Important Dates
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-6">Mark these important deadlines for your application</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Event</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {importantDates.map((date, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{date.event}</td>
                      <td className="px-6 py-4 text-gray-600">{date.date}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          date.status === 'open' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {date.status === 'open' ? 'Open' : 'Upcoming'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Need Help?
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto mb-6"></div>
          <p className="text-gray-600 mb-8">
            Have questions about the application process? Check our FAQ or contact our admissions office.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/faq" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-all"
            >
              View FAQ
              <FaArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Contact Us
              <FaArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Apply?</h2>
          <p className="text-green-100 mb-8">Start your application today and take the first step toward your future</p>
          <Link 
            href="/apply" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-green-600 rounded-lg font-semibold hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            Apply Now
            <FaArrowRight className="w-4 h-4" />
          </Link>
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