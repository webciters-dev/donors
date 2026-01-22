import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Input } from "./input";
import { Calendar, X } from "lucide-react";

export const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Select date",
  disabled = false,
  minDate = null,
  maxDate = null,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

  // Update selectedDate when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDate(date);
      onChange(formatDate(date));
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          readOnly
          value={selectedDate ? formatDisplayDate(selectedDate) : ""}
          placeholder={placeholder}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`cursor-pointer pr-10 ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          disabled={disabled}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {selectedDate ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 pointer-events-auto"
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Calendar className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabled}
              fromDate={minDate ? new Date(minDate) : undefined}
              toDate={maxDate ? new Date(maxDate) : undefined}
              captionLayout="buttons"
              className="rounded-md"
            />
          </div>
        </>
      )}
    </div>
  );
};

