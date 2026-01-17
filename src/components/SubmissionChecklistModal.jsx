// src/components/SubmissionChecklistModal.jsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, Circle } from "lucide-react";

/**
 * SubmissionChecklistModal - A modal that shows a checklist that must be acknowledged before final submission
 * 
 * Props:
 * - isOpen: boolean - Whether the modal is visible
 * - onClose: () => void - Called when modal is closed without submitting
 * - onSubmit: () => void - Called when all items are checked and submit is clicked
 * - savedChecklist: string[] - Array of previously checked item keys (for persistence)
 * - onSaveProgress: (checkedItems: string[]) => void - Called to save current progress
 */
export default function SubmissionChecklistModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  savedChecklist = [],
  onSaveProgress 
}) {
  // Checklist items from the bug report section 1.6
  const CHECKLIST_ITEMS = [
    { key: "applicant_cnic", label: "Applicant CNIC", required: true },
    { key: "university_card", label: "University/Institution Identity Card", required: true },
    { key: "hostel_card", label: "Hostel Card (if applicable)", required: false },
    { key: "guardian_cnic", label: "Father/Guardian CNIC", required: true },
    { key: "bonafide_certificate", label: "Bonafide Student Certificate from current University/Institution", required: true },
    { key: "ssc_certificate", label: "O Level (Cambridge) / SSC (Matriculation) Certificate (BISE/FBISE)", required: true },
    { key: "hssc_certificate", label: "A Level (Cambridge) / HSSC Certificate (BISE/FBISE)", required: true },
    { key: "latest_result", label: "Latest Examination Result Card", required: true },
    { key: "income_certificate", label: "Income Certificate (Salary slip of Father/Guardian if salaried)", required: true },
    { key: "utility_bill", label: "Utility Bill (not older than 3 months)", required: true },
    { key: "achievement_certificates", label: "Distinction/Achievement Certificates in Extra & Co-curricular Activities (if any)", required: false },
  ];

  const [checkedItems, setCheckedItems] = useState(new Set(savedChecklist));

  // Reset checkedItems when modal opens with saved checklist
  useEffect(() => {
    if (isOpen) {
      setCheckedItems(new Set(savedChecklist));
    }
  }, [isOpen, savedChecklist]);

  const toggleItem = (key) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const requiredItems = CHECKLIST_ITEMS.filter(item => item.required);
  const allRequiredChecked = requiredItems.every(item => checkedItems.has(item.key));
  const checkedCount = CHECKLIST_ITEMS.filter(item => checkedItems.has(item.key)).length;

  const handleSaveProgress = () => {
    onSaveProgress?.(Array.from(checkedItems));
    onClose();
  };

  const handleSubmit = () => {
    if (!allRequiredChecked) return;
    onSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <div>
            <h2 className="text-lg font-semibold text-blue-900">Submission Checklist</h2>
            <p className="text-sm text-blue-700">Please confirm you have uploaded all required documents</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Checklist Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = checkedItems.has(item.key);
              return (
                <div
                  key={item.key}
                  onClick={() => toggleItem(item.key)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                    ${isChecked 
                      ? 'bg-green-50 border border-green-200' 
                      : item.required 
                        ? 'bg-white border border-gray-200 hover:bg-gray-50' 
                        : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                    }
                  `}
                >
                  {isChecked ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <Circle className={`h-5 w-5 flex-shrink-0 ${item.required ? 'text-amber-500' : 'text-gray-400'}`} />
                  )}
                  <div className="flex-1">
                    <span className={`text-sm ${isChecked ? 'text-green-800' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    {item.required && !isChecked && (
                      <span className="text-xs text-red-500 ml-2">*Required</span>
                    )}
                    {!item.required && (
                      <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress and Actions */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">
              Progress: <span className="font-medium">{checkedCount}/{CHECKLIST_ITEMS.length}</span> items checked
              {!allRequiredChecked && (
                <span className="text-amber-600 ml-2">
                  ({requiredItems.filter(item => !checkedItems.has(item.key)).length} required items remaining)
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleSaveProgress}
              className="rounded-2xl"
            >
              Save Progress
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allRequiredChecked}
              className={`rounded-2xl ${!allRequiredChecked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Submit Application
            </Button>
          </div>
          
          {!allRequiredChecked && (
            <p className="text-xs text-amber-600 mt-2 text-center">
              Please check all required (*) items before submitting your application.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
