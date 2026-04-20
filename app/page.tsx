'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaGraduationCap, 
  FaRobot, 
  FaChartLine, 
  FaUserCheck,
  FaArrowRight,
  FaCheckCircle,
  FaShieldAlt,
  FaClock,
  FaEnvelope,
  FaPhoneAlt,
  FaFacebook,
  FaTwitter,
  FaLinkedin
} from 'react-icons/fa';

export default function ApplyPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

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
      <section className="relative h-[600px] flex items-center justify-center text-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('/images/mzuni3.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-green-900/80"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative max-w-4xl px-4 text-white"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
          >
            <FaRobot className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Admissions</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Smart Admissions with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-300">
              Machine Learning
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Apply to Mzuzu University through an intelligent e-Admission system that predicts success, 
            enhances fairness, and simplifies your application journey.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link 
              href="/apply" 
              className="px-8 py-3 bg-white text-green-700 rounded-lg font-semibold hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 group"
            >
              Apply Now
              <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/about-ml" 
              className="px-8 py-3 border-2 border-white rounded-lg font-semibold hover:bg-white/10 transition-all"
            >
              Learn About ML
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white rounded-full mt-2 animate-bounce"></div>
          </div>
        </motion.div>
      </section>

      {/* About ML Section */}
      <motion.section 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="py-20 px-6 max-w-7xl mx-auto"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Admission System
          </h2>
          <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto"></div>
          <p className="text-gray-600 max-w-3xl mx-auto mt-6">
            Our system uses Machine Learning to analyze applicant data and predict academic success. 
            This helps the university make fair, data-driven decisions while giving students better 
            chances based on merit and potential.
          </p>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 mt-10"
        >
          {[
            {
              icon: <FaRobot className="text-4xl" />,
              title: "Smart Predictions",
              description: "ML models predict student performance based on past academic data.",
              color: "blue",
              gradient: "from-blue-500 to-blue-600"
            },
            {
              icon: <FaChartLine className="text-4xl" />,
              title: "Data-Driven Decisions",
              description: "Admissions are enhanced using analytics and predictive insights.",
              color: "green",
              gradient: "from-green-500 to-green-600"
            },
            {
              icon: <FaUserCheck className="text-4xl" />,
              title: "Fair Selection",
              description: "Ensures transparency and equal opportunity for all applicants.",
              color: "purple",
              gradient: "from-purple-500 to-purple-600"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ y: -8 }}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.gradient}`}></div>
              <div className="p-8 text-center">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${item.gradient} text-white mb-5 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-green-600 to-emerald-600 mx-auto"></div>
            <p className="text-gray-600 mt-6">Simple steps to start your academic journey</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Create Account", icon: FaUserCheck, color: "blue" },
              { step: "02", title: "Fill Application", icon: FaGraduationCap, color: "green" },
              { step: "03", title: "ML Evaluation", icon: FaRobot, color: "purple" },
              { step: "04", title: "Get Results", icon: FaChartLine, color: "orange" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 text-center group"
              >
                <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 rounded-full flex items-center justify-center text-white font-bold`}>
                  {item.step}
                </div>
                <div className={`mt-4 mb-4 inline-flex p-3 rounded-full bg-${item.color}-100 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: "98%", label: "Application Success", icon: FaCheckCircle },
              { number: "5000+", label: "Students Placed", icon: FaGraduationCap },
              { number: "24/7", label: "Support Available", icon: FaClock },
              { number: "100%", label: "Data Security", icon: FaShieldAlt }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                <div className="text-3xl font-bold">{stat.number}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-12 shadow-xl"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Start Your Journey Today
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Join Mzuzu University using our intelligent admission platform
            </p>
            <Link 
              href="/apply" 
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-xl transition-all hover:-translate-y-0.5 group"
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