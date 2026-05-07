'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, CheckCircle, GraduationCap, Clock, Building2, AlertCircle, 
  X, ChevronDown, Award, Star, TrendingUp, Brain, Sparkles, 
  Shield, Loader2, ThumbsUp, Target, Zap, BarChart3, Eye, EyeOff, Plus, Trash2
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

type Programme = {
  id: number;
  name: string;
  description?: string;
  department?: string;
  duration?: string;
  category?: string;
  code?: string;
  is_active?: boolean;
};

type Choice = {
  id: number;
  programme: Programme | null;
};

type MLRecommendation = {
  id: number;
  name: string;
  code: string;
  duration: string;
  type: string;
  fit_score: number;
  admission_probability: number;
  eligibility: string;
  required_subjects: string[];
  missing_subjects: string[];
  min_points: number;
  required_credits: number;
  quota: number;
  rank: number;
};

// Helper function for rank suffix
const getRankSuffix = (rank: number): string => {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
};

// Map application types to programme categories
const getCategoryFromApplicationType = (applicationType: string): string[] => {
  const categoryMap: Record<string, string[]> = {
    'odl': ['ODL', 'Open and Distance Learning', 'Distance', 'Bachelor'],
    'postgraduate': ['Postgraduate', 'Master', 'Doctoral', 'PhD', 'Masters'],
    'diploma': ['Diploma', 'Certificate', 'Undergraduate'],
    'international': ['International', 'Bachelor', 'Undergraduate', 'Postgraduate']
  };
  return categoryMap[applicationType] || ['Bachelor', 'Undergraduate', 'Diploma'];
};

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState<Programme[]>([]);
  const [choices, setChoices] = useState<Choice[]>([
    { id: 1, programme: null },
    { id: 2, programme: null },
    { id: 3, programme: null },
    { id: 4, programme: null },
    { id: 5, programme: null },
    { id: 6, programme: null },
  ]);
  const [savedChoices, setSavedChoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error" | "warning">("success");
  const [applicationType, setApplicationType] = useState<string>("");
  
  // ML Recommendations State
  const [mlRecommendations, setMlRecommendations] = useState<MLRecommendation[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [mlStudentStats, setMlStudentStats] = useState<any>(null);
  const [hasLoadedRecommendations, setHasLoadedRecommendations] = useState(false);
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const router = useRouter();

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Get application type from localStorage
  const getApplicationType = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userApplicationType') || localStorage.getItem('userRole') || '';
    }
    return '';
  };

  // Fetch MSCE results for ML recommendations
  const fetchMSCEResults = async () => {
    try {
      const token = getToken();
      if (!token) return null;
      
      const response = await axios.get(`${API_BASE_URL}/subject-records/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const subjects = response.data.data || response.data || [];
      return subjects.filter((s: any) => s.qualification === 'MSCE (Malawi School Certificate of Education)');
    } catch (err) {
      console.error("Failed to fetch MSCE results:", err);
      return null;
    }
  };

  // Get ML recommendations (called when modal opens)
  const getMLRecommendations = async () => {
    const token = getToken();
    if (!token) return;
    
    setIsLoadingRecommendations(true);
    
    try {
      // Fetch MSCE results
      const msceResults = await fetchMSCEResults();
      
      if (!msceResults || msceResults.length === 0) {
        setNotification("No MSCE results found. Please add your MSCE results first.");
        setNotificationType("warning");
        setTimeout(() => setNotification(""), 5000);
        setShowAIModal(false);
        return;
      }
      
      // Format subjects for ML model
      const formattedSubjects = msceResults.map((s: any) => ({
        subject: s.subject,
        grade: s.grade
      }));
      
      // Get recommendations from ML endpoint
      const response = await axios.post(
        `${API_BASE_URL}/ml/recommend-programmes/`,
        {
          subjects: formattedSubjects,
          top_n: 10,
          programme_type: applicationType === 'odl' ? 'generic' : 'all'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success && response.data.recommendations) {
        // Filter only eligible or high-fit programmes
        const filteredRecs = response.data.recommendations.filter((rec: any) => 
          rec.eligibility === 'Eligible' || rec.fit_score >= 60
        );
        setMlRecommendations(filteredRecs.slice(0, 10));
        setMlStudentStats(response.data.student_stats);
        setHasLoadedRecommendations(true);
        
        if (filteredRecs.length === 0) {
          setNotification("No strong programme matches found based on your results.");
          setNotificationType("warning");
          setTimeout(() => setNotification(""), 5000);
        }
      } else {
        setNotification("Could not generate recommendations at this time.");
        setNotificationType("error");
        setTimeout(() => setNotification(""), 5000);
      }
    } catch (err) {
      console.error("Failed to get ML recommendations:", err);
      setNotification("Failed to load recommendations. Please try again.");
      setNotificationType("error");
      setTimeout(() => setNotification(""), 5000);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Open AI modal and fetch recommendations
  const openAIModal = () => {
    setShowAIModal(true);
    if (!hasLoadedRecommendations) {
      getMLRecommendations();
    }
  };

  // Close AI modal
  const closeAIModal = () => {
    setShowAIModal(false);
  };

  // Add recommendation to choices
  const addRecommendationToChoice = (recommendation: MLRecommendation) => {
    // Find the first empty choice
    const emptyIndex = choices.findIndex(c => !c.programme);
    if (emptyIndex !== -1) {
      updateChoice(choices[emptyIndex].id, recommendation.id);
      setNotification(`✓ Added ${recommendation.name} as your ${emptyIndex + 1}${getRankSuffix(emptyIndex + 1)} choice`);
      setNotificationType("success");
      setTimeout(() => setNotification(""), 3000);
    } else {
      setNotification("All 6 choices are already filled. Please remove one to add this recommendation.");
      setNotificationType("warning");
      setTimeout(() => setNotification(""), 3000);
    }
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

      let allProgrammes: Programme[] = [];
      if (response.data && response.data.success) {
        allProgrammes = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        allProgrammes = response.data;
      } else if (response.data && response.data.results) {
        allProgrammes = response.data.results;
      } else {
        console.error('Unexpected response format:', response.data);
        allProgrammes = [];
      }

      setProgrammes(allProgrammes);
      
      // Filter programmes based on application type
      filterProgrammesByType(allProgrammes, applicationType);
      
    } catch (err: any) {
      console.error("Failed to fetch programmes:", err);
      
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
      setFilteredProgrammes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter programmes based on application type
  const filterProgrammesByType = (allProgrammes: Programme[], type: string) => {
    if (!type) {
      setFilteredProgrammes(allProgrammes);
      return;
    }
    
    const allowedCategories = getCategoryFromApplicationType(type);
    
    // Filter programmes that match the application type
    const filtered = allProgrammes.filter(programme => {
      const category = programme.category?.toLowerCase() || '';
      const name = programme.name?.toLowerCase() || '';
      const department = programme.department?.toLowerCase() || '';
      
      // Check if programme matches any of the allowed categories
      return allowedCategories.some(allowed => 
        category.includes(allowed.toLowerCase()) ||
        name.includes(allowed.toLowerCase()) ||
        department.includes(allowed.toLowerCase())
      );
    });
    
    setFilteredProgrammes(filtered);
    
    if (filtered.length === 0) {
      setNotification(`No programmes found for ${getApplicationTypeName(type)}. Please contact support.`);
      setNotificationType("warning");
      setTimeout(() => setNotification(""), 5000);
    }
  };

  // Get readable application type name
  const getApplicationTypeName = (type: string): string => {
    const names: Record<string, string> = {
      'odl': 'ODL Student',
      'postgraduate': 'Postgraduate',
      'diploma': 'Diploma/Certificate',
      'international': 'International Student'
    };
    return names[type] || type;
  };

  // Fetch saved choices
  const fetchSavedChoices = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/applicants/programme-choices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.data && response.data.success && response.data.choices && response.data.choices.length > 0) {
        const savedChoicesData = response.data.choices;
        setSavedChoices(savedChoicesData);
        
        // Map the saved choices to the choices state
        const newChoices = [...choices];
        savedChoicesData.forEach((savedChoice: any) => {
          const index = savedChoice.choice_number - 1;
          if (index >= 0 && index < 6) {
            newChoices[index] = {
              id: savedChoice.choice_number,
              programme: {
                id: savedChoice.programme_id,
                name: savedChoice.programme_name,
                department: savedChoice.department,
                duration: savedChoice.duration,
                category: savedChoice.category
              }
            };
          }
        });
        setChoices(newChoices);
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        console.log("No saved choices found (expected for new users)");
      } else if (err.response?.status !== 404) {
        console.warn("Error fetching saved choices:", err);
      }
    }
  };

  // Save choices to backend (actual save function)
  const performSaveChoices = async () => {
    setSaving(true);
    
    try {
      const token = getToken();
      
      if (!token) {
        setNotification("Please login to continue");
        setNotificationType("error");
        router.push('/login');
        return;
      }

      const choicesData = choices.map((choice) => ({
        choice_number: choice.id,
        programme_id: choice.programme?.id,
        programme_name: choice.programme?.name || "",
        department: choice.programme?.department || "",
        duration: choice.programme?.duration || "",
        category: choice.programme?.category || ""
      }));

      const endpoint = `${API_BASE_URL}/applicants/programme-choices`;
      
      const response = await axios.post(
        endpoint,
        { choices: choicesData },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.data && response.data.success) {
        localStorage.setItem('programmeChoiceCompleted', 'true');
        localStorage.setItem('programmeChoices', JSON.stringify(choicesData));
        
        setNotification("Programme choices saved successfully!");
        setNotificationType("success");
        setSavedChoices(choicesData);
        setShowConfirmModal(false);
        
        setTimeout(() => {
          router.push("/application/education");
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Failed to save choices");
      }
      
    } catch (err: any) {
      console.error("Error saving choices:", err);
      
      let errorMessage = "Failed to save programme choices. Please try again.";
      
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((d: any) => d.msg).join(", ");
        } else if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setNotification(errorMessage);
      setNotificationType("error");
      setShowConfirmModal(false);
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(""), 5000);
    }
  };

  // Show confirmation modal before saving
  const handleSaveChoices = () => {
    if (!canProceed) {
      setNotification("Please select all 6 programmes before saving.");
      setNotificationType("warning");
      setTimeout(() => setNotification(""), 3000);
      return;
    }
    setShowConfirmModal(true);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    
    const userType = getApplicationType();
    setApplicationType(userType);
    
    if (!userType) {
      setNotification("Please select your application type first.");
      setNotificationType("warning");
      setTimeout(() => {
        router.push('/application/select-type');
      }, 2000);
      return;
    }
    
    fetchProgrammes();
    fetchSavedChoices();
  }, []);

  useEffect(() => {
    if (programmes.length > 0 && applicationType) {
      filterProgrammesByType(programmes, applicationType);
    }
  }, [programmes, applicationType]);

  const updateChoice = (choiceId: number, programmeId: number) => {
    const selectedProgramme = filteredProgrammes.find(p => p.id === programmeId);
    
    const isAlreadySelected = choices.some(choice => 
      choice.id !== choiceId && choice.programme?.id === programmeId
    );
    
    if (isAlreadySelected) {
      setNotification("This programme is already selected in another choice. Please choose a different programme.");
      setNotificationType("warning");
      setTimeout(() => setNotification(""), 3000);
      return;
    }
    
    setChoices(prev => prev.map(choice =>
      choice.id === choiceId
        ? { ...choice, programme: selectedProgramme || null }
        : choice
    ));
  };

  const removeChoice = (choiceId: number) => {
    setChoices(prev => prev.map(choice =>
      choice.id === choiceId
        ? { ...choice, programme: null }
        : choice
    ));
  };

  const areAllChoicesFilled = choices.every(choice => choice.programme !== null);
  const canProceed = areAllChoicesFilled;

  const getAvailableProgrammes = (currentChoiceId: number) => {
    const selectedIds = choices
      .filter(choice => choice.id !== currentChoiceId && choice.programme)
      .map(choice => choice.programme!.id);
    
    return filteredProgrammes.filter(p => !selectedIds.includes(p.id));
  };

  const getRankLabel = (index: number) => {
    const ranks = [
      { label: "1st Choice", icon: Award, color: "text-green-600", bg: "bg-green-100" },
      { label: "2nd Choice", icon: Star, color: "text-green-600", bg: "bg-green-100" },
      { label: "3rd Choice", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
      { label: "4th Choice", icon: Award, color: "text-green-600", bg: "bg-green-100" },
      { label: "5th Choice", icon: Star, color: "text-green-600", bg: "bg-green-100" },
      { label: "6th Choice", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    ];
    return ranks[index];
  };

  const getSelectedProgrammesSummary = () => {
    const selected = choices.filter(c => c.programme);
    return selected.map((c, idx) => ({
      rank: idx + 1,
      name: c.programme?.name || ''
    }));
  };

  const getEligibilityColor = (eligibility: string) => {
    switch(eligibility) {
      case 'Eligible': return 'bg-green-100 text-green-700';
      case 'Points Issue': return 'bg-yellow-100 text-yellow-700';
      case 'Missing Subjects': return 'bg-orange-100 text-orange-700';
      default: return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-800">PROGRAMME SELECTION</h2>
              </div>
              
              {/* AI Recommendations Button - Opens Modal */}
              <button
                onClick={openAIModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md"
              >
                <Brain className="w-4 h-4" />
                <span className="text-sm font-medium">Get AI Recommendations</span>
              </button>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                You are applying as: <strong className="text-green-700">{getApplicationTypeName(applicationType)}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Select your preferred programmes in order of priority. You must select exactly 6 programmes.
              </p>
            </div>
          </div>

          <div className="p-6">
            {/* Notification */}
            {notification && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                notificationType === "success" 
                  ? "bg-green-50 border border-green-200 text-green-800" 
                  : notificationType === "warning"
                  ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}>
                {notificationType === "success" ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : notificationType === "warning" ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <X className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm">{notification}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading programmes...</p>
              </div>
            ) : (
              <>
                {/* Choices Grid */}
                <div className="space-y-4 mb-8">
                  {choices.map((choice, index) => {
                    const { label, icon: Icon, color, bg } = getRankLabel(index);
                    const availableProgrammes = getAvailableProgrammes(choice.id);
                    
                    return (
                      <div
                        key={choice.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-all duration-200"
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Rank Badge */}
                          <div className={`flex items-center gap-2 ${bg} rounded-lg px-3 py-1.5 min-w-[110px]`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                            <span className={`font-semibold text-sm ${color}`}>{label}</span>
                          </div>

                          {/* Programme Select Dropdown */}
                          <div className="flex-1">
                            <select
                              value={choice.programme?.id || ""}
                              onChange={(e) => updateChoice(choice.id, parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800"
                            >
                              <option value="">-- Select a programme --</option>
                              {availableProgrammes.map((programme) => (
                                <option key={programme.id} value={programme.id}>
                                  {programme.name} - {programme.department || "No Dept"} ({programme.duration || "N/A"})
                                </option>
                              ))}
                            </select>
                            
                            {/* Selected Programme Details */}
                            {choice.programme && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex flex-wrap gap-3 text-sm">
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Building2 className="w-4 h-4 text-green-600" />
                                    <span>{choice.programme.department || "Not specified"}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <Clock className="w-4 h-4 text-green-600" />
                                    <span>{choice.programme.duration || "Not specified"}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <BookOpen className="w-4 h-4 text-green-600" />
                                    <span>{choice.programme.category || "Not specified"}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Remove Button */}
                          {choice.programme && (
                            <button
                              onClick={() => removeChoice(choice.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove selection"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress Indicator */}
                <div className="mb-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Selection Progress</span>
                    <span className="text-sm font-semibold text-green-700">
                      {choices.filter(c => c.programme).length}/6 Completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(choices.filter(c => c.programme).length / 6) * 100}%` }}
                    />
                  </div>
                  {!areAllChoicesFilled && (
                    <p className="text-xs text-gray-500 mt-2">
                      You need to select {6 - choices.filter(c => c.programme).length} more programme(s)
                    </p>
                  )}
                </div>

                {/* Action Section */}
                {savedChoices.length === 0 ? (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveChoices}
                        disabled={saving || !canProceed}
                        className={`px-6 py-2.5 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 ${
                          canProceed
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Save & Continue
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Choices Saved!</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Your programme preferences have been saved successfully.
                    </p>
                    <button
                      onClick={() => router.push("/application/education")}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
                    >
                      Continue to Education
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendations Modal - Transparent Background */}
      <AnimatePresence>
        {showAIModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeAIModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI Programme Recommendations</h3>
                    <p className="text-xs text-purple-200">
                      {hasLoadedRecommendations 
                        ? 'Based on your MSCE results analysis' 
                        : 'Analyzing your academic profile'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAIModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {isLoadingRecommendations ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Analyzing your MSCE results...</p>
                    <p className="text-sm text-gray-400 mt-1">Finding the best programme matches for you</p>
                  </div>
                ) : mlRecommendations.length === 0 && hasLoadedRecommendations ? (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No strong programme matches found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adding more MSCE subjects or check your grades</p>
                    <button
                      onClick={closeAIModal}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Student Stats Summary */}
                    {mlStudentStats && (
                      <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Your Academic Profile</p>
                              <p className="text-xs text-gray-500">Based on your MSCE results</p>
                            </div>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-700">{mlStudentStats.subjects_count}</p>
                              <p className="text-xs text-gray-500">Subjects</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-700">{mlStudentStats.average_points}</p>
                              <p className="text-xs text-gray-500">Avg Points</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-700">{mlStudentStats.best_grade}</p>
                              <p className="text-xs text-gray-500">Best Grade</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recommendations List */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Recommended Programmes ({mlRecommendations.length})
                      </p>
                      
                      {mlRecommendations.map((rec, idx) => (
                        <div
                          key={rec.id}
                          className="border border-purple-100 rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-sm font-bold text-purple-600">#{rec.rank}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getEligibilityColor(rec.eligibility)}`}>
                                  {rec.eligibility}
                                </span>
                                {rec.code && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    {rec.code}
                                  </span>
                                )}
                              </div>
                              
                              <h4 className="font-semibold text-gray-800 mb-2">{rec.name}</h4>
                              
                              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {rec.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  Quota: {rec.quota}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  Min Points: {rec.min_points}
                                </span>
                              </div>

                              {/* Required Subjects */}
                              {rec.required_subjects.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-gray-600 mb-1">Required Subjects:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {rec.required_subjects.map((subject, i) => (
                                      <span
                                        key={i}
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                          rec.missing_subjects.includes(subject)
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}
                                      >
                                        {subject}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Missing Subjects Warning */}
                              {rec.missing_subjects.length > 0 && (
                                <div className="bg-orange-50 border-l-4 border-orange-500 p-2 rounded-r-lg mt-2">
                                  <p className="text-xs text-orange-700">
                                    Missing required subjects: {rec.missing_subjects.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Fit Score and Add Button */}
                            <div className="text-center">
                              <div className="relative w-20 h-20 mx-auto">
                                <svg className="w-20 h-20 transform -rotate-90">
                                  <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    stroke="#e5e7eb"
                                    strokeWidth="5"
                                    fill="none"
                                  />
                                  <circle
                                    cx="40"
                                    cy="40"
                                    r="35"
                                    stroke="#8b5cf6"
                                    strokeWidth="5"
                                    fill="none"
                                    strokeDasharray={`${(rec.fit_score / 100) * 219.9} 219.9`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-lg font-bold text-purple-700">{rec.fit_score}%</span>
                                  <span className="text-[10px] text-gray-500">Fit</span>
                                </div>
                              </div>
                              <button
                                onClick={() => addRecommendationToChoice(rec)}
                                className="mt-2 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 mx-auto"
                              >
                                <Plus className="w-3 h-3" />
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              {!isLoadingRecommendations && mlRecommendations.length > 0 && (
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3 text-purple-600" />
                    Click the Add button on any programme to add it to your selection list
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 p-5 bg-white rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Confirm Your Programme Choices
              </h3>
            </div>
            
            <div className="p-5 bg-white">
              <p className="text-gray-600 text-sm mb-4">
                Please confirm your programme selections. Once saved, you will be redirected to complete your Education details.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Your Selected Programmes:</h4>
                <div className="space-y-2">
                  {getSelectedProgrammesSummary().map((item) => (
                    <div key={item.rank} className="flex items-start gap-2 text-sm">
                      <span className="font-bold text-green-600 min-w-[70px]">{item.rank}{getRankSuffix(item.rank)} Choice:</span>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg mb-4">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> You cannot change your programme choices after saving. Please review carefully.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={performSaveChoices}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}