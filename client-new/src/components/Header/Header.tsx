import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { toggleTheme, setLanguage, toggleMobileMenu } from '../../store/slices/uiSlice';
import { fetchCoinBalance } from '../../store/slices/coinsSlice';
import { t } from '../../i18n';
import styles from './Header.module.css';
import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import SearchModal from '../SearchModal/SearchModal';
import { Coins } from 'lucide-react';
import { FULL_ACCESS_ROLES, type UserRole } from '../../types';

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
);
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{width:14,height:14,strokeWidth:2}}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
);

export default function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const { theme, language } = useAppSelector(s => s.ui);
  const { balance } = useAppSelector(s => s.coins);
  const lang = t(language);
  const themeBtnRef = useRef<HTMLButtonElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Subscribe to unread count from NotificationToast via custom event instead of polling
  useEffect(() => {
    if (!user) return;
    const handler = (e: Event) => {
      let count = (e as CustomEvent).detail as number;
      if (['owner', 'admin', 'deputy_owner'].includes(user.role)) {
        const resolved = JSON.parse(localStorage.getItem('resolved-notifications') || '[]');
        const totalMock = 3 - resolved.filter((id: string) => ['mock-crit-1', 'mock-crit-2', 'mock-crit-3'].includes(id)).length;
        const hasReadMock = localStorage.getItem('mock-notifications-read') === 'true';
        if (!hasReadMock) {
          count += totalMock;
        }
      }
      setUnreadCount(count);
    };
    window.addEventListener('unread-count-update', handler);

    // Initial check
    if (['owner', 'admin', 'deputy_owner'].includes(user.role)) {
      const resolved = JSON.parse(localStorage.getItem('resolved-notifications') || '[]');
      const totalMock = 3 - resolved.filter((id: string) => ['mock-crit-1', 'mock-crit-2', 'mock-crit-3'].includes(id)).length;
      const hasReadMock = localStorage.getItem('mock-notifications-read') === 'true';
      if (!hasReadMock) {
        setUnreadCount(prev => prev + totalMock);
      }
    }

    return () => window.removeEventListener('unread-count-update', handler);
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      let list = [...data];
      if (user && ['owner', 'admin', 'deputy_owner'].includes(user.role)) {
        const resolved = JSON.parse(localStorage.getItem('resolved-notifications') || '[]');
        const criticalMock = [
          {
            id: 'mock-crit-1',
            title: 'Расхождение отметок по задаче #1043',
            message: 'Начальник Смирнов А. поставил "Сдано в срок", но файл отправлен на 2 дня позже дедлайна. Исполнитель: Сидорова М.',
            type: 'critical_divergence',
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-crit-2',
            title: 'Непроведенный разбор KPI подчинённого',
            message: 'Начальник Смирнов А. не провел разбор падения KPI сотрудника Сидорова М. в течение 5 дней.',
            type: 'critical_warning',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'mock-crit-3',
            title: 'Зависшее тестирование идеи сотрудника',
            message: 'Идея "Автоматическое планирование" сотрудника Иванов И. находится в тестировании уже 16 дней.',
            type: 'critical_info',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          }
        ];
        const filteredMock = criticalMock.filter(m => !resolved.includes(m.id));
        list = [...filteredMock, ...list];
        localStorage.setItem('mock-notifications-read', 'true');
      }
      setNotifications(list);
      setShowNotifications(true);
      await api.put('/notifications/read-all');
      setUnreadCount(0);
    } catch {
      setNotifications([]);
      setShowNotifications(true);
    }
  };

  const handleLogout = () => {
    api.post('/auth/logout', null, { _silent401: true } as any).catch(() => {}).finally(() => {
      dispatch(logout());
      navigate('/login');
    });
  };

  useEffect(() => {
    if (user) dispatch(fetchCoinBalance());
  }, [dispatch, user]);

  const [conferenceActive, setConferenceActive] = useState(false);

  const fetchConferenceStatus = async () => {
    try {
      const { data } = await api.get('/conference');
      setConferenceActive(data.active);
    } catch (e) {
      console.error('Failed to fetch conference status:', e);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchConferenceStatus();
    const interval = setInterval(fetchConferenceStatus, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleCreateConference = async () => {
    try {
      await api.post('/conference');
      setConferenceActive(true);
      window.open('https://agile-coll.vercel.app/', '_blank');
    } catch (e) {
      console.error('Failed to create conference:', e);
    }
  };

  const handleStopConference = async () => {
    try {
      await api.delete('/conference');
      setConferenceActive(false);
    } catch (e) {
      console.error('Failed to stop conference:', e);
    }
  };

  const handleJoinConference = () => {
    window.open('https://agile-coll.vercel.app/', '_blank');
  };

  const isPrivileged = user && ['owner', 'admin', 'deputy_owner'].includes(user.role);

  const renderConferenceButtons = () => {
    if (!user) return null;
    if (conferenceActive) {
      return (
        <div className={styles.confGroup}>
          <button className={`btn btn-sm ${styles.joinBtn}`} onClick={handleJoinConference}>
            Присоединиться
          </button>
          {isPrivileged && (
            <button className={`btn btn-sm ${styles.stopBtn}`} onClick={handleStopConference} title="Завершить конференцию">
              Завершить
            </button>
          )}
        </div>
      );
    } else {
      if (isPrivileged) {
        return (
          <button className={`btn btn-sm ${styles.createBtn}`} onClick={handleCreateConference}>
            Создать конференцию
          </button>
        );
      }
    }
    return null;
  };

  if (!user) return null;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={`${styles.iconBtn} mobile-only`} onClick={() => dispatch(toggleMobileMenu())} aria-label="Menu">
          <MenuIcon />
        </button>
        <div className={styles.logo} onClick={() => navigate('/')}>
          <img
            src={theme === 'dark' ? '/logo-light.svg' : '/logo-dark.svg'}
            alt="Agile.Workspace"
            className={styles.logoImg}
          />
        </div>
      </div>

      <div id="header-project-slot" className={styles.projectSlot} />

      <div className={styles.right}>
        <button className={styles.iconBtn} onClick={() => setShowSearch(true)} aria-label="Search (Ctrl+K)">
          <SearchIcon />
        </button>

        <div className={styles.langSwitch}>
          {(['ru', 'ka', 'en', 'ar'] as const).map((code) => (
            <button
              key={code}
              className={`${styles.langBtn} ${language === code ? styles.langActive : ''}`}
              onClick={() => dispatch(setLanguage(code))}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          ref={themeBtnRef}
          className={styles.iconBtn}
          aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          onClick={() => {
            const rect = themeBtnRef.current?.getBoundingClientRect();
            if (rect) {
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              window.dispatchEvent(new CustomEvent('theme-toggle-click', { detail: { x, y } }));
            }
            dispatch(toggleTheme());
          }}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>

        <div className={styles.notifWrap}>
          <button className={styles.iconBtn} onClick={loadNotifications} aria-label="Notifications">
            <BellIcon />
            {unreadCount > 0 && <span className={styles.notifBadge} style={{ animation: 'badgePulse 2s ease-in-out infinite' }} />}
          </button>
          {showNotifications && (
            <>
              <div className={styles.notifOverlay} onClick={() => setShowNotifications(false)} />
              <div className={styles.notifDropdown}>
                <h4>{lang.nav.notifications}</h4>
                {notifications.length === 0 ? (
                  <p className={styles.notifEmpty}>{lang.common.noData}</p>
                ) : (
                  notifications.map((n) => {
                    const borderColor = (n.type === 'deadline_overdue' || n.type === 'critical_divergence') 
                      ? '#dc2626' 
                      : (n.type === 'deadline_today' || n.type === 'critical_warning') 
                        ? '#f59e0b' 
                        : (n.type === 'deadline_soon' || n.type === 'critical_info') 
                          ? '#3b82f6' 
                          : undefined;
                    return (
                    <div key={n.id} className={styles.notifItem} onClick={() => { if (n.link && typeof n.link === 'string' && n.link.startsWith('/')) { navigate(n.link); setShowNotifications(false); } }} style={{ cursor: n.link ? 'pointer' : undefined, borderLeftColor: borderColor }}>
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                      {n.type === 'critical_divergence' && (
                        <div style={{ marginTop: 8 }}>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            style={{
                              fontSize: '11px',
                              padding: '4px 8px',
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const resolved = JSON.parse(localStorage.getItem('resolved-notifications') || '[]');
                              resolved.push(n.id);
                              localStorage.setItem('resolved-notifications', JSON.stringify(resolved));
                              setNotifications(prev => prev.filter(x => x.id !== n.id));
                              alert('Расхождение успешно исправлено. Начальнику отправлено соответствующее извещение.');
                              window.dispatchEvent(new Event('divergence-fixed'));
                            }}
                          >
                            Исправить расхождение вручную
                          </button>
                        </div>
                      )}
                      <small style={{ display: 'block', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</small>
                    </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>


        <div className={styles.userInfo} onClick={() => navigate('/profile')}>
          <div className="avatar avatar-sm">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 6, objectFit: 'cover' }} />
            ) : (
              (user.name || '?')[0].toUpperCase()
            )}
          </div>
          <span className={`${styles.userName} desktop-only`}>{user.name}</span>
        </div>

        <button className={`btn btn-ghost btn-sm`} onClick={handleLogout} style={{ gap: 4 }} aria-label={lang.nav.logout}>
          <LogoutIcon />
          <span className="desktop-only">{lang.nav.logout}</span>
        </button>
      </div>

      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
    </header>
  );
}
