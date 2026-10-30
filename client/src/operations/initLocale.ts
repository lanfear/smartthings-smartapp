import i18n, {type TFunction} from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import HttpBackend from 'i18next-http-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import {initReactI18next} from 'react-i18next';

const init = (): Promise<TFunction> => i18n
  .use(LanguageDetector)
  .use(ChainedBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    load: 'currentOnly',
    keySeparator: '.', // allow nesting in the translation json
    interpolation: {
      escapeValue: false // recommended by their quick start guide, since react already escapes values for us
    },
    defaultNS: 'default',
    ns: ['default'],
    react: {
      useSuspense: false // TODO: come back around to this
    },
    backend: {
      backends: [
        LocalStorageBackend,
        HttpBackend
      ],
      backendOptions: [
        {
          // cached translations are only refetched when this changes - tools/bundle.ts sets it to a hash of the
          // translation files, so every translation edit refreshes the cache on the next build
          versions: {
            'en-US': process.env.SMARTAPP_BUILDTIME_TRANSLATION_VERSION ?? 'dev'
          }
        },
        {
          loadPath: '/{{lng}}/{{ns}}.json'
        }
      ]
    },
    debug: false
  });

export default init;