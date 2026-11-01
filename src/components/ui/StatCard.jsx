import Icon from './Icon.jsx';

export default function StatCard({ label, value, icon, tone = 'brand' }) {
  return (
    <div className={`stat stat--${tone}`}>
      <span className="stat__icon"><Icon name={icon} size={24} /></span>
      <div>
        <span className="stat__value">{value}</span>
        <span className="stat__label">{label}</span>
      </div>
    </div>
  );
}
