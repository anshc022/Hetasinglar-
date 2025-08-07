import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../services/api';

const AffiliateRedirect = () => {
  const { affiliateCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAffiliateRedirect = async () => {
      try {
        // Track the affiliate click
        if (affiliateCode) {
          await auth.trackAffiliateClick(affiliateCode);
        }

        // Redirect to registration page with referral code
        navigate(`/auth?ref=${affiliateCode}&signup=true`);
      } catch (error) {
        console.error('Affiliate redirect error:', error);
        // Still redirect even if tracking fails
        navigate(`/auth?ref=${affiliateCode}&signup=true`);
      }
    };

    if (affiliateCode) {
      handleAffiliateRedirect();
    } else {
      // If no affiliate code, redirect to normal auth page
      navigate('/auth');
    }
  }, [affiliateCode, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-red-500 to-yellow-500 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Referral...</h2>
        <p className="text-gray-600">Please wait while we redirect you to registration.</p>
      </div>
    </div>
  );
};

export default AffiliateRedirect;
