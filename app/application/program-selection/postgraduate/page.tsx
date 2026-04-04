'use client';

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import axios from "axios";
import Button2 from "@/componets/Button2";
import ProgressIndicator from "@/componets/ProgressIndicator";
import { BookOpen, Search, Filter, Save, CheckCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

type Programme = {
  id: number;
  name: string;
  code: string;
  department: string;
  duration?: string;
  category?: string;
};

export default function ProgrammesStep() {
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [savedProgramme, setSavedProgramme] = useState<Programme | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const router = useRouter();

  // 🔹 Load token
  useEffect(() => {
    const t = Cookies.get("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  // 🔹 Fetch programmes from database
  useEffect(() => {
    if (!token) return;
    
    const fetchProgrammes = async () => {
      try {
        setFetchLoading(true);
        const res = await axios.get(`${API_BASE_URL}/admin/programmes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProgrammes(res.data);
      } catch (err) {
        console.error('Failed to fetch programmes:', err);
        alert('Failed to load programmes. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchProgrammes();
  }, [token]);

  // 🔹 Fetch saved programme from backend
  useEffect(() => {
    if (!token) return;
    const fetchSavedProgramme = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/applicants/programme`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && res.data.id) {
          setSavedProgramme(res.data);
          setSelectedProgramme(res.data);
        } else {
          setSavedProgramme(null);
        }
      } catch (err) {
        console.warn("No saved programme found:", err);
      }
    };
    fetchSavedProgramme();
  }, [token]);

  // 🔹 Filter programme list
  const categories = ["All", ...Array.from(new Set(programmes.map((p) => p.department || 'Uncategorized')))];

  const filteredProgrammes = programmes.filter((p) => {
    const matchesCategory = categoryFilter === "All" || p.department === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  // 🔹 Save selected programme
  const handleSave = async () => {
    if (!selectedProgramme) return alert("Please select a programme first.");
    if (!token) return alert("User not identified. Please log in again.");
  
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/applicants/programme`, selectedProgramme, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
  
      if (response.status === 200) {
        setSavedProgramme(selectedProgramme);
        router.push("/application/documents");
      } else {
        alert("Failed to save programme.");
      }
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err.response?.data?.message || "Error saving programme.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <ProgressIndicator currentStep={7} />

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Select Your Programme</h1>
                <p className="text-gray-600 mt-2">
                  Choose from our available programmes
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 min-w-[120px]">
                <p className="text-sm font-medium text-gray-600">Programmes</p>
                <p className="text-2xl font-bold text-gray-900">{programmes.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 min-w-[120px]">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length - 1}</p>
              </div>
            </div>
          </div>
        </div>

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
                <p className="text-sm opacity-90">{savedProgramme.code} • {savedProgramme.department}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Available Programmes</h2>
            <p className="text-gray-600 text-sm mt-1">
              Browse and select your preferred programme
            </p>
          </div>

          {/* Filters Section */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Department Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Department
                </label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Programmes
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    placeholder="Search by programme name, code or ID..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Programmes Table */}
          {fetchLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading programmes...</p>
            </div>
          ) : programmes.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No programmes available</h3>
              <p className="text-gray-500">Please check back later for available programmes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Programme Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                      Department
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProgrammes.map((programme) => (
                    <tr
                      key={programme.id}
                      className={`hover:bg-green-50/50 transition-all duration-200 group ${
                        selectedProgramme?.id === programme.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="programmeChoice"
                            checked={selectedProgramme?.id === programme.id}
                            onChange={() => setSelectedProgramme(programme)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {programme.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {programme.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium font-mono">
                          {programme.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                          {programme.department}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProgrammes.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No programmes found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          )}

          {/* Action Section */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{filteredProgrammes.length}</span> of <span className="font-medium">{programmes.length}</span> programme{programmes.length !== 1 ? 's' : ''}
                  {searchTerm && (
                    <span> for "<span className="font-medium">{searchTerm}</span>"</span>
                  )}
                </p>
              </div>
              
              <Button2
                onClick={handleSave}
                disabled={loading || !selectedProgramme}
                className="min-w-[200px] bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Save className="w-5 h-5" />
                    <span>Continue to Documents</span>
                  </div>
                )}
              </Button2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}