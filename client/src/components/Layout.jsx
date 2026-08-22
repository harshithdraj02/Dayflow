import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Users, Clock, CalendarDays, User, LogOut, Settings, BarChart3, DollarSign, ChevronRight, Bell, X, Sun, Moon } from 'lucide-react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('dayflow_theme') || 'light');
  const [todayStatus, setTodayStatus] = useState(null);
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const statusRef = useRef(null);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dayflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    loadTodayStatus();
    loadNotifications();
    const interval = setInterval(loadNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatusPopover(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDrawer(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch { /* ignore */ }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      loadNotifications();
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (err) { console.error(err); }
  };

  const loadTodayStatus = async () => {
    try {
      const data = await api.getToday();
      setTodayStatus(data);
    } catch { /* ignore */ }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.checkIn();
      await loadTodayStatus();
    } catch (err) {
      alert(err.message);
    }
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await api.checkOut();
      await loadTodayStatus();
    } catch (err) {
      alert(err.message);
    }
    setCheckingIn(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isCheckedIn = todayStatus?.check_in && !todayStatus?.check_out;
  const isCheckedOut = todayStatus?.check_in && todayStatus?.check_out;
  const initials = user ? (user.first_name?.[0] || '') + (user.last_name?.[0] || '') : '?';

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <NavLink to="/" className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user?.company_logo ? (
              <img 
                src={user.company_logo} 
                alt={user.company_name || 'Logo'} 
                className="company-logo-img" 
                style={{ 
                  height: 32, 
                  width: 'auto', 
                  maxWidth: 120, 
                  objectFit: 'contain', 
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '2px 6px'
                }} 
              />
            ) : (
              <h1>Dayflow</h1>
            )}
            {user?.company_name && (
              <span 
                className="company-logo-name" 
                style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)',
                  opacity: 0.8,
                  borderLeft: '1px solid var(--border-color)',
                  paddingLeft: 10,
                  display: 'inline-block'
                }}
              >
                {user.company_name}
              </span>
            )}
          </NavLink>
          <nav className="header-nav">
            <NavLink to="/" end className={({ isActive }) => `header-nav-item ${isActive || location.pathname === '/employees' ? 'active' : ''}`}>
              <Users size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Employees
            </NavLink>
            <NavLink to="/attendance" className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}>
              <Clock size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Attendance
            </NavLink>
            <NavLink to="/time-off" className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}>
              <CalendarDays size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Time Off
            </NavLink>
            {isAdmin && (
              <>
                <NavLink to="/payroll" className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}>
                  <DollarSign size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Payroll
                </NavLink>
                <NavLink to="/analytics" className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}>
                  <BarChart3 size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Analytics
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="header-right">
          {/* Check-in/Check-out indicator */}
          <div className="status-indicator" ref={statusRef}>
            <div
              className={`status-dot ${isCheckedIn ? 'checked-in' : 'checked-out'}`}
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              title={isCheckedIn ? 'Checked In' : 'Not Checked In'}
            />
            {showStatusPopover && (
              <div className="status-popover">
                {isCheckedIn ? (
                  <>
                    <p>Checked in since <span className="time">{todayStatus.check_in}</span></p>
                    <button className="btn btn-danger btn-sm btn-full" onClick={handleCheckOut} disabled={checkingIn}>
                      {checkingIn ? 'Processing...' : 'Check Out'} <ChevronRight size={14} />
                    </button>
                  </>
                ) : isCheckedOut ? (
                  <>
                    <p>Today's session complete</p>
                    <p>In: <span className="time">{todayStatus.check_in}</span> → Out: <span className="time">{todayStatus.check_out}</span></p>
                    <p style={{ marginTop: 8, fontSize: 12 }}>Work: {todayStatus.work_hours?.toFixed(1)}h | Extra: {todayStatus.extra_hours?.toFixed(1)}h</p>
                  </>
                ) : (
                  <>
                    <p>You haven't checked in today</p>
                    <button className="btn btn-success btn-sm btn-full" onClick={handleCheckIn} disabled={checkingIn}>
                      {checkingIn ? 'Processing...' : 'Check In'} <ChevronRight size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            className="btn-notification"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            style={{ marginRight: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
          </button>

          {/* Notification Bell */}
          <div className="notification-bell-container" ref={notifRef} style={{ position: 'relative' }}>
            <button 
              className={`btn-notification ${notifications.some(n => !n.is_read) ? 'has-unread' : ''}`}
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              title="Notifications"
            >
              <Bell size={20} />
              {notifications.some(n => !n.is_read) && (
                <span className="notification-badge" />
              )}
            </button>

            {/* Slideout Drawer Panel */}
            {showNotifDrawer && (
              <div className="notification-slideout">
                <div className="notif-header">
                  <h3>Notifications</h3>
                  {notifications.some(n => !n.is_read) && (
                    <button className="btn-mark-all" onClick={handleMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                  <button className="btn-close-notif" onClick={() => setShowNotifDrawer(false)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <Bell size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <p>You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`notif-item ${n.is_read ? 'read' : 'unread'} notif-type-${n.type || 'general'}`}
                        onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      >
                        <div className="notif-item-header">
                          <span className="notif-title">{n.title}</span>
                          {!n.is_read && <span className="notif-unread-dot" />}
                        </div>
                        <p className="notif-message">{n.message}</p>
                        <span className="notif-time">
                          {new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <div className="user-avatar" onClick={() => setShowUserMenu(!showUserMenu)} style={{ overflow: 'hidden' }}>
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={`${user.first_name} ${user.last_name}`}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
            {showUserMenu && (
              <div className="user-menu">
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{user.first_name} {user.last_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user.email}</div>
                  <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-employee'}`} style={{ marginTop: 6 }}>
                    {user.role}
                  </span>
                </div>
                <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate(`/profile/${user.id}`); }}>
                  <User size={16} /> My Profile
                </button>
                {isAdmin && (
                  <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate('/payroll'); }}>
                    <DollarSign size={16} /> Payroll
                  </button>
                )}
                <div className="user-menu-divider" />
                <button className="user-menu-item danger" onClick={handleLogout}>
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
