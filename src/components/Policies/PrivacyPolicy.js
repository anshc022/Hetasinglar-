import React from 'react';
import { useSwedishTranslation } from '../../utils/swedishTranslations';

const PrivacyPolicy = ({ isModal = false, onClose = null }) => {
  const { t } = useSwedishTranslation();

  const content = (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('privacyPolicy')}
      </h1>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Inledning</h2>
          <p className="mb-4">
            Din integritet är viktig för oss. Denna integritetspolicy förklarar hur vi samlar in, 
            använder och skyddar din personliga information när du använder Hetasinglar.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Information vi samlar in</h2>
          <h3 className="text-lg font-medium mb-2">Information du ger oss:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Kontouppgifter (namn, e-post, lösenord)</li>
            <li>Profilinformation (ålder, kön, intressen)</li>
            <li>Meddelanden och kommunikation</li>
            <li>Betalningsinformation (via säkra tredjepartsleverantörer)</li>
          </ul>
          
          <h3 className="text-lg font-medium mb-2">Information vi samlar automatiskt:</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>IP-adress och enhetsuppgifter</li>
            <li>Användningsdata och navigeringsmönster</li>
            <li>Cookies och liknande teknologier</li>
            <li>Platsdata (om du tillåter det)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Hur vi använder din information</h2>
          <p className="mb-4">Vi använder din information för att:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Tillhandahålla och förbättra våra tjänster</li>
            <li>Matcha dig med relevanta profiler</li>
            <li>Kommunicera med dig om tjänsten</li>
            <li>Behandla betalningar</li>
            <li>Förhindra bedrägerier och missbruk</li>
            <li>Följa juridiska krav</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Delning av information</h2>
          <p className="mb-4">
            Vi delar aldrig din personliga information med tredje parter förutom:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Med ditt uttryckliga samtycke</li>
            <li>För att följa juridiska krav</li>
            <li>Med våra betrodda tjänsteleverantörer (som följer strikta sekretessavtal)</li>
            <li>För att skydda våra eller andras rättigheter och säkerhet</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Datasäkerhet</h2>
          <p className="mb-4">
            Vi implementerar branschstandardiserade säkerhetsåtgärder för att skydda din data:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>SSL-kryptering för all dataöverföring</li>
            <li>Säker lagring av lösenord med hashning</li>
            <li>Regelbundna säkerhetsgranskningar</li>
            <li>Begränsad åtkomst till personlig data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Dina rättigheter enligt GDPR</h2>
          <p className="mb-4">Du har rätt att:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Få tillgång till din personliga data</li>
            <li>Rätta felaktig information</li>
            <li>Radera din data ("rätten att bli bortglömd")</li>
            <li>Begränsa behandlingen av din data</li>
            <li>Överföra din data till en annan tjänst</li>
            <li>Invända mot behandling av din data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Cookies</h2>
          <p className="mb-4">
            Vi använder cookies för att förbättra din upplevelse. Du kan inaktivera cookies 
            i din webbläsare, men detta kan påverka funktionaliteten.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Datalagring</h2>
          <p className="mb-4">
            Vi behåller din information så länge ditt konto är aktivt eller enligt vad som 
            krävs för att tillhandahålla tjänster. Du kan när som helst begära borttagning 
            av ditt konto och associerad data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Ändringar av denna policy</h2>
          <p className="mb-4">
            Vi kan uppdatera denna integritetspolicy när som helst. Vi kommer att meddela 
            dig om betydande ändringar via e-post eller genom en notis på plattformen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">10. Kontakta oss</h2>
          <p className="mb-4">
            För frågor om denna integritetspolicy eller dina personuppgifter, kontakta oss på:
          </p>
          <ul className="list-none mb-4">
            <li>E-post: privacy@hetasinglar.se</li>
            <li>Adress: Hetasinglar AB, [Adress], Sverige</li>
          </ul>
        </section>

        <div className="text-sm text-gray-600 dark:text-gray-400 mt-8">
          <p>Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</p>
        </div>
      </div>

      {isModal && onClose && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Stäng
          </button>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default PrivacyPolicy;