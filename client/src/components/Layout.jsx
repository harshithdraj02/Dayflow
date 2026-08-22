import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  Users, 
  Clock, 
  CalendarDays, 
  User, 
  LogOut, 
  Settings, 
  BarChart3, 
  DollarSign, 
  ChevronRight, 
  Bell, 
  X,
  Sparkles,
  Layers
} from 'lucide-react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
          <NavLink to="/" className="brand-logo-container">
            <div className="brand-icon-box">
              <Sparkles size={22} color="#ffffff" />
            </div>
            <span className="brand-text">Dayflow</span>
            {user?.company_name && (
              <div className="brand-company-badge">
                {user.company_logo && (
                  <img src={user.company_logo} alt={user.company_name} className="brand-company-logo-img" />
                )}
                <span>{user.company_name}</span>
              </div>
            )}
          </NavLink>

          <nav className="header-nav">
            <NavLink 
              to="/" 
              end 
              className={({ isActive }) => `header-nav-item ${isActive || location.pathname === '/employees' ? 'active' : ''}`}
            >
              <Users size={16} />
              <span>Directory</span>
            </NavLink>
            <NavLink 
              to="/attendance" 
              className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}
            >
              <Clock size={16} />
              <span>Attendance</span>
            </NavLink>
            <NavLink 
              to="/time-off" 
              className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}
            >
              <CalendarDays size={16} />
              <span>Time Off</span>
            </NavLink>
            {isAdmin && (
              <>
                <NavLink 
                  to="/payroll" 
                  className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}
                >
                  <DollarSign size={16} />
                  <span>Payroll</span>
                </NavLink>
                <NavLink 
                  to="/analytics" 
                  className={({ isActive }) => `header-nav-item ${isActive ? 'active' : ''}`}
                >
                  <BarChart3 size={16} />
                  <span>Analytics</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="header-right">
          {/* Live Punch-In Status Toggle */}
          <div style={{ position: 'relative' }} ref={statusRef}>
            <div 
              className="punch-status-widget"
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              title={isCheckedIn ? 'Checked In — Click for options' : isCheckedOut ? 'Session Completed' : 'Not Checked In'}
            >
              <div className={`status-dot ${isCheckedIn ? 'checked-in' : isCheckedOut ? 'checked-out' : ''}`} />
              <span className="punch-status-text">
                {isCheckedIn ? `In ${todayStatus.check_in}` : isCheckedOut ? 'Shift Done' : 'Punch In'}
              </span>
            </div>

            {showStatusPopover && (
              <div className="user-menu" style={{ width: 260, top: 'calc(100% + 10px)' }}>
                <div className="user-menu-header">
                  <div className="user-menu-name">Attendance Punch</div>
                  <div className="user-menu-email">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </div>

                <div style={{ padding: '8px 12px' }}>
                  {isCheckedIn ? (
                    <>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Checked in at <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{todayStatus.check_in}</span>
                      </div>
                      <button 
                        className="btn btn-danger btn-sm btn-full" 
                        onClick={handleCheckOut} 
                        disabled={checkingIn}
                      >
                        {checkingIn ? 'Clocking Out...' : 'Clock Out Session'}
                      </button>
                    </>
                  ) : isCheckedOut ? (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      <p>Session completed for today.</p>
                      <p style={{ marginTop: 4, fontWeight: 600, color: 'var(--text-primary)' }}>
                        In: {todayStatus.check_in} → Out: {todayStatus.check_out}
                      </p>
                      <p style={{ marginTop: 4, fontSize: 12, color: 'var(--accent-green)' }}>
                        Total: {todayStatus.work_hours?.toFixed(1)}h worked
                      </p>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Start your workday and record your check-in.
                      </p>
                      <button 
                        className="btn btn-success btn-sm btn-full" 
                        onClick={handleCheckIn} 
                        disabled={checkingIn}
                      >
                        {checkingIn ? 'Punching In...' : 'Punch In Now'} <ChevronRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notification Slideout Drawer */}
          <div className="notification-bell-container" ref={notifRef} style={{ position: 'relative' }}>
            <button 
              className={`btn-notification ${notifications.some(n => !n.is_read) ? 'has-unread' : ''}`}
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              title="Notifications"
            >
              <Bell size={18} />
              {notifications.some(n => !n.is_read) && (
                <span className="notification-badge" />
              )}
            </button>

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
                        className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                        onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                      >
                        <div className="notif-item-header">
                          <span className="notif-title">{n.title}</span>
                          {!n.is_read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-light)' }} />}
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

          {/* User Profile Menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button 
              className="user-avatar-btn" 
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" />
                ) : (
                  initials
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <div className="user-menu-name">{user.first_name} {user.last_name}</div>
                  <div className="user-menu-email">{user.email}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-employee'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button 
                  className="user-menu-item" 
                  onClick={() => { setShowUserMenu(false); navigate(`/profile/${user.id}`); }}
                >
                  <User size={16} /> My Profile
                </button>
                {isAdmin && (
                  <button 
                    className="user-menu-item" 
                    onClick={() => { setShowUserMenu(false); navigate('/payroll'); }}
                  >
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
