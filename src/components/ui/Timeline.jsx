/** items: [{ id, title, meta, body }] */
export default function Timeline({ items, emptyLabel }) {
  if (items.length === 0) return <p className="muted">{emptyLabel}</p>;
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={item.id} className="timeline__item">
          <div className="timeline__title">{item.title}</div>
          <div className="timeline__meta">{item.meta}</div>
          {item.body && <div className="timeline__body">{item.body}</div>}
        </li>
      ))}
    </ol>
  );
}
