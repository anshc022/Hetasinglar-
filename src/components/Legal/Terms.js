import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Terms = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Användarvillkor</h1>
            <p className="text-gray-600">Giltigt från: 2025-11-10</p>
            <p className="text-sm text-gray-500 mt-2">ASJ GROUP LTD · 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ · E-post: <a href="mailto:support@hetasinglar.se" className="text-purple-600 hover:underline">support@hetasinglar.se</a></p>
          </div>

          {/* Content */}
          <div className="prose max-w-none text-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Avtalets omfattning</h2>
            <p className="mb-6">Dessa användarvillkor ("Villkor") reglerar din användning av HetaSinglar.se ("Tjänsten"). Genom att skapa ett konto eller använda Tjänsten accepterar du Villkoren.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Behörighet</h2>
            <p className="mb-6">Du måste vara minst 18 år gammal för att använda Tjänsten. Genom att använda Tjänsten bekräftar du att du uppfyller detta krav.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Konton och säkerhet</h2>
            <ul className="mb-6 list-disc pl-6">
              <li>Du ansvarar för att hålla dina inloggningsuppgifter konfidentiella.</li>
              <li>Du godkänner att omedelbart meddela oss vid misstänkt obehörig användning av ditt konto.</li>
              <li>Vi kan stänga av eller avsluta konton som bryter mot Villkoren.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Tillåten användning</h2>
            <ul className="mb-6 list-disc pl-6">
              <li>Publicera inte olagligt, kränkande, diskriminerande eller explicit innehåll.</li>
              <li>Följ gällande lagar och respektera andra användares rättigheter.</li>
              <li>Ingen scraping, reverse engineering eller missbruk av Tjänsten.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Betalningar och krediter</h2>
            <p className="mb-6">Köp och krediter (mynt) på plattformen är föremål för gällande priser. Återbetalningar kan vara begränsade enligt våra policyer och gällande lag.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Immateriella rättigheter</h2>
            <p className="mb-6">Allt innehåll, varumärken och material på Tjänsten tillhör ASJ GROUP LTD eller dess licensgivare. Otillåten användning är förbjuden.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Ansvarsbegränsning</h2>
            <p className="mb-6">Tjänsten tillhandahålls i befintligt skick. Vi ansvarar inte för indirekta skador, dataförluster eller driftavbrott som uppstår genom användning av Tjänsten, i den utsträckning som tillåts enligt lag.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Uppsägning</h2>
            <p className="mb-6">Du kan avsluta ditt konto när som helst. Vi kan avsluta eller begränsa åtkomst vid brott mot Villkoren, misstänkt bedrägeri eller risk för säkerhet.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Ändringar</h2>
            <p className="mb-6">Vi kan uppdatera dessa Villkor. Väsentliga ändringar kommuniceras och "Giltigt från"-datumet uppdateras.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Tillämplig lag</h2>
            <p className="mb-6">Dessa Villkor regleras av tillämplig brittisk lag. Tvister kan hanteras i behörig domstol i Storbritannien, med förbehåll för tvingande konsumenträtt.</p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Kontakt</h2>
            <p className="mb-6">ASJ GROUP LTD · 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ · E-post: <a href="mailto:support@hetasinglar.se" className="text-purple-600 hover:underline">support@hetasinglar.se</a></p>
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

export default Terms;
