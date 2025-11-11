import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Integritetspolicy</h1>
            <p className="text-gray-600">Giltigt från: 2025-11-10</p>
            <p className="text-sm text-gray-500 mt-2">ASJ GROUP LTD · 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ · E-post: <a href="mailto:support@hetasinglar.se" className="text-purple-600 hover:underline">support@hetasinglar.se</a></p>
          </div>

          {/* Content */}
          <div className="prose max-w-none text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduktion</h2>
            <p className="mb-6">Denna integritetspolicy förklarar hur ASJ GROUP LTD ("vi", "oss", "vår") samlar in, använder, avslöjar och skyddar din information när du besöker och använder vår webbplats, HetaSinglar.se ("Webbplatsen"). Vi är engagerade i att skydda dina personuppgifter i enlighet med GDPR (EU 2016/679) och tillämplig brittisk dataskyddslag.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Personuppgiftsansvarig</h2>
            <p className="mb-6">ASJ GROUP LTD är personuppgiftsansvarig för dina personuppgifter. Frågor om dina uppgifter eller denna policy kan skickas till <a href="mailto:support@hetasinglar.se" className="text-purple-600 hover:underline">support@hetasinglar.se</a>.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Vilka personuppgifter vi samlar in</h2>
            <ul className="mb-6 list-disc pl-6">
              <li>Namn och kontaktinformation (e-postadress, IP-adress)</li>
              <li>Inloggningsuppgifter och kontoinställningar</li>
              <li>Köphistorik och kredit-/mynttransaktioner</li>
              <li>Kommunikation och meddelanden skickade inom plattformen</li>
              <li>Användningsdata, enhetstyp, webbläsare och generell geolokalisering</li>
            </ul>
            <p className="mb-6">Vi samlar inte avsiktligt in känsliga personuppgifter (t.ex. hälsa, religion, politiska åsikter) och användare är förbjudna att dela sådan data.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Hur vi använder dina uppgifter</h2>
            <ul className="mb-6 list-disc pl-6">
              <li>Tillhandahålla och underhålla plattformen</li>
              <li>Hantera ditt konto och transaktioner</li>
              <li>Svara på dina förfrågningar och ge kundservice</li>
              <li>Förbättra användarupplevelse och plattformsfunktioner</li>
              <li>Uppfylla juridiska skyldigheter och förebygga bedrägerier</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Rättslig grund för behandling</h2>
            <ul className="mb-6 list-disc pl-6">
              <li>Avtal – för att tillhandahålla de tjänster du begär</li>
              <li>Samtycke – där du aktivt har godkänt valfri databehandling</li>
              <li>Rättslig skyldighet – för att uppfylla lagliga och reglerande krav</li>
              <li>Berättigat intresse – för att förebygga missbruk, förbättra tjänster och skydda användare</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Delning av dina uppgifter</h2>
            <p className="mb-6">Vi säljer inte dina uppgifter. Vi kan dela dem med betrodda tredjepartsleverantörer (t.ex. betalningsleverantörer), myndigheter om det krävs enligt lag, samt juridiska ombud vid tvister eller bedrägeriutredningar.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Internationella överföringar</h2>
            <p className="mb-6">Om vi överför dina uppgifter utanför Storbritannien eller EU, skyddas de genom lämpliga skyddsåtgärder såsom standardavtalsklausuler godkända av Europeiska kommissionen.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Lagringstid för data</h2>
            <p className="mb-6">Vi lagrar dina uppgifter endast så länge det är nödvändigt för syftet de samlades in. Inaktiva konton och tillhörande data kan raderas efter en rimlig tidsperiod, om inte lagliga skyldigheter kräver längre lagring.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Dina rättigheter enligt GDPR</h2>
            <ul className="mb-6 list-disc pl-6">
              <li>Få tillgång till dina uppgifter</li>
              <li>Korrigera felaktigheter</li>
              <li>Begära radering ("rätten att bli glömd")</li>
              <li>Invända mot eller begränsa behandling</li>
              <li>Få dataportabilitet</li>
              <li>Återkalla samtycke när som helst</li>
            </ul>
            <p className="mb-6">För att utöva dina rättigheter, mejla oss på <a href="mailto:support@hetasinglar.se" className="text-purple-600 hover:underline">support@hetasinglar.se</a>. Vi kan behöva verifiera din identitet innan vi behandlar din begäran.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Cookies</h2>
            <p className="mb-6">Vi använder cookies och liknande spårningstekniker för funktionalitet, analys och valfria preferenser. Du kan hantera cookie-inställningar via din webbläsare. Se vår separata cookiepolicy för fullständig information.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Säkerhet</h2>
            <p className="mb-6">Vi implementerar rimliga tekniska och organisatoriska åtgärder för att skydda dina personuppgifter mot förlust, missbruk och obehörig åtkomst. Inget system är dock helt säkert.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Uppdateringar av denna policy</h2>
            <p className="mb-6">Denna integritetspolicy kan uppdateras då och då. Vi meddelar användare om väsentliga ändringar och uppdaterar "Giltigt från"-datumet ovan.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Kontakt</h2>
            <p className="mb-2">ASJ GROUP LTD<br/>71-75 Shelton Street, Covent Garden, London, WC2H 9JQ<br/>E-post: <a href="mailto:support@hetasinglar.se" className="text-purple-600 hover:underline">support@hetasinglar.se</a></p>
            <p className="mb-6">Denna policy följer GDPR och UK Data Protection Act 2018.</p>
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
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;