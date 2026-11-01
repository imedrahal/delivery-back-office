/** items: [{ label, value }] */
export default function DetailGrid({ items }) {
  return (
    <dl className="detail-grid">
      {items.map((item) => (
        <div key={item.label} className="detail-grid__row">
          <dt>{item.label}</dt>
          <dd>{typeof item.value === 'string' ? <bdi>{item.value}</bdi> : item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
