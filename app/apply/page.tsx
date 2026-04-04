'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertTriangle, CheckCircle, Zap, Cpu, X } from 'lucide-react';

// Advanced AI Validator - 100% Dependency Free
class AIValidator {
  // Smart pattern detection using advanced algorithms
  static detectSuspiciousPatterns(text: string, fieldType: string): { score: number; insights: string[] } {
    if (!text.trim()) return { score: 100, insights: [] };

    const cleanText = text.trim().toLowerCase();
    let riskScore = 0;
    const insights: string[] = [];

    // Pattern 1: Repetitive characters (like "aaa", "1111")
    const repetitiveRegex = /(.)\1{2,}/g;
    const repetitiveMatches = (cleanText.match(repetitiveRegex) || []);
    if (repetitiveMatches.length > 0) {
      riskScore += repetitiveMatches.length * 10;
      insights.push(`Repeated "${repetitiveMatches[0][0]}" pattern detected`);
    }

    // Pattern 2: Keyboard walking sequences
    const keyboardPatterns = [
      'qwerty', 'asdfgh', 'zxcvbn', '123456', '234567', '345678', '456789',
      'abcdef', 'bcdefg', 'cdefgh', 'wertyu', 'sdfghj', 'xcvbnm'
    ];
    const hasKeyboardPattern = keyboardPatterns.some(pattern => cleanText.includes(pattern));
    if (hasKeyboardPattern) {
      riskScore += 25;
      insights.push('Keyboard sequence identified');
    }

    // Pattern 3: Sequential patterns
    const sequentialPatterns = [
      'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij', 'ijk', 'jkl', 
      'klm', 'lmn', 'mno', 'nop', 'opq', 'pqr', 'qrs', 'rst', 'stu', 'tuv', 
      'uvw', 'vwx', 'wxy', 'xyz'
    ];
    const hasSequential = sequentialPatterns.some(pattern => cleanText.includes(pattern));
    if (hasSequential) {
      riskScore += 20;
      insights.push('Sequential pattern found');
    }

    // Pattern 4: Common fake values
    const fakePatterns = [
      'test', 'demo', 'sample', 'fake', 'dummy', 'user', 'admin', 'temp',
      'asdf', 'qwer', 'zxcv', 'hjkl', 'password', 'hello', 'welcome'
    ];
    const hasFakePattern = fakePatterns.some(pattern => cleanText.includes(pattern));
    if (hasFakePattern) {
      riskScore += 30;
      insights.push('Common placeholder detected');
    }

    // Pattern 5: Number analysis for names
    if (fieldType === 'name') {
      const numberCount = (cleanText.match(/\d/g) || []).length;
      if (numberCount > 2) {
        riskScore += 15;
        insights.push('Unusual numbers in name');
      }
    }

    // Pattern 6: Length analysis
    if (cleanText.length < 2) {
      riskScore += 20;
      insights.push('Input too short');
    } else if (cleanText.length > 30 && fieldType === 'name') {
      riskScore += 10;
      insights.push('Unusually long input');
    }

    const finalScore = Math.max(0, 100 - riskScore);
    return { score: finalScore, insights: insights.slice(0, 3) };
  }

  // Advanced password strength analyzer
  static analyzePasswordStrength(password: string): { 
    score: number; 
    level: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
    insights: string[];
  } {
    let score = 0;
    const insights: string[] = [];

    // Length scoring (exponential)
    if (password.length >= 16) {
      score += 35;
    } else if (password.length >= 12) {
      score += 25;
    } else if (password.length >= 8) {
      score += 15;
    } else {
      insights.push('🔒 Should be at least 8 characters');
    }

    // Character variety analysis
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (hasUpper) score += 15;
    else insights.push('🔠 Add uppercase letters');
    
    if (hasLower) score += 10;
    else insights.push('🔡 Add lowercase letters');
    
    if (hasNumbers) score += 15;
    else insights.push('🔢 Include numbers');
    
    if (hasSpecial) score += 20;
    else insights.push('⚡ Add special characters');

    // Entropy calculation
    const charSet = new Set(password);
    const characterVariety = charSet.size;
    const entropy = password.length * Math.log2(characterVariety || 1);
    score += Math.min(entropy * 0.4, 15);

    // Common weak pattern detection
    const weakPatterns = [
      { pattern: /123456|234567|345678|456789/, penalty: 25, message: 'Sequential numbers' },
      { pattern: /qwerty|asdfgh|zxcvbn/, penalty: 20, message: 'Keyboard pattern' },
      { pattern: /password|admin|welcome|12345678/, penalty: 30, message: 'Common password' },
      { pattern: /(.)\1{3,}/, penalty: 15, message: 'Repeated characters' },
      { pattern: /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno)/, penalty: 10, message: 'Sequential letters' }
    ];

    weakPatterns.forEach(({ pattern, penalty, message }) => {
      if (pattern.test(password.toLowerCase())) {
        score = Math.max(0, score - penalty);
        insights.push(`🚫 ${message}`);
      }
    });

