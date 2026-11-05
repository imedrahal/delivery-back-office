import Avatar from '../ui/Avatar.jsx';
import StatusBadge from './StatusBadge.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { courierCapability } from '../../domain/couriers.js';
import { label } from '../../i18n/labels.js';

export default function CourierCard({ courier, onOpen }) {
  const { t } = useI18n();
  const profile = courier.courier_profile;
  const { average, count } = courier.rating ?? { average: null, count: 0 };
  return (
    <button type="button" className="card courier" onClick={() => onOpen(courier)}>
      <span className="courier__head">
        <Avatar name={courier.display_name} />
        <span className="courier__id">
          <strong>{courier.display_name}</strong>
          <span className="muted">{label(t, 'vehicle', profile?.vehicle)}{profile?.zone ? ` · ${profile.zone}` : ''}</span>
        </span>
        <StatusBadge status={courierCapability(courier)?.status} />
      </span>
      <span className="courier__info">
        <span dir="ltr">{courier.phone}</span>
        <span dir="ltr" className="muted">{courier.email}</span>
      </span>
      <span className="courier__rating stars">{average === null ? '—' : `${average} ★ (${count})`}</span>
    </button>
  );
}
