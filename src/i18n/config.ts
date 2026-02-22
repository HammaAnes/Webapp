import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { translationFr } from "./locales/fr";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: translationFr },
    },
    fallbackLng: "fr",
    lng: "fr",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
