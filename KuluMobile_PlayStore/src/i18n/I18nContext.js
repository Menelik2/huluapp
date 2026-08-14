import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {translations, format} from './translations';

const LANG_KEY = 'kulu_lang';
const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => key,
});

export function I18nProvider({children}) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((v) => {
      if (v === 'am' || v === 'en') setLangState(v);
    });
  }, []);

  const setLang = (next) => {
    const v = next === 'am' ? 'am' : 'en';
    setLangState(v);
    AsyncStorage.setItem(LANG_KEY, v).catch(() => {});
  };

  const value = useMemo(() => {
    const dict = translations[lang] || translations.en;
    return {
      lang,
      setLang,
      t: (key, vars) => format(dict[key] ?? translations.en[key] ?? key, vars),
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
