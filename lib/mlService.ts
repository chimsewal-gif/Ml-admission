// lib/mlService.ts
export interface MLPrediction {
    decision: 'approve' | 'reject' | 'review';
    confidence: number;
    reasons: string[];
    risk_factors?: string[];
    processed_at: string;
  }
  
  export interface ApplicationFeatures {
    programme: string;
    applicant_name: string;
    submitted_at: string;
    content_features?: {
      completeness_score: number;
      relevance_score: number;
      quality_indicators: string[];
      risk_indicators: string[];
    };
  }
  
  class MLService {
    private async extractFeatures(application: any): Promise<ApplicationFeatures> {
      return {
        programme: application.programme,
        applicant_name: application.applicant_name,
        submitted_at: application.submitted_at,
        content_features: await this.analyzeContent(application)
      };
    }
  
    private async analyzeContent(application: any) {
      let completeness_score = 0;
      let relevance_score = 0;
      const quality_indicators: string[] = [];
      const risk_indicators: string[] = [];
  
      // Check completeness based on available fields
      const requiredFields = ['applicant_name', 'programme', 'reference_number'];
      const filledFields = requiredFields.filter(field => application[field] && application[field].trim().length > 0);
      completeness_score = (filledFields.length / requiredFields.length) * 100;
  
      // Analyze programme relevance
      const programme = application.programme.toLowerCase();
      if (programme.includes('computer') || programme.includes('technology') || programme.includes('engineering')) {
        relevance_score = 85;
        quality_indicators.push('High-demand technical field');
      } else if (programme.includes('business') || programme.includes('management') || programme.includes('administration')) {
        relevance_score = 75;
        quality_indicators.push('Business-related field');
      } else if (programme.includes('health') || programme.includes('medical') || programme.includes('nursing')) {
        relevance_score = 80;
        quality_indicators.push('Healthcare field');
      } else {
        relevance_score = 60;
        risk_indicators.push('Less common programme field');
      }
  
      // Check application quality indicators
      if (application.applicant_name && application.applicant_name.length > 5) {
        quality_indicators.push('Complete applicant name');
      } else {
        risk_indicators.push('Short or incomplete name');
      }
  
      if (application.reference_number && application.reference_number.length > 3) {
        quality_indicators.push('Valid reference number');
      } else {
        risk_indicators.push('Missing or short reference');
      }
  
      // Time-based analysis (applications submitted during business hours might be better)
      const submitDate = new Date(application.submitted_at);
      const hour = submitDate.getHours();
      if (hour >= 9 && hour <= 17) {
        quality_indicators.push('Submitted during business hours');
      } else {
        risk_indicators.push('Submitted outside business hours');
      }
  
      return {
        completeness_score,
        relevance_score,
        quality_indicators,
        risk_indicators
      };
    }
  
    public async predictApplication(application: any): Promise<MLPrediction> {
      try {
        const features = await this.extractFeatures(application);
        
        // Try to call actual ML model first, fallback to mock
        try {
          // Uncomment when you have actual ML endpoint
          // return await this.callMLModel(features);
        } catch (error) {
          console.log('ML model unavailable, using rule-based prediction');
        }
        
        return await this.ruleBasedPrediction(features);
      } catch (error) {
        console.error('ML prediction error:', error);
        return {
          decision: 'review',
          confidence: 0,
          reasons: ['ML service unavailable - requires manual review'],
          processed_at: new Date().toISOString()
        };
      }
    }
  
    private async ruleBasedPrediction(features: ApplicationFeatures): Promise<MLPrediction> {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing time
  
      const completeness = features.content_features?.completeness_score || 0;
      const relevance = features.content_features?.relevance_score || 0;
      const qualityIndicators = features.content_features?.quality_indicators || [];
      const riskIndicators = features.content_features?.risk_indicators || [];
      
      let decision: 'approve' | 'reject' | 'review' = 'review';
      let confidence = 0;
      const reasons: string[] = [];
  
      // Decision matrix based on scores and indicators
      const totalScore = (completeness * 0.6) + (relevance * 0.4);
      const riskRatio = riskIndicators.length / (qualityIndicators.length + riskIndicators.length || 1);
  
      if (totalScore >= 85 && riskRatio < 0.2) {
        decision = 'approve';
        confidence = 0.88 + (Math.random() * 0.08); // 0.88-0.96
        reasons.push('Excellent application score');
        reasons.push('Strong quality indicators');
      } else if (totalScore >= 75 && riskRatio < 0.3) {
        decision = 'approve';
        confidence = 0.78 + (Math.random() * 0.08); // 0.78-0.86
        reasons.push('Good application score');
        reasons.push('Acceptable risk profile');
      } else if (totalScore < 50 || riskRatio > 0.6) {
        decision = 'reject';
        confidence = 0.82 + (Math.random() * 0.10); // 0.82-0.92
        reasons.push('Low application score');
        reasons.push('High risk indicators');
      } else if (totalScore < 65 || riskRatio > 0.4) {
        decision = 'reject';
        confidence = 0.72 + (Math.random() * 0.08); // 0.72-0.80
        reasons.push('Below threshold score');
        reasons.push('Moderate risk indicators');
      } else {
        decision = 'review';
        confidence = 0.65 + (Math.random() * 0.10); // 0.65-0.75
        reasons.push('Borderline application');
        reasons.push('Requires human assessment');
      }
  
      // Add specific reasons from analysis
      if (completeness >= 90) {
        reasons.push('High completeness');
      } else if (completeness < 70) {
        reasons.push('Low completeness');
      }
  
      if (relevance >= 80) {
        reasons.push('High relevance');
      } else if (relevance < 60) {
        reasons.push('Low relevance');
      }
  
      return { 
        decision, 
        confidence: Math.round(confidence * 100) / 100, 
        reasons, 
        risk_factors: riskIndicators,
        processed_at: new Date().toISOString()
      };
    }
  
    // Method to call actual ML API
    private async callMLModel(features: ApplicationFeatures): Promise<MLPrediction> {
      // Example implementation for actual ML endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_ML_API_URL}/predict`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ML_API_TOKEN}`
        },
        body: JSON.stringify({
          programme: features.programme,
          applicant_name: features.applicant_name,
          features: features.content_features
        })
      });
      
      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        decision: result.prediction,
        confidence: result.confidence,
        reasons: result.explanations || ['ML model decision'],
        risk_factors: result.risks || [],
        processed_at: new Date().toISOString()
      };
    }
  
    // Method to get batch predictions
    public async batchPredict(applications: any[]): Promise<Map<number, MLPrediction>> {
      const predictions = new Map<number, MLPrediction>();
      
      for (const application of applications) {
        try {
          const prediction = await this.predictApplication(application);
          predictions.set(application.id, prediction);
        } catch (error) {
          console.error(`Failed to predict application ${application.id}:`, error);
          predictions.set(application.id, {
            decision: 'review',
            confidence: 0,
            reasons: ['Prediction failed'],
            processed_at: new Date().toISOString()
          });
        }
      }
      
      return predictions;
    }
  }
  
  export const mlService = new MLService();