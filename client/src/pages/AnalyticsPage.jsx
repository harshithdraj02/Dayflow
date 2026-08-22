import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Users, DollarSign, Calendar, TrendingUp, BarChart3, PieChart as PieIcon, ShieldAlert } from 'lucide-react';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

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
      <div style={{ textAlign: 'center', padding: '64px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <ShieldAlert size={40} color="var(--accent-red-light)" style={{ marginBottom: 12 }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Access Restricted</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Only HR Officers and Administrators can view organization analytics.</p>
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
        <div>
          <h1>Workforce Analytics & Trends</h1>
          <p>Real-time attendance trends, headcount distributions, and compensation budget insights</p>
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

        {/* Headcount Distribution Donut */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, backdropFilter: 'blur(20px)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieIcon size={18} color="var(--secondary-light)" />
            <span>Department Headcount Distribution</span>
          </h3>
          <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={deptStats}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deptStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-elevated)', 
                    borderColor: 'var(--border-light)', 
                    borderRadius: 10,
                    boxShadow: 'var(--shadow-lg)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Payroll Breakdown Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, backdropFilter: 'blur(20px)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Department Payroll Budget Allocation
        </h3>
        <div className="data-table-wrapper" style={{ marginTop: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Staff Count</th>
                <th>Monthly Budget</th>
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
                    <td style={{ fontWeight: 700 }}>{dept.department}</td>
                    <td>{dept.count} members</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{fmt(dept.total_wage)}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(dept.avg_wage)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 44 }}>{share}%</span>
                        <div style={{ flex: 1, height: 7, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${share}%`, background: COLORS[index % COLORS.length], borderRadius: 4 }} />
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
  );
}
