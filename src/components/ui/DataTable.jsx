/** columns: [{ key, header, render(row) }] — rows and cell rendering are fully injected. */
export default function DataTable({ columns, rows, onRowClick }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} scope="col">{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={onRowClick ? 'is-clickable' : ''} onClick={() => onRowClick?.(row)}
              onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(row)} tabIndex={onRowClick ? 0 : undefined}>
              {columns.map((c) => <td key={c.key}>{c.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
