import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';

const COLORS = ['#7c6aff', '#00d4aa', '#ff6b6b', '#ffd93d', '#60a5fa', '#a855f7'];

export default function AnalyticsPage() {
  const { isAdmin } = useAuth();
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [payrollSum, setPayrollSum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState('daily');

  const getWeeklyData = (dailyData) => {
    const weeks = {};
    dailyData.forEach(item => {
      const [year, month, day] = item.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const currentDay = dateObj.getDay();
      const dayDiff = dateObj.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const monday = new Date(dateObj.setDate(dayDiff));
      const weekLabel = `w/c ${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
      
      if (!weeks[weekLabel]) {
        weeks[weekLabel] = {
          day: weekLabel,
          present: 0,
          absent: 0,
          leave: 0,
          halfDay: 0,
          sortKey: monday.getTime()
        };
      }
      weeks[weekLabel].present += item.present || 0;
      weeks[weekLabel].absent += item.absent || 0;
      weeks[weekLabel].leave += item.leave || 0;
      weeks[weekLabel].halfDay += item.halfDay || 0;
    });
    return Object.values(weeks).sort((a, b) => a.sortKey - b.sortKey);
  };

  const getChartData = () => {
    if (trendView === 'weekly') {
      return getWeeklyData(trend);
    }
    return trend.slice(-10);
  };

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [ov, tr, dept, pay] = await Promise.all([
        api.getOverview(),
        api.getAttendanceTrend(30),
        api.getDepartmentStats(),
        api.getPayrollSummary()
      ]);
      setOverview(ov);
      setTrend(tr);
      setDeptStats(dept);
      setPayrollSum(pay);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fmt = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

  if (!isAdmin) {
    return (
      <div className="empty-state">
        <h3>Access Denied</h3>
        <p>Only HR Officers and Administrators can view organization analytics.</p>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const activePresenceRate = overview
    ? Math.round((overview.presentToday / (overview.totalEmployees || 1)) * 100)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1>HR Analytics</h1>
      </div>

      <div className="stat-cards">
        <div className="stat-card" style={{ '--card-accent': 'var(--primary)' }}>
          <div className="stat-icon"><Users size={20} /></div>
          <div className="stat-value">{overview?.totalEmployees || 0}</div>
          <div className="stat-label">Total Staff Strength</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-green)' }}>
          <div className="stat-icon" style={{ background: 'rgba(74, 222, 128, 0.1)', color: 'var(--accent-green)' }}><TrendingUp size={20} /></div>
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{activePresenceRate}%</div>
          <div className="stat-label">Today's Presence Rate</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-blue)' }}>
          <div className="stat-icon" style={{ background: 'rgba(96, 165, 250, 0.1)', color: 'var(--accent-blue)' }}><Calendar size={20} /></div>
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{overview?.onLeaveToday || 0}</div>
          <div className="stat-label">On Leave Today</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-yellow)' }}>
          <div className="stat-icon" style={{ background: 'rgba(255, 217, 61, 0.1)', color: 'var(--accent-yellow)' }}><DollarSign size={20} /></div>
          <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>{fmt(payrollSum?.summary?.total_monthly_wage)}</div>
          <div className="stat-label">Monthly Gross Spend</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Attendance Trends</h3>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 4px' }}>
              <button
                className={`btn-toggle ${trendView === 'daily' ? 'active' : ''}`}
                style={{
                  background: trendView === 'daily' ? 'var(--primary)' : 'transparent',
                  color: trendView === 'daily' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setTrendView('daily')}
              >
                Daily
              </button>
              <button
                className={`btn-toggle ${trendView === 'weekly' ? 'active' : ''}`}
                style={{
                  background: trendView === 'weekly' ? 'var(--primary)' : 'transparent',
                  color: trendView === 'weekly' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setTrendView('weekly')}
              >
                Weekly
              </button>
            </div>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--text-secondary)" />
                <YAxis allowDecimals={false} stroke="var(--text-secondary)" />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }} />
                <Legend />
                <Bar dataKey="present" fill="var(--accent-green)" name="Present" />
                <Bar dataKey="leave" fill="var(--accent-blue)" name="On Leave" />
                <Bar dataKey="halfDay" fill="#ffa500" name="Half-Day" />
                <Bar dataKey="absent" fill="var(--accent-red)" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <h3>Department Wise Staff Distribution</h3>
          <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '60%', height: '100%' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={deptStats}
                    dataKey="count"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {deptStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container" style={{ gridColumn: 'span 2' }}>
          <h3>Department Payroll Budget Breakdown</h3>
          <div className="data-table-wrapper" style={{ marginTop: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Staff Count</th>
                  <th>Total Monthly Budget</th>
                  <th>Average Monthly Wage</th>
                  <th>Budget Share</th>
                </tr>
              </thead>
              <tbody>
                {payrollSum?.byDepartment?.map((dept, index) => {
                  const share = payrollSum.summary.total_monthly_wage
                    ? ((dept.total_wage / payrollSum.summary.total_monthly_wage) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={dept.department}>
                      <td style={{ fontWeight: 600 }}>{dept.department}</td>
                      <td>{dept.count}</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{fmt(dept.total_wage)}</td>
                      <td>{fmt(dept.avg_wage)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, minWidth: 40 }}>{share}%</span>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${share}%`, background: COLORS[index % COLORS.length], borderRadius: 3 }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
