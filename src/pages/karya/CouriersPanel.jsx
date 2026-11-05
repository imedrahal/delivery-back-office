import { useState } from 'react';
import AsyncView from '../../components/domain/AsyncView.jsx';
import CourierCard from '../../components/domain/CourierCard.jsx';
import CourierForm from '../../components/domain/CourierForm.jsx';
import StatusActionPanel from '../../components/domain/StatusActionPanel.jsx';
import StatusBadge from '../../components/domain/StatusBadge.jsx';
import StatusTimeline from '../../components/domain/StatusTimeline.jsx';
import Button from '../../components/ui/Button.jsx';
import DetailGrid from '../../components/ui/DetailGrid.jsx';
import FilterBar from '../../components/ui/FilterBar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { ACCOUNT_STATUSES } from '../../domain/constants.js';
import { courierCapability } from '../../domain/couriers.js';
import { formatDateTime } from '../../domain/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import { usePaginatedList } from '../../hooks/usePaginatedList.js';
import { enumOptions, label } from '../../i18n/labels.js';
import { changeProviderStatus, createCourier, getCourierStats, listResource } from '../../services/backOfficeApi.js';

const fetchCouriers = (query) => listResource('users', { ...query, pageSize: 6, filters: { ...query.filters, roles: 'courier' } });
const STAT_KEYS = ['total', 'approved', 'pending', 'suspended'];

function CourierDetail({ courier, onUpdated }) {
  const { t, locale } = useI18n();
  const cap = courierCapability(courier);
  const profile = courier.courier_profile;
  return (
    <>
      <DetailGrid items={[
        { label: t('field.name'), value: courier.display_name },
        { label: t('field.phone'), value: courier.phone },
        { label: t('field.email'), value: courier.email },
        { label: t('field.vehicle'), value: label(t, 'vehicle', profile?.vehicle) },
        { label: t('field.zone'), value: profile?.zone ?? t('common.none') },
        { label: t('field.courierStatus'), value: <StatusBadge status={cap?.status} /> },
        { label: t('field.created'), value: formatDateTime(courier.created_at, locale) },
      ]} />
      <h3>{t('common.actions')}</h3>
      <StatusActionPanel entity="provider" status={cap?.status} onDone={onUpdated}
        submit={(to, form) => changeProviderStatus(courier.id, 'courier', { to, ...form })} />
      <h3>{t('common.timeline')}</h3>
      <StatusTimeline events={courier.events} />
    </>
  );
}

export default function CouriersPanel() {
  const { t } = useI18n();
  const list = usePaginatedList(fetchCouriers);
  const stats = useAsync(getCourierStats);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const { status, data, error } = list.state;
  const filters = [{ key: 'account_status', label: t('field.accountStatus'), options: enumOptions(t, 'status', ACCOUNT_STATUSES) }];

  const refresh = () => { list.reload(); stats.reload(); };
  const handleCreate = async (input) => { await createCourier(input); setCreating(false); refresh(); };
  const handleUpdated = (updated) => { setSelected((s) => ({ ...s, ...updated })); refresh(); };

  return (
    <div>
      {stats.data && (
        <div className="stats">
          {STAT_KEYS.map((key) => <StatCard key={key} label={t(`courier.${key}`)} value={stats.data[key]} />)}
        </div>
      )}
      <div className="toolbar">
        <FilterBar search={list.search} onSearch={list.setSearch} searchPlaceholder={t('common.search')}
          filters={filters} values={list.filters} onFilter={list.setFilter} allLabel={t('common.all')} />
        <Button variant="primary" className="toolbar__push" onClick={() => setCreating(true)}>＋ {t('courier.new')}</Button>
      </div>
      <AsyncView status={status} error={error} isEmpty={data?.total === 0} onRetry={list.reload}>
        {data && (
          <>
            <div className="courier-grid">
              {data.items.map((c) => <CourierCard key={c.id} courier={c} onOpen={setSelected} />)}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={list.setPage}
              labels={{ prev: t('common.prev'), next: t('common.next'), page: t('common.page', { page: data.page, total: data.totalPages }) }} />
          </>
        )}
      </AsyncView>
      <Modal open={creating} title={t('courier.new')} closeLabel={t('common.close')} onClose={() => setCreating(false)}>
        <CourierForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>
      <Modal open={!!selected} wide title={selected?.display_name ?? ''} closeLabel={t('common.close')} onClose={() => setSelected(null)}>
        {selected && <CourierDetail courier={selected} onUpdated={handleUpdated} />}
      </Modal>
    </div>
  );
}
