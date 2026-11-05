import { initials } from '../../domain/couriers.js';

const hueOf = (text) => [...text].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 360, 7);

export default function Avatar({ name }) {
  return <span className="avatar" style={{ '--h': hueOf(name) }} aria-hidden="true">{initials(name)}</span>;
}
