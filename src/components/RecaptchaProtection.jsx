import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

// reCAPTCHA v3 Component for invisible protection  
const RecaptchaV3 = forwardRef(({ onVerify, onError, onExpired }, ref) => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const isDevelopment = import.meta.env.VITE_DEVELOPMENT_MODE === 'true';
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname.includes('localhost');
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
      // Debug logging
      console.log('🔍 reCAPTCHA Debug:', {
        isDevelopment,
        isLocalhost,
        hostname: window.location.hostname,
        shouldBypass: isDevelopment && isLocalhost
      });
      
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
  }), [isDevelopment, isLocalhost, grecaptchaLoaded, siteKey, onError]); // Add dependencies

  if (!siteKey) {
    console.warn('reCAPTCHA site key not configured');
    return null;
  }

  // Show development status for localhost (but don't block children)
  if (isDevelopment && isLocalhost) {
    console.log('🚀 Development Mode: reCAPTCHA bypassed for localhost');
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
  className = '',
  children
}, ref) => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  const isDevelopment = import.meta.env.VITE_DEVELOPMENT_MODE === 'true';
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname.includes('localhost');
  const recaptchaRef = useRef();

  // Handle development mode with render prop pattern
  if (isDevelopment && isLocalhost) {
    // For render prop pattern, provide mock executeRecaptcha function
    if (typeof children === 'function') {
      const mockExecuteRecaptcha = async (action = 'submit') => {
        console.log('🚀 Development mode: Bypassing reCAPTCHA for localhost (render prop)');
        console.log('🔍 Render Prop Debug:', {
          isDevelopment,
          isLocalhost,
          hostname: window.location.hostname,
          shouldBypass: isDevelopment && isLocalhost
        });
        return 'development-bypass-token';
      };
      return (
        <div className={className}>
          {children({ executeRecaptcha: mockExecuteRecaptcha })}
        </div>
      );
    }
    // For regular children, just render them
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  if (version === 'v2') {
    return (
      <div className={className}>
        <RecaptchaV2 
          ref={ref}
          onVerify={onVerify}
          onError={onError}
          onExpired={onExpired}
        />
        {typeof children === 'function' ? children({ executeRecaptcha: ref?.current?.executeRecaptcha }) : children}
      </div>
    );
  }

  // Default to v3 (invisible) with render prop support
  return (
    <div className={className}>
      <RecaptchaV3 
        ref={ref}
        onVerify={onVerify}
        onError={onError}
        onExpired={onExpired}
      />
      {typeof children === 'function' ? children({ executeRecaptcha: ref?.current?.executeRecaptcha }) : children}
    </div>
  );
});

RecaptchaProtection.displayName = 'RecaptchaProtection';

export default RecaptchaProtection;
export { RecaptchaV3, RecaptchaV2 };