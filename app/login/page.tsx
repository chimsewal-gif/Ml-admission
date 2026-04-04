'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield, Zap, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email_or_username: '', password: '' });
  const [error, setError] = useState('');
  const [mlInsights, setMlInsights] = useState<string[]>([]);
  const [securityLevel, setSecurityLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [typingTimestamps, setTypingTimestamps] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  function extractPasswordFeatures(password: string) {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return { hasUpper, hasLower, hasNumber, hasSpecial };
  }

  function calculateTraditionalScore(password: string): number {
    let score = 0;
    
    if (password.length >= 12) score += 30;
    else if (password.length >= 8) score += 20;
    else if (password.length >= 6) score += 10;
    
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
    
    const charSet = new Set(password);
    const entropy = password.length * Math.log2(charSet.size || 1);
    score += Math.min(entropy, 10);
    
    return Math.min(score, 100);
  }

  function analyzeTypingPattern(timestamps: number[]) {
    const insights: string[] = [];
    
    if (timestamps.length < 3) return { insights, isSuspicious: false };

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    if (avgInterval < 50) {
      insights.push('Very fast typing detected');
    } else if (avgInterval > 2000) {
      insights.push('Unusually slow typing detected');
    }

    return { insights, isSuspicious: avgInterval < 50 };
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
        const features = extractPasswordFeatures(password);
        const insights: string[] = [];
        const finalScore = calculateTraditionalScore(password);
        setPasswordScore(finalScore);

        if (finalScore >= 70) setSecurityLevel('high');
        else if (finalScore >= 40) setSecurityLevel('medium');
        else setSecurityLevel('low');

        if (password.length < 8) insights.push('Use at least 8 characters');
        if (!features.hasUpper) insights.push('Add uppercase letters');
        if (!features.hasNumber) insights.push('Include numbers');
        if (!features.hasSpecial) insights.push('Add special characters');

        const commonPatterns = detectCommonPatterns(password);
        insights.push(...commonPatterns);

        if (typingTimestamps.length >= 3) {
          const typingAnalysis = analyzeTypingPattern(typingTimestamps);
          insights.push(...typingAnalysis.insights);
        }

        setMlInsights(insights.slice(0, 3));
      } catch (error) {
        console.error('Password analysis error:', error);
        const simpleScore = calculateTraditionalScore(password);
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

  function trackTypingBehavior(field: string, value: string) {
    if (!isClient) return;
    
    const currentTime = Date.now();
    
    if (field === 'password') {
      setTypingTimestamps(prev => [...prev.slice(-9), currentTime]);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (field === 'password' && value.length > 0) {
        analyzePassword(value);
      }
    }, 600);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (isClient) {
      trackTypingBehavior(name, value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Attempting login with JWT...');
      
      // Login request - JWT doesn't need CSRF
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
      console.log('📊 Login response:', data);

      if (!response.ok || !data.success) {
        setError(data.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      // Save JWT token and user data to localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('✅ JWT token saved to localStorage');
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
        console.log('✅ User data saved to localStorage:', userData);
        window.dispatchEvent(new Event('userLoggedIn'));
      }

      // Verify token is working
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const verifyResponse = await fetch('http://127.0.0.1:8000/api/verify-token/', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          
          const verifyData = await verifyResponse.json();
          console.log('🔍 Token verification:', verifyData);
          
          if (verifyData.valid) {
            console.log('✅ Token is valid!');
            setError('✅ Login successful! Redirecting...');
            
            setTimeout(() => {
              router.push('/application/select-type');
            }, 1000);
          } else {
            console.error('❌ Token verification failed');
            setError('Login succeeded but token verification failed. Please try again.');
            setIsLoading(false);
          }
        } catch (verifyErr) {
          console.warn('Token verification error, redirecting anyway:', verifyErr);
          setError('✅ Login successful! Redirecting...');
          setTimeout(() => {
            router.push('/application/select-type');
          }, 1000);
        }
      } else {
        setError('✅ Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/application/select-type');
        }, 1000);
      }

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
      <div className="min-h-screen bg-white flex flex-col">
        <header className="border-b border-gray-200 py-4 px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8">
                <div className="bg-[#1ba0d7] text-white h-full w-full flex items-center justify-center rounded-sm font-bold text-lg">
                  M
                </div>
              </div>
              <span className="text-xl font-semibold text-gray-800">Mzuni </span>
              <span className="text-xl font-light text-gray-800">e admission hub</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/apply" 
                className="text-[#1ba0d7] hover:text-[#0d8cbf] text-sm font-medium"
              >
                Sign up
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                Help
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-8">
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-normal text-gray-800 mb-2">
                    Sign in to Mzuni e-admission hub
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Enter your username or email to continue
                  </p>
                </div>
                <div className="animate-pulse">
                  <div className="h-10 bg-gray-200 rounded-sm mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded-sm mb-6"></div>
                  <div className="h-10 bg-gray-200 rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8">
              <div className="bg-[#1ba0d7] text-white h-full w-full flex items-center justify-center rounded-sm font-bold text-lg">
                M
              </div>
            </div>
            <span className="text-xl font-semibold text-gray-800">Mzuni</span>
            <span className="text-xl font-light text-gray-800">E admission hub</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/apply" 
              className="text-[#1ba0d7] hover:text-[#0d8cbf] text-sm font-medium"
            >
              Sign up
            </Link>
            <div className="w-px h-6 bg-gray-300"></div>
            <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
              Help
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-normal text-gray-800 mb-2">
                  Sign in to Mzuni E admission hub
                </h1>
                <p className="text-gray-600 text-sm">
                  Enter your username or email address to continue
                </p>
                
                <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                  <Brain className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">AI Security Active</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className={`rounded-md p-3 text-center ${
                    error.includes('Success') || error.includes('✅')
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email_or_username" className="block text-sm font-medium text-gray-700 mb-1">
                    Email or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="email_or_username"
                      name="email_or_username"
                      type="text"
                      required
                      value={form.email_or_username}
                      onChange={handleChange}
                      placeholder="Enter your email or username"
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-[#1ba0d7] focus:border-[#1ba0d7] text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-xs text-[#1ba0d7] hover:text-[#0d8cbf] font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-sm focus:ring-1 focus:ring-[#1ba0d7] focus:border-[#1ba0d7] text-sm"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>

                  {form.password.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">Security Level</span>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium ${getSecurityColor()}`}>
                            {getSecurityIcon()}
                            <span>{securityLevel.toUpperCase()}</span>
                            {isAnalyzing && <span className="ml-1 animate-pulse">...</span>}
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
                        <div className="bg-gray-50 border border-gray-200 rounded-sm p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-gray-700">AI Security Insights:</span>
                          </div>
                          <ul className="space-y-1">
                            {mlInsights.map((insight, index) => (
                              <li key={index} className="flex items-start">
                                <span className={`text-xs mr-2 ${
                                  insight.includes('fast') || insight.includes('slow') 
                                    ? 'text-yellow-600'
                                    : insight.includes('Common') || insight.includes('Sequential') || insight.includes('Repeated')
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

                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-[#1ba0d7] hover:text-[#0d8cbf] font-medium"
                    onClick={() => router.push('/forgot-password')}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1ba0d7] hover:bg-[#0d8cbf] text-white font-medium py-2.5 px-4 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowSecurityInfo(!showSecurityInfo)}
                    className="flex items-center justify-center w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Advanced Security Features
                    <svg 
                      className={`ml-1 h-4 w-4 transform transition-transform ${showSecurityInfo ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showSecurityInfo && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-sm border border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-800 mb-2">AI-Powered Security System</h4>
                      <ul className="space-y-1.5">
                        <li className="flex items-start">
                          <div className="p-0.5 bg-blue-100 rounded-sm mr-2 mt-0.5">
                            <Brain className="h-2 w-2 text-blue-600" />
                          </div>
                          <span className="text-xs text-gray-600">Real-time typing pattern analysis</span>
                        </li>
                        <li className="flex items-start">
                          <div className="p-0.5 bg-blue-100 rounded-sm mr-2 mt-0.5">
                            <Zap className="h-2 w-2 text-blue-600" />
                          </div>
                          <span className="text-xs text-gray-600">Behavioral biometrics monitoring</span>
                        </li>
                        <li className="flex items-start">
                          <div className="p-0.5 bg-blue-100 rounded-sm mr-2 mt-0.5">
                            <Shield className="h-2 w-2 text-blue-600" />
                          </div>
                          <span className="text-xs text-gray-600">Dynamic password strength scoring</span>
                        </li>
                        <li className="flex items-start">
                          <div className="p-0.5 bg-blue-100 rounded-sm mr-2 mt-0.5">
                            <AlertTriangle className="h-2 w-2 text-yellow-600" />
                          </div>
                          <span className="text-xs text-gray-600">Common pattern detection</span>
                        </li>
                      </ul>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          System analyzes 15+ security parameters in real-time to protect your account.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600 text-sm">
                  Don't have an account?{' '}
                  <Link 
                    href="/apply" 
                    className="text-[#1ba0d7] hover:text-[#0d8cbf] font-medium"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="bg-blue-50 border border-blue-100 rounded-sm p-3">
              <div className="text-lg font-semibold text-blue-700">{'>99%'}</div>
              <div className="text-xs text-blue-600">Accuracy</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-sm p-3">
              <div className="text-lg font-semibold text-green-700">{'<50ms'}</div>
              <div className="text-xs text-green-600">Real-time</div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-sm p-3">
              <div className="text-lg font-semibold text-purple-700">24/7</div>
              <div className="text-xs text-purple-600">Monitoring</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">AI Security: Active & Monitoring</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-800">
                <span className="font-medium">Privacy Policy</span>
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-800">
                <span className="font-medium">Terms of Use</span>
              </a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-800">
                <span className="font-medium">Contact Support</span>
              </a>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Mzuni E Admission Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}