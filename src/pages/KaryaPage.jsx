import DataTable from '../components/ui/DataTable.jsx';
import DetailGrid from '../components/ui/DetailGrid.jsx';
import ResourcePage from '../components/domain/ResourcePage.jsx';
import StatusActionPanel from '../components/domain/StatusActionPanel.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import StatusTimeline from '../components/domain/StatusTimeline.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { KARYA_CATEGORIES, KARYA_STATUSES } from '../domain/constants.js';
import { formatAmount, formatDateTime } from '../domain/format.js';
import { label } from '../i18n/labels.js';
import { changeStatus, listResource } from '../services/backOfficeApi.js';

const fetchKarya = (query) => listResource('karya', query);

const COLUMNS = [
  { key: 'reference', labelKey: 'field.reference' },
  { key: 'category', labelKey: 'field.category', render: (k, { t }) => label(t, 'karyaCategory', k.category) },
  { key: 'customer_name', labelKey: 'field.customer' },
  { key: 'provider_name', labelKey: 'field.provider' },
  { key: 'status', labelKey: 'field.status', render: (k) => <StatusBadge status={k.status} /> },
];
const FILTERS = [
  { key: 'status', labelKey: 'field.status', values: KARYA_STATUSES, optionPrefix: 'status' },
  { key: 'category', labelKey: 'field.category', values: KARYA_CATEGORIES, optionPrefix: 'karyaCategory' },
];

function QuotesTable({ quotes, selectedId }) {
  const { t, locale } = useI18n();
  const columns = [
    { key: 'provider', header: t('field.provider'), render: (q) => q.provider_name },
    { key: 'amount', header: t('field.amount'), render: (q) => formatAmount(q.amount, locale, q.currency) },
    { key: 'note', header: t('field.note'), render: (q) => q.note || '—' },
    { key: 'status', header: t('field.status'), render: (q) => <StatusBadge status={q.id === selectedId ? 'SELECTED' : q.status} /> },
  ];
  return <DataTable columns={columns} rows={quotes} />;
}

function KaryaDetail({ item, onUpdated }) {
  const { t, locale } = useI18n();
  return (
    <>
      <DetailGrid items={[
        { label: t('field.reference'), value: item.reference },
        { label: t('field.status'), value: <StatusBadge status={item.status} /> },
        { label: t('field.category'), value: label(t, 'karyaCategory', item.category) },
        { label: t('field.customer'), value: item.customer_name },
        { label: t('field.provider'), value: item.provider_name },
        { label: t('field.pickup'), value: item.pickup_address },
        { label: t('field.destination'), value: item.destination_address },
        { label: t('field.description'), value: item.description },
        { label: t('field.created'), value: formatDateTime(item.created_at, locale) },
      ]} />
      <h3>{t('field.quotes')}</h3>
      <QuotesTable quotes={item.quotes} selectedId={item.selected_quote_id} />
      <h3>{t('common.actions')}</h3>
      <StatusActionPanel entity="karya" status={item.status} onDone={onUpdated}
        submit={(to, form) => changeStatus('karya', item.id, { to, ...form })} />
      <h3>{t('common.timeline')}</h3>
      <StatusTimeline events={item.events} />
    </>
  );
}

export default function KaryaPage() {
  return (
    <ResourcePage titleKey="nav.karya" fetcher={fetchKarya} columns={COLUMNS} filters={FILTERS}
      detailTitle={(k) => k.reference} renderDetail={(props) => <KaryaDetail {...props} />} />
  );
}
