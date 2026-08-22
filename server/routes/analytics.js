const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/overview - Admin dashboard stats
router.get('/overview', authMiddleware, adminOnly, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const presentToday = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date = ? AND status = 'present'").get(today).count;
    const onLeaveToday = db.prepare(`
      SELECT COUNT(*) as count FROM leave_requests 
      WHERE status = 'approved' AND ? BETWEEN start_date AND end_date
    `).get(today).count;
    const pendingLeaves = db.prepare("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'").get().count;
    const absentToday = totalEmployees - presentToday - onLeaveToday;

    res.json({
      totalEmployees,
      presentToday,
      onLeaveToday,
      absentToday: Math.max(0, absentToday),
      pendingLeaves
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get overview stats' });
  }
});

// GET /api/analytics/attendance-trend - Weekly attendance trend
router.get('/attendance-trend', authMiddleware, adminOnly, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const results = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const present = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'present'").get(dateStr).c;
      const absent = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'absent'").get(dateStr).c;
      const leave = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'leave'").get(dateStr).c;
      const halfDay = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'half-day'").get(dateStr).c;
      
      results.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        present,
        absent,
        leave,
        halfDay
      });
    }
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get attendance trend' });
  }
});

// GET /api/analytics/department-stats
router.get('/department-stats', authMiddleware, adminOnly, (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT department, COUNT(*) as count FROM users GROUP BY department ORDER BY count DESC
    `).all();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get department stats' });
  }
});

// GET /api/analytics/leave-distribution
router.get('/leave-distribution', authMiddleware, adminOnly, (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const dist = db.prepare(`
      SELECT leave_type, status, COUNT(*) as count, SUM(days) as total_days
      FROM leave_requests 
      WHERE strftime('%Y', created_at) = ?
      GROUP BY leave_type, status
    `).all(String(currentYear));
    res.json(dist);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get leave distribution' });
  }
});

// GET /api/analytics/payroll-summary
router.get('/payroll-summary', authMiddleware, adminOnly, (req, res) => {
  try {
    const summary = db.prepare(`
      SELECT 
        SUM(month_wage) as total_monthly_wage,
        SUM(net_salary) as total_net_salary,
        SUM(pf_employee) as total_pf_employee,
        SUM(pf_employer) as total_pf_employer,
        AVG(month_wage) as avg_salary,
        MIN(month_wage) as min_salary,
        MAX(month_wage) as max_salary,
        COUNT(*) as total_employees
      FROM payroll
    `).get();

    const byDepartment = db.prepare(`
      SELECT u.department, COUNT(*) as count, SUM(p.month_wage) as total_wage, AVG(p.month_wage) as avg_wage
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      GROUP BY u.department
      ORDER BY total_wage DESC
    `).all();

    res.json({ summary, byDepartment });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get payroll summary' });
  }
});

module.exports = router;
