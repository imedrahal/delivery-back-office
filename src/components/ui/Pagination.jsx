import Button from './Button.jsx';

export default function Pagination({ page, totalPages, onChange, labels }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="pagination">
      <Button disabled={page <= 1} onClick={() => onChange(page - 1)}>{labels.prev}</Button>
      <span>{labels.page}</span>
      <Button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>{labels.next}</Button>
    </nav>
  );
}
