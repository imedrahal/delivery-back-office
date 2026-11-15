import { LOCALES, LOCALE_LABELS } from '../../domain/constants.js';
import { useI18n } from '../../context/I18nContext.jsx';
import Select from '../ui/Select.jsx';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <Select
      className="lang-select"
      value={locale}
      label={t('common.language')}
      options={LOCALES.map((code) => ({ value: code, label: LOCALE_LABELS[code] }))}
      onChange={setLocale}
    />
  );
}
