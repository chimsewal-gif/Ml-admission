'use client';

import { useState, useEffect } from 'react';
import Button from '@/componets/Button';
import ProgressIndicator from '@/componets/ProgressIndicator';
import { Brain, Clock, CheckCircle, AlertCircle, TrendingUp, Target } from 'lucide-react';

interface ApplicationProgress {
  overallPercentage: number;
  completionProbability: number;
  predictedTimeline: string;
  riskFactors: string[];
  recommendations: string[];
  sectionProgress: {
    personalInfo: number;
    academicBackground: number;
    documents: number;
    programSelection: number;
    payment: number;
  };
  lastUpdated: Date;
}

// ML Progress Prediction Service
class MLProgressService {
  static async predictProgress(userData: any, applicationData: any): Promise<ApplicationProgress> {
    // Simulate ML API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const {
      personalInfo = 0,
      academicBackground = 0,
      documents = 0,
      programSelection = 0,
      payment = 0
    } = applicationData;

    // Calculate weighted overall percentage
    const weights = {
      personalInfo: 0.15,
      academicBackground: 0.25,
      documents: 0.30,
      programSelection: 0.20,
      payment: 0.10
    };

    const overallPercentage = Math.round(
      personalInfo * weights.personalInfo +
      academicBackground * weights.academicBackground +
      documents * weights.documents +
      programSelection * weights.programSelection +
      payment * weights.payment
    );

    // Predict completion probability based on progress patterns
    let completionProbability = 0;
    if (overallPercentage >= 90) completionProbability = 95;
    else if (overallPercentage >= 75) completionProbability = 80;
    else if (overallPercentage >= 50) completionProbability = 60;
    else if (overallPercentage >= 25) completionProbability = 35;
    else completionProbability = 15;

    // Adjust based on time factors (simulated)
    const timeFactor = this.analyzeTimePatterns(userData.createdAt);
    completionProbability = Math.min(95, completionProbability + timeFactor);

    // Predict timeline
    const predictedTimeline = this.predictTimeline(overallPercentage, completionProbability);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(applicationData, overallPercentage);

    // Generate recommendations
    const recommendations = this.generateRecommendations(applicationData, riskFactors);

    return {
      overallPercentage,
      completionProbability,
      predictedTimeline,
      riskFactors,
      recommendations,
      sectionProgress: {
        personalInfo,
        academicBackground,
        documents,
        programSelection,
        payment
      },
      lastUpdated: new Date()
    };
  }

  private static analyzeTimePatterns(createdAt: string): number {
    // Simulate time pattern analysis
    const daysSinceCreation = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600 * 24);
    
    if (daysSinceCreation < 7) return 10; // New application bonus
    if (daysSinceCreation > 30) return -15; // Stale application penalty
    return 0;
  }

  private static predictTimeline(progress: number, probability: number): string {
    if (progress >= 90) return '1-3 days';
    if (progress >= 70) return '3-7 days';
    if (progress >= 50) return '1-2 weeks';
    if (progress >= 30) return '2-3 weeks';
    return '3-4 weeks';
  }

  private static identifyRiskFactors(applicationData: any, overallProgress: number): string[] {
    const risks: string[] = [];

    if (applicationData.documents < 50) {
      risks.push('Document submission incomplete');
    }

    if (applicationData.personalInfo < 80) {
      risks.push('Personal information needs completion');
    }

    if (applicationData.academicBackground < 60) {
      risks.push('Academic history requires more details');
    }

    if (overallProgress < 30) {
      risks.push('Low overall progress may delay review');
    }

    // Simulate ML-detected patterns
    if (Math.random() > 0.7) {
      risks.push('Consider verifying contact information');
    }

    return risks.slice(0, 3); // Return top 3 risks
  }

  private static generateRecommendations(applicationData: any, risks: string[]): string[] {
    const recommendations: string[] = [];

    if (applicationData.documents < 70) {
      recommendations.push('Upload required documents to speed up processing');
    }

    if (applicationData.personalInfo < 100) {
      recommendations.push('Complete personal information section');
    }

    if (applicationData.academicBackground < 80) {
      recommendations.push('Fill in academic background details');
    }

    if (risks.includes('Document submission incomplete')) {
      recommendations.push('Prioritize document upload for faster review');
    }

    // AI-powered suggestions
    recommendations.push('Review all sections for accuracy before submission');
    recommendations.push('Ensure documents meet quality requirements');

    return recommendations.slice(0, 4); // Return top 4 recommendations
  }
}

