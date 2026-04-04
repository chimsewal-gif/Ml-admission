"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Plus, Trash2 } from "lucide-react";
import Button2 from "@/componets/Button2";
import ProgressIndicator from "@/componets/ProgressIndicator";

// 🔹 Config
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());

// Postgraduate-specific data
const postgraduateQualificationTypes = [
  "Bachelor's Degree",
  "Honours Degree",
  "Master's Degree",
  "PhD",
  "Postgraduate Diploma",
  "Graduate Certificate",
  "Professional Qualification"
];

const gradingSystems = [
  "GPA (4.0 Scale)",
  "GPA (5.0 Scale)",
  "Percentage",
  "Class System",
  "Grade Points",
  "Other"
];

const classSystems = [
  "First Class",
  "Second Class Upper",
  "Second Class Lower",
  "Third Class",
  "Pass",
  "Distinction",
  "Merit"
];

// Types
type PostgraduateRow = {
  qualification: string;
  institution: string;
  year: string;
  specialization: string;
  gradingSystem: string;
  finalGrade: string;
  classAward?: string;
};

type SubjectRow = {
  qualification: string;
  centreNumber: string;
  examNumber: string;
  subject: string;
  grade: string;
  year: string;
};

type OtherRow = {
  qualification: string;
  institution: string;
  year: string;
  teachingSubject?: string;
  workExperience?: string;
};

