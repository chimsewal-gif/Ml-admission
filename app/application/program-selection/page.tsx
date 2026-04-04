'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle, Brain, Target, Sparkles, Filter } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

type Programme = {
  id: number;
  name: string;
  description?: string;
  department?: string;
  duration?: string;
  category?: string;
};

type RecommendedProgramme = Programme & {
  confidence_score: number;
  match_reason: string;
  requirements: string[];
  career_opportunities: string[];
  is_recommended?: boolean;
};

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [recommendedProgrammes, setRecommendedProgrammes] = useState<RecommendedProgramme[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [savedProgramme, setSavedProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const [showRecommended, setShowRecommended] = useState(true);
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(true);
  const router = useRouter();

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch programmes from Django API
  const fetchProgrammes = async () => {
    try {
      const token = getToken();
      
      if (!token) {
        setNotification("Please login to view programmes");
        setNotificationType("error");
        router.push('/login');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/programmes/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      // Handle different response formats
      if (response.data && response.data.success) {
        setProgrammes(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setProgrammes(response.data);
      } else if (response.data && response.data.results) {
        setProgrammes(response.data.results);
      } else {
        console.error('Unexpected response format:', response.data);
        setProgrammes([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch programmes:", err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || "Failed to fetch programmes";
      setNotification(errorMessage);
      setNotificationType("error");
      setProgrammes([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved programme
  const fetchSavedProgramme = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/applicants/programme/selection/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.data && response.data.id) {
        setSavedProgramme(response.data);
        setSelectedProgramme(response.data);
      }
    } catch (err: any) {
      // 404 is expected when no programme is saved yet
      if (err.response?.status !== 404) {
        console.warn("Error fetching saved programme:", err);
      }
    }
  };

  // Get ML-based programme recommendations
  const getRecommendedProgrammes = async () => {
    try {
      setPredicting(true);
      const token = getToken();
      
      if (!token) {
        setNotification("Please login to get recommendations");
        setNotificationType("error");
        return;
      }

      // Get recommendations based on academic records
      const response = await axios.post(
        `${API_BASE_URL}/predict-courses/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (response.data && response.data.success && response.data.recommendations) {
        const recommendations = response.data.recommendations;
        
        // Map recommendations to programme format and mark as recommended
        const recommendedProgrammesList: RecommendedProgramme[] = recommendations.map((rec: any, index: number) => ({
          id: index + 1000, // Temporary ID for recommendations
          name: rec.course_name || rec.name,
          department: rec.university || rec.department || "Recommended",
          description: rec.match_reason || rec.description,
          confidence_score: rec.confidence_score || 0.8,
          match_reason: rec.match_reason || "Based on your academic performance",
          requirements: rec.requirements || [],
          career_opportunities: rec.career_opportunities || [],
          duration: rec.duration || "4 Years",
          category: rec.category || "Undergraduate",
          is_recommended: true
        }));

        setRecommendedProgrammes(recommendedProgrammesList);
        setNotification("AI recommendations generated based on your academic performance!");
        setNotificationType("success");
        
        // Auto-select the top recommendation if none is selected
        if (!selectedProgramme && recommendedProgrammesList.length > 0) {
          setSelectedProgramme(recommendedProgrammesList[0]);
        }
      }
    } catch (err: any) {
      console.warn("Failed to get recommendations:", err);
      // Don't show error as this is not critical
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    // Check authentication on mount
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    fetchProgrammes();
    fetchSavedProgramme();
  }, []);

  // Get recommendations when programmes are loaded
  useEffect(() => {
    if (programmes.length > 0 && !savedProgramme) {
      getRecommendedProgrammes();
    }
  }, [programmes, savedProgramme]);

  // Handle saving the selected programme
  const handleSaveProgramme = async () => {
    if (!selectedProgramme) {
      setNotification("Please select a programme first");
      setNotificationType("error");
      setTimeout(() => setNotification(""), 5000);
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      
      if (!token) {
        setNotification("Please login to save programme");
        setNotificationType("error");
        router.push('/login');
        return;
      }

      // Prepare the programme data
      const programmeData = {
        programme_id: selectedProgramme.id,
        name: selectedProgramme.name,
        department: selectedProgramme.department || "General",
        duration: selectedProgramme.duration || "4 Years",
        category: selectedProgramme.category || "Undergraduate",
      };

      console.log('Saving programme data:', programmeData);

      const response = await axios.post(
        `${API_BASE_URL}/applicants/select-programme/`, 
        programmeData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setSavedProgramme(selectedProgramme);
        setNotification(`Programme "${selectedProgramme.name}" selected successfully!`);
        setNotificationType("success");
        
        // Redirect to next step
        setTimeout(() => {
          router.push("/application/documents");
        }, 1500);
      } else {
        throw new Error("Failed to save programme");
      }
    } catch (err: any) {
      console.error("Failed to save programme:", err);
      
      let errorMessage = "Failed to save programme selection";
      
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        
        if (err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        
        if (err.response.data.errors) {
          const validationErrors = err.response.data.errors;
          errorMessage = "Validation failed: " + Object.values(validationErrors).flat().join(', ');
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      setNotification(errorMessage);
      setNotificationType("error");
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(""), 5000);
    }
  };

  // Refresh recommendations
  const handleRefreshRecommendations = async () => {
    await getRecommendedProgrammes();
  };

  // Get programmes to display in table
  const getDisplayProgrammes = () => {
    if (showOnlyRecommended && recommendedProgrammes.length > 0) {
      return recommendedProgrammes;
    }
    return programmes;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Select Your Programme</h1>
              <p className="text-gray-600 mt-1">Choose the programme you wish to study</p>
            </div>
          </div>
        </div>

        {/* AI Recommendations Banner */}
        {recommendedProgrammes.length > 0 && showRecommended && (
          <div className="mb-6 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">AI Programme Recommendations</h3>
                  <p className="opacity-90">Based on your academic performance and subject strengths</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleRefreshRecommendations}
                  disabled={predicting}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {predicting ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={() => setShowRecommended(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
                >
                  Hide
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Programme Banner */}
        {savedProgramme && (
          <div className="mb-8 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8" />
                <div>
                  <h3 className="text-lg font-bold">Programme Selected</h3>
                  <p className="opacity-90">Your application will be processed for this programme</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{savedProgramme.name}</p>
                <p className="text-sm opacity-90">{savedProgramme.department}</p>
                {savedProgramme.duration && (
                  <p className="text-sm opacity-90">Duration: {savedProgramme.duration}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out ${
            notificationType === "success" 
              ? "bg-green-600 text-white" 
              : "bg-red-600 text-white"
          }`}>
            <div className="flex items-center space-x-2">
              {notificationType === "success" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <span>{notification}</span>
            </div>
          </div>
        )}

        {/* Recommended Programmes Section */}
        {recommendedProgrammes.length > 0 && showRecommended && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span>Recommended For You</span>
              </h2>
              <span className="text-sm text-gray-500 bg-purple-100 px-3 py-1 rounded-full">
                AI-Powered Matching
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {recommendedProgrammes.slice(0, 3).map((programme, index) => (
                <div
                  key={programme.id}
                  className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedProgramme?.id === programme.id 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedProgramme(programme)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600' :
                        index === 1 ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {index === 0 && <Sparkles className="w-4 h-4" />}
                        {index === 1 && <Target className="w-4 h-4" />}
                        {index === 2 && <Brain className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        {index === 0 ? 'Best Match' : index === 1 ? 'Great Fit' : 'Good Option'}
                      </span>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      {Math.round((programme.confidence_score || 0) * 100)}% Match
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2">{programme.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{programme.match_reason}</p>
                  
                  <div className="space-y-2">
                    {programme.requirements && programme.requirements.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <strong>Key Requirements:</strong> {programme.requirements.slice(0, 2).join(', ')}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="programmeSelection"
                        checked={selectedProgramme?.id === programme.id}
                        onChange={() => setSelectedProgramme(programme)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-purple-600 font-medium">Select this programme</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Programmes Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {showOnlyRecommended ? 'AI-Matched Programmes' : 'All Available Programmes'}
                </h2>
                {recommendedProgrammes.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <button
                      onClick={() => setShowOnlyRecommended(!showOnlyRecommended)}
                      className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${
                        showOnlyRecommended 
                          ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {showOnlyRecommended ? 'AI Matched Only' : 'Show All'}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {recommendedProgrammes.length > 0 && (
                  <button
                    onClick={() => setShowRecommended(!showRecommended)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {showRecommended ? 'Hide Recommendations' : 'Show Recommendations'}
                  </button>
                )}
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {getDisplayProgrammes().length} programme{getDisplayProgrammes().length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading programmes...</p>
            </div>
          ) : getDisplayProgrammes().length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {showOnlyRecommended ? 'No AI recommendations available' : 'No programmes available'}
              </h3>
              <p className="text-gray-500 mb-4">
                {showOnlyRecommended 
                  ? 'Try refreshing recommendations or view all programmes.' 
                  : 'Please check back later for available programmes.'
                }
              </p>
              {showOnlyRecommended && (
                <button
                  onClick={() => setShowOnlyRecommended(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View All Programmes
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Select</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Programme Name</th>
                    {showOnlyRecommended && (
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Match Score</th>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Duration</th>
                    {showOnlyRecommended && (
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Why It Matches</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getDisplayProgrammes().map((prog) => (
                    <tr 
                      key={prog.id} 
                      className={`hover:bg-green-50/50 transition-all duration-200 group cursor-pointer ${
                        selectedProgramme?.id === prog.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                      } ${
                        (prog as RecommendedProgramme).is_recommended ? 'bg-blue-50/30 hover:bg-blue-50/50' : ''
                      }`}
                      onClick={() => setSelectedProgramme(prog)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="programmeSelection"
                            checked={selectedProgramme?.id === prog.id}
                            onChange={() => setSelectedProgramme(prog)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{prog.name}</span>
                          {(prog as RecommendedProgramme).is_recommended && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              AI Recommended
                            </span>
                          )}
                        </div>
                        {prog.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {prog.description}
                          </div>
                        )}
                      </td>
                      {showOnlyRecommended && (
                        <td className="px-6 py-4">
                          {(prog as RecommendedProgramme).confidence_score ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${(prog as RecommendedProgramme).confidence_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {Math.round((prog as RecommendedProgramme).confidence_score * 100)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-700">
                        {prog.department || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {prog.duration || "-"}
                      </td>
                      {showOnlyRecommended && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs">
                            {(prog as RecommendedProgramme).match_reason || "No match reason available"}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Section */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {selectedProgramme ? (
                    <>Selected: <span className="font-medium text-green-700">{selectedProgramme.name}</span></>
                  ) : (
                    "Please select a programme to continue"
                  )}
                </p>
                {selectedProgramme && (selectedProgramme as RecommendedProgramme).is_recommended && (
                  <p className="text-sm text-purple-600 mt-1">
                    ✓ AI-recommended based on your academic profile
                  </p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleRefreshRecommendations}
                  disabled={predicting}
                  className="px-4 py-3 border border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-all duration-200 disabled:opacity-50"
                >
                  {predicting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4" />
                      <span>Get AI Suggestions</span>
                    </div>
                  )}
                </button>
                
                <button
                  onClick={handleSaveProgramme}
                  disabled={saving || !selectedProgramme}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Continue to Documents</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}