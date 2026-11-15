import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import LanguageSwitcher from '../components/layout/LanguageSwitcher.jsx';
import BrandMark from '../components/layout/BrandMark.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import { errorCode } from '../domain/errors.js';
import { USE_DEMO_BACKEND } from '../config/runtime.js';

export default function LoginPage() {
  const { t } = useI18n();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form.identifier, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorCode(err));
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <section className="login__brand" aria-label={t('auth.welcome')}>
        <div className="login__brand-head">
          <span className="login__brand-logo"><BrandMark /></span>
          <span>{t('app.title')}</span>
        </div>
        <div className="login__brand-content">
          <span className="login__eyebrow"><span />{t('auth.secure')}</span>
          <h2>{t('auth.welcome')}</h2>
          <p>{t('auth.subtitle')}</p>
          <div className="login__illustration" aria-hidden="true">
            <div className="login__orbit login__orbit--outer" />
            <div className="login__orbit login__orbit--inner" />
            <div className="login__route">
              <span className="login__route-node login__route-node--start"><BrandMark /></span>
              <span className="login__route-line" />
              <span className="login__route-node login__route-node--end">
                <svg viewBox="0 0 24 24" fill="none"><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7.5" cy="19" r="2" /><circle cx="17.5" cy="19" r="2" /></svg>
              </span>
            </div>
            <span className="login__floating login__floating--one" />
            <span className="login__floating login__floating--two" />
          </div>
        </div>
        <p className="login__brand-footer">{t('auth.footer')}</p>
      </section>
      <form className="login__card form" onSubmit={handleSubmit}>
        <div className="login__top">
          <div className="login__heading">
            <span className="login__welcome">{t('auth.welcomeBack')}</span>
            <h1>{t('auth.title')}</h1>
            <p>{t('auth.signInHint')}</p>
            {USE_DEMO_BACKEND && <p className="login__demo-hint" role="note">{t('auth.demoHint')}</p>}
          </div>
          <LanguageSwitcher />
        </div>
        <label className="field">
          <span>{t('auth.identifier')}</span>
          <span className="login__input-wrap">
            <svg className="login__input-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" />
            </svg>
            <input type="text" autoComplete="username" placeholder={t('auth.identifierPlaceholder')} value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
          </span>
        </label>
        <label className="field">
          <span>{t('auth.password')}</span>
          <span className="login__input-wrap">
            <svg className="login__input-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 1 1 8 0v3M12 14v3" />
            </svg>
            <input type="password" autoComplete="current-password" placeholder={t('auth.passwordPlaceholder')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </span>
        </label>
        {error && <p className="field__error" role="alert">{t(`error.${error}`)}</p>}
        <Button type="submit" variant="primary" className="login__submit" disabled={busy}>
          <span>{busy ? t('auth.signingIn') : t('auth.submit')}</span>
          {busy ? <span className="login__spinner" aria-hidden="true" /> : (
            <svg className="login__submit-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </Button>
        <p className="login__security">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>
          {t(USE_DEMO_BACKEND ? 'auth.demoSecurityNote' : 'auth.securityNote')}
        </p>
      </form>
    </div>
  );
}
