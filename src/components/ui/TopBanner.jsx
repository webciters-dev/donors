import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, X, Info } from "lucide-react";

// Context for global banner management
const BannerContext = createContext(null);

/**
 * TopBanner - A full-width banner that pushes content down
 * For important notifications that need to be very visible
 */
function TopBannerComponent({ type = "success", message, onDismiss, autoDismiss = true, duration = 5000 }) {
  useEffect(() => {
    if (autoDismiss && onDismiss && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss, duration]);

  if (!message) return null;

  const styles = {
    success: {
      container: "bg-green-600 text-white",
      icon: <CheckCircle2 className="h-5 w-5 flex-shrink-0" />,
    },
    error: {
      container: "bg-red-600 text-white",
      icon: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    },
    warning: {
      container: "bg-yellow-500 text-white",
      icon: <AlertTriangle className="h-5 w-5 flex-shrink-0" />,
    },
    info: {
      container: "bg-blue-600 text-white",
      icon: <Info className="h-5 w-5 flex-shrink-0" />,
    },
  };

  const style = styles[type] || styles.success;

  return (
    <div
      className={`w-full px-4 py-3 ${style.container} animate-in slide-in-from-top duration-300`}
      role="alert"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {style.icon}
          <p className="text-sm sm:text-base font-medium">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 hover:opacity-70 transition-opacity p-1 rounded-full hover:bg-white/20"
            aria-label="Dismiss notification"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * BannerProvider - Wrap your app with this to enable showBanner() anywhere
 */
export function BannerProvider({ children }) {
  const [banner, setBanner] = useState(null);

  const showBanner = useCallback((message, type = "success", options = {}) => {
    setBanner({ message, type, ...options });
  }, []);

  const hideBanner = useCallback(() => {
    setBanner(null);
  }, []);

  const showSuccess = useCallback((message, options = {}) => {
    showBanner(message, "success", options);
  }, [showBanner]);

  const showError = useCallback((message, options = {}) => {
    showBanner(message, "error", { autoDismiss: false, ...options });
  }, [showBanner]);

  const showWarning = useCallback((message, options = {}) => {
    showBanner(message, "warning", options);
  }, [showBanner]);

  const showInfo = useCallback((message, options = {}) => {
    showBanner(message, "info", options);
  }, [showBanner]);

  return (
    <BannerContext.Provider value={{ showBanner, hideBanner, showSuccess, showError, showWarning, showInfo }}>
      {banner && (
        <TopBannerComponent
          type={banner.type}
          message={banner.message}
          onDismiss={hideBanner}
          autoDismiss={banner.autoDismiss !== false}
          duration={banner.duration || 5000}
        />
      )}
      {children}
    </BannerContext.Provider>
  );
}

/**
 * useBanner - Hook to show/hide banners from any component
 * 
 * Usage:
 * const { showSuccess, showError, showWarning } = useBanner();
 * showSuccess("Application saved successfully!");
 */
export function useBanner() {
  const context = useContext(BannerContext);
  if (!context) {
    // Fallback if used outside provider - use console warning
    console.warn("useBanner must be used within BannerProvider");
    return {
      showBanner: () => {},
      hideBanner: () => {},
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
    };
  }
  return context;
}

export { TopBannerComponent as TopBanner };
