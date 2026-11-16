import PageHeader from '../components/ui/PageHeader.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import CouriersPanel from './karya/CouriersPanel.jsx';

export default function KaryaPage() {
  const { t } = useI18n();
  return (
    <section>
      <PageHeader title={t('nav.karya')} />
      <div className="page"><CouriersPanel /></div>
    </section>
  );
}
