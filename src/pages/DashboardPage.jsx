import AsyncView from '../components/domain/AsyncView.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { getDashboardStats } from '../services/backOfficeApi.js';
import { USE_DEMO_BACKEND } from '../config/runtime.js';

const STAT_KEYS = [
  'openDeliveries',
  'activeDeliveries',
  'openReturns',
  'activeTransporters',
  'inactiveTransporters',
  'openDisputes',
];

export default function DashboardPage() {
  const { t } = useI18n();
  const { status, data, error, reload } = useAsync(getDashboardStats);
  return (
    <section>
      <PageHeader title={t('dash.title')} />
      {USE_DEMO_BACKEND && <p className="demo-notice" role="status">{t('dash.demoNotice')}</p>}
      <AsyncView status={status} error={error} onRetry={reload}>
        {data && (
          <div className="stats">
            {STAT_KEYS.map((key) => <StatCard key={key} label={t(`dash.${key}`)} value={data[key]} />)}
          </div>
        )}
      </AsyncView>
    </section>
  );
}
