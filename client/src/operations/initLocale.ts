import i18n, {TFunction} from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ChainedBackend from 'i18next-chained-backend';
import LocalStorageBackend from 'i18next-localstorage-backend';
import HttpBackend from 'i18next-http-backend';
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
                    versions: {
                        'en-US': '0.0.1'
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