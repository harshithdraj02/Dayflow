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
        api.getAttendanceTrend(10),
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

      {/* KPI Cards */}
      <div className="stat-cards-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card-glass" style={{ '--card-gradient': 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <div className="stat-card-info">
            <span className="stat-card-label">Total Staff Strength</span>
            <span className="stat-card-value">{overview?.totalEmployees || 0}</span>
            <span className="stat-card-sub" style={{ color: 'var(--primary-light)' }}>Active headcount</span>
          </div>
          <div className="stat-card-icon-box">
            <Users size={24} />
          </div>
        </div>

        <div className="stat-card-glass" style={{ '--card-gradient': 'linear-gradient(135deg, #10b981, #059669)', '--icon-bg': 'rgba(16, 185, 129, 0.15)', '--icon-color': 'var(--accent-green-light)' }}>
          <div className="stat-card-info">
            <span className="stat-card-label">Today's Presence Rate</span>
            <span className="stat-card-value" style={{ color: 'var(--accent-green-light)' }}>{activePresenceRate}%</span>
            <span className="stat-card-sub">{overview?.presentToday || 0} of {overview?.totalEmployees || 0} clocked in</span>
          </div>
          <div className="stat-card-icon-box">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="stat-card-glass" style={{ '--card-gradient': 'linear-gradient(135deg, #06b6d4, #3b82f6)', '--icon-bg': 'rgba(6, 182, 212, 0.15)', '--icon-color': 'var(--secondary-light)' }}>
          <div className="stat-card-info">
            <span className="stat-card-label">On Leave Today</span>
            <span className="stat-card-value" style={{ color: 'var(--secondary-light)' }}>{overview?.onLeaveToday || 0}</span>
            <span className="stat-card-sub">Approved time off</span>
          </div>
          <div className="stat-card-icon-box">
            <Calendar size={24} />
          </div>
        </div>

        <div className="stat-card-glass" style={{ '--card-gradient': 'linear-gradient(135deg, #f59e0b, #fbbf24)', '--icon-bg': 'rgba(245, 158, 11, 0.15)', '--icon-color': 'var(--accent-yellow-light)' }}>
          <div className="stat-card-info">
            <span className="stat-card-label">Monthly Gross Spend</span>
            <span className="stat-card-value" style={{ color: 'var(--accent-yellow-light)', fontSize: 28 }}>{fmt(payrollSum?.summary?.total_monthly_wage)}</span>
            <span className="stat-card-sub">Gross payroll obligation</span>
          </div>
          <div className="stat-card-icon-box">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Attendance Trend Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, backdropFilter: 'blur(20px)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="var(--primary-light)" />
            <span>Attendance Trend (Recent Working Days)</span>
          </h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-elevated)', 
                    borderColor: 'var(--border-light)', 
                    borderRadius: 10,
                    boxShadow: 'var(--shadow-lg)'
                  }} 
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="leave" fill="#06b6d4" radius={[4, 4, 0, 0]} name="On Leave" />
                <Bar dataKey="halfDay" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Half-Day" />
                <Bar dataKey="absent" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Absent" />
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
