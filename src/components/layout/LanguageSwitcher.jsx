import { LOCALES, LOCALE_LABELS } from '../../domain/constants.js';
import { useI18n } from '../../context/I18nContext.jsx';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="segmented" role="group" aria-label={t('common.language')}>
      {LOCALES.map((code) => (
        <button key={code} type="button" lang={code} aria-pressed={code === locale} onClick={() => setLocale(code)}>
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
