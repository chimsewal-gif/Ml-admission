'use client';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, CheckCircle, GraduationCap, Clock, Building2, AlertCircle, 
  X, ChevronDown, Award, Star, TrendingUp, Brain, Sparkles, 
  Shield, Loader2, ThumbsUp, Target, Zap, BarChart3, Eye, EyeOff, Plus, Trash2, Search
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
  programme_type?: string;
  study_mode?: string;
  application_category?: string;
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

// Custom Styled Select Component with green theme
const StyledSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: number | string; 
  onChange: (value: number) => void; 
  options: Programme[];
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedProgramme = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(programme =>
    programme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    programme.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    programme.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (programmeId: number) => {
    onChange(programmeId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center justify-between gap-2 hover:border-green-300 transition-all"
      >
        <div className="flex-1 truncate">
          {selectedProgramme ? (
            <span className="text-gray-800">{selectedProgramme.name}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search programmes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No programmes found
                </div>
              ) : (
                filteredOptions.map((programme) => (
                  <button
                    key={programme.id}
                    onClick={() => handleSelect(programme.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      selectedProgramme?.id === programme.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-800">{programme.name}</span>
                      {selectedProgramme?.id === programme.id && (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      )}
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                      {programme.department && <span>{programme.department}</span>}
                      {programme.duration && <span>• {programme.duration}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
    'degree': ['degree', 'undergraduate', 'bachelor', 'bsc', 'ba', 'bcom', 'bed', 'beng', 'generic', 'upgrading'],
    'masters': ['masters', 'master', 'msc', 'ma', 'mba', 'postgraduate', 'master\'s'],
    'phd': ['phd', 'doctorate', 'doctoral', 'dphil', 'research'],
    'diploma': ['diploma', 'certificate', 'advanced diploma'],
    'certificate': ['certificate', 'short course', 'foundation', 'training'],
    'odl': ['odl', 'open and distance learning', 'distance', 'degree', 'generic'],
    'postgraduate': ['postgraduate', 'master', 'masters', 'phd', 'doctoral'],
    'international': ['international', 'degree', 'undergraduate', 'postgraduate']
  };
  return categoryMap[applicationType] || ['degree', 'undergraduate', 'diploma'];
};

// Get readable application type name
const getApplicationTypeName = (type: string): string => {
  const names: Record<string, string> = {
    'degree': "Bachelor's Degree Programmes",
    'masters': "Master's Degree Programmes",
    'phd': "PhD / Doctorate Programmes",
    'diploma': "Diploma Programmes",
    'certificate': "Certificate Programmes",
    'odl': 'ODL Programmes',
    'postgraduate': 'Postgraduate Programmes',
    'international': 'International Student Programmes'
  };
  return names[type] || type;
};

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState<Programme[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
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
  
  // Maximum number of choices (6)
  const MAX_CHOICES = 6;
  
  const router = useRouter();

  // Helper to get token from localStorage
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Get application type from localStorage
  const getApplicationTypeFromStorage = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userApplicationType') || 
             localStorage.getItem('userRole') || 
             localStorage.getItem('selectedApplicationType') || 
             '';
    }
    return '';
  };

  // Initialize choices based on available programmes
  const initializeChoices = (availableCount: number) => {
    const numberOfChoices = Math.min(availableCount, MAX_CHOICES);
    const newChoices: Choice[] = [];
    for (let i = 1; i <= numberOfChoices; i++) {
      newChoices.push({ id: i, programme: null });
    }
    setChoices(newChoices);
    return newChoices;
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

  // Get ML recommendations
  const getMLRecommendations = async () => {
    const token = getToken();
    if (!token) return;
    
    setIsLoadingRecommendations(true);
    
    try {
      const msceResults = await fetchMSCEResults();
      
      if (!msceResults || msceResults.length === 0) {
        setNotification("No MSCE results found. Please add your MSCE results first.");
        setNotificationType("warning");
        setTimeout(() => setNotification(""), 5000);
        setShowAIModal(false);
        return;
      }
      
      const formattedSubjects = msceResults.map((s: any) => ({
        subject: s.subject,
        grade: s.grade
      }));
      
      let programmeTypeParam = 'all';
      if (applicationType === 'phd') {
        programmeTypeParam = 'phd';
      } else if (applicationType === 'masters') {
        programmeTypeParam = 'masters';
      } else if (applicationType === 'degree') {
        programmeTypeParam = 'degree';
      } else if (applicationType === 'diploma') {
        programmeTypeParam = 'diploma';
      } else if (applicationType === 'certificate') {
        programmeTypeParam = 'certificate';
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/ml/recommend-programmes/`,
        {
          subjects: formattedSubjects,
          top_n: 100,
          application_category: programmeTypeParam
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.success && response.data.recommendations) {
        const allRecommendations = response.data.recommendations.sort((a: MLRecommendation, b: MLRecommendation) => b.fit_score - a.fit_score);
        setMlRecommendations(allRecommendations);
        setMlStudentStats(response.data.student_stats);
        setHasLoadedRecommendations(true);
        
        if (allRecommendations.length === 0) {
          setNotification("No programme matches found based on your results.");
          setNotificationType("warning");
          setTimeout(() => setNotification(""), 5000);
        } else {
          setNotification(`🎯 Found ${allRecommendations.length} programme recommendations for you!`);
          setNotificationType("success");
          setTimeout(() => setNotification(""), 4000);
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

  const openAIModal = () => {
    setShowAIModal(true);
    if (!hasLoadedRecommendations) {
      getMLRecommendations();
    }
  };

  const closeAIModal = () => {
    setShowAIModal(false);
  };

  const addRecommendationToChoice = (recommendation: MLRecommendation) => {
    const emptyIndex = choices.findIndex(c => !c.programme);
    if (emptyIndex !== -1) {
      updateChoice(choices[emptyIndex].id, recommendation.id);
      setNotification(`✓ Added ${recommendation.name} as your ${emptyIndex + 1}${getRankSuffix(emptyIndex + 1)} choice`);
      setNotificationType("success");
      setTimeout(() => setNotification(""), 3000);
    } else {
      setNotification(`All ${choices.length} choices are already filled. Please remove one to add this recommendation.`);
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
      const availableCount = allProgrammes.length;
      initializeChoices(Math.min(availableCount, MAX_CHOICES));
      return;
    }
    
    const allowedCategories = getCategoryFromApplicationType(type);
    
    const filtered = allProgrammes.filter(programme => {
      const category = programme.category?.toLowerCase() || '';
      const name = programme.name?.toLowerCase() || '';
      const department = programme.department?.toLowerCase() || '';
      const programmeType = programme.programme_type?.toLowerCase() || '';
      const applicationCategory = programme.application_category?.toLowerCase() || '';
      
      const matches = allowedCategories.some(allowed => 
        category.includes(allowed.toLowerCase()) ||
        name.includes(allowed.toLowerCase()) ||
        department.includes(allowed.toLowerCase()) ||
        programmeType.includes(allowed.toLowerCase()) ||
        applicationCategory.includes(allowed.toLowerCase())
      );
      
      if (type === 'phd') {
        return matches && (name.includes('phd') || name.includes('doctorate') || name.includes('doctoral'));
      }
      
      if (type === 'masters') {
        return matches && (name.includes('master') || name.includes('msc') || name.includes('ma') || name.includes('mba'));
      }
      
      if (type === 'degree') {
        return matches && (name.includes('bachelor') || name.includes('bsc') || name.includes('ba') || 
                          name.includes('bcom') || name.includes('bed') || category === 'undergraduate');
      }
      
      return matches;
    });
    
    setFilteredProgrammes(filtered);
    
    // Initialize choices based on available filtered programmes
    const availableCount = filtered.length;
    initializeChoices(Math.min(availableCount, MAX_CHOICES));
    
    if (filtered.length === 0) {
      setNotification(`No ${getApplicationTypeName(type)} programmes found. Please contact support.`);
      setNotificationType("warning");
      setTimeout(() => setNotification(""), 5000);
    } else {
      console.log(`Found ${filtered.length} programmes for ${type}`);
    }
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
        
        const newChoices = [...choices];
        savedChoicesData.forEach((savedChoice: any) => {
          const index = savedChoice.choice_number - 1;
          if (index >= 0 && index < newChoices.length) {
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

  // Save choices to backend
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

  const handleSaveChoices = () => {
    const filledCount = choices.filter(c => c.programme).length;
    const requiredCount = choices.length;
    
    if (filledCount !== requiredCount) {
      setNotification(`Please select all ${requiredCount} programme(s) before saving. You have selected ${filledCount}/${requiredCount}.`);
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
    
    const userType = getApplicationTypeFromStorage();
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
    return ranks[index] || { label: `${index + 1}th Choice`, icon: Award, color: "text-green-600", bg: "bg-green-100" };
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

  const filledChoicesCount = choices.filter(c => c.programme).length;
  const totalChoices = choices.length;
  const isAllFilled = filledChoicesCount === totalChoices;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading programmes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-800">PROGRAMME SELECTION</h2>
              </div>
              
              <button
                onClick={openAIModal}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md"
              >
                <Brain className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {hasLoadedRecommendations ? `AI Picks (${mlRecommendations.length})` : 'Get AI Recommendations'}
                </span>
              </button>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mt-3">
              <p className="text-sm text-gray-700">
                You are applying as: <strong className="text-green-700">{getApplicationTypeName(applicationType)}</strong>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Select your preferred programmes in order of priority. You must select exactly {totalChoices} programme{totalChoices !== 1 ? 's' : ''}.
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

            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-green-600">{filteredProgrammes.length}</span> programmes for{" "}
                <span className="font-semibold">{getApplicationTypeName(applicationType)}</span>
              </p>
              <p className="text-sm text-gray-600">
                You need to select <span className="font-semibold text-green-600">{totalChoices}</span> programme{totalChoices !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Choices Grid - Dynamically rendered based on totalChoices */}
            <div className="space-y-4 mb-8">
              {choices.map((choice, index) => {
                const { label, icon: Icon, color, bg } = getRankLabel(index);
                const availableProgrammes = getAvailableProgrammes(choice.id);
                
                return (
                  <div
                    key={choice.id}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      choice.programme ? 'border-green-300 bg-green-50/30' : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className={`flex items-center gap-2 ${bg} rounded-lg px-3 py-1.5 min-w-[110px]`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className={`font-semibold text-sm ${color}`}>{label}</span>
                      </div>

                      <div className="flex-1">
                        <StyledSelect
                          value={choice.programme?.id || ""}
                          onChange={(programmeId) => updateChoice(choice.id, programmeId)}
                          options={availableProgrammes}
                          placeholder="-- Select a programme --"
                        />
                        
                        {choice.programme && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100">
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
                                <GraduationCap className="w-4 h-4 text-green-600" />
                                <span>{choice.programme.category || "Not specified"}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

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
                  {filledChoicesCount}/{totalChoices} Completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(filledChoicesCount / totalChoices) * 100}%` }}
                />
              </div>
              {!isAllFilled && (
                <p className="text-xs text-gray-500 mt-2">
                  You need to select {totalChoices - filledChoicesCount} more programme(s)
                </p>
              )}
            </div>

            {/* Action Section */}
            {savedChoices.length === 0 ? (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveChoices}
                    disabled={saving || !isAllFilled}
                    className={`px-6 py-2.5 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 ${
                      isAllFilled
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
          </div>
        </div>
      </div>

      {/* AI Recommendations Modal */}
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
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Brain className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">AI Programme Recommendations</h3>
                    <p className="text-xs text-gray-500">
                      {hasLoadedRecommendations 
                        ? `Based on your MSCE results - ${mlRecommendations.length} programmes found` 
                        : 'Analyzing your academic profile'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAIModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {isLoadingRecommendations ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Analyzing your MSCE results...</p>
                    <p className="text-sm text-gray-400 mt-1">Finding the best programme matches for you</p>
                  </div>
                ) : mlRecommendations.length === 0 && hasLoadedRecommendations ? (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No programme matches found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adding more MSCE subjects or check your grades</p>
                    <button
                      onClick={closeAIModal}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Close
                    </button>
                  </div>
                ) : mlRecommendations.length > 0 ? (
                  <>
                    {mlStudentStats && (
                      <div className="mb-6 bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Your Academic Profile</p>
                              <p className="text-xs text-gray-500">Based on your MSCE results</p>
                            </div>
                          </div>
                          <div className="flex gap-6">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-700">{mlStudentStats.subjects_count}</p>
                              <p className="text-xs text-gray-500">Subjects</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-700">{mlStudentStats.average_points}</p>
                              <p className="text-xs text-gray-500">Avg Points</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-700">{mlStudentStats.best_grade}</p>
                              <p className="text-xs text-gray-500">Best Grade</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-green-600" />
                          Recommended Programmes for {getApplicationTypeName(applicationType)} ({mlRecommendations.length})
                        </p>
                        <p className="text-xs text-gray-400">Sorted by fit score</p>
                      </div>
                      
                      {mlRecommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="border border-green-100 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between flex-wrap gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-sm font-bold text-green-600">#{rec.rank}</span>
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
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Required Credits: {rec.required_credits}
                                </span>
                              </div>

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

                              {rec.missing_subjects.length > 0 && (
                                <div className="bg-orange-50 border-l-4 border-orange-500 p-2 rounded-r-lg mt-2">
                                  <p className="text-xs text-orange-700">
                                    ⚠️ Missing required subjects: {rec.missing_subjects.join(', ')}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="text-center min-w-[100px]">
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
                                    stroke="#22c55e"
                                    strokeWidth="5"
                                    fill="none"
                                    strokeDasharray={`${(rec.fit_score / 100) * 219.9} 219.9`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-lg font-bold text-green-700">{rec.fit_score}%</span>
                                  <span className="text-[10px] text-gray-500">Fit</span>
                                </div>
                              </div>
                              <p className="text-xs text-green-600 mt-1">
                                {rec.admission_probability}% Chance
                              </p>
                              <button
                                onClick={() => addRecommendationToChoice(rec)}
                                className="mt-2 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 mx-auto"
                              >
                                <Plus className="w-3 h-3" />
                                Add to List
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              {!isLoadingRecommendations && mlRecommendations.length > 0 && (
                <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 sticky bottom-0">
                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3 text-green-600" />
                    Showing {mlRecommendations.length} programme recommendations. Click "Add to List" to add any programme to your {totalChoices} choices.
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