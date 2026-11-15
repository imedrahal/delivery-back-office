import { useState } from 'react';
import AsyncView from '../components/domain/AsyncView.jsx';
import Avatar from '../components/ui/Avatar.jsx';
import DetailGrid from '../components/ui/DetailGrid.jsx';
import FilterBar from '../components/ui/FilterBar.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { usePaginatedList } from '../hooks/usePaginatedList.js';
import { listResource } from '../services/backOfficeApi.js';

const PAGE_SIZE = 6;
const fetchRatings = (query) => listResource('ratings', { ...query, pageSize: PAGE_SIZE });

function ratingLabel(score, locale) {
  if (score === null || score === undefined) return '—';
  return Number(score).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function RatingStars({ score, locale, emptyLabel }) {
  const label = score === null || score === undefined
    ? emptyLabel
    : `${ratingLabel(score, locale)} / 5`;
  const fill = score === null || score === undefined ? 0 : `${Math.max(0, Math.min(5, score)) * 20}%`;
  return (
    <span className="rating-stars" role="img" aria-label={label} title={label} dir="ltr">
      <span className="rating-stars__base" aria-hidden="true">★★★★★</span>
      <span className="rating-stars__fill" style={{ width: fill }} aria-hidden="true">★★★★★</span>
    </span>
  );
}

function RatingCard({ item, onOpen, t, locale }) {
  const countLabel = item.rating_count === 1 ? 'rating.countOne' : 'rating.countMany';
  return (
    <button type="button" className="card rating-card" onClick={() => onOpen(item)}>
      <span className="rating-card__identity">
        <Avatar name={item.provider_name} />
        <span className="rating-card__name">
          <strong>{item.provider_name}</strong>
          <span className="muted">{t('nav.couriers')}</span>
        </span>
        <span className="rating-card__score">{ratingLabel(item.score, locale)}<small> / 5</small></span>
      </span>
      <span className="rating-card__summary">
        <RatingStars score={item.score} locale={locale} emptyLabel={t('rating.noRating')} />
        <span className="rating-card__count">
          {t(countLabel, { count: item.rating_count })}
        </span>
      </span>
      <span className="rating-card__hint">{t('rating.viewDetails')} <span aria-hidden="true">→</span></span>
    </button>
  );
}

function RatingDetail({ item }) {
  const { t, locale } = useI18n();
  const countLabel = item.rating_count === 1 ? 'rating.countOne' : 'rating.countMany';
  return (
    <div className="rating-detail">
      <div className="rating-detail__score">
        <Avatar name={item.provider_name} />
        <strong>{ratingLabel(item.score, locale)}<small> / 5</small></strong>
        <RatingStars score={item.score} locale={locale} emptyLabel={t('rating.noRating')} />
      </div>
      <DetailGrid items={[
        { label: t('field.courier'), value: item.provider_name },
        { label: t('field.ratingCount'), value: t(countLabel, { count: item.rating_count }) },
      ]} />
    </div>
  );
}

export default function RatingsPage() {
  const { t, locale } = useI18n();
  const list = usePaginatedList(fetchRatings);
  const [selected, setSelected] = useState(null);
  const { status, data, error } = list.state;

  return (
    <section>
      <PageHeader title={t('nav.ratings')} />
      <FilterBar search={list.search} onSearch={list.setSearch} searchPlaceholder={t('common.search')}
        filters={[]} values={list.filters} onFilter={list.setFilter} allLabel={t('common.all')} />
      <AsyncView status={status} error={error} isEmpty={data?.total === 0} onRetry={list.reload}>
        {data && (
          <>
            <div className="rating-grid">
              {data.items.map((item) => (
                <RatingCard key={item.id} item={item} onOpen={setSelected} t={t} locale={locale} />
              ))}
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onChange={list.setPage}
              labels={{ prev: t('common.prev'), next: t('common.next'), page: t('common.page', { page: data.page, total: data.totalPages }) }} />
          </>
        )}
      </AsyncView>
      <Modal open={!!selected} title={selected?.provider_name ?? ''} closeLabel={t('common.close')} onClose={() => setSelected(null)}>
        {selected && <RatingDetail item={selected} />}
      </Modal>
    </section>
  );
}
