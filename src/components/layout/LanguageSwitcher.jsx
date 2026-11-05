import { LOCALES, LOCALE_LABELS } from '../../domain/constants.js';
import { useI18n } from '../../context/I18nContext.jsx';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <select className="lang-select" value={locale} aria-label={t('common.language')} onChange={(e) => setLocale(e.target.value)}>
      {LOCALES.map((code) => <option key={code} value={code}>{LOCALE_LABELS[code]}</option>)}
    </select>
  );
}
