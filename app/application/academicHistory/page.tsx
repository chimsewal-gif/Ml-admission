'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import Button2 from '@/componets/Button2';
import { Brain, FileCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// ML Prediction Service (Mock - replace with actual ML API)
class MLPredictionService {
  static async predictProgram(userData: any, documents: any) {
    // Simulate ML API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock ML prediction logic based on document analysis
    const scores = {
      masters: 0,
      phd: 0
    };

    // Analyze documents for program suitability
    if (documents['Research Concept']) {
      scores.phd += 40;
      scores.masters += 20;
    }

    if (documents['Curriculum Vitae']) {
      // Simulate CV analysis for research experience
      const cvAnalysis = this.analyzeCV(documents['Curriculum Vitae']);
      scores.phd += cvAnalysis.researchExperience * 30;
      scores.masters += cvAnalysis.researchExperience * 15;
    }

    if (documents['Academic Transcripts']) {
      const transcriptAnalysis = this.analyzeTranscripts(documents['Academic Transcripts']);
      scores.phd += transcriptAnalysis.gpa * 20;
      scores.masters += transcriptAnalysis.gpa * 25;
    }

    if (documents['Letter of Motivation']) {
      const motivationAnalysis = this.analyzeMotivationLetter(documents['Letter of Motivation']);
      scores.phd += motivationAnalysis.researchInterest * 25;
      scores.masters += motivationAnalysis.academicGoals * 20;
    }

    // Determine recommended program
    const recommendedProgram = scores.phd > scores.masters ? 'phd' : 'masters';
    const confidence = Math.abs(scores.phd - scores.masters) / 100;

    return {
      recommendedProgram,
      confidence: Math.min(confidence, 0.95),
      scores,
      reasoning: this.generateReasoning(recommendedProgram, scores, documents)
    };
  }

  static analyzeCV(cvFile: File) {
    // Mock CV analysis - in real implementation, use NLP/ML
    return {
      researchExperience: Math.random() > 0.4 ? 0.8 : 0.3, // 0-1 scale
      publications: Math.floor(Math.random() * 10),
      workExperience: Math.floor(Math.random() * 8)
    };
  }

  static analyzeTranscripts(transcriptFile: File) {
    // Mock transcript analysis
    return {
      gpa: 3.0 + Math.random() * 1.5, // 3.0-4.5 scale
      relevantCourses: Math.floor(Math.random() * 15),
      degreeClass: ['First Class', 'Second Class Upper', 'Second Class Lower'][Math.floor(Math.random() * 3)]
    };
  }

  static analyzeMotivationLetter(motivationFile: File) {
    // Mock motivation letter analysis
    return {
      researchInterest: Math.random() > 0.5 ? 0.9 : 0.4,
      academicGoals: Math.random() > 0.3 ? 0.8 : 0.5,
      clarity: Math.random() > 0.4 ? 0.85 : 0.6
    };
  }

  static generateReasoning(program: string, scores: any, documents: any) {
    const reasons = [];
    
    if (program === 'phd') {
      if (scores.phd - scores.masters > 20) {
        reasons.push("Strong research background detected in documents");
      }
      if (documents['Research Concept']) {
        reasons.push("Research concept shows PhD-level thinking");
      }
      reasons.push("Academic profile aligns with doctoral studies");
    } else {
      if (scores.masters - scores.phd > 15) {
        reasons.push("Profile better suited for Masters advancement");
      }
      reasons.push("Strong foundation for graduate-level coursework");
      reasons.push("Career goals align with Masters program outcomes");
    }

    return reasons;
  }

  static async scanDocumentQuality(file: File, documentType: string) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const issues = [];
    let qualityScore = 80 + Math.floor(Math.random() * 20); // 80-100 base score

    // File size checks
    if (file.size > 10 * 1024 * 1024) { // 10MB
      issues.push("File size too large");
      qualityScore -= 20;
    }

    if (file.size < 10 * 1024) { // 10KB
      issues.push("File size too small - may be incomplete");
      qualityScore -= 25;
    }

    // Document type specific checks
    if (documentType.includes('Transcript') || documentType.includes('Certificate')) {
      if (!file.name.toLowerCase().includes('transcript') && !file.name.toLowerCase().includes('certificate')) {
        issues.push("Filename doesn't suggest academic document");
        qualityScore -= 10;
      }
    }

    if (documentType.includes('Research')) {
      if (file.size < 50 * 1024) { // 50KB
        issues.push("Research document seems brief");
        qualityScore -= 15;
      }
    }

    // File format validation
    const validExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      issues.push("Unsupported file format");
      qualityScore -= 30;
    }

    return {
      qualityScore: Math.max(0, qualityScore),
      issues,
      isValid: qualityScore >= 60,
      recommendations: this.generateRecommendations(issues, documentType)
    };
  }

  static generateRecommendations(issues: string[], documentType: string) {
    const recommendations = [];
    
    if (issues.includes("File size too large")) {
      recommendations.push("Compress the document or use PDF optimization");
    }
    
    if (issues.includes("File size too small")) {
      recommendations.push("Ensure document is complete and all pages are included");
    }

    if (documentType.includes('Research')) {
      recommendations.push("Ensure research concept includes: objectives, methodology, and expected outcomes");
    }

    if (documentType.includes('Transcript')) {
      recommendations.push("Verify all grades and personal information are clearly visible");
    }

    return recommendations;
  }
}

