import { useCallback } from 'react';
import DetailGrid from '../components/ui/DetailGrid.jsx';
import ResourcePage from '../components/domain/ResourcePage.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import StatusTimeline from '../components/domain/StatusTimeline.jsx';
import AsyncView from '../components/domain/AsyncView.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { DELIVERY_STATUSES } from '../domain/constants.js';
import { formatAmount, formatDateTime } from '../domain/format.js';
import { useAsync } from '../hooks/useAsync.js';
import { getDeliveryDetails, listResource } from '../services/backOfficeApi.js';

const fetchDeliveries = (query) => listResource('deliveries', query);

function DeliveryParty({ name, phone }) {
  if (!name) return <span className="muted">{'\u2014'}</span>;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <span className="delivery-party">
      <span className="delivery-party__avatar" aria-hidden="true">{initials}</span>
      <span className="delivery-party__info">
        <strong>{name}</strong>
        {phone && <small>{phone}</small>}
      </span>
    </span>
  );
}

const COLUMNS = [
  {
    key: 'reference',
    labelKey: 'field.reference',
    render: (delivery, { t }) => (
      <span className="delivery-reference">
        <span className="delivery-reference__mark" aria-hidden="true">#</span>
        <span className="delivery-reference__info">
          <strong>{delivery.reference}</strong>
          <small>{t('nav.deliveries')}</small>
        </span>
      </span>
    ),
  },
  {
    key: 'customer_name',
    labelKey: 'field.customer',
    render: (delivery) => <DeliveryParty name={delivery.customer_name} phone={delivery.customer_phone} />,
  },
  {
    key: 'courier_name',
    labelKey: 'field.courier',
    render: (delivery) => <DeliveryParty name={delivery.courier_name} phone={delivery.courier_phone} />,
  },
  { key: 'status', labelKey: 'field.status', render: (d) => <StatusBadge status={d.status} /> },
  {
    key: 'created_at',
    labelKey: 'field.created',
    render: (delivery, { locale }) => <span className="delivery-date">{formatDateTime(delivery.created_at, locale)}</span>,
  },
];
const FILTERS = [{
  key: 'status',
  labelKey: 'field.status',
  values: DELIVERY_STATUSES.filter((status) => status !== 'OPEN_FOR_PREFERRED_COURIER'),
  optionPrefix: 'status',
}];

function DeliveryDetailContent({ item }) {
  const { t, locale } = useI18n();
  return (
    <div className="delivery-detail">
      <DetailGrid items={[
        { label: t('field.reference'), value: item.reference },
        { label: t('field.status'), value: <StatusBadge status={item.status} /> },
        { label: t('field.customer'), value: item.customer_name },
        { label: t('field.courier'), value: item.courier_name },
        { label: t('field.preferredCourier'), value: item.preferred_courier_name },
        { label: t('field.offerExpiry'), value: item.preferred_offer_expires_at && formatDateTime(item.preferred_offer_expires_at, locale) },
        { label: t('field.pickup'), value: item.pickup_address },
        { label: t('field.destination'), value: item.destination_address },
        { label: t('field.recipient'), value: [item.recipient_name, item.recipient_phone].filter(Boolean).join(' · ') },
        { label: t('field.parcel'), value: item.parcel_description },
        { label: t('field.cashOnDelivery'), value: formatAmount(item.cod_amount, locale) },
        { label: t('field.courierFee'), value: formatAmount(item.courier_fee, locale) },
        { label: t('field.deliveredAt'), value: item.delivered_at && formatDateTime(item.delivered_at, locale) },
        { label: t('field.settledAt'), value: item.settled_at && formatDateTime(item.settled_at, locale) },
        { label: t('field.failureReason'), value: item.failure_reason },
        { label: t('field.created'), value: formatDateTime(item.created_at, locale) },
      ]} />
      <h3>{t('common.timeline')}</h3>
      <StatusTimeline events={item.events} />
    </div>
  );
}

function DeliveryDetail({ item }) {
  const loadDetails = useCallback(() => getDeliveryDetails(item.id), [item.id]);
  const { status, data, error, reload } = useAsync(loadDetails);
  return (
    <AsyncView status={status} error={error} onRetry={reload}>
      {data && <DeliveryDetailContent item={data} />}
    </AsyncView>
  );
}

export default function DeliveriesPage() {
  return (
    <ResourcePage titleKey="nav.deliveries" fetcher={fetchDeliveries} columns={COLUMNS} filters={FILTERS}
      detailTitle={(d) => d.reference} renderDetail={(props) => <DeliveryDetail {...props} />}
      className="resource-page--deliveries" />
  );
}
