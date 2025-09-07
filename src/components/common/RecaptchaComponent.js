import React, { useRef, useEffect, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const RecaptchaComponent = ({ 
  onVerify, 
  onExpire, 
  onError,
  siteKey = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI", // Test key - replace with your actual site key
  theme = "light",
  size = "normal",
  className = ""
}) => {
  const recaptchaRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Reset reCAPTCHA when component mounts
    return () => {
      window.removeEventListener('resize', checkMobile);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    };
  }, []);

  const handleChange = (token) => {
    if (token) {
      onVerify(token);
    } else {
      // Token is null when reCAPTCHA expires or is reset
      if (onExpire) {
        onExpire();
      }
    }
  };

  const handleError = () => {
    if (onError) {
      onError();
    }
  };

  // Use compact size on mobile if size is not explicitly set to something else
  const effectiveSize = size === "normal" && isMobile ? "compact" : size;

  return (
    <div className={`recaptcha-container ${className}`}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onExpired={onExpire}
        onError={handleError}
        theme={theme}
        size={effectiveSize}
      />
    </div>
  );
};

export default RecaptchaComponent;
