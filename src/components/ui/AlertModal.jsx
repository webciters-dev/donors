import React, { useState, createContext, useContext, useCallback } from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, X, Info } from "lucide-react";
import { Button } from "./button";

// Context for global modal management
const AlertModalContext = createContext(null);

/**
 * AlertModal - A centered modal dialog for important warnings that need acknowledgment
 */
function AlertModalComponent({ 
  type = "warning", 
  title, 
  message, 
  confirmText = "OK", 
  cancelText,
  onConfirm, 
  onCancel,
  onClose 
}) {
  if (!message) return null;

  const styles = {
    warning: {
      iconBg: "bg-yellow-100",
      icon: <AlertTriangle className="h-8 w-8 text-yellow-600" />,
      confirmBtn: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
    error: {
      iconBg: "bg-red-100",
      icon: <AlertCircle className="h-8 w-8 text-red-600" />,
      confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
    },
    success: {
      iconBg: "bg-green-100",
      icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
      confirmBtn: "bg-green-600 hover:bg-green-700 text-white",
    },
    info: {
      iconBg: "bg-blue-100",
      icon: <Info className="h-8 w-8 text-blue-600" />,
      confirmBtn: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const style = styles[type] || styles.warning;

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200" 
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`rounded-full p-3 ${style.iconBg} mb-4`}>
            {style.icon}
          </div>

          {/* Title */}
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          )}

          {/* Message */}
          <p className="text-gray-600 mb-6 text-base leading-relaxed">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            {cancelText && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                {cancelText}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              className={`flex-1 ${style.confirmBtn}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AlertModalProvider - Wrap your app with this to enable showAlert() anywhere
 */
export function AlertModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const showAlert = useCallback((options) => {
    return new Promise((resolve) => {
      setModal({
        ...options,
        onConfirm: () => {
          options.onConfirm?.();
          resolve(true);
        },
        onCancel: () => {
          options.onCancel?.();
          resolve(false);
        },
        onClose: () => {
          setModal(null);
        },
      });
    });
  }, []);

  const showWarning = useCallback((message, options = {}) => {
    return showAlert({ type: "warning", message, ...options });
  }, [showAlert]);

  const showError = useCallback((message, options = {}) => {
    return showAlert({ type: "error", message, ...options });
  }, [showAlert]);

  const showConfirm = useCallback((message, options = {}) => {
    return showAlert({ 
      type: "warning", 
      message, 
      confirmText: "Yes", 
      cancelText: "No",
      ...options 
    });
  }, [showAlert]);

  const hideAlert = useCallback(() => {
    setModal(null);
  }, []);

  return (
    <AlertModalContext.Provider value={{ showAlert, showWarning, showError, showConfirm, hideAlert }}>
      {children}
      {modal && (
        <AlertModalComponent
          type={modal.type}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
          onClose={modal.onClose}
        />
      )}
    </AlertModalContext.Provider>
  );
}

/**
 * useAlertModal - Hook to show modal alerts from any component
 * 
 * Usage:
 * const { showWarning, showConfirm } = useAlertModal();
 * showWarning("Please check your information", { title: "Warning" });
 * const confirmed = await showConfirm("Are you sure you want to delete?");
 */
export function useAlertModal() {
  const context = useContext(AlertModalContext);
  if (!context) {
    console.warn("useAlertModal must be used within AlertModalProvider");
    return {
      showAlert: () => Promise.resolve(true),
      showWarning: () => Promise.resolve(true),
      showError: () => Promise.resolve(true),
      showConfirm: () => Promise.resolve(true),
      hideAlert: () => {},
    };
  }
  return context;
}

export { AlertModalComponent as AlertModal };
