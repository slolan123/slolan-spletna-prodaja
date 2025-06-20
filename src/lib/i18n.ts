import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import sl from '../locales/sl.json';
import en from '../locales/en.json';
import de from '../locales/de.json';
import it from '../locales/it.json';
import ru from '../locales/ru.json';

const resources = {
  sl: { translation: sl },
  en: { translation: en },
  de: { translation: de },
  it: { translation: it },
  ru: { translation: ru },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'sl',
    fallbackLng: 'sl',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;