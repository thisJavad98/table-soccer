import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';
import fa from './fa.js';

const dictionaries = { en, fa };

const I18nContext = createContext(null);

function format(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] == null ? `{${key}}` : String(vars[key]),
  );
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('ts-lang');
    if (saved === 'fa' || saved === 'en') return saved;
    return navigator.language?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
  });

  const dict = dictionaries[lang] || en;

  useEffect(() => {
    localStorage.setItem('ts-lang', lang);
    document.documentElement.lang = dict.code;
    document.documentElement.dir = dict.dir;
  }, [lang, dict.code, dict.dir]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: dict,
      f: (key, vars) => format(dict[key] ?? key, vars),
      dir: dict.dir,
    }),
    [lang, dict],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
