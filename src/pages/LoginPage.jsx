import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import LanguageSwitcher from '../components/layout/LanguageSwitcher.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { errorCode } from '../domain/errors.js';

export default function LoginPage() {
  const { t } = useI18n();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorCode(err));
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <form className="login__card form" onSubmit={handleSubmit}>
        <div className="login__top"><h1>{t('auth.title')}</h1><LanguageSwitcher /></div>
        <label className="field">
          <span>{t('auth.email')}</span>
          <input type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label className="field">
          <span>{t('auth.password')}</span>
          <input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </label>
        {error && <p className="field__error" role="alert">{t(`error.${error}`)}</p>}
        <Button type="submit" variant="primary" disabled={busy}>{t('auth.submit')}</Button>
        <small className="muted">{t('auth.hint', { email: 'admin@delivery.tn', password: 'Admin123!' })}</small>
      </form>
    </div>
  );
}
