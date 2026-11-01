import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import BrandMark from './BrandMark.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import Icon from '../ui/Icon.jsx';
import { NAV_ITEMS } from '../../config/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../context/I18nContext.jsx';
import { initials } from '../../domain/format.js';

export default function AppLayout() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="shell">
      <div className={`scrim ${menuOpen ? 'is-visible' : ''}`} onClick={closeMenu} />
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="brand"><BrandMark /><span>{t('app.title')}</span></div>
        <nav className="sidebar__nav" aria-label={t('nav.menu')}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end} onClick={closeMenu}
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <Icon name={item.icon} />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" aria-label={t('nav.menu')} onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="topbar__spacer" />
          <LanguageSwitcher />
          <div className="topbar__user">
            <span className="avatar" aria-hidden="true">{initials(user?.display_name)}</span>
            <span className="topbar__name">{user?.display_name}</span>
            <button type="button" className="icon-btn" aria-label={t('nav.logout')} title={t('nav.logout')} onClick={logout}>
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
