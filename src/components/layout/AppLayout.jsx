import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { NAV_ITEMS } from '../../config/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../context/I18nContext.jsx';

export default function AppLayout() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand"><span className="sidebar__logo">⚡</span>{t('app.title')}</div>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <span className="nav-link__icon" aria-hidden="true">{item.icon}</span>{t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="shell__main">
        <div className="topbar">
          <LanguageSwitcher />
          <span className="muted">{user?.display_name}</span>
          <Button onClick={logout}>{t('nav.logout')}</Button>
        </div>
        <main className="content"><div key={pathname} className="page"><Outlet /></div></main>
      </div>
    </div>
  );
}
