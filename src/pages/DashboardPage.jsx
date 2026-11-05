import AsyncView from '../components/domain/AsyncView.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { getDashboardStats } from '../services/backOfficeApi.js';

const STAT_KEYS = ['openDeliveries', 'activeDeliveries', 'openReturns', 'openKarya', 'openDisputes'];

export default function DashboardPage() {
  const { t } = useI18n();
  const { status, data, error, reload } = useAsync(getDashboardStats);
  return (
    <section>
      <PageHeader title={t('dash.title')} />
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
