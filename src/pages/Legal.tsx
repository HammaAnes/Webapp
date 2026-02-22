import React from "react";
import { motion } from "framer-motion";

const Legal = () => {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-r from-accent to-teal text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-display font-bold mb-4"
          >
            Mentions Légales
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/90"
          >
            Informations légales et conditions d'utilisation
          </motion.p>
        </div>
      </section>

      {/* Contenu légal */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prose prose-lg max-w-none"
          >
            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              1. Informations sur l'entreprise
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <p>
                <strong>Nom commercial :</strong> Coffice (marque déposée)
              </p>
              <p>
                <strong>Raison sociale :</strong> S.A.R.L HadCenter Consulting
              </p>
              <p>
                <strong>Adresse :</strong> Centre Commercial Mohammadia Mall
                <br />
                4ème étage, Bureau 1178
                <br />
                Mohammadia, Alger
              </p>
              <p>
                <strong>Téléphone :</strong> +213 23 804 924
              </p>
              <p>
                <strong>Email :</strong> contact@hadcenter.net
              </p>
              <p>
                <strong>Site web :</strong>{" "}
                <a
                  href="https://hadcenter.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  hadcenter.net
                </a>
              </p>
              <p>
                <strong>Numéro de registre du commerce :</strong>{" "}
                22B1050469-00/16
              </p>
            </div>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              2. Hébergement du site
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <p>
                <strong>Hébergeur :</strong> EURL Novihost
              </p>
              <p>
                <strong>Adresse :</strong> Centre Commercial Mohammadia Mall
                <br />
                7ème étage, Bureau 1254
                <br />
                Mohammadia, Alger
              </p>
            </div>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              3. Propriété intellectuelle
            </h2>
            <p className="mb-6">
              L'ensemble de ce site relève de la législation algérienne et
              internationale sur le droit d'auteur et la propriété
              intellectuelle. Tous les droits de reproduction sont réservés, y
              compris pour les documents téléchargeables et les représentations
              iconographiques et photographiques.
            </p>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              4. Conditions d'utilisation
            </h2>
            <p className="mb-4">
              L'utilisation de ce site implique l'acceptation pleine et entière
              des conditions générales d'utilisation décrites ci-après. Ces
              conditions d'utilisation sont susceptibles d'être modifiées ou
              complétées à tout moment.
            </p>
            <p className="mb-6">
              Les utilisateurs du site s'engagent à respecter les règles en
              vigueur et à ne pas porter atteinte aux droits de tiers ou à
              l'ordre public.
            </p>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              5. Protection des données personnelles
            </h2>
            <p className="mb-4">
              Conformément à la <strong>loi n° 18-07 du 10 juin 2018</strong>{" "}
              relative à la protection des personnes physiques dans le
              traitement des données à caractère personnel, vous disposez d'un
              droit d'accès, de rectification et de suppression des données vous
              concernant.
            </p>
            <p className="mb-4">
              Les informations recueillies sur ce site sont nécessaires pour le
              traitement de vos demandes et la gestion de nos services. Elles
              sont traitées de manière confidentielle et sécurisée.
            </p>
            <p className="mb-6">
              Vos données personnelles ne sont transmises à aucun tiers sans
              votre accord préalable explicite, sauf obligation légale. Vous
              pouvez exercer vos droits en nous contactant à l'adresse :
              contact@hadcenter.net
            </p>
            <p className="mb-6 text-sm text-gray-600">
              <strong>Dernière mise à jour :</strong> Novembre 2025
            </p>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              6. Cookies
            </h2>
            <p className="mb-6">
              Ce site utilise des cookies pour améliorer l'expérience
              utilisateur et analyser le trafic. En continuant à naviguer sur ce
              site, vous acceptez l'utilisation de cookies conformément à notre
              politique de confidentialité.
            </p>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              7. Responsabilité
            </h2>
            <p className="mb-6">
              Les informations contenues sur ce site sont aussi précises que
              possible et le site est périodiquement remis à jour, mais peut
              toutefois contenir des inexactitudes, des omissions ou des
              lacunes. Si vous constatez une lacune, erreur ou ce qui paraît
              être un dysfonctionnement, merci de bien vouloir le signaler par
              email à desk@coffice.dz.
            </p>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              8. Liens hypertextes
            </h2>
            <p className="mb-6">
              Les liens hypertextes mis en place dans le cadre du présent site
              web en direction d'autres ressources présentes sur le réseau
              Internet ne sauraient engager la responsabilité de Coffice.
            </p>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              9. Droit applicable
            </h2>
            <p className="mb-6">
              Tant le présent site que les modalités et conditions de son
              utilisation sont régis par le droit algérien. En cas de litige,
              les tribunaux algériens seront seuls compétents.
            </p>

            <h2 className="text-2xl font-display font-bold text-primary mb-6">
              10. Contact
            </h2>
            <p className="mb-6">
              Pour toute question concernant ces mentions légales, vous pouvez
              nous contacter :
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p>
                <strong>Par email :</strong> desk@coffice.dz
              </p>
              <p>
                <strong>Par téléphone :</strong> +213 23 804 924
              </p>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>Dernière mise à jour : Novembre 2025</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Legal;
