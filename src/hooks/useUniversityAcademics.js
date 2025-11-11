// src/hooks/useUniversityAcademics.js
import { useState, useEffect } from 'react';
import { API } from '@/lib/api';

export const useUniversityAcademics = (universityId) => {
  const [degreeLevels, setDegreeLevels] = useState([]);
  const [fields, setFields] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState({
    degreeLevels: false,
    fields: false,
    programs: false
  });
  const [error, setError] = useState(null);

  // Fetch degree levels when university changes
  useEffect(() => {
    if (!universityId) {
      setDegreeLevels([]);
      setFields([]);
      setPrograms([]);
      return;
    }

    const fetchDegreeLevels = async () => {
      setLoading(prev => ({ ...prev, degreeLevels: true }));
      setError(null);
      
      try {
        const response = await fetch(`${API.baseURL}/api/universities/${universityId}/degree-levels`);
        if (!response.ok) {
          throw new Error('Failed to fetch degree levels');
        }
        const data = await response.json();
        setDegreeLevels(data.degreeLevels || []);
        
        // Clear dependent fields
        setFields([]);
        setPrograms([]);
      } catch (err) {
        console.error('Error fetching degree levels:', err);
        setError(err.message);
        setDegreeLevels([]);
      } finally {
        setLoading(prev => ({ ...prev, degreeLevels: false }));
      }
    };

    fetchDegreeLevels();
  }, [universityId]);

  // Function to fetch fields for a specific degree level
  const fetchFields = async (degreeLevel) => {
    if (!universityId || !degreeLevel) {
      setFields([]);
      setPrograms([]);
      return;
    }

    setLoading(prev => ({ ...prev, fields: true }));
    setError(null);

    try {
      const response = await fetch(
        `${API.baseURL}/api/universities/${universityId}/fields?degreeLevel=${encodeURIComponent(degreeLevel)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch fields');
      }
      const data = await response.json();
      setFields(data.fields || []);
      
      // Clear dependent programs
      setPrograms([]);
    } catch (err) {
      console.error('Error fetching fields:', err);
      setError(err.message);
      setFields([]);
    } finally {
      setLoading(prev => ({ ...prev, fields: false }));
    }
  };

  // Function to fetch programs for a specific degree level and field
  const fetchPrograms = async (degreeLevel, field) => {
    if (!universityId || !degreeLevel || !field) {
      setPrograms([]);
      return;
    }

    setLoading(prev => ({ ...prev, programs: true }));
    setError(null);

    try {
      const response = await fetch(
        `${API.baseURL}/api/universities/${universityId}/programs?degreeLevel=${encodeURIComponent(degreeLevel)}&field=${encodeURIComponent(field)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      setPrograms(data.programs || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err.message);
      setPrograms([]);
    } finally {
      setLoading(prev => ({ ...prev, programs: false }));
    }
  };

  return {
    degreeLevels,
    fields,
    programs,
    loading,
    error,
    fetchFields,
    fetchPrograms
  };
};

// Generate month/year options (keeping this utility function)
export const generateMonthYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const years = [];
  for (let year = currentYear; year <= currentYear + 10; year++) {
    years.push({ value: year.toString(), label: year.toString() });
  }

  return { months, years };
};