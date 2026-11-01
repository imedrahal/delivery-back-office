export default function PageHeader({ title, children }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      {children}
    </header>
  );
}
