'use client';

import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email_or_username: '', password: '' });
  const [error, setError] = useState('');
  const [mlInsights, setMlInsights] = useState<string[]>([]);
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function calculatePasswordScore(password: string): number {
    let score = 0;
    
    if (password.length >= 12) score += 30;
    else if (password.length >= 8) score += 20;
    else if (password.length >= 6) score += 10;
    
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
    
    return Math.min(score, 100);
  }

  function detectCommonPatterns(password: string): string[] {
    const patterns: string[] = [];
    
    const commonPasswords = [
      'password', '123456', '12345678', '123456789', 'admin', 'welcome',
      'qwerty', 'abc123', 'password1', '12345', '000000', '111111'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      patterns.push('Common password detected');
    }
    
    if (/(123|234|345|456|567|678|789|abc|bcd|cde|def)/i.test(password)) {
      patterns.push('Sequential pattern detected');
    }
    
    if (/(.)\1{2,}/.test(password)) {
      patterns.push('Repeated characters found');
    }
    
    return patterns;
  }

  function analyzePassword(password: string) {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      try {
        const insights: string[] = [];
        const finalScore = calculatePasswordScore(password);
        setPasswordScore(finalScore);

        if (finalScore >= 70) setSecurityLevel('high');
        else if (finalScore >= 40) setSecurityLevel('medium');
        else setSecurityLevel('low');

        if (password.length < 8) insights.push('Use at least 8 characters');
        if (!/[A-Z]/.test(password)) insights.push('Add uppercase letters');
        if (!/\d/.test(password)) insights.push('Include numbers');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) insights.push('Add special characters');

        const commonPatterns = detectCommonPatterns(password);
        insights.push(...commonPatterns);

        setMlInsights(insights.slice(0, 3));
      } catch (error) {
        console.error('Password analysis error:', error);
        const simpleScore = calculatePasswordScore(password);
        setPasswordScore(simpleScore);
        if (simpleScore >= 70) setSecurityLevel('high');
        else if (simpleScore >= 40) setSecurityLevel('medium');
        else setSecurityLevel('low');
        
        setMlInsights(['Make password longer', 'Mix character types']);
      } finally {
        setIsAnalyzing(false);
      }
    }, 100);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'password' && value.length > 0) {
      analyzePassword(value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email_or_username: form.email_or_username,
          password: form.password
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      if (data.user) {
        const userData = {
          id: data.user.id,
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          email: data.user.email || '',
          username: data.user.username || '',
          role: data.user.role || 'guest'
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new Event('userLoggedIn'));
      }

      setError('✅ Login successful! Redirecting...');
      
      setTimeout(() => {
        router.push('/application/select-type');
      }, 1000);

    } catch (err: any) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  }

  const getSecurityColor = () => {
    switch (securityLevel) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSecurityIcon = () => {
    switch (securityLevel) {
      case 'high': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getPasswordStrengthWidth = () => {
    return `${Math.min(passwordScore, 100)}%`;
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-10 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-green-100 text-sm">Sign in to your account</p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className={`rounded-lg p-3 text-center ${
                  error.includes('Success') || error.includes('✅')
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="email_or_username"
                    type="text"
                    required
                    value={form.email_or_username}
                    onChange={handleChange}
                    placeholder="Enter your email or username"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>

                {form.password.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">Password Strength</span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getSecurityColor()}`}>
                          {getSecurityIcon()}
                          <span>{securityLevel.toUpperCase()}</span>
                          {isAnalyzing && <span className="ml-1 animate-pulse">...</span>}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            securityLevel === 'high' ? 'bg-green-500' :
                            securityLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: getPasswordStrengthWidth() }}
                        />
                      </div>
                    </div>

                    {mlInsights.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-gray-700">AI Security Insights:</span>
                        </div>
                        <ul className="space-y-1">
                          {mlInsights.map((insight, index) => (
                            <li key={index} className="flex items-start">
                              <span className={`text-xs mr-2 ${
                                insight.includes('Common') || insight.includes('Sequential') || insight.includes('Repeated')
                                ? 'text-red-600'
                                : 'text-blue-600'
                              }`}>•</span>
                              <span className="text-xs text-gray-600">{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                  onClick={() => router.push('/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link 
                  href="/apply" 
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}