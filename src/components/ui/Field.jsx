export default function Field({ label, error, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error && <p className="field__error" role="alert">{error}</p>}
    </label>
  );
}
