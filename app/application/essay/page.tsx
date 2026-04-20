'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Save, ArrowRight, AlertCircle, 
  CheckCircle, X, ChevronLeft, BookOpen, 
  Target, Lightbulb, TrendingUp, Clock, MessageSquare
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface EssayData {
  id?: number;
  motivation: string;
  research_concept_note: string;
}

export default function EssayPage() {
  const router = useRouter();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [essay, setEssay] = useState<EssayData>({
    motivation: '',
    research_concept_note: '',
  });
  const [wordCounts, setWordCounts] = useState({
    motivation: 0,
    research_concept_note: 0
  });
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  // Add toast notification
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      router.push('/login');
      throw new Error('User not authenticated');
    }

    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
    };

    const res = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
    
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || `Request failed with status ${res.status}`);
    return data;
  };

  useEffect(() => {
    if (token) {
      fetchEssay();
    }
  }, [token]);

  const fetchEssay = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authFetch('/essay/');
      console.log('Essay API response:', data);
      
      if (data.success && data.data) {
        setEssay({
          motivation: data.data.motivation || '',
          research_concept_note: data.data.research_concept_note || '',
        });
        updateWordCounts(data.data.motivation || '', data.data.research_concept_note || '');
      }
    } catch (err: any) {
      console.error('Error fetching essay:', err);
      setError(err.message || 'Failed to load essay');
      // Load from localStorage
      const saved = localStorage.getItem('essay');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setEssay(parsed);
          updateWordCounts(parsed.motivation || '', parsed.research_concept_note || '');
        } catch (e) {
          console.error('Error parsing saved essay:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const updateWordCounts = (motivation: string, researchNote: string) => {
    setWordCounts({
      motivation: motivation.trim() === '' ? 0 : motivation.trim().split(/\s+/).length,
      research_concept_note: researchNote.trim() === '' ? 0 : researchNote.trim().split(/\s+/).length
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEssay(prev => ({ ...prev, [name]: value }));
    updateWordCounts(
      name === 'motivation' ? value : essay.motivation,
      name === 'research_concept_note' ? value : essay.research_concept_note
    );
  };

  const handleSave = async () => {
    if (!essay.motivation.trim()) {
      addToast('Please write your motivation essay', 'error');
      return;
    }
    
    if (wordCounts.motivation > 500) {
      addToast(`Motivation exceeds 500 words. Current: ${wordCounts.motivation} words`, 'error');
      return;
    }
    
    if (wordCounts.research_concept_note > 1000) {
      addToast(`Research concept note exceeds 1000 words. Current: ${wordCounts.research_concept_note} words`, 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      const data = await authFetch('/essay/', {
        method: 'POST',
        body: JSON.stringify({
          motivation: essay.motivation,
          research_concept_note: essay.research_concept_note,
        }),
      });
      
      if (data.success) {
        localStorage.setItem('essay', JSON.stringify(essay));
        addToast('Essay saved successfully!', 'success');
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Error saving essay:', err);
      localStorage.setItem('essay', JSON.stringify(essay));
      addToast('Essay saved locally!', 'success');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (!essay.motivation.trim()) {
      addToast('Please write your motivation essay before continuing', 'error');
      return;
    }
    if (wordCounts.motivation > 500) {
      addToast(`Motivation exceeds 500 words. Current: ${wordCounts.motivation} words`, 'error');
      return;
    }
    router.push('/application/teacher-subjects');
  };

  const getWordCountColor = (count: number, max: number) => {
    if (count > max) return 'text-red-600';
    if (count > max * 0.9) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your essay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Toast Notifications */}
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center space-y-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg animate-slide-down ${
                toast.type === 'success' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 hover:opacity-80 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Essay Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">ESSAY</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                Answer each question carefully. Pay attention to word limits.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Motivation Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Motivation *</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-medium ${getWordCountColor(wordCounts.motivation, 500)}`}>
                    {wordCounts.motivation} / 500 words
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Explain your motivation for applying to this programme. Discuss your academic background, research interests, and career goals, and how this programme aligns with them. (Max 500 words)
              </p>
              <textarea
                name="motivation"
                value={essay.motivation}
                onChange={handleInputChange}
                rows={12}
                placeholder="Write your motivation essay here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
              {wordCounts.motivation > 500 && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Word limit exceeded! Please reduce to 500 words or less.
                </p>
              )}
            </div>

            {/* Research Concept Note Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Research Concept Note</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-medium ${getWordCountColor(wordCounts.research_concept_note, 1000)}`}>
                    {wordCounts.research_concept_note} / 1000 words
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                (For PhD and Research Masters Students only) Provide a brief research concept note outlining your proposed area of study. Include the research problem, objectives, methodology, and expected contribution to knowledge. (Max 1000 words)
              </p>
              <textarea
                name="research_concept_note"
                value={essay.research_concept_note}
                onChange={handleInputChange}
                rows={15}
                placeholder="Write your research concept note here..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              />
              {wordCounts.research_concept_note > 1000 && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Word limit exceeded! Please reduce to 1000 words or less.
                </p>
              )}
            </div>

            {/* Word Count Tips */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-gray-700">Tips for a Great Essay</h4>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 ml-6 list-disc">
                <li>Be specific about your academic background and how it relates to the programme</li>
                <li>Clearly articulate your career goals and how this programme will help achieve them</li>
                <li>Show genuine enthusiasm for the field of study</li>
                <li>Proofread your essay for grammar and spelling errors</li>
                <li>Stay within the word limits - concise writing is valued</li>
              </ul>
            </div>

            {/* Action Buttons - Back, Save, Next */}
            <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Your essays are saved automatically. Please ensure you stay within the word limits.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}