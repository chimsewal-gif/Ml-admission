export interface CommitteeMember {
    id: string;
    name: string;
    email: string;
    role: 'chair' | 'vice-chair' | 'member' | 'secretary';
    department: string;
    status: 'active' | 'inactive';
    assignedApplicants: number;
    reviewedCount: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Applicant {
    id: string;
    name: string;
    email: string;
    phone: string;
    program: string;
    submissionDate: string;
    status: 'pending' | 'reviewing' | 'completed' | 'accepted' | 'rejected';
    averageScore: number;
    documents: Document[];
  }
  
  export interface Document {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadDate: string;
  }
  
  export interface Evaluation {
    id: string;
    applicantId: string;
    evaluatorId: string;
    scores: {
      academic: number;
      experience: number;
      interview: number;
      recommendations: number;
    };
    totalScore: number;
    comments: string;
    status: 'draft' | 'submitted';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Report {
    id: string;
    type: string;
    dateRange: {
      start: string;
      end: string;
    };
    data: any;
    createdAt: string;
  }