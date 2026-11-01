import DetailGrid from '../components/ui/DetailGrid.jsx';
import ResourcePage from '../components/domain/ResourcePage.jsx';
import StatusActionPanel from '../components/domain/StatusActionPanel.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import StatusTimeline from '../components/domain/StatusTimeline.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { MODERATION_STATUSES } from '../domain/constants.js';
import { formatDateTime } from '../domain/format.js';
import { stars } from '../domain/ratings.js';
import { label } from '../i18n/labels.js';
import { changeStatus, listResource } from '../services/backOfficeApi.js';

const fetchRatings = (query) => listResource('ratings', query);

const COLUMNS = [
  { key: 'score', labelKey: 'field.score', render: (r) => <span className="stars">{stars(r.score)}</span> },
  { key: 'comment', labelKey: 'field.comment' },
  { key: 'provider_name', labelKey: 'field.provider' },
  { key: 'job_ref', labelKey: 'field.job', render: (r, { t }) => `${label(t, 'jobType', r.job_type)} · ${r.job_ref}` },
  { key: 'moderation_status', labelKey: 'field.visibility', render: (r) => <StatusBadge status={r.moderation_status} /> },
];
const FILTERS = [
  { key: 'moderation_status', labelKey: 'field.visibility', values: MODERATION_STATUSES, optionPrefix: 'status' },
];

function RatingDetail({ item, onUpdated }) {
  const { t, locale } = useI18n();
  return (
    <>
      <DetailGrid items={[
        { label: t('field.score'), value: <span className="stars">{stars(item.score)}</span> },
        { label: t('field.comment'), value: item.comment },
        { label: t('field.customer'), value: item.customer_name },
        { label: t('field.provider'), value: item.provider_name },
        { label: t('field.job'), value: `${label(t, 'jobType', item.job_type)} · ${item.job_ref}` },
        { label: t('field.visibility'), value: <StatusBadge status={item.moderation_status} /> },
        { label: t('field.created'), value: formatDateTime(item.created_at, locale) },
      ]} />
      <h3>{t('common.actions')}</h3>
      <StatusActionPanel entity="rating" status={item.moderation_status} onDone={onUpdated}
        submit={(to, form) => changeStatus('rating', item.id, { to, ...form })} />
      <h3>{t('common.timeline')}</h3>
      <StatusTimeline events={item.events} />
    </>
  );
}

export default function RatingsPage() {
  return (
    <ResourcePage titleKey="nav.ratings" fetcher={fetchRatings} columns={COLUMNS} filters={FILTERS}
      detailTitle={(r) => `${r.provider_name} · ${stars(r.score)}`} renderDetail={(props) => <RatingDetail {...props} />} />
  );
}
