'use client';

import { useState } from 'react';
import { UserPlus, Mail, Lock, CheckCircle } from 'lucide-react'; // Importing icons

export default function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
    } else if (!name || !email || !password) {
      setError('Please fill in all fields.');
    } else {
      setError('');
      console.log('Signing up with:', { name, email, password });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-500 text-center mb-4">Sign Up to your Account</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex items-center border border-green-300 rounded-lg">
            <UserPlus className="w-5 h-5 text-green-700 mx-3" /> {/* Name Icon */}
            <input
              type="text"
              id="name"
              name="name"
              className="w-full px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="mb-4 flex items-center border border-green-300 rounded-lg">
            <Mail className="w-5 h-5 text-green-700 mx-3" /> {/* Email Icon */}
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-4 flex items-center border border-green-300 rounded-lg">
            <Lock className="w-5 h-5 text-green-700 mx-3" /> {/* Password Icon */}
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="mb-6 flex items-center border border-green-300 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-700 mx-3" /> {/* Confirm Password Icon */}
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="w-full px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-5 h-5" /> {/* Signup Icon */}
            <span>Sign Up</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-green-600 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
