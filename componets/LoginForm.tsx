'use client';

import { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react'; // Importing Lucide icons

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
    } else {
      setError('');
      console.log('Logging in with:', { email, password });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex items-center border border-gray-300 rounded-lg">
            <Mail className="w-5 h-5 text-gray-500 mx-3" /> {/* Email Icon */}
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

          <div className="mb-6 flex items-center border border-gray-300 rounded-lg">
            <Lock className="w-5 h-5 text-gray-500 mx-3" /> {/* Password Icon */}
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-4 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-5 h-5" /> {/* Login Icon */}
            <span>Login</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
