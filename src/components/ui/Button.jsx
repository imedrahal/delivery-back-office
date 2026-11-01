export default function Button({ variant = 'secondary', block = false, type = 'button', className = '', ...props }) {
  return <button type={type} className={`btn btn--${variant} ${block ? 'btn--block' : ''} ${className}`.trim()} {...props} />;
}
