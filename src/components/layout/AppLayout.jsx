import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { NAV_ITEMS } from '../../config/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useI18n } from '../../context/I18nContext.jsx';

export default function AppLayout() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [usersExpanded, setUsersExpanded] = useState(() => pathname.startsWith('/users'));
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const updateViewport = () => setIsMobile(media.matches);
    media.addEventListener('change', updateViewport);
    return () => media.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    if (pathname.startsWith('/users')) setUsersExpanded(true);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <div className="shell">
      <button
        type="button"
        className={`sidebar-scrim ${menuOpen ? 'is-visible' : ''}`}
        aria-label={t('common.closeMenu')}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />
      <aside id="app-sidebar" className={`sidebar ${menuOpen ? 'is-open' : ''}`} aria-hidden={isMobile && !menuOpen} inert={isMobile && !menuOpen ? '' : undefined}>
        <div className="sidebar__brand">
          <span className="sidebar__logo">⚡</span>
          <span>{t('app.title')}</span>
          <button type="button" className="sidebar__close" aria-label={t('common.closeMenu')} onClick={() => setMenuOpen(false)}>
            <Icon name="close" size={19} />
          </button>
        </div>
        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => item.children ? (
            <div key={item.path} className={`nav-section ${pathname.startsWith(item.path) ? 'is-active' : ''}`}>
              <button
                type="button"
                className="nav-link nav-section__toggle"
                aria-expanded={usersExpanded}
                aria-controls="users-submenu"
                onClick={() => setUsersExpanded((expanded) => !expanded)}
              >
                <span className="nav-link__icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-section__label">{t(item.labelKey)}</span>
                <span className={`nav-section__chevron ${usersExpanded ? 'is-expanded' : ''}`} aria-hidden="true">⌄</span>
              </button>
              {usersExpanded && (
                <div id="users-submenu" className="sidebar__submenu">
                  {item.children.map((child) => (
                    <NavLink key={child.path} to={child.path} onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => `nav-link nav-link--child ${isActive ? 'is-active' : ''}`}>
                      {t(child.labelKey)}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <span className="nav-link__icon" aria-hidden="true">{item.icon}</span>{t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="shell__main">
        <div className="topbar">
          <button
            type="button"
            className={`icon-btn menu-btn ${menuOpen ? 'is-open' : ''}`}
            aria-label={t(menuOpen ? 'common.closeMenu' : 'common.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="app-sidebar"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
          <span className="topbar__title">{t('app.title')}</span>
          <span className="topbar__spacer" />
          <LanguageSwitcher />
          <span className="topbar__name">{user?.display_name}</span>
          <Button className="topbar__logout" onClick={logout}><Icon name="logout" size={17} /><span>{t('nav.logout')}</span></Button>
        </div>
        <main className="content"><div key={pathname} className="page"><Outlet /></div></main>
      </div>
    </div>
  );
}
