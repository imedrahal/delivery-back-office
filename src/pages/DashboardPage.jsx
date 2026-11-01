import { Link } from 'react-router-dom';
import AsyncView from '../components/domain/AsyncView.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ActivityFeed from '../components/ui/ActivityFeed.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { formatDateTime } from '../domain/format.js';
import { label } from '../i18n/labels.js';
import { useAsync } from '../hooks/useAsync.js';
import { getDashboardStats } from '../services/backOfficeApi.js';

const ACTIVITY_ROUTES = { DELIVERY: '/deliveries', RETURN: '/returns', KARYA: '/karya', DISPUTE: '/disputes' };
const STATS = [
  { key: 'openDeliveries', icon: 'package', tone: 'brand', to: '/deliveries' },
  { key: 'activeDeliveries', icon: 'truck', tone: 'brand', to: '/deliveries' },
  { key: 'openReturns', icon: 'undo', tone: 'warning', to: '/returns' },
  { key: 'openKarya', icon: 'tag', tone: 'brand', to: '/karya' },
  { key: 'openDisputes', icon: 'shield', tone: 'danger', to: '/disputes' },
];

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const { status, data, error, reload } = useAsync(getDashboardStats);
  return (
    <section>
      <PageHeader title={t('dash.title')} />
      <AsyncView status={status} error={error} onRetry={reload}>
        {data && (
          <>
          <div className="stats">
            {STATS.map(({ key, icon, tone, to }) => (
              <Link key={key} to={to} className="stat-link">
                <StatCard label={t(`dash.${key}`)} value={data[key]} icon={icon} tone={tone} />
              </Link>
            ))}
          </div>
          <section className="panel">
            <h2 className="panel__title">{t('dash.activity')}</h2>
            <ActivityFeed items={data.activity.map((event) => ({
              id: event.id,
              to: ACTIVITY_ROUTES[event.type],
              title: event.reference,
              type: label(t, 'jobType', event.type),
              badge: <StatusBadge status={event.status} />,
              meta: `${event.actor_name} · ${formatDateTime(event.created_at, locale)}`,
            }))} />
          </section>
          </>
        )}
      </AsyncView>
    </section>
  );
}
