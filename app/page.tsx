'use client';

import Link from 'next/link';
import { FaGraduationCap, FaRobot, FaChartLine, FaUserCheck } from 'react-icons/fa';

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Top Bar */}
      <div className="bg-gray-100 text-sm text-gray-600 py-2 px-4 flex flex-wrap justify-between">
        <span>support@mzuni.ac.mw</span>
        <span>+265 887 138 538 | WhatsApp +265 882 855 707</span>
      </div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 shadow bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-700 rounded flex items-center justify-center">
            <FaGraduationCap className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800">Mzuni e-Admission</h1>
            <p className="text-xs text-gray-500">Mzuzu University</p>
          </div>
        </div>

        <div className="hidden md:flex gap-8 text-gray-700 font-medium">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <Link href="/how-to-apply" className="hover:text-blue-600">How to Apply</Link>
          <Link href="/programs" className="hover:text-blue-600">Programs</Link>
          <Link href="/guidelines" className="hover:text-blue-600">Guidelines</Link>
          <Link href="/faq" className="hover:text-blue-600">FAQ</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[520px] flex items-center justify-center text-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mzuni3.jpeg')" }}
        />

        <div className="absolute inset-0 bg-blue-900/70"></div>

        <div className="relative max-w-4xl px-4 text-white">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Smart Admissions with Machine Learning
          </h1>
          <p className="text-lg md:text-xl text-gray-200">
            Apply to Mzuzu University through an intelligent e-Admission system that predicts success, enhances fairness, and simplifies your application journey.
          </p>

          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <Link href="/apply" className="px-6 py-3 bg-white text-blue-900 rounded-lg font-semibold hover:bg-gray-100">
              Apply Now
            </Link>
            <Link href="/about-ml" className="px-6 py-3 border border-white rounded-lg hover:bg-white/10">
              Learn About ML
            </Link>
          </div>
        </div>
      </section>

      {/* About ML Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-blue-900 mb-4">
          AI-Powered Admission System
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Our system uses Machine Learning to analyze applicant data and predict academic success. This helps the university make fair, data-driven decisions while giving students better chances based on merit and potential.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mt-10">
          <div className="p-6 border rounded-lg shadow-sm">
            <FaRobot className="text-3xl text-blue-600 mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Smart Predictions</h3>
            <p className="text-gray-500 text-sm">ML models predict student performance based on past academic data.</p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm">
            <FaChartLine className="text-3xl text-green-600 mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Data-Driven Decisions</h3>
            <p className="text-gray-500 text-sm">Admissions are enhanced using analytics and predictive insights.</p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm">
            <FaUserCheck className="text-3xl text-purple-600 mb-4 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Fair Selection</h3>
            <p className="text-gray-500 text-sm">Ensures transparency and equal opportunity for all applicants.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">How It Works</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              'Create Account',
              'Fill Application',
              'ML Evaluation',
              'Get Results'
            ].map((step, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-blue-600 font-bold text-xl mb-2">0{i+1}</div>
                <p className="text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-700 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Start Your Journey Today</h2>
        <p className="mb-6">Join Mzuzu University using our intelligent admission platform</p>
        <Link href="/apply" className="px-8 py-3 bg-white text-blue-700 rounded-lg font-semibold">
          Apply Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-10 text-center">
        <p>&copy; {new Date().getFullYear()} Mzuzu University e-Admission System. All rights reserved.</p>
      </footer>

    </div>
  );
}
