import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LOCALES, RTL_LOCALES } from '../domain/constants.js';
import { dictionaries } from '../i18n/index.js';
import { translate } from '../i18n/translate.js';

const STORAGE_KEY = 'bo_locale';
const I18nContext = createContext(null);

function detectInitialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LOCALES.includes(saved)) return saved;
  } catch { /* storage unavailable */ }
  const device = navigator.language?.slice(0, 2);
  return LOCALES.includes(device) ? device : DEFAULT_LOCALE;
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectInitialLocale);
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next) => {
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const t = useCallback((key, params) => translate(dictionaries, locale, key, params), [locale]);
  const value = useMemo(() => ({ locale, dir, setLocale, t }), [locale, dir, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
