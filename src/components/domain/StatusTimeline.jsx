import Timeline from '../ui/Timeline.jsx';
import StatusBadge from './StatusBadge.jsx';
import { formatDateTime } from '../../domain/format.js';
import { useI18n } from '../../context/I18nContext.jsx';

export default function StatusTimeline({ events = [] }) {
  const { t, locale } = useI18n();
  const items = events.map((event) => ({
    id: event.id,
    title: <StatusBadge status={event.to_status} />,
    meta: `${formatDateTime(event.created_at, locale)} · ${event.actor_name ?? t('common.none')}`,
    body: event.reason,
  }));
  return <Timeline items={items} emptyLabel={t('common.none')} />;
}
