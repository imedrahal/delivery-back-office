import DetailGrid from '../components/ui/DetailGrid.jsx';
import ResourcePage from '../components/domain/ResourcePage.jsx';
import StatusActionPanel from '../components/domain/StatusActionPanel.jsx';
import StatusBadge from '../components/domain/StatusBadge.jsx';
import StatusTimeline from '../components/domain/StatusTimeline.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { ACCOUNT_STATUSES, ROLES } from '../domain/constants.js';
import { formatDateTime } from '../domain/format.js';
import { label } from '../i18n/labels.js';
import { changeProviderStatus, changeStatus, listResource } from '../services/backOfficeApi.js';

const fetchUsers = (query) => listResource('users', query);

const ratingText = ({ average, count }) => (average === null ? '—' : `${average} ★ (${count})`);

const COLUMNS = [
  { key: 'display_name', labelKey: 'field.name' },
  { key: 'email', labelKey: 'field.email' },
  { key: 'roles', labelKey: 'field.roles', render: (u, { t }) => u.roles.map((r) => label(t, 'role', r)).join(', ') },
  { key: 'rating', labelKey: 'field.rating', render: (u) => ratingText(u.rating) },
  { key: 'account_status', labelKey: 'field.accountStatus', render: (u) => <StatusBadge status={u.account_status} /> },
];
const FILTERS = [
  { key: 'account_status', labelKey: 'field.accountStatus', values: ACCOUNT_STATUSES, optionPrefix: 'status' },
  { key: 'roles', labelKey: 'field.roles', values: ROLES, optionPrefix: 'role' },
];

function UserDetail({ item, onUpdated }) {
  const { t, locale } = useI18n();
  return (
    <>
      <DetailGrid items={[
        { label: t('field.name'), value: item.display_name },
        { label: t('field.email'), value: item.email },
        { label: t('field.phone'), value: item.phone },
        { label: t('field.language'), value: item.preferred_language.toUpperCase() },
        { label: t('field.rating'), value: ratingText(item.rating) },
        { label: t('field.accountStatus'), value: <StatusBadge status={item.account_status} /> },
        { label: t('field.created'), value: formatDateTime(item.created_at, locale) },
      ]} />
      <h3>{t('field.accountStatus')}</h3>
      <StatusActionPanel entity="account" status={item.account_status} onDone={(u) => onUpdated({ ...item, ...u })}
        submit={(to, form) => changeStatus('account', item.id, { to, ...form })} />
      {item.capabilities.map((cap) => (
        <div key={cap.capability}>
          <h3>{label(t, 'capability', cap.capability)} <StatusBadge status={cap.status} /></h3>
          <StatusActionPanel entity="provider" status={cap.status} onDone={(u) => onUpdated(u)}
            submit={(to, form) => changeProviderStatus(item.id, cap.capability, { to, ...form })} />
        </div>
      ))}
      <h3>{t('common.timeline')}</h3>
      <StatusTimeline events={item.events} />
    </>
  );
}

export default function UsersPage() {
  return (
    <ResourcePage titleKey="nav.users" fetcher={fetchUsers} columns={COLUMNS} filters={FILTERS}
      detailTitle={(u) => u.display_name} renderDetail={(props) => <UserDetail {...props} />} />
  );
}