// ---------------- POSTGRADUATE QUALIFICATIONS ----------------
function PostgraduateQualificationsTable() {
  const [rows, setRows] = useState<PostgraduateRow[]>([
    { 
      qualification: "", 
      institution: "", 
      year: "", 
      specialization: "", 
      gradingSystem: "", 
      finalGrade: "",
      classAward: ""
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = Cookies.get("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    
    const fetchRecords = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/postgraduate-qualifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data && Array.isArray(res.data.records)) {
          const formatted = res.data.records.map((r: any) => ({
            qualification: r.qualification || "",
            institution: r.institution || "",
            year: r.year || "",
            specialization: r.specialization || "",
            gradingSystem: r.grading_system || "",
            finalGrade: r.final_grade || "",
            classAward: r.class_award || ""
          }));
          setRows(formatted.length > 0 ? formatted : [createEmptyRow()]);
        }
      } catch (err) {
        console.error("Failed to fetch postgraduate records:", err);
        // Keep default empty row
      }
    };

    fetchRecords();
  }, [token]);

  const createEmptyRow = (): PostgraduateRow => ({
    qualification: "", 
    institution: "", 
    year: "", 
    specialization: "", 
    gradingSystem: "", 
    finalGrade: "",
    classAward: ""
  });

  const handleChange = (index: number, field: keyof PostgraduateRow, value: string) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    
    // Reset dependent fields when grading system changes
    if (field === 'gradingSystem') {
      if (value === 'Class System') {
        newRows[index].finalGrade = '';
      } else {
        newRows[index].classAward = '';
      }
    }
    
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, idx) => idx !== index));
    }
  };

  const handleSave = async () => {
    if (!token) return;
    
    // Validation
    for (const row of rows) {
      if (!row.qualification || !row.institution || !row.year || !row.gradingSystem) {
        alert("Please fill all required fields in all rows");
        return;
      }
      
      if (row.gradingSystem === 'Class System' && !row.classAward) {
        alert("Please select class award for Class System grading");
        return;
      }
      
      if (row.gradingSystem !== 'Class System' && !row.finalGrade) {
        alert("Please enter final grade");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        records: rows.map(row => ({
          qualification: row.qualification,
          institution: row.institution,
          year: row.year,
          specialization: row.specialization,
          grading_system: row.gradingSystem,
          final_grade: row.finalGrade,
          class_award: row.classAward
        }))
      };

      await axios.post(
        `${API_BASE_URL}/postgraduate-qualifications`, 
        payload,
        {
          headers: { 
            Authorization: `Bearer ${token}`, 
            Accept: "application/json" 
          },
        }
      );
      
      router.push("/application/program-selection");
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err.response?.data?.message || "Failed to save postgraduate qualifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <p className="text-center p-6">Checking authentication...</p>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-green-900 text-center mb-6">
        Postgraduate Academic Qualifications
      </h2>
      
      <p className="text-gray-600 text-center mb-8">
        Please provide details of your previous academic qualifications. Add multiple entries if you have more than one qualification.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Qualification Type*</th>
              <th className="border p-2">Institution*</th>
              <th className="border p-2">Specialization/Major</th>
              <th className="border p-2">Year Awarded*</th>
              <th className="border p-2">Grading System*</th>
              <th className="border p-2">Final Grade/CGPA*</th>
              <th className="border p-2">Class Award</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border p-2">
                  <select 
                    value={row.qualification} 
                    onChange={(e) => handleChange(index, "qualification", e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Qualification</option>
                    {postgraduateQualificationTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </td>
                <td className="border p-2">
                  <input 
                    type="text" 
                    value={row.institution} 
                    onChange={(e) => handleChange(index, "institution", e.target.value)}
                    placeholder="University/Institution name"
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </td>
                <td className="border p-2">
                  <input 
                    type="text" 
                    value={row.specialization} 
                    onChange={(e) => handleChange(index, "specialization", e.target.value)}
                    placeholder="e.g., Computer Science"
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </td>
                <td className="border p-2">
                  <select 
                    value={row.year} 
                    onChange={(e) => handleChange(index, "year", e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </td>
                <td className="border p-2">
                  <select 
                    value={row.gradingSystem} 
                    onChange={(e) => handleChange(index, "gradingSystem", e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select System</option>
                    {gradingSystems.map((system) => (
                      <option key={system} value={system}>{system}</option>
                    ))}
                  </select>
                </td>
                <td className="border p-2">
                  {row.gradingSystem === 'Class System' ? (
                    <span className="text-gray-400">N/A for Class System</span>
                  ) : (
                    <input 
                      type="text" 
                      value={row.finalGrade} 
                      onChange={(e) => handleChange(index, "finalGrade", e.target.value)}
                      placeholder={row.gradingSystem.includes('GPA') ? "e.g., 3.5" : "e.g., 75%"}
                      className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required={row.gradingSystem !== 'Class System' && row.gradingSystem !== ''}
                    />
                  )}
                </td>
                <td className="border p-2">
                  {row.gradingSystem === 'Class System' ? (
                    <select 
                      value={row.classAward || ''} 
                      onChange={(e) => handleChange(index, "classAward", e.target.value)}
                      className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Class</option>
                      {classSystems.map((classSys) => (
                        <option key={classSys} value={classSys}>{classSys}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="border p-2 text-center">
                  <button 
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                    className={`p-2 rounded ${
                      rows.length === 1 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button 
          onClick={addRow}
          className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="mr-2" size={18}/>
          Add Another Qualification
        </button>
        
        <div className="flex gap-4">
          <button 
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Back
          </button>
          
          <Button2 
            onClick={handleSave} 
            disabled={loading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors min-w-[140px]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save & Continue"
            )}
          </Button2>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
        <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
          <li>All fields marked with * are required</li>
          <li>For Class System grading, select your class award instead of entering a grade</li>
          <li>Add multiple qualifications if you have more than one relevant degree</li>
          <li>Ensure the information matches your academic transcripts</li>
        </ul>
      </div>
    </div>
  );
}

// ---------------- UNDERGRADUATE (Keep your existing code, just for reference) ----------------
const subjectsList = [
  "English", "Chichewa", "Mathematics", "Biology", "Physical Science",
  "Agriculture", "Geography", "History", "Bible Knowledge",
  "Social and Development Studies", "Computer Studies", "Home Economics",
  "Clothing and Textiles", "Woodwork", "Metalwork", "Technical Drawing",
  "French", "Life Skills", "Chemistry",
];
const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const qualifications = ["MSCE", "IGCSE"];

function SubjectSelectionTable() {
  const [rows, setRows] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "review">("form");
  const router = useRouter();

  useEffect(() => {
    const t = Cookies.get("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const fetchRecords = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/subject-records`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data && Array.isArray(res.data)) {
          const formatted = res.data.map((r: any) => ({
            qualification: r.qualification || "",
            centreNumber: r.centre_number || "",
            examNumber: r.exam_number || "",
            subject: r.subject || "",
            grade: r.grade || "",
            year: r.year || "",
          }));
          setRows(formatted);
          setStep("review");
        } else {
          setRows(Array.from({ length: 8 }, () => ({
            qualification: "", centreNumber: "", examNumber: "", subject: "", grade: "", year: "",
          })));
        }
      } catch (err) {
        console.error("Failed to fetch subject records:", err);
        setRows(Array.from({ length: 8 }, () => ({
          qualification: "", centreNumber: "", examNumber: "", subject: "", grade: "", year: "",
        })));
      }
    };
    fetchRecords();
  }, [token]);

  const handleChange = (i: number, field: keyof SubjectRow, value: string) => {
    const newRows = [...rows];
    newRows[i][field] = value;
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { qualification: "", centreNumber: "", examNumber: "", subject: "", grade: "", year: "" }]);
  };
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const formatted = rows.map((r) => ({
        qualification: r.qualification,
        centre_number: r.centreNumber,
        exam_number: r.examNumber,
        subject: r.subject,
        grade: r.grade,
        year: r.year,
      }));
      await axios.post(`${API_BASE_URL}/subject-records`, { records: formatted }, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      setStep("review");
    } catch (err) {
      console.error("Error saving:", err);
      alert("Failed to save subjects.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <p className="text-center p-6">Checking authentication...</p>;

  return step === "form" ? (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl text-green-900 text-center font-bold mb-6">Subjects and Grades</h2>
      <table className="w-full table-auto border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Qualification</th>
            <th className="border p-2">Centre Number</th>
            <th className="border p-2">Exam Number</th>
            <th className="border p-2">Subject</th>
            <th className="border p-2">Grade</th>
            <th className="border p-2">Year</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border p-2">
                <select value={row.qualification} onChange={(e) => handleChange(i, "qualification", e.target.value)} className="w-full border rounded p-1">
                  <option value="">Select</option>
                  {qualifications.map((q) => <option key={q}>{q}</option>)}
                </select>
              </td>
              <td className="border p-2"><input value={row.centreNumber} onChange={(e) => handleChange(i, "centreNumber", e.target.value)} className="w-full border rounded p-1" /></td>
              <td className="border p-2"><input value={row.examNumber} onChange={(e) => handleChange(i, "examNumber", e.target.value)} className="w-full border rounded p-1" /></td>
              <td className="border p-2">
                <select value={row.subject} onChange={(e) => handleChange(i, "subject", e.target.value)} className="w-full border rounded p-1">
                  <option value="">Select subject</option>
                  {subjectsList.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
              <td className="border p-2">
                <select value={row.grade} onChange={(e) => handleChange(i, "grade", e.target.value)} className="w-full border rounded p-1">
                  <option value="">Select grade</option>
                  {grades.map((g) => <option key={g}>{g}</option>)}
                </select>
              </td>
              <td className="border p-2">
                <select value={row.year} onChange={(e) => handleChange(i, "year", e.target.value)} className="w-full border rounded p-1">
                  <option value="">Select year</option>
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </td>
              <td className="border p-2 text-center">
                <button onClick={() => removeRow(i)} className="p-2 bg-red-600 text-white rounded"><Trash2 size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between">
        <button onClick={addRow} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded">
          <Plus className="mr-2" size={18}/> Add New Record
        </button>
        <Button2 onClick={handleSave} disabled={loading} className="w-1/5 py-2 bg-green-600 text-white rounded">
          {loading ? "Saving..." : "Save & Next"}
        </Button2>
      </div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl text-green-900 font-bold text-center mb-6">Review Your Details</h2>
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Qualification</th>
            <th className="border p-2">Centre</th>
            <th className="border p-2">Exam No</th>
            <th className="border p-2">Subject</th>
            <th className="border p-2">Grade</th>
            <th className="border p-2">Year</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border p-2">{r.qualification}</td>
              <td className="border p-2">{r.centreNumber}</td>
              <td className="border p-2">{r.examNumber}</td>
              <td className="border p-2">{r.subject}</td>
              <td className="border p-2">{r.grade}</td>
              <td className="border p-2">{r.year}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6 flex justify-between">
        <button onClick={() => setStep("form")} className="px-6 py-3 bg-yellow-500 text-white rounded">Edit</button>
        <button onClick={() => router.push("/application/program-selection")} className="px-6 py-3 bg-green-600 text-white rounded">Continue</button>
      </div>
    </div>
  );
}

// ---------------- OTHER QUALIFICATIONS ----------------
function OtherQualificationsTable({ type }: { type: string }) {
  const [rows, setRows] = useState<OtherRow[]>([{ qualification: "", institution: "", year: "" }]);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = Cookies.get("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
  }, [router]);

  const handleChange = (i: number, field: keyof OtherRow, value: string) => {
    const newRows = [...rows]; newRows[i][field] = value; setRows(newRows);
  };
  const addRow = () => setRows([...rows, { qualification: "", institution: "", year: "" }]);
  const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/other-qualifications`, { records: rows, type }, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      router.push("/application/program-selection");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save qualifications.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold text-green-900 text-center mb-6">
        {type === "teacher" ? "Teaching Qualifications" : "Other Qualifications"}
      </h2>
      <table className="w-full table-auto border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Qualification</th>
            <th className="border p-2">Award Institution</th>
            <th className="border p-2">Year</th>
            {type === "teacher" && <th className="border p-2">Teaching Subject</th>}
            {type === "teacher" && <th className="border p-2">Work Experience</th>}
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border p-2"><input value={row.qualification} onChange={(e) => handleChange(i, "qualification", e.target.value)} className="w-full border rounded p-1" /></td>
              <td className="border p-2"><input value={row.institution} onChange={(e) => handleChange(i, "institution", e.target.value)} className="w-full border rounded p-1" /></td>
              <td className="border p-2">
                <select value={row.year} onChange={(e) => handleChange(i, "year", e.target.value)} className="w-full border rounded p-1">
                  <option value="">Select</option>
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </td>
              {type === "teacher" && (
                <>
                  <td className="border p-2"><input value={row.teachingSubject || ""} onChange={(e) => handleChange(i, "teachingSubject", e.target.value)} className="w-full border rounded p-1" /></td>
                  <td className="border p-2"><input value={row.workExperience || ""} onChange={(e) => handleChange(i, "workExperience", e.target.value)} className="w-full border rounded p-1" placeholder="e.g. 5 years" /></td>
                </>
              )}
              <td className="border p-2 text-center">
                <button onClick={() => removeRow(i)} className="p-2 bg-red-600 text-white rounded"><Trash2 size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between">
        <button onClick={addRow} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded"><Plus className="mr-2" size={18}/> Add</button>
        <Button2 onClick={handleSave} disabled={loading} className="w-1/4 py-2 bg-green-600 text-white rounded">
          {loading ? "Saving..." : "Save & Next"}
        </Button2>
      </div>
    </div>
  );
}

// ---------------- MAIN ENTRY ----------------
export default function QualificationStep() {
  const [applicationType, setApplicationType] = useState<string | null>(null);

  useEffect(() => {
    const type = Cookies.get("applicationType") || "undergraduate";
    setApplicationType(type);
  }, []);

  if (!applicationType) return <p className="text-center p-6">Loading...</p>;

  return (
    <>
      <ProgressIndicator currentStep={6} />
      {applicationType === "undergraduate" ? (
        <SubjectSelectionTable />
      ) : applicationType === "postgraduate" ? (
        <PostgraduateQualificationsTable />
      ) : (
        <OtherQualificationsTable type={applicationType} />
      )}
    </>
  );
}