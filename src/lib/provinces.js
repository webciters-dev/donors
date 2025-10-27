// src/lib/provinces.js
// Pakistani Provinces and Administrative Regions

export const PAKISTANI_PROVINCES = [
  'Punjab',
  'Sindh', 
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
  'Islamabad Capital Territory'
];

// Alternative names/abbreviations that users might use
export const PROVINCE_ALIASES = {
  'KPK': 'Khyber Pakhtunkhwa',
  'GB': 'Gilgit-Baltistan',
  'AJK': 'Azad Jammu & Kashmir',
  'ICT': 'Islamabad Capital Territory',
  'Islamabad': 'Islamabad Capital Territory',
  'Kashmir': 'Azad Jammu & Kashmir',
  'FATA': 'Khyber Pakhtunkhwa' // Former FATA merged with KPK
};

// Helper function to normalize province names
export const normalizeProvinceName = (province) => {
  if (!province) return '';
  
  const trimmed = province.trim();
  
  // Check if it's an alias
  if (PROVINCE_ALIASES[trimmed]) {
    return PROVINCE_ALIASES[trimmed];
  }
  
  // Check if it's already a valid province name
  if (PAKISTANI_PROVINCES.includes(trimmed)) {
    return trimmed;
  }
  
  // Return as-is if not found (for flexibility)
  return trimmed;
};

// Helper function to get province options for dropdowns
export const getProvinceOptions = () => {
  return PAKISTANI_PROVINCES.map(province => ({
    value: province,
    label: province
  }));
};

// Helper function to validate province
export const isValidProvince = (province) => {
  if (!province) return false;
  const normalized = normalizeProvinceName(province);
  return PAKISTANI_PROVINCES.includes(normalized);
};