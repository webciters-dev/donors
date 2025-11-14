import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

// reCAPTCHA v3 Component for invisible protection  
const RecaptchaV3 = forwardRef(({ onVerify, onError, onExpired }, ref) => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const isDevelopment = import.meta.env.VITE_DEVELOPMENT_MODE === 'true';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const [grecaptchaLoaded, setGrecaptchaLoaded] = useState(false);

  // Load reCAPTCHA v3 script
  useEffect(() => {
    const loadRecaptchaScript = () => {
      if (window.grecaptcha) {
        setGrecaptchaLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.onload = () => {
        window.grecaptcha.ready(() => {
          setGrecaptchaLoaded(true);
        });
      };
      script.onerror = () => {
        console.error('Failed to load reCAPTCHA script');
        if (onError) onError(new Error('Failed to load reCAPTCHA'));
      };
      document.head.appendChild(script);
    };

    // Skip loading reCAPTCHA script in development on localhost
    if (isDevelopment && isLocalhost) {
      console.log('🚀 Development mode: Skipping reCAPTCHA script load for localhost');
      setGrecaptchaLoaded(true);
      return;
    }

    if (siteKey) {
      loadRecaptchaScript();
    }

    return () => {
      // Cleanup if needed
    };
  }, [siteKey, onError, isDevelopment, isLocalhost]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    // Execute reCAPTCHA and get token
    executeRecaptcha: async (action = 'submit') => {
      // 🚀 Development bypass for localhost
      if (isDevelopment && isLocalhost) {
        console.log('🚀 Development mode: Bypassing reCAPTCHA for localhost');
        return 'development-bypass-token';
      }

      if (!grecaptchaLoaded || !window.grecaptcha) {
        throw new Error('reCAPTCHA not loaded');
      }
      
      try {
        const token = await window.grecaptcha.execute(siteKey, { action });
        
        if (!token) {
          throw new Error('Failed to get reCAPTCHA token');
        }
        
        return token;
      } catch (error) {
        console.error('reCAPTCHA execution failed:', error);
        if (onError) onError(error);
        throw error;
      }
    },
    
    // Reset reCAPTCHA (not really needed for v3)
    reset: () => {
      // v3 doesn't need reset
    }
  }));

  if (!siteKey) {
    console.warn('reCAPTCHA site key not configured');
    return null;
  }

  // Show development status for localhost
  if (isDevelopment && isLocalhost) {
    return (
      <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
        🚀 Development Mode: reCAPTCHA bypassed for localhost
      </div>
    );
  }

  // v3 is invisible, no UI component needed
  return null;
});

RecaptchaV3.displayName = 'RecaptchaV3';

// reCAPTCHA v2 Component for visible checkbox (fallback)
const RecaptchaV2 = forwardRef(({ onVerify, onError, onExpired }, ref) => {
  const recaptchaRef = useRef();
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useImperativeHandle(ref, () => ({
    executeRecaptcha: () => {
      return new Promise((resolve, reject) => {
        if (!recaptchaRef.current) {
          reject(new Error('reCAPTCHA not loaded'));
          return;
        }
        
        // For v2, we need the user to check the box
        const token = recaptchaRef.current.getValue();
        if (token) {
          resolve(token);
        } else {
          reject(new Error('Please complete the reCAPTCHA verification'));
        }
      });
    },
    
    reset: () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    }
  }));

  const handleVerify = (token) => {
    if (onVerify) {
      onVerify(token);
    }
  };

  const handleExpired = () => {
    if (onExpired) {
      onExpired();
    }
  };

  const handleError = (error) => {
    console.error('reCAPTCHA error:', error);
    if (onError) {
      onError(error);
    }
  };

  if (!siteKey) {
    console.warn('reCAPTCHA site key not configured');
    return null;
  }

  return (
    <div className="flex justify-center my-4">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        size="normal"
        onChange={handleVerify}
        onExpired={handleExpired}
        onError={handleError}
      />
    </div>
  );
});

RecaptchaV2.displayName = 'RecaptchaV2';

// Main reCAPTCHA Component with automatic fallback
const RecaptchaProtection = forwardRef(({ 
  version = 'v3',
  onVerify, 
  onError, 
  onExpired,
  className = ''
}, ref) => {
  if (version === 'v2') {
    return (
      <div className={className}>
        <RecaptchaV2 
          ref={ref}
          onVerify={onVerify}
          onError={onError}
          onExpired={onExpired}
        />
      </div>
    );
  }

  // Default to v3 (invisible)
  return (
    <div className={className}>
      <RecaptchaV3 
        ref={ref}
        onVerify={onVerify}
        onError={onError}
        onExpired={onExpired}
      />
    </div>
  );
});

RecaptchaProtection.displayName = 'RecaptchaProtection';

export default RecaptchaProtection;
export { RecaptchaV3, RecaptchaV2 };