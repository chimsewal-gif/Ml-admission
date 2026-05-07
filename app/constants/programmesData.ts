// constants/programmesData.ts
export interface ProgrammeData {
  name: string;
  description: string;
  department: string;
  duration: string;
  category: string;
  code: string;
  is_active: boolean;
  programme_type?: string;
  study_mode?: string;
  school?: string;
  entry_requirements?: string;
  quota?: number;
}

// Import the new programmes from your admission documents
import { MZUZU_PROGRAMMES_FROM_PROSPECTUS } from './programmesImportData';

// Use the imported programmes
export const MZUNI_PROGRAMMES: ProgrammeData[] = MZUZU_PROGRAMMES_FROM_PROSPECTUS;

// Helper function to get counts
export const getProgrammesCount = () => {
  return {
    total: MZUNI_PROGRAMMES.length,
    upgrading: MZUNI_PROGRAMMES.filter(p => p.programme_type === 'upgrading').length,
    generic: MZUNI_PROGRAMMES.filter(p => p.programme_type === 'generic').length,
    nonGeneric: MZUNI_PROGRAMMES.filter(p => p.programme_type === 'non-generic').length,
  };
};