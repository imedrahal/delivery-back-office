import DetailGrid from '../components/ui/DetailGrid.jsx';
import ResourcePage from '../components/domain/ResourcePage.jsx';
import StatusActionPanel from '../components/domain/StatusActionPanel.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import StatusTimeline from '../components/domain/StatusTimeline.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { RETURN_STATUSES, RETURN_TYPES } from '../domain/constants.js';
import { formatDateTime } from '../domain/format.js';
import { label } from '../i18n/labels.js';
import { changeStatus, listResource } from '../services/backOfficeApi.js';

const fetchReturns = (query) => listResource('returns', query);

const COLUMNS = [
  { key: 'reference', labelKey: 'field.reference' },
  { key: 'return_type', labelKey: 'field.type', render: (r, { t }) => label(t, 'returnType', r.return_type) },
  { key: 'original_delivery_ref', labelKey: 'field.originalDelivery' },
  { key: 'courier_name', labelKey: 'field.courier' },
  { key: 'status', labelKey: 'field.status', render: (r) => <StatusBadge status={r.status} /> },
];
const FILTERS = [
  { key: 'status', labelKey: 'field.status', values: RETURN_STATUSES, optionPrefix: 'status' },
  { key: 'return_type', labelKey: 'field.type', values: RETURN_TYPES, optionPrefix: 'returnType' },
];

function ReturnDetail({ item, onUpdated }) {
  const { t, locale } = useI18n();
  return (
    <>
      <DetailGrid items={[
        { label: t('field.reference'), value: item.reference },
        { label: t('field.status'), value: <StatusBadge status={item.status} /> },
        { label: t('field.type'), value: label(t, 'returnType', item.return_type) },
        { label: t('field.originalDelivery'), value: item.original_delivery_ref },
        { label: t('field.reason'), value: label(t, 'reason', item.reason) },
        { label: t('field.customer'), value: item.customer_name },
        { label: t('field.courier'), value: item.courier_name },
        { label: t('field.pickup'), value: item.pickup_address },
        { label: t('field.destination'), value: item.return_destination },
        { label: t('field.created'), value: formatDateTime(item.created_at, locale) },
      ]} />
      <h3>{t('common.actions')}</h3>
      <StatusActionPanel entity="return" status={item.status} onDone={onUpdated}
        submit={(to, form) => changeStatus('return', item.id, { to, ...form })} />
      <h3>{t('common.timeline')}</h3>
      <StatusTimeline events={item.events} />
    </>
  );
}

export default function ReturnsPage() {
  return (
    <ResourcePage titleKey="nav.returns" fetcher={fetchReturns} columns={COLUMNS} filters={FILTERS}
      detailTitle={(r) => r.reference} renderDetail={(props) => <ReturnDetail {...props} />} />
  );
}