export default function UploadDocumentsPage() {
  const router = useRouter();
  const token = Cookies.get('token');
  const [programmeType, setProgrammeType] = useState<'masters' | 'phd' | ''>('');
  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mlAnalysis, setMlAnalysis] = useState<any>(null);
  const [documentScans, setDocumentScans] = useState<{ [key: string]: any }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const phdFields = [
    'Letter of Motivation',
    'Curriculum Vitae',
    'Three Referees',
    'Two Reference Letters',
    'Academic Certificates',
    'Academic Transcripts',
    'Research Concept',
    'Bank Deposit Slip',
  ];

  const mastersFields = [
    'Letter of Motivation',
    'Curriculum Vitae',
    'Two Reference Letters',
    'Academic Certificates',
    'Academic Transcripts',
    'Bank Deposit Slip',
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFiles((prev) => ({ ...prev, [label]: file }));

      // Scan document quality
      setIsAnalyzing(true);
      try {
        const scanResult = await MLPredictionService.scanDocumentQuality(file, label);
        setDocumentScans(prev => ({
          ...prev,
          [label]: scanResult
        }));
      } catch (error) {
        console.error('Document scan failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const runMLPrediction = async () => {
    if (Object.keys(files).length === 0) return;

    setIsAnalyzing(true);
    try {
      const prediction = await MLPredictionService.predictProgram({}, files);
      setMlAnalysis(prediction);
    } catch (error) {
      console.error('ML prediction failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run ML prediction when files change
  useEffect(() => {
    if (Object.keys(files).length > 2) { // Run after several files are uploaded
      const timer = setTimeout(() => {
        runMLPrediction();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [files]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programmeType) {
      setMessage('Please select a programme type first.');
      return;
    }
    if (!token) {
      setMessage('You are not logged in.');
      return;
    }

    // Check document quality before submission
    const lowQualityDocs = Object.entries(documentScans)
      .filter(([_, scan]) => !scan.isValid)
      .map(([docName, _]) => docName);

    if (lowQualityDocs.length > 0) {
      setMessage(`Some documents have quality issues: ${lowQualityDocs.join(', ')}. Please review before submission.`);
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('programme_type', programmeType);
      formData.append('ml_analysis', JSON.stringify(mlAnalysis));

      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      await axios.post(`${API_BASE_URL}/upload-documents`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Documents uploaded successfully.');
      router.push('/application/program-selection/postgraduate');
    } catch (err: any) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Failed to upload documents.');
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (scan: any) => {
    if (!scan) return <Clock className="h-4 w-4 text-gray-400" />;
    if (scan.isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  };

  const selectedFields = programmeType === 'phd' ? phdFields : mastersFields;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 mt-10 rounded-lg shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-purple-600" />
        <h1 className="text-2xl font-bold text-green-800">AI-Powered Document Upload</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Section */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <label className="font-semibold text-gray-700">Select Programme Type:</label>
            <select
              value={programmeType}
              onChange={(e) => setProgrammeType(e.target.value as 'masters' | 'phd' | '')}
              className="w-full mt-2 border border-gray-300 rounded px-3 py-2 bg-white"
            >
              <option value="">-- Choose --</option>
              <option value="masters">Masters</option>
              <option value="phd">Doctor of Philosophy (PhD)</option>
            </select>
          </div>

          {programmeType && (
            <form onSubmit={handleSubmit}>
              {selectedFields.map((label) => (
                <div key={label} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-medium text-gray-700">{label}</label>
                    <div className="flex items-center gap-2">
                      {getQualityIcon(documentScans[label])}
                      {documentScans[label] && (
                        <span className={`text-sm font-medium ${getQualityColor(documentScans[label].qualityScore)}`}>
                          {documentScans[label].qualityScore}%
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => handleFileChange(e, label)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />

                  {/* Document Quality Feedback */}
                  {documentScans[label] && (
                    <div className="mt-2 text-sm">
                      {documentScans[label].issues.length > 0 && (
                        <div className="text-red-600 mb-2">
                          <strong>Issues:</strong> {documentScans[label].issues.join(', ')}
                        </div>
                      )}
                      {documentScans[label].recommendations.length > 0 && (
                        <div className="text-blue-600">
                          <strong>Suggestions:</strong> {documentScans[label].recommendations.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <Button2 type="submit" disabled={loading || isAnalyzing}>
                {loading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Submit Documents'}
              </Button2>
            </form>
          )}
        </div>

        {/* ML Analysis Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Analysis
            </h3>

            {isAnalyzing && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Analyzing documents...</p>
              </div>
            )}

            {mlAnalysis && !isAnalyzing && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="font-semibold text-gray-700 mb-2">Program Recommendation</h4>
                  <div className="text-lg font-bold text-purple-600 capitalize">
                    {mlAnalysis.recommendedProgram}
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {(mlAnalysis.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="font-semibold text-gray-700 mb-2">Scores</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>PhD Suitability:</span>
                      <span className="font-medium">{Math.round(mlAnalysis.scores.phd)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Masters Suitability:</span>
                      <span className="font-medium">{Math.round(mlAnalysis.scores.masters)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border">
                  <h4 className="font-semibold text-gray-700 mb-2">AI Reasoning</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {mlAnalysis.reasoning.map((reason: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Analysis powered by machine learning algorithms
                </div>
              </div>
            )}

            {!mlAnalysis && !isAnalyzing && (
              <div className="text-center py-4 text-gray-500">
                <FileCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Upload documents to get AI recommendations</p>
              </div>
            )}
          </div>

          {/* Document Quality Summary */}
          {Object.keys(documentScans).length > 0 && (
            <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">Document Quality</h4>
              <div className="space-y-2">
                {selectedFields.map((label) => (
                  documentScans[label] && (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="truncate flex-1">{label}</span>
                      <span className={`font-medium ${getQualityColor(documentScans[label].qualityScore)}`}>
                        {documentScans[label].qualityScore}%
                      </span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 p-3 rounded text-center ${
            message.includes('success')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}