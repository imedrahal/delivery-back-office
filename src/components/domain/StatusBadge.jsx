import Badge from '../ui/Badge.jsx';
import { toneFor } from '../../domain/statusTone.js';
import { useI18n } from '../../context/I18nContext.jsx';

export default function StatusBadge({ status }) {
  const { t } = useI18n();
  if (!status) return <span className="muted">{t('common.none')}</span>;
  return <Badge tone={toneFor(status)}>{t(`status.${status}`)}</Badge>;
}