    // Determine strength level
    let level: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong' = 'very-weak';
    if (score >= 85) level = 'very-strong';
    else if (score >= 70) level = 'strong';
    else if (score >= 50) level = 'medium';
    else if (score >= 30) level = 'weak';

    // Positive feedback
    if (level === 'very-strong') {
      insights.push('🎉 Excellent password strength!');
    } else if (level === 'strong') {
      insights.push('👍 Strong password');
    }

    return { 
      score: Math.min(100, Math.round(score)), 
      level,
      insights: insights.slice(0, 4)
    };
  }

  // Smart email validation
  static analyzeEmail(email: string): { 
    isValid: boolean; 
    quality: 'high' | 'medium' | 'low';
    insights: string[];
  } {
    const insights: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      return { isValid: false, quality: 'low', insights: ['Invalid email format'] };
    }

    const [localPart, domain] = email.split('@');
    let quality: 'high' | 'medium' | 'low' = 'high';

    // Local part analysis
    if (localPart.length < 2) {
      insights.push('Email username too short');
      quality = 'low';
    }

    if (/(.)\1{3,}/.test(localPart)) {
      insights.push('Suspicious repetition in email');
      quality = 'medium';
    }

    // Domain analysis
    const disposableDomains = [
      'tempmail', 'guerrillamail', 'mailinator', '10minutemail', 
      'throwaway', 'fakeinbox', 'yopmail', 'trashmail'
    ];
    
    if (disposableDomains.some(d => domain.includes(d))) {
      insights.push('Disposable email detected');
      quality = 'low';
    }

    // Common typo detection
    const commonTypos: { [key: string]: string } = {
      'gmial.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'hotmal.com': 'hotmail.com',
      'outloo.com': 'outlook.com',
    };

    if (commonTypos[domain]) {
      insights.push(`Possible typo: did you mean ${commonTypos[domain]}?`);
      quality = 'medium';
    }

    // Trusted domain check
    const trustedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (trustedDomains.includes(domain)) {
      insights.push('✅ Trusted email provider');
    }

    return { isValid: true, quality, insights };
  }
}

