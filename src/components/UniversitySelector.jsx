// src/components/UniversitySelector.jsx
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { API } from "@/lib/api";

/**
 * UniversitySelector - A reusable component for university selection
 * Supports both dropdown for official universities and custom university input
 * 
 * Props:
 * - country: The country to filter universities by
 * - value: Current university value
 * - customValue: Current custom university value (for "Other")
 * - onChange: Callback for university change (university, customUniversity, universityId)
 * - required: Whether field is required
 * - placeholder: Placeholder text
 * - className: Additional CSS classes
 */
export default function UniversitySelector({
  country,
  value = "",
  customValue = "",
  onChange,
  required = false,
  placeholder = "Select or type university name",
  className = ""
}) {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load universities when country changes
  useEffect(() => {
    if (!country || country === "Other") {
      setUniversities([]);
      return;
    }

    let cancelled = false;
    
    async function loadUniversities() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API.baseURL}/api/universities/countries/${encodeURIComponent(country)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load universities: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!cancelled) {
          setUniversities(data.universities || []);
        }
      } catch (err) {
        console.error("Error loading universities:", err);
        if (!cancelled) {
          setError(err.message);
          setUniversities([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUniversities();
    
    return () => {
      cancelled = true;
    };
  }, [country]);

  const handleUniversityChange = (selectedUniversity) => {
    if (selectedUniversity === "Other") {
      onChange("Other", "", null);
    } else {
      // Find the university ID for the selected university
      const selectedUni = universities.find(uni => uni.name === selectedUniversity);
      const universityId = selectedUni ? selectedUni.id : null;
      onChange(selectedUniversity, "", universityId);
    }
  };

  const handleCustomUniversityChange = (customUniversity) => {
    onChange("Other", customUniversity, null);
  };

  return (
    <div className="space-y-2">
      {/* Main University Input */}
      <div>
        <Input
          placeholder={loading ? "Loading universities..." : placeholder}
          value={value}
          onChange={(e) => handleUniversityChange(e.target.value)}
          list="universities"
          required={required}
          disabled={loading || !country || country === "Other"}
          className={`min-h-[44px] ${className}`}
        />
        
        {/* Datalist for universities */}
        <datalist id="universities">
          {universities.map((uni) => (
            <option key={uni.id} value={uni.name}>
              {uni.name}
            </option>
          ))}
          <option value="Other">🏫 Other University (not listed)</option>
        </datalist>
        
        {/* Error state */}
        {error && (
          <p className="text-xs text-red-600 mt-1">
            Failed to load universities. You can still type a university name.
          </p>
        )}
        
        {/* No country selected */}
        {!country && (
          <p className="text-xs text-slate-500 mt-1">
            Please select a country first
          </p>
        )}
        
        {/* Other country selected */}
        {country === "Other" && (
          <p className="text-xs text-slate-500 mt-1">
            Please type your university name below
          </p>
        )}
      </div>

      {/* Custom University Input - Shows when "Other" is selected or country is "Other" */}
      {(value === "Other" || country === "Other") && (
        <div>
          <Input
            placeholder="Enter university name"  
            value={customValue}
            onChange={(e) => handleCustomUniversityChange(e.target.value)}
            required={required && (value === "Other" || country === "Other")}
            className={`min-h-[44px] ${className}`}
          />
          <p className="text-xs text-slate-500 mt-1">
            {country === "Other" 
              ? "Enter the name of your university"
              : "This will be submitted as a custom university for admin review"
            }
          </p>
        </div>
      )}
    </div>
  );
}