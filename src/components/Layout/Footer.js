import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSwedishTranslation } from '../../utils/swedishTranslations';
import TermsOfService from '../Policies/TermsOfService';
import PrivacyPolicy from '../Policies/PrivacyPolicy';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useSwedishTranslation();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">❤️</span>
                <span className="text-2xl font-bold text-rose-600">HetaSinglar</span>
                <span className="text-2xl">❤️</span>
              </div>
              <p className="text-gray-600 mb-6">
                {t('footerDescription') || 'Där äkta kontakter blomstrar.'}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-rose-600">Företag</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 hover:text-rose-600">{t('aboutUs') || 'Om oss'}</Link></li>
                <li><Link to="/careers" className="text-gray-600 hover:text-rose-600">Karriär</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-rose-600">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-600 hover:text-rose-600">{t('helpCenter') || 'Hjälpcenter'}</Link></li>
                <li><Link to="/contact" className="text-gray-600 hover:text-rose-600">{t('contactUs') || 'Kontakta oss'}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-rose-600">Juridiskt</h4>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => setShowPrivacy(true)}
                    className="text-gray-600 hover:text-rose-600"
                  >
                    {t('privacyPolicy') || 'Integritetspolicy'}
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowTerms(true)}
                    className="text-gray-600 hover:text-rose-600"
                  >
                    {t('termsOfService') || 'Användarvillkor'}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-500 text-sm">
                © {currentYear} HetaSinglar. Alla rättigheter förbehållna.
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <button 
                  onClick={() => setShowTerms(true)}
                  className="hover:text-rose-600 transition-colors"
                >
                  Villkor
                </button>
                <button 
                  onClick={() => setShowPrivacy(true)}
                  className="hover:text-rose-600 transition-colors"
                >
                  Integritet
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showTerms && (
        <TermsOfService 
          isModal={true} 
          onClose={() => setShowTerms(false)} 
        />
      )}
      
      {showPrivacy && (
        <PrivacyPolicy 
          isModal={true} 
          onClose={() => setShowPrivacy(false)} 
        />
      )}
    </>
  );
};

export default Footer;