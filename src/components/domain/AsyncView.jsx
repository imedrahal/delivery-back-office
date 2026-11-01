import { EmptyState, ErrorState, LoadingState } from '../ui/StateViews.jsx';
import { errorCode } from '../../domain/errors.js';
import { useI18n } from '../../context/I18nContext.jsx';

/** loading / error / empty / content. With `hasData`, a refresh keeps the content visible (dimmed). */
export default function AsyncView({ status, error, isEmpty, hasData = false, onRetry, children }) {
  const { t } = useI18n();
  if (status === 'loading' && !hasData) return <LoadingState label={t('common.loading')} />;
  if (status === 'error') {
    return <ErrorState message={t(`error.${errorCode(error)}`)} retryLabel={t('common.retry')} onRetry={onRetry} />;
  }
  if (isEmpty) return <EmptyState label={t('common.empty')} />;
  return <div className={status === 'loading' ? 'is-refreshing' : undefined} aria-busy={status === 'loading'}>{children}</div>;
}
