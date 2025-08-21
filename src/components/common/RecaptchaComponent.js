import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    // Reset reCAPTCHA when component mounts
    return () => {
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

  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  return (
    <div className={`recaptcha-container ${className}`}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleChange}
        onExpired={onExpire}
        onError={handleError}
        theme={theme}
        size={size}
      />
    </div>
  );
};

export default RecaptchaComponent;
