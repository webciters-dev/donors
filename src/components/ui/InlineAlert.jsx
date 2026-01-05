import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, X } from "lucide-react";

/**
 * InlineAlert - Displays inline messages directly in the UI
 * For errors, warnings, and success messages that should appear near form actions
 * 
 * @param {Object} props
 * @param {"error" | "success" | "warning" | "info"} props.type - Type of alert
 * @param {string} props.message - The message to display
 * @param {function} props.onDismiss - Optional dismiss handler
 * @param {string} props.className - Additional CSS classes
 */
export function InlineAlert({ type = "error", message, onDismiss, className = "" }) {
  if (!message) return null;

  const styles = {
    error: {
      container: "bg-red-50 border-red-200 text-red-800",
      icon: <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />,
    },
    success: {
      container: "bg-green-50 border-green-200 text-green-800",
      icon: <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />,
    },
    warning: {
      container: "bg-yellow-50 border-yellow-200 text-yellow-800",
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />,
    },
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-800",
      icon: <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />,
    },
  };

  const style = styles[type] || styles.error;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${style.container} ${className}`}
      role="alert"
    >
      {style.icon}
      <p className="text-sm font-medium flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default InlineAlert;
