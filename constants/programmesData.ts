// programmesData.ts
// Mzuzu University Programmes Data 2026/27

export interface ProgrammeData {
    name: string;
    description: string;
    department: string;
    duration: string;
    category: string;
    code: string;
    is_active: boolean;
  }
  
  // Programmes from Mzuzu University Prospectus 2026/27
  export const MZUNI_PROGRAMMES: ProgrammeData[] = [
    // ==================== FACULTY OF EDUCATION ====================
    // Upgrading Programmes (Face-to-Face)
    {
      name: "Bachelor of Education (Arts) - Upgrading (2 Years)",
      description: "For diploma in Education holders. Must be qualified to teach History, Geography, Bible Knowledge, Chichewa or French.",
      department: "Faculty of Education",
      duration: "2 Years",
      category: "upgrading",
      code: "MZU-BEdA-UP2",
      is_active: true
    },
    {
      name: "Bachelor of Education (Arts) - Upgrading (4 Years)",
      description: "For T2 Teaching Certificate holders. Must be ready to teach History, Geography or Bible Knowledge.",
      department: "Faculty of Education",
      duration: "4 Years",
      category: "upgrading",
      code: "MZU-BEdA-UP4",
      is_active: true
    },
    {
      name: "Bachelor of Education (Languages) - Upgrading (2 Years)",
      description: "For diploma in Education holders. Must be qualified to teach English, Chichewa or French.",
      department: "Faculty of Education",
      duration: "2 Years",
      category: "upgrading",
      code: "MZU-BEdL-UP2",
      is_active: true
    },
    {
      name: "Bachelor of Education (Languages) - Upgrading (4 Years)",
      description: "For T2 Teaching Certificate holders. Must be ready to teach English, Chichewa or French.",
      department: "Faculty of Education",
      duration: "4 Years",
      category: "upgrading",
      code: "MZU-BEdL-UP4",
      is_active: true
    },
  
    // ODeL Programmes
    {
      name: "Bachelor of Education (Arts) - ODeL",
      description: "Must have MSCE with 6 credits including English and any three from Geography, History, French, Bible Knowledge, Chichewa, Social Studies.",
      department: "Faculty of Education",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BEdA-ODL",
      is_active: true
    },
    {
      name: "Bachelor of Education (Languages) - ODeL",
      description: "Must have MSCE with 6 credits including English, Chichewa or French, and any two from Geography, History, Bible Knowledge.",
      department: "Faculty of Education",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BEdL-ODL",
      is_active: true
    },
    {
      name: "Bachelor of Education (Science) - ODeL",
      description: "Must have MSCE with 6 credits including English, Biology, Mathematics, Chemistry and Physics.",
      department: "Faculty of Education",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BEdSc-ODL",
      is_active: true
    },
    {
      name: "University Certificate in Education (UCE)",
      description: "For diploma holders in any field. Must be able to teach two subjects in secondary schools.",
      department: "Faculty of Education",
      duration: "1 Year",
      category: "certificate",
      code: "MZU-UCE",
      is_active: true
    },
  
    // Economic Fees Programmes
    {
      name: "Bachelor of Education (Languages) - Economic Fees",
      description: "MSCE with 6 credits including English, Chichewa or French. Limited spaces: 30",
      department: "Faculty of Education",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BEdL-EF",
      is_active: true
    },
    {
      name: "Bachelor of Education (Arts) - Economic Fees",
      description: "MSCE with 6 credits including English and any three humanities. Limited spaces: 30",
      department: "Faculty of Education",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BEdA-EF",
      is_active: true
    },
    {
      name: "Bachelor of Education (Science) - Economic Fees",
      description: "MSCE with 6 credits including English, Biology, Mathematics. Limited spaces: 30",
      department: "Faculty of Education",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BEdSc-EF",
      is_active: true
    },
  
    // ==================== FACULTY OF HUMANITIES AND SOCIAL SCIENCES ====================
    // Upgrading Programmes
    {
      name: "Bachelor of Arts (Theology and Religious Studies) - Upgrading",
      description: "For diploma in Theology holders. Must have credits in English and Bible Knowledge or History.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "2 Years",
      category: "upgrading",
      code: "MZU-BTRS-UP",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Security Studies) - Upgrading (4 Years)",
      description: "For MSCE holders with 2+ years security service experience. Must have credits in English and Mathematics.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "upgrading",
      code: "MZU-BSS-UP4",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Security Studies) - Upgrading (2 Years)",
      description: "For diploma holders in Peace and Security Studies. Must have 2+ years security experience.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "2 Years",
      category: "upgrading",
      code: "MZU-BSS-UP2",
      is_active: true
    },
  
    // Weekend Release Programmes
    {
      name: "Bachelor of Arts (Communication Studies)",
      description: "Must have MSCE with 6 credits including English and a pass in Mathematics.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BACOS",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Communication Studies) - Upgrading",
      description: "For diploma holders in Communication Studies, Public Relations, Journalism. Must have credits in English.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BACOS-UP",
      is_active: true
    },
    {
      name: "Bachelor of Library and Information Science",
      description: "Must have MSCE with 6 credits including English and any two from History, Geography, Chichewa, French.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BLIS",
      is_active: true
    },
    {
      name: "Bachelor of Library and Information Science - Upgrading",
      description: "For diploma holders in Library Science, Records Management. Must have credits in English.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BLIS-UP",
      is_active: true
    },
    {
      name: "Bachelor of Arts (History and Heritage Studies)",
      description: "Must have MSCE with 6 credits including English, History, and any two from Geography, Bible Knowledge.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BHHS",
      is_active: true
    },
  
    // ODeL Programmes
    {
      name: "Bachelor of Arts (Communication Studies) - ODeL",
      description: "For diploma holders in Communication Studies, Public Relations, Journalism. Must have credits in English.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "3 Years",
      category: "odl",
      code: "MZU-BACOS-ODL",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Theology and Religious Studies) - ODeL",
      description: "Must have MSCE with 6 credits including English, Bible Knowledge or History.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BTRS-ODL",
      is_active: true
    },
    {
      name: "Bachelor of Arts (History and Heritage Studies) - ODeL",
      description: "Must have MSCE with 6 credits including English, History, and any two from Geography, Bible Knowledge.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BHHS-ODL",
      is_active: true
    },
    {
      name: "Bachelor of Library and Information Science - ODeL",
      description: "Must have MSCE with 6 credits including English and any two from History, Geography, Chichewa, French.",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BLIS-ODL",
      is_active: true
    },
  
    // Economic Fees Programmes
    {
      name: "Bachelor of Arts (Politics and Governance)",
      description: "MSCE with 6 credits in English, Mathematics and any two humanities. Limited spaces: 3",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BPOL",
      is_active: true
    },
    {
      name: "Bachelor of Arts (International Relations and Diplomacy)",
      description: "MSCE with 6 credits in English, Mathematics and any two humanities. Limited spaces: 3",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BIRD",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Development Studies)",
      description: "MSCE with 6 credits in English, Mathematics and any two humanities. Limited spaces: 3",
      department: "Faculty of Humanities and Social Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BDEV",
      is_active: true
    },
  
    // ==================== FACULTY OF ENVIRONMENTAL SCIENCES ====================
    // Upgrading Programmes
    {
      name: "Bachelor of Science (Forestry) - Upgrading (3 Years)",
      description: "For certificate holders in Forestry or Agriculture. Must have credits in English, Biology, Mathematics.",
      department: "Faculty of Environmental Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BSCF-UP3",
      is_active: true
    },
    {
      name: "Bachelor of Science (Forestry) - Upgrading (2 Years)",
      description: "For diploma holders in Forestry or Agriculture. Must have credits in English, Biology, Mathematics.",
      department: "Faculty of Environmental Sciences",
      duration: "2 Years",
      category: "upgrading",
      code: "MZU-BSCF-UP2",
      is_active: true
    },
    {
      name: "Bachelor of Science (Fisheries and Aquatic Sciences) - Upgrading (4 Years)",
      description: "For certificate holders in Fisheries/Agriculture. Must have credits in English, Biology, Physical Science, Mathematics.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "upgrading",
      code: "MZU-BSFS-UP4",
      is_active: true
    },
    {
      name: "Bachelor of Science (Fisheries and Aquatic Sciences) - Upgrading (3 Years)",
      description: "For diploma holders in Fisheries Science. Must have credits in English, Biology, Mathematics.",
      department: "Faculty of Environmental Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BSFS-UP3",
      is_active: true
    },
    {
      name: "Bachelor of Science in Land Surveying - Upgrading (4 Years)",
      description: "For certificate holders in Land Administration/Surveying. Must have credits in Mathematics, Geography, English.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "upgrading",
      code: "MZU-BSLS-UP4",
      is_active: true
    },
    {
      name: "Bachelor of Science in Land Surveying - Upgrading (3 Years)",
      description: "For diploma holders in Land Administration/Surveying. Must have credits in English, Mathematics, Geography.",
      department: "Faculty of Environmental Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BSLS-UP3",
      is_active: true
    },
    {
      name: "Bachelor of Science in Estate Management - Upgrading (4 Years)",
      description: "For certificate holders in Land Administration/Property. Must have credits in English, Mathematics, Geography.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "upgrading",
      code: "MZU-BSEM-UP4",
      is_active: true
    },
    {
      name: "Bachelor of Science in Estate Management - Upgrading (3 Years)",
      description: "For diploma holders in Land Administration/Property. Must have credits in English, Mathematics, Geography.",
      department: "Faculty of Environmental Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BSEM-UP3",
      is_active: true
    },
    {
      name: "Bachelor of Science in Town Planning - Upgrading (4 Years)",
      description: "For certificate holders in Land Administration/Planning. Must have credits in English, Mathematics, Geography.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "upgrading",
      code: "MZU-BSTRP-UP4",
      is_active: true
    },
    {
      name: "Bachelor of Science in Town Planning - Upgrading (3 Years)",
      description: "For diploma holders in Land Administration/Planning. Must have credits in English, Mathematics, Geography.",
      department: "Faculty of Environmental Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BSTRP-UP3",
      is_active: true
    },
    {
      name: "Bachelor of Science (Water Resources Engineering and Management) - Upgrading",
      description: "For diploma holders in Hydrology, Civil Engineering, Agriculture. Must have credits in Mathematics, Physical Science, English.",
      department: "Faculty of Environmental Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BSWREM-UP",
      is_active: true
    },
    {
      name: "Bachelor of Science in Transformative Community Development - Upgrading",
      description: "For diploma holders in Community Development, Agriculture Education, Rural Development.",
      department: "Faculty of Environmental Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BTCD-UP",
      is_active: true
    },
    {
      name: "Bachelor of Science in Value Chain Agriculture - Upgrading",
      description: "For diploma holders in Agriculture, Agribusiness, Marketing. Must have credits in English, Mathematics, Biology.",
      department: "Faculty of Environmental Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BVCA-UP",
      is_active: true
    },
  
    // Undergraduate Programmes
    {
      name: "Bachelor of Science (Forestry)",
      description: "MSCE with 6 credits including English, Biology, Mathematics and any three science-related subjects.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSCF",
      is_active: true
    },
    {
      name: "Bachelor of Science (Fisheries and Aquatic Sciences)",
      description: "MSCE with 6 credits in Biology, Physical Science, Mathematics, English and any two credits.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSFS",
      is_active: true
    },
    {
      name: "Bachelor of Science in Land Surveying",
      description: "MSCE with 6 credits including Mathematics, Geography, English, Physical Science.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSLS",
      is_active: true
    },
    {
      name: "Bachelor of Science in Estate Management",
      description: "MSCE with 6 credits including Agriculture, English, Geography, Mathematics.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSEM",
      is_active: true
    },
    {
      name: "Bachelor of Science in Town and Regional Planning",
      description: "MSCE with 6 credits in Mathematics, Geography, Agriculture, English.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSTRP",
      is_active: true
    },
    {
      name: "Bachelor of Science (Water Resources Engineering and Management)",
      description: "MSCE with 6 credits including Mathematics, Physical Science, English.",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSWREM",
      is_active: true
    },
  
    // Economic Fees Programmes
    {
      name: "Bachelor of Science (Forestry) - Economic Fees",
      description: "MSCE with 6 credits including English, Biology, Mathematics. Limited spaces: 30",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSCF-EF",
      is_active: true
    },
    {
      name: "Bachelor of Science (Fisheries and Aquatic Sciences) - Economic Fees",
      description: "MSCE with 6 credits in Biology, Physical Science, Mathematics, English. Limited spaces: 10",
      department: "Faculty of Environmental Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSFS-EF",
      is_active: true
    },
  
    // ==================== FACULTY OF HEALTH SCIENCES ====================
    {
      name: "Bachelor of Science (Honours) Biomedical Laboratory Science - Upgrading",
      description: "For diploma holders in Biomedical Sciences. Must have credits in English, Biology, Chemistry, Mathematics.",
      department: "Faculty of Health Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BBLS-UP",
      is_active: true
    },
    {
      name: "Bachelor of Science (Honours) in Optometry - Upgrading",
      description: "For diploma holders in Optometry. Must have credits in English, Mathematics, Chemistry, Physics, Biology.",
      department: "Faculty of Health Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BOPT-UP",
      is_active: true
    },
    {
      name: "Bachelor of Science in Nursing and Midwifery - Upgrading",
      description: "For diploma holders in Nursing. Must be registered with Nurses and Midwives Council of Malawi.",
      department: "Faculty of Health Sciences",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BSNM-UP",
      is_active: true
    },
    {
      name: "Bachelor of Science in Nursing and Midwifery",
      description: "MSCE with 6 credits including English, Mathematics, Chemistry, Physics, Biology. Limited spaces: 20",
      department: "Faculty of Health Sciences",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSNM",
      is_active: true
    },
  
    // ==================== FACULTY OF TOURISM, HOSPITALITY AND MANAGEMENT ====================
    // Upgrading Programmes
    {
      name: "Bachelor of Business (Tourism Management) - Upgrading",
      description: "For diploma holders in Travel/Tourism Management. Must have credits in English and Mathematics.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BBTM-UP",
      is_active: true
    },
    {
      name: "Bachelor of Hospitality Management - Upgrading",
      description: "For diploma holders in Hospitality Management, Culinary Arts, Food Production. Must have credits in English and Mathematics.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BHM-UP",
      is_active: true
    },
    {
      name: "Bachelor of Culinary Arts - Upgrading",
      description: "For diploma holders in Culinary Arts, Food Production, Hospitality Management. Must have credits in English and Mathematics.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BCA-UP",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Culture and Heritage Tourism) - Upgrading",
      description: "For diploma holders in Cultural Heritage Management, Conservation, Cultural Tourism.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BCHT-UP",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Sports Management) - Upgrading",
      description: "For diploma holders in Physical Education or Sports Management. Must have credits in English.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-BSM-UP",
      is_active: true
    },
  
    // Undergraduate Programmes
    {
      name: "Bachelor of Business (Tourism Management)",
      description: "Must have MSCE with 6 credits including English and Mathematics.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BBTM",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Culture and Heritage Tourism)",
      description: "Must have MSCE with 6 credits including English.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BCHT",
      is_active: true
    },
    {
      name: "Bachelor of Hospitality Management",
      description: "Must have MSCE with 6 credits including English and Mathematics.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BHM",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Sports Management)",
      description: "Must have MSCE with 6 credits including English. Exit with Diploma after 2 years.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSM",
      is_active: true
    },
  
    // ODeL Programmes
    {
      name: "Bachelor of Business (Tourism Management) - ODeL",
      description: "Must have MSCE with 6 credits including English and Mathematics.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BBTM-ODL",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Culture and Heritage Tourism) - ODeL",
      description: "Must have MSCE with 6 credits including English.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BCHT-ODL",
      is_active: true
    },
    {
      name: "Bachelor of Hospitality Management - ODeL",
      description: "Must have MSCE with 6 credits including English and Mathematics.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BHM-ODL",
      is_active: true
    },
    {
      name: "Bachelor of Arts (Sports Management) - ODeL",
      description: "Must have MSCE with 6 credits including English and Mathematics.",
      department: "Faculty of Tourism, Hospitality and Management",
      duration: "4 Years",
      category: "odl",
      code: "MZU-BSM-ODL",
      is_active: true
    },
  
    // ==================== FACULTY OF SCIENCE, TECHNOLOGY AND INNOVATION ====================
    // Weekend Release Programmes
    {
      name: "Bachelor of Science in Information and Communication Technology",
      description: "Must have MSCE with 6 credits including English, Mathematics, and any two sciences.",
      department: "Faculty of Science, Technology and Innovation",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-ICT",
      is_active: true
    },
    {
      name: "Bachelor of Science in Information and Communication Technology (Upgrading)",
      description: "For diploma holders in ICT. Must have credits in English and Mathematics.",
      department: "Faculty of Science, Technology and Innovation",
      duration: "3 Years",
      category: "upgrading",
      code: "MZU-ICT-UP",
      is_active: true
    },
    {
      name: "Bachelor of Science in Data Science",
      description: "Must have MSCE with 6 credits including English, Mathematics, and any two science subjects.",
      department: "Faculty of Science, Technology and Innovation",
      duration: "4 Years",
      category: "undergraduate",
      code: "MZU-BSDS",
      is_active: true
    },
    {
      name: "Bachelor of Science (Honours) in Renewable Energy Systems Engineering",
      description: "MSCE with 6 credits in English, Mathematics, Physics, Chemistry. Limited spaces: 10",
      department: "Faculty of Science, Technology and Innovation",
      duration: "5 Years",
      category: "undergraduate",
      code: "MZU-BRESE",
      is_active: true
    }
  ];
  
  // Export helper functions
  export const getProgrammesByCategory = (category: string) => {
    return MZUNI_PROGRAMMES.filter(p => p.category === category);
  };
  
  export const getProgrammesByDepartment = (department: string) => {
    return MZUNI_PROGRAMMES.filter(p => p.department === department);
  };
  
  export const getProgrammeByCode = (code: string) => {
    return MZUNI_PROGRAMMES.find(p => p.code === code);
  };
  
  export const getAllCategories = () => {
    const categories = new Set(MZUNI_PROGRAMMES.map(p => p.category));
    return Array.from(categories);
  };
  
  export const getAllDepartments = () => {
    const departments = new Set(MZUNI_PROGRAMMES.map(p => p.department));
    return Array.from(departments);
  };
  
  export const getProgrammesCount = () => {
    return {
      total: MZUNI_PROGRAMMES.length,
      undergraduate: MZUNI_PROGRAMMES.filter(p => p.category === 'undergraduate').length,
      upgrading: MZUNI_PROGRAMMES.filter(p => p.category === 'upgrading').length,
      odl: MZUNI_PROGRAMMES.filter(p => p.category === 'odl').length,
      certificate: MZUNI_PROGRAMMES.filter(p => p.category === 'certificate').length
    };
  };