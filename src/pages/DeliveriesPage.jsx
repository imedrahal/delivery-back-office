import DetailGrid from '../components/ui/DetailGrid.jsx';
import ResourcePage from '../components/domain/ResourcePage.jsx';
import StatusActionPanel from '../components/domain/StatusActionPanel.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import StatusTimeline from '../components/domain/StatusTimeline.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { DELIVERY_STATUSES } from '../domain/constants.js';
import { formatDateTime, offerMinutesLeft } from '../domain/format.js';
import { label } from '../i18n/labels.js';
import { changeStatus, listResource } from '../services/backOfficeApi.js';

const fetchDeliveries = (query) => listResource('deliveries', query);

const COLUMNS = [
  { key: 'reference', labelKey: 'field.reference' },
  { key: 'customer_name', labelKey: 'field.customer' },
  { key: 'courier_name', labelKey: 'field.courier' },
  { key: 'status', labelKey: 'field.status', render: (d) => <StatusBadge status={d.status} /> },
  { key: 'created_at', labelKey: 'field.created', render: (d, { locale }) => formatDateTime(d.created_at, locale) },
];
const FILTERS = [{ key: 'status', labelKey: 'field.status', values: DELIVERY_STATUSES, optionPrefix: 'status' }];

const offerText = (iso, t) => {
  const minutes = offerMinutesLeft(iso);
  if (minutes === null) return null;
  return minutes > 0 ? t('offer.minutesLeft', { minutes }) : t('offer.expired');
};

function DeliveryDetail({ item, onUpdated }) {
  const { t, locale } = useI18n();
  return (
    <>
      <DetailGrid items={[
        { label: t('field.reference'), value: item.reference },
        { label: t('field.status'), value: <StatusBadge status={item.status} /> },
        { label: t('field.customer'), value: item.customer_name },
        { label: t('field.courier'), value: item.courier_name },
        { label: t('field.preferredCourier'), value: item.preferred_courier_name },
        { label: t('field.offerExpiry'), value: offerText(item.preferred_offer_expires_at, t) },
        { label: t('field.pickup'), value: item.pickup_address },
        { label: t('field.destination'), value: item.destination_address },
        { label: t('field.recipient'), value: `${item.recipient_name} · ${item.recipient_phone}` },
        { label: t('field.parcel'), value: item.parcel_description },
        { label: t('field.pickupConfirmed'), value: item.pickup_confirmed_at && formatDateTime(item.pickup_confirmed_at, locale) },
        { label: t('field.failureReason'), value: item.failure_reason && label(t, 'reason', item.failure_reason) },
        { label: t('field.created'), value: formatDateTime(item.created_at, locale) },
      ]} />
      <h3>{t('common.actions')}</h3>
      <StatusActionPanel entity="delivery" status={item.status} onDone={onUpdated}
        submit={(to, form) => changeStatus('delivery', item.id, { to, ...form })} />
      <h3>{t('common.timeline')}</h3>
      <StatusTimeline events={item.events} />
    </>
  );
}

export default function DeliveriesPage() {
  return (
    <ResourcePage titleKey="nav.deliveries" fetcher={fetchDeliveries} columns={COLUMNS} filters={FILTERS}
      detailTitle={(d) => d.reference} renderDetail={(props) => <DeliveryDetail {...props} />} />
  );
}
