export default function Button({ variant = 'secondary', type = 'button', className = '', ...props }) {
  return <button type={type} className={`btn btn--${variant} ${className}`.trim()} {...props} />;
}
