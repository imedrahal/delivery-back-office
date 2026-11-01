import DetailGrid from '../components/ui/DetailGrid.jsx';
import ResourcePage from '../components/domain/ResourcePage.jsx';
import StatusActionPanel from '../components/domain/StatusActionPanel.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import StatusTimeline from '../components/domain/StatusTimeline.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { DISPUTE_CATEGORIES, DISPUTE_STATUSES } from '../domain/constants.js';
import { formatDateTime } from '../domain/format.js';
import { label } from '../i18n/labels.js';
import { changeStatus, listResource } from '../services/backOfficeApi.js';

const fetchDisputes = (query) => listResource('disputes', query);

const COLUMNS = [
  { key: 'reference', labelKey: 'field.reference' },
  { key: 'job_ref', labelKey: 'field.job', render: (d, { t }) => `${label(t, 'jobType', d.job_type)} · ${d.job_ref}` },
  { key: 'category', labelKey: 'field.category', render: (d, { t }) => label(t, 'disputeCategory', d.category) },
  { key: 'opened_by_name', labelKey: 'field.openedBy' },
  { key: 'status', labelKey: 'field.status', render: (d) => <StatusBadge status={d.status} /> },
];
const FILTERS = [
  { key: 'status', labelKey: 'field.status', values: DISPUTE_STATUSES, optionPrefix: 'status' },
  { key: 'category', labelKey: 'field.category', values: DISPUTE_CATEGORIES, optionPrefix: 'disputeCategory' },
];

function DisputeDetail({ item, onUpdated }) {
  const { t, locale } = useI18n();
  const visibility = item.decision_is_internal ? 'internal' : 'public';
  return (
    <>
      <DetailGrid items={[
        { label: t('field.reference'), value: item.reference },
        { label: t('field.status'), value: <StatusBadge status={item.status} /> },
        { label: t('field.job'), value: `${label(t, 'jobType', item.job_type)} · ${item.job_ref}` },
        { label: t('field.category'), value: label(t, 'disputeCategory', item.category) },
        { label: t('field.openedBy'), value: item.opened_by_name },
        { label: t('field.description'), value: item.description },
        { label: t('field.decisionNote'), value: item.decision_note && `${item.decision_note} (${t(`noteVisibility.${visibility}`)})` },
        { label: t('field.created'), value: formatDateTime(item.created_at, locale) },
      ]} />
      <h3>{t('common.actions')}</h3>
      <StatusActionPanel entity="dispute" status={item.status} onDone={onUpdated}
        submit={(to, form) => changeStatus('dispute', item.id, { to, ...form })} />
      <h3>{t('common.timeline')}</h3>
      <StatusTimeline events={item.events} />
    </>
  );
}

export default function DisputesPage() {
  return (
    <ResourcePage titleKey="nav.disputes" fetcher={fetchDisputes} columns={COLUMNS} filters={FILTERS}
      detailTitle={(d) => d.reference} renderDetail={(props) => <DisputeDetail {...props} />} />
  );
}