export default function DashboardPage() {
  const [progress, setProgress] = useState<ApplicationProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldLoadProgress, setShouldLoadProgress] = useState(false);

  useEffect(() => {
    // Check if we should load progress - wait a bit for header to establish auth
    const timer = setTimeout(() => {
      // Check localStorage for user data
      const user = localStorage.getItem('user');
      if (user) {
        setShouldLoadProgress(true);
        loadUserProgress();
      } else {
        // No user found, still load but with minimal/default data
        loadUserProgress();
      }
    }, 300); // Reduced delay to 300ms

    return () => clearTimeout(timer);
  }, []);

  const loadUserProgress = async () => {
    try {
      setLoading(true);
      
      // Get user from localStorage (if available)
      const localUser = localStorage.getItem('user');
      let user = null;
      
      if (localUser) {
        try {
          user = JSON.parse(localUser);
        } catch (err) {
          console.error('Invalid user data in localStorage:', err);
        }
      }

      // Default application data for demo/demo user
      const applicationData = {
        personalInfo: user ? 75 : 0,
        academicBackground: user ? 60 : 0,
        documents: user ? 40 : 0,
        programSelection: 0,
        payment: 0
      };

      // Default user data for demo
      const userData = user || {
        id: 'demo',
        email: 'guest@example.com',
        name: 'Guest User',
        createdAt: new Date().toISOString(),
        role: 'guest'
      };

      const progressPrediction = await MLProgressService.predictProgress(userData, applicationData);
      setProgress(progressPrediction);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <ProgressIndicator currentStep={1} />

      {/* Welcome Section */}
      <div className="mb-8 w-full max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl text-green-900 font-bold mb-2">
          Welcome to Mzuzu University Applications Portal
        </h1>
        <p className="text-gray-500 text-base sm:text-lg">
          Access and manage your application easily through this portal.
        </p>
      </div>

      {/* ML Progress Analytics - Always show when we have progress data */}
      {progress && (
        <div className="mb-8 w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">AI Progress Analytics</h2>
              <span className="text-xs text-gray-500 ml-auto">
                Updated: {progress.lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Overall Progress */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-700">Overall Progress</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {progress.overallPercentage}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getProgressBarColor(progress.overallPercentage)}`}
                    style={{ width: `${progress.overallPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Completion Probability */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-700">Completion Chance</h3>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {progress.completionProbability}%
                </div>
                <div className="text-sm text-gray-600">
                  Based on current progress
                </div>
              </div>

              {/* Predicted Timeline */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-700">Est. Timeline</h3>
                </div>
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {progress.predictedTimeline}
                </div>
                <div className="text-sm text-gray-600">
                  To complete application
                </div>
              </div>

              {/* Risk Level */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-gray-700">Risk Factors</h3>
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {progress.riskFactors.length}
                </div>
                <div className="text-sm text-gray-600">
                  Needs attention
                </div>
              </div>
            </div>

            {/* Detailed Section Progress */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-4">Section Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(progress.sectionProgress).map(([section, percentage]) => (
                  <div key={section} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {section.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${getProgressColor(percentage)}`}>
                        {percentage}%
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressBarColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            {progress.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-yellow-600" />
                  AI Recommendations
                </h3>
                <ul className="space-y-2">
                  {progress.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Submission Section */}
      <div className="mb-8 w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl sm:text-3xl text-green-900 font-bold mb-2">
            Application Submission
          </h2>
          <p className="text-gray-500 text-base sm:text-lg mb-4">
            {progress && progress.overallPercentage > 0 ? (
              <>
                Your application is <span className="font-semibold text-green-600">{progress.overallPercentage}%</span> complete.
                <br />
                Continue where you left off to complete your submission.
              </>
            ) : (
              <>
                It looks like you have not yet started your <br className="sm:hidden" />
                application process. Please submit the details after you fill them.
              </>
            )}
          </p>

          {/* Button */}
          <div className="w-full sm:w-auto flex justify-start">
            <Button
              type="button"
              title={progress && progress.overallPercentage > 0 ? "Continue Application" : "Apply Now"}
              icon=""
              variant="bg-teal-800"
              href="/application/select-type"
            />
          </div>

          {/* Quick Stats */}
          {progress && progress.overallPercentage > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Est. completion: {progress.predictedTimeline}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Success probability: {progress.completionProbability}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Risk Factors Alert */}
      {progress && progress.riskFactors.length > 0 && (
        <div className="mb-8 w-full max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Areas Needing Attention
            </h3>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {progress.riskFactors.map((risk, index) => (
                <li key={index}>{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}