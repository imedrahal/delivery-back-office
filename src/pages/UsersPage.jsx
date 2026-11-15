import { useState } from 'react';
import AsyncView from '../components/domain/AsyncView.jsx';
import StatusActionPanel from '../components/domain/StatusActionPanel.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import DetailGrid from '../components/ui/DetailGrid.jsx';
import FilterBar from '../components/ui/FilterBar.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { ACCOUNT_STATUSES } from '../domain/constants.js';
import { courierCapability } from '../domain/couriers.js';
import { formatDateTime } from '../domain/format.js';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { enumOptions } from '../i18n/labels.js';
import { changeStatus, listResource } from '../services/backOfficeApi.js';

const fetchClients = (query) => listResource('users', {
  ...query,
  filters: { ...query.filters, roles: 'customer' },
});
const fetchCouriers = (query) => listResource('users', {
  ...query,
  filters: { ...query.filters, roles: 'courier' },
});

function UserCard({ user, type, onOpen, t }) {
  const isCourier = type === 'couriers';
  const status = user.account_status;
  return (
    <button type="button" className="card courier user-directory-card" onClick={() => onOpen(user)}>
      <span className="courier__head">
        <Avatar name={user.display_name} />
        <span className="courier__id">
          <strong>{user.display_name}</strong>
          <span className="muted">{t(isCourier ? 'nav.couriers' : 'nav.clients')}</span>
        </span>
        <StatusBadge status={status} />
      </span>
      <span className="courier__info">
        <span dir="ltr">{user.phone || '—'}</span>
        <span dir="ltr" className="muted">{user.email || '—'}</span>
      </span>
    </button>
  );
}

function UserDetail({ item, type, onUpdated }) {
  const { t, locale } = useI18n();
  const isCourier = type === 'couriers';
  const capability = isCourier ? courierCapability(item) : null;
  const profile = item.courier_profile;
  const items = [
    { label: t('field.name'), value: item.display_name },
    { label: t('field.email'), value: item.email },
    { label: t('field.phone'), value: item.phone },
  ];

  if (isCourier) {
    items.push(
      { label: t('field.vehicle'), value: profile?.vehicle ? t(`vehicle.${profile.vehicle}`) : t('common.none') },
      { label: t('field.zone'), value: profile?.zone || t('common.none') },
      { label: t('field.courierStatus'), value: <StatusBadge status={capability?.status} /> },
    );
  } else {
    items.push({ label: t('field.language'), value: item.preferred_language?.toUpperCase() || t('common.none') });
  }
  items.push(
    { label: t('field.accountStatus'), value: <StatusBadge status={item.account_status} /> },
    { label: t('field.created'), value: formatDateTime(item.created_at, locale) },
  );

  return (
    <>
      <DetailGrid items={items} />
      <h3>{t('common.actions')}</h3>
      {isCourier ? (
        <StatusActionPanel entity="account" status={item.account_status} onDone={(user) => onUpdated({ ...item, ...user })}
          actionLabels={{ ACTIVE: 'actionLabel.accountActivate', DEACTIVATED: 'actionLabel.accountDeactivate' }}
          submit={(to, form) => changeStatus('account', item.id, { to, ...form })} />
      ) : (
        <StatusActionPanel entity="account" status={item.account_status} onDone={(user) => onUpdated({ ...item, ...user })}
          submit={(to, form) => changeStatus('account', item.id, { to, ...form })} />
      )}
    </>
  );
}

export default function UsersPage({ type }) {
  const { t } = useI18n();
  const fetcher = type === 'couriers' ? fetchCouriers : fetchClients;
  const list = usePaginatedList(fetcher);
  const [selected, setSelected] = useState(null);
  const { status, data, error } = list.state;
  const filters = [{
    key: 'account_status',
    label: t('field.accountStatus'),
    options: enumOptions(t, 'status', ACCOUNT_STATUSES),
  }];
  const handleUpdated = (user) => {
    setSelected(user);
    list.reload();
  };

  return (
    <section>
      <PageHeader title={t(type === 'couriers' ? 'nav.couriers' : 'nav.clients')} />
      <FilterBar search={list.search} onSearch={list.setSearch} searchPlaceholder={t('common.search')}
        filters={filters} values={list.filters} onFilter={list.setFilter} allLabel={t('common.all')} />
      <AsyncView status={status} error={error} isEmpty={data?.total === 0} onRetry={list.reload}>
        {data && (
          <>
            <div className="courier-grid">
              {data.items.map((user) => (
                <UserCard key={user.id} user={user} type={type} onOpen={setSelected} t={t} />
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={list.setPage}
              labels={{ prev: t('common.prev'), next: t('common.next'), page: t('common.page', { page: data.page, total: data.totalPages }) }} />
          </>
        )}
      </AsyncView>
      <Modal open={!!selected} wide title={selected?.display_name ?? ''} closeLabel={t('common.close')} onClose={() => setSelected(null)}>
        {selected && <UserDetail item={selected} type={type} onUpdated={handleUpdated} />}
      </Modal>
    </section>
  );
}
