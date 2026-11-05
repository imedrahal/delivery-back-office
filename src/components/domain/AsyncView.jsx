import { EmptyState, ErrorState, LoadingState } from '../ui/StateViews.jsx';
import { errorCode } from '../../domain/errors.js';
import { useI18n } from '../../context/I18nContext.jsx';

/** Maps a request status to loading / error / empty / content. */
export default function AsyncView({ status, error, isEmpty, onRetry, children }) {
  const { t } = useI18n();
  if (status === 'loading') return <LoadingState label={t('common.loading')} />;
  if (status === 'error') {
    return <ErrorState message={t(`error.${errorCode(error)}`)} retryLabel={t('common.retry')} onRetry={onRetry} />;
  }
  if (isEmpty) return <EmptyState label={t('common.empty')} />;
  return children;
}
