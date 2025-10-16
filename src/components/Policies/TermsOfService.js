import React from 'react';
import { useSwedishTranslation } from '../../utils/swedishTranslations';

const TermsOfService = ({ isModal = false, onClose = null }) => {
  const { t } = useSwedishTranslation();

  const content = (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('termsOfService')}
      </h1>
      
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">1. Allmänna villkor</h2>
          <p className="mb-4">
            Dessa användarvillkor ("Villkor") reglerar din användning av Hetasinglar-plattformen 
            ("Tjänsten"). Genom att använda vår tjänst accepterar du dessa villkor fullt ut.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Registrering och konto</h2>
          <p className="mb-4">
            För att använda tjänsten måste du:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Vara minst 18 år gammal</li>
            <li>Ange korrekt och sanningsenlig information</li>
            <li>Hålla dina inloggningsuppgifter säkra</li>
            <li>Inte dela ditt konto med andra</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Tjänstens användning</h2>
          <p className="mb-4">
            Du förbinder dig att:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Använda tjänsten på ett respektfullt sätt</li>
            <li>Inte publicera olämpligt innehåll</li>
            <li>Respektera andra användares integritet</li>
            <li>Inte använda tjänsten för olagliga ändamål</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">4. Betalningar och prenumerationer</h2>
          <p className="mb-4">
            Alla betalningar är slutgiltiga. Återbetalningar kan endast ske enligt svensk 
            konsumentlagstiftning. Prenumerationer förnyas automatiskt om de inte sägs upp.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">5. Ansvarsbegränsning</h2>
          <p className="mb-4">
            Hetasinglar ansvarar inte för:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Innehåll som publiceras av användare</li>
            <li>Kommunikation mellan användare</li>
            <li>Tekniska avbrott eller störningar</li>
            <li>Förlust av data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">6. Avstängning av konto</h2>
          <p className="mb-4">
            Vi förbehåller oss rätten att stänga av konton som bryter mot dessa villkor 
            utan förvarning.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">7. Ändringar av villkor</h2>
          <p className="mb-4">
            Vi kan uppdatera dessa villkor när som helst. Fortsatt användning av tjänsten 
            innebär att du accepterar de nya villkoren.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">8. Gällande lag</h2>
          <p className="mb-4">
            Dessa villkor regleras av svensk lag. Eventuella tvister avgörs av svensk domstol.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">9. Kontaktuppgifter</h2>
          <p className="mb-4">
            För frågor om dessa villkor, kontakta oss på: support@hetasinglar.se
          </p>
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

export default TermsOfService;