// Toast Component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
      <div className={`rounded-2xl shadow-2xl p-6 min-w-[320px] max-w-md ${
        type === 'success' 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
          : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${
              type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {type === 'success' ? 'Success!' : 'Error!'}
            </h3>
            <p className={`text-sm mt-1 ${
              type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full animate-progress ${
              type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ animation: 'progress 5s linear forwards' }}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation: progress 5s linear forwards;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        .animate-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    title: 'Mr',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [aiInsights, setAiInsights] = useState<{ [key: string]: any }>({});
  
  const router = useRouter();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Track typing behavior for AI analysis
  const trackTypingBehavior = (field: string, value: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      performAIAnalysis(field, value);
    }, 700);
  };

  // Perform AI analysis
  const performAIAnalysis = (field: string, value: string) => {
    if (!value.trim()) {
      setAiInsights(prev => {
        const newInsights = { ...prev };
        delete newInsights[field];
        return newInsights;
      });
      return;
    }

    let analysis: any = {};

    switch (field) {
      case 'username':
        analysis = AIValidator.detectSuspiciousPatterns(value, 'name');
        break;
      
      case 'first_name':
      case 'last_name':
        analysis = AIValidator.detectSuspiciousPatterns(value, 'name');
        break;
      
      case 'password':
        analysis = AIValidator.analyzePasswordStrength(value);
        break;
      
      case 'email':
        analysis = AIValidator.analyzeEmail(value);
        break;
    }

    setAiInsights(prev => ({
      ...prev,
      [field]: analysis
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    trackTypingBehavior(name, value);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // AI-powered validation
    if (form.username) {
      const analysis = AIValidator.detectSuspiciousPatterns(form.username, 'name');
      if (analysis.score < 60) {
        errors.username = 'Please enter a valid username';
      }
    }

    if (form.first_name) {
      const analysis = AIValidator.detectSuspiciousPatterns(form.first_name, 'name');
      if (analysis.score < 60) {
        errors.first_name = 'Please enter a valid first name';
      }
    }

    if (form.last_name) {
      const analysis = AIValidator.detectSuspiciousPatterns(form.last_name, 'name');
      if (analysis.score < 60) {
        errors.last_name = 'Please enter a valid last name';
      }
    }

    // Password validation
    if (form.password) {
      const analysis = AIValidator.analyzePasswordStrength(form.password);
      if (analysis.level === 'very-weak' || analysis.level === 'weak') {
        errors.password = 'Password is too weak - please follow suggestions';
      }
    }

    // Password confirmation
    if (form.password !== form.password_confirm) {
      errors.password_confirm = 'Passwords do not match';
    }

    // Email validation
    if (form.email) {
      const analysis = AIValidator.analyzeEmail(form.email);
      if (!analysis.isValid) {
        errors.email = 'Invalid email address';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getPasswordStrengthColor = (level?: string) => {
    switch (level) {
      case 'very-strong': return 'text-green-600 bg-green-50 border-green-200';
      case 'strong': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'weak': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very-weak': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPasswordStrengthIcon = (level?: string) => {
    switch (level) {
      case 'very-strong': return <CheckCircle className="h-4 w-4" />;
      case 'strong': return <Shield className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'weak': return <AlertTriangle className="h-4 w-4" />;
      case 'very-weak': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const hasError = (fieldName: string) => fieldErrors[fieldName];
  const hasAIInsights = (fieldName: string) => aiInsights[fieldName]?.insights?.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fix validation errors before submitting.' });
      return;
    }

    setLoading(true);

    try {
      // Format data to match ApplicantRegistrationSchema
      const formData = {
        title: form.title,
        firstname: form.first_name,
        middlename: '',
        lastname: form.last_name,
        dob: null,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: 'guest'
      };

      console.log('Sending registration data:', formData);

      // Use the correct endpoint: /api/register (not /api/applicants)
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.status === 201 && data.success) {
        setToast({ 
          type: 'success', 
          message: 'Registration successful! Redirecting to login...' 
        });
        
        // Clear form
        setForm({
          username: '',
          email: '',
          password: '',
          password_confirm: '',
          first_name: '',
          last_name: '',
          title: 'Mr',
          phone: '',
        });
        
        setTimeout(() => {
          router.push('/login');
        }, 3000);
        return;
      }
      
      // Handle validation errors
      if (response.status === 400) {
        if (data.message) {
          throw new Error(data.message);
        }
        if (data.errors) {
          // Map field errors
          const errors: {[key: string]: string} = {};
          Object.keys(data.errors).forEach(key => {
            errors[key] = data.errors[key][0];
          });
          setFieldErrors(errors);
          throw new Error('Please fix the form errors');
        }
      }
      
      throw new Error(data.message || data.detail || 'Registration failed');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setToast({ 
        type: 'error', 
        message: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <div className="flex items-center justify-center gap-2">
                <Cpu className="h-6 w-6" />
                <h2 className="text-2xl font-bold text-center">AI-Powered Registration</h2>
              </div>
              <p className="text-blue-100 text-center text-sm mt-2">
                Advanced pattern detection keeps your account secure
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                {/* Title Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <select
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Prof">Prof</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      hasError('first_name')
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  {hasError('first_name') && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.first_name}</p>
                  )}
                  {hasAIInsights('first_name') && (
                    <div className="mt-1 space-y-1">
                      {aiInsights.first_name.insights.map((insight: string, index: number) => (
                        <p key={index} className="text-orange-600 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {insight}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      hasError('last_name')
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  {hasError('last_name') && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.last_name}</p>
                  )}
                  {hasAIInsights('last_name') && (
                    <div className="mt-1 space-y-1">
                      {aiInsights.last_name.insights.map((insight: string, index: number) => (
                        <p key={index} className="text-orange-600 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {insight}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      hasError('email')
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  {hasError('email') && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                  )}
                  {hasAIInsights('email') && (
                    <div className="mt-1 space-y-1">
                      {aiInsights.email.insights.map((insight: string, index: number) => (
                        <p key={index} className={`text-xs flex items-center gap-1 ${
                          insight.includes('✅') ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {insight.includes('✅') ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {insight}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Password with Advanced AI Analysis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      hasError('password')
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  {hasError('password') && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {form.password && aiInsights.password && (
                    <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg border ${getPasswordStrengthColor(aiInsights.password.level)}`}>
                      {getPasswordStrengthIcon(aiInsights.password.level)}
                      <span className="text-sm font-medium">
                        {aiInsights.password.level?.replace('-', ' ').toUpperCase()} ({aiInsights.password.score}%)
                      </span>
                    </div>
                  )}

                  {/* Password Insights */}
                  {hasAIInsights('password') && (
                    <div className="mt-2 space-y-1">
                      {aiInsights.password.insights.map((insight: string, index: number) => (
                        <p key={index} className={`text-xs flex items-center gap-1 ${
                          insight.includes('🎉') || insight.includes('👍') || insight.includes('✅')
                            ? 'text-green-600' 
                            : insight.includes('🚫')
                            ? 'text-red-600'
                            : 'text-orange-600'
                        }`}>
                          {insight.includes('🎉') || insight.includes('👍') || insight.includes('✅') ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : insight.includes('🚫') ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {insight}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Password Confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="password_confirm"
                    value={form.password_confirm}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={`w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      hasError('password_confirm')
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  {hasError('password_confirm') && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.password_confirm}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Sign in here
                  </button>
                </p>
              </div>

              {/* AI Security Notice */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                  <Cpu className="h-5 w-5" />
                  <span className="font-semibold">AI Security Protection Active</span>
                </div>
                <p className="text-blue-600 text-xs">
                  Pattern detection • Behavioral analysis • Real-time validation
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}