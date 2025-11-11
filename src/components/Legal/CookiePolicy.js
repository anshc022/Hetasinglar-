import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookiepolicy</h1>
            <p className="text-gray-600">Giltigt från: 2025-11-10</p>
            <p className="text-sm text-gray-500 mt-2">ASJ GROUP LTD · 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ · E-post: <a href="mailto:support@hetasinglar.se" className="text-purple-600 hover:underline">support@hetasinglar.se</a></p>
          </div>

          {/* Content */}
          <div className="prose max-w-none text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Vad är cookies?</h2>
            <p className="mb-6">Cookies är små textfiler som lagras på din enhet (dator, mobil, surfplatta) när du besöker en webbplats. De används för att möjliggöra grundläggande funktioner, förbättra prestanda, analysera användning och komma ihåg dina preferenser.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Hur vi använder cookies</h2>
            <p className="mb-6">Vi använder cookies för att:</p>
            <ul className="list-disc ml-6 mb-6">
              <li>Autentisera användare och hålla dig inloggad</li>
              <li>Spara inställningar och preferenser</li>
              <li>Analysera trafik och användarbeteende för att förbättra tjänsten</li>
              <li>Förbättra prestanda och användarupplevelse</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Typer av cookies vi använder</h2>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nödvändiga (Essential)</h3>
              <p className="mb-4">Krävs för att webbplatsens grundfunktioner ska fungera (inloggning, säker sessionshantering).</p>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">Funktionscookies</h3>
              <p className="mb-4">Ger förbättrad funktionalitet och personalisering (språk, UI-inställningar).</p>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">Analyscookies</h3>
              <p className="mb-4">Hjälper oss förstå hur användare interagerar med plattformen så vi kan optimera upplevelsen.</p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Hantering av cookies</h2>
            <p className="mb-6">Du kan när som helst blockera eller radera cookies via inställningar i din webbläsare. Om du blockerar nödvändiga cookies kan vissa funktioner sluta fungera korrekt. Mer information finns på <a href="https://www.aboutcookies.org" target="_blank" rel="noopener" className="text-purple-600 hover:underline">aboutcookies.org</a>.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Tredjepartscookies</h2>
            <p className="mb-6">Eventuella tredjepartscookies (t.ex. betalnings- eller analysleverantörer) styrs av respektive leverantörs egna policyer. Vi strävar efter att endast använda betrodda leverantörer.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Uppdateringar</h2>
            <p className="mb-6">Denna cookiepolicy kan uppdateras. Större ändringar kommuniceras till användare och datumet ovan uppdateras.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Kontakt</h2>
            <p className="mb-6">Frågor om cookies? Kontakta oss: <a href="mailto:support@hetasinglar.se" className="text-purple-600 hover:underline">support@hetasinglar.se</a></p>
          </div>

          {/* Back Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link 
              to="/" 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Till startsidan
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CookiePolicy;
