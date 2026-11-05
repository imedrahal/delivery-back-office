import { useMemo, useState } from 'react';
import DataTable from '../ui/DataTable.jsx';
import FilterBar from '../ui/FilterBar.jsx';
import Modal from '../ui/Modal.jsx';
import PageHeader from '../ui/PageHeader.jsx';
import Pagination from '../ui/Pagination.jsx';
import AsyncView from './AsyncView.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { usePaginatedList } from '../../hooks/usePaginatedList.js';
import { enumOptions } from '../../i18n/labels.js';

/**
 * Config-driven list + detail page.
 *  columns:  [{ key, labelKey, render?(item, { t, locale }) }]
 *  filters:  [{ key, labelKey, values, optionPrefix }]
 *  renderDetail({ item, onUpdated }) → node ; detailTitle(item) → string
 */
export default function ResourcePage({ titleKey, fetcher, columns, filters = [], renderDetail, detailTitle, showHeader = true }) {
  const { t, locale } = useI18n();
  const list = usePaginatedList(fetcher);
  const [selected, setSelected] = useState(null);
  const { status, data, error } = list.state;

  const tableColumns = useMemo(
    () => columns.map((c) => ({
      key: c.key,
      header: t(c.labelKey),
      render: (row) => (c.render ? c.render(row, { t, locale }) : row[c.key] ?? '—'),
    })),
    [columns, t, locale],
  );
  const filterDefs = useMemo(
    () => filters.map((f) => ({ key: f.key, label: t(f.labelKey), options: enumOptions(t, f.optionPrefix, f.values) })),
    [filters, t],
  );

  const handleUpdated = (item) => { setSelected(item); list.reload(); };

  return (
    <section>
      {showHeader && <PageHeader title={t(titleKey)} />}
      <FilterBar search={list.search} onSearch={list.setSearch} searchPlaceholder={t('common.search')}
        filters={filterDefs} values={list.filters} onFilter={list.setFilter} allLabel={t('common.all')} />
      <AsyncView status={status} error={error} isEmpty={data?.total === 0} onRetry={list.reload}>
        {data && (
          <>
            <DataTable columns={tableColumns} rows={data.items} onRowClick={setSelected} />
            <Pagination page={data.page} totalPages={data.totalPages} onChange={list.setPage}
              labels={{ prev: t('common.prev'), next: t('common.next'), page: t('common.page', { page: data.page, total: data.totalPages }) }} />
          </>
        )}
      </AsyncView>
      <Modal open={!!selected} wide title={selected ? detailTitle(selected) : ''} closeLabel={t('common.close')} onClose={() => setSelected(null)}>
        {selected && renderDetail({ item: selected, onUpdated: handleUpdated })}
      </Modal>
    </section>
  );
}
