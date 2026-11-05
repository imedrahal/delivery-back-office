import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import CouriersPanel from './karya/CouriersPanel.jsx';
import KaryaRequests from './karya/KaryaRequests.jsx';

const TABS = [
  { id: 'requests', labelKey: 'karya.tab.requests' },
  { id: 'couriers', labelKey: 'karya.tab.couriers' },
];

export default function KaryaPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState('requests');
  return (
    <section>
      <PageHeader title={t('nav.karya')} />
      <Tabs tabs={TABS.map((x) => ({ id: x.id, label: t(x.labelKey) }))} active={tab} onChange={setTab} />
      <div key={tab} className="page">{tab === 'requests' ? <KaryaRequests /> : <CouriersPanel />}</div>
    </section>
  );
}
