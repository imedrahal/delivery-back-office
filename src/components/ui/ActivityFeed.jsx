import { Link } from 'react-router-dom';

/** items: [{ id, to, title, type, badge, meta }] */
export default function ActivityFeed({ items }) {
  return (
    <ul className="feed">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={item.to} className="feed__link">
            <span className="feed__ref">{item.title}<span className="feed__type">{item.type}</span></span>
            {item.badge}
            <span className="feed__meta">{item.meta}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
