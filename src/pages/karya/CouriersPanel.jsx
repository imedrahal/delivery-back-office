import { useState } from 'react';
import AsyncView from '../../components/domain/AsyncView.jsx';
import StatusBadge from '../../components/domain/StatusBadge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import DetailGrid from '../../components/ui/DetailGrid.jsx';
import FilterBar from '../../components/ui/FilterBar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import TransporterForm from './TransporterForm.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { ACCOUNT_STATUSES } from '../../domain/constants.js';
import { errorCode } from '../../domain/errors.js';
import { usePaginatedList } from '../../hooks/usePaginatedList.js';
import { enumOptions } from '../../i18n/labels.js';
import { createTransporter, listResource, setTransporterActive } from '../../services/backOfficeApi.js';

const fetchTransporters = (query) => listResource('transporters', { ...query, pageSize: 9 });

function TransporterCard({ transporter, onOpen, t }) {
  return (
    <button type="button" className="card transporter-card" onClick={() => onOpen(transporter)}>
      <span className="transporter-card__cover">
        {transporter.photoUrl
          ? <img src={transporter.photoUrl} alt="" className="transporter-card__photo" />
          : <span className="transporter-card__avatar"><Avatar name={transporter.name} /></span>}
        <StatusBadge status={transporter.account_status} />
      </span>
      <span className="transporter-card__body">
        <strong className="transporter-card__name">{transporter.name}</strong>
        <span className="transporter-card__vehicle">{transporter.vehicleType}</span>
        <span className="transporter-card__meta">
          <span aria-hidden="true">⌖</span> {transporter.city || t('common.none')}
        </span>
        <span className="transporter-card__meta">
          <span aria-hidden="true">☎</span> <bdi dir="ltr">{transporter.phone}</bdi>
        </span>
      </span>
      <span className="transporter-card__footer">{t('transporter.openProfile')} <span aria-hidden="true">→</span></span>
    </button>
  );
}

function TransporterDetail({ transporter, onUpdated }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const active = transporter.active;

  const toggleActive = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await setTransporterActive(transporter.id, !active);
      onUpdated({ ...transporter, ...updated, account_status: updated.active ? 'ACTIVE' : 'DEACTIVATED' });
    } catch (requestError) {
      setError(errorCode(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="transporter-detail">
      <div className="transporter-detail__identity">
        {transporter.photoUrl
          ? <img src={transporter.photoUrl} alt="" className="transporter-detail__photo" />
          : <Avatar name={transporter.name} />}
        <div>
          <strong>{transporter.name}</strong>
          <span>{transporter.city || t('common.none')}</span>
        </div>
        <StatusBadge status={transporter.account_status} />
      </div>
      <DetailGrid items={[
        { label: t('field.phone'), value: <bdi dir="ltr">{transporter.phone}</bdi> },
        { label: t('field.vehicle'), value: transporter.vehicleType },
        { label: t('field.vehicleDescription'), value: transporter.vehicleDescription },
        { label: t('field.capacity'), value: transporter.capacity },
        { label: t('field.description'), value: transporter.description },
      ]} />
      {error && <p className="field__error" role="alert">{t(`error.${error}`)}</p>}
      <div className="transporter-detail__actions">
        <Button
          variant={active ? 'danger-outline' : 'primary'}
          onClick={toggleActive}
          disabled={busy}
        >
          {busy ? t('transporter.saving') : t(active ? 'transporter.hideAccount' : 'transporter.activateAccount')}
        </Button>
      </div>
    </div>
  );
}

export default function CouriersPanel() {
  const { t } = useI18n();
  const list = usePaginatedList(fetchTransporters);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const { status, data, error } = list.state;
  const filters = [{
    key: 'account_status',
    label: t('field.accountStatus'),
    options: enumOptions(t, 'status', ACCOUNT_STATUSES),
  }];
  const handleUpdated = (updated) => {
    setSelected(updated);
    list.reload();
  };
  const handleCreate = async (input) => {
    await createTransporter(input);
    setCreating(false);
    if (list.page === 1) list.reload();
    else list.setPage(1);
  };

  return (
    <section className="transporter-directory">
      <div className="transporter-directory__intro">
        <div>
          <span className="transporter-directory__eyebrow">{t('nav.karya')}</span>
          <h2>{t('transporter.directoryTitle')}</h2>
          <p>{t('transporter.directoryDescription')}</p>
        </div>
        <div className="transporter-directory__tools">
          {data && <span className="transporter-directory__count">{t('transporter.count', { count: data.total })}</span>}
          <Button variant="primary" onClick={() => setCreating(true)}>＋ {t('transporter.add')}</Button>
        </div>
      </div>
      <FilterBar search={list.search} onSearch={list.setSearch} searchPlaceholder={t('common.search')}
        filters={filters} values={list.filters} onFilter={list.setFilter} allLabel={t('common.all')} />
      <AsyncView status={status} error={error} isEmpty={data?.total === 0} onRetry={list.reload}>
        {data && (
          <>
            <div className="transporter-grid">
              {data.items.map((transporter) => (
                <TransporterCard key={transporter.id} transporter={transporter} onOpen={setSelected} t={t} />
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={list.setPage}
              labels={{ prev: t('common.prev'), next: t('common.next'), page: t('common.page', { page: data.page, total: data.totalPages }) }} />
          </>
        )}
      </AsyncView>
      <Modal open={creating} wide title={t('transporter.addTitle')} closeLabel={t('common.close')} onClose={() => setCreating(false)}>
        <TransporterForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
      </Modal>
      <Modal open={!!selected} wide title={selected?.name ?? ''} closeLabel={t('common.close')} onClose={() => setSelected(null)}>
        {selected && <TransporterDetail transporter={selected} onUpdated={handleUpdated} />}
      </Modal>
    </section>
  );
}
