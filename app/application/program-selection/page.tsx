'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle, GraduationCap, Clock, Building2, AlertCircle, X, ChevronDown, Award, Star, TrendingUp } from "lucide-react";
import axios from "axios";

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

  // Save choices to backend
  const handleSaveChoices = async () => {
    if (!canProceed) {
      setNotification("Please select all 6 programmes before saving.");
      setNotificationType("warning");
      setTimeout(() => setNotification(""), 3000);
      return;
    }

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
        setNotification("Programme choices saved successfully!");
        setNotificationType("success");
        setSavedChoices(choicesData);
        
        setTimeout(() => {
          router.push("/application/documents");
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
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(""), 5000);
    }
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

  // Update choice at specific index
  const updateChoice = (choiceId: number, programmeId: number) => {
    const selectedProgramme = filteredProgrammes.find(p => p.id === programmeId);
    
    // Check if programme is already selected in another choice
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

  // Remove a choice
  const removeChoice = (choiceId: number) => {
    setChoices(prev => prev.map(choice =>
      choice.id === choiceId
        ? { ...choice, programme: null }
        : choice
    ));
  };

  // Check if all choices are filled
  const areAllChoicesFilled = choices.every(choice => choice.programme !== null);
  const canProceed = areAllChoicesFilled;

  // Get available programmes for dropdown (excluding already selected ones)
  const getAvailableProgrammes = (currentChoiceId: number) => {
    const selectedIds = choices
      .filter(choice => choice.id !== currentChoiceId && choice.programme)
      .map(choice => choice.programme!.id);
    
    return filteredProgrammes.filter(p => !selectedIds.includes(p.id));
  };

  // Get rank label
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">PROGRAMME SELECTION</h2>
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
                              <X className="w-5 h-5" />
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
                      onClick={() => router.push("/application/documents")}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
                    >
                      Continue to Documents
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}