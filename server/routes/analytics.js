const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/overview - Admin dashboard stats
router.get('/overview', authMiddleware, adminOnly, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const companyId = req.user.company_id;
    
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM users WHERE company_id = ?').get(companyId).count;
    
    const presentToday = db.prepare(`
      SELECT COUNT(*) as count FROM attendance a 
      JOIN users u ON a.user_id = u.id 
      WHERE a.date = ? AND a.status = 'present' AND u.company_id = ?
    `).get(today, companyId).count;
    
    const onLeaveToday = db.prepare(`
      SELECT COUNT(*) as count FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      WHERE lr.status = 'approved' AND ? BETWEEN lr.start_date AND lr.end_date AND u.company_id = ?
    `).get(today, companyId).count;
    
    const pendingLeaves = db.prepare(`
      SELECT COUNT(*) as count FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      WHERE lr.status = 'pending' AND u.company_id = ?
    `).get(companyId).count;
    
    const absentToday = totalEmployees - presentToday - onLeaveToday;

    res.json({
      totalEmployees,
      presentToday,
      onLeaveToday,
      absentToday: Math.max(0, absentToday),
      pendingLeaves
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ error: 'Failed to get overview stats' });
  }
});

// GET /api/analytics/attendance-trend - Weekly attendance trend
router.get('/attendance-trend', authMiddleware, adminOnly, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const companyId = req.user.company_id;
    const results = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const present = db.prepare(`
        SELECT COUNT(*) as c FROM attendance a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.date = ? AND a.status = 'present' AND u.company_id = ?
      `).get(dateStr, companyId).c;
      
      const absent = db.prepare(`
        SELECT COUNT(*) as c FROM attendance a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.date = ? AND a.status = 'absent' AND u.company_id = ?
      `).get(dateStr, companyId).c;
      
      const leave = db.prepare(`
        SELECT COUNT(*) as c FROM attendance a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.date = ? AND a.status = 'leave' AND u.company_id = ?
      `).get(dateStr, companyId).c;
      
      const halfDay = db.prepare(`
        SELECT COUNT(*) as c FROM attendance a 
        JOIN users u ON a.user_id = u.id 
        WHERE a.date = ? AND a.status = 'half-day' AND u.company_id = ?
      `).get(dateStr, companyId).c;
      
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
    console.error('Analytics trend error:', err);
    res.status(500).json({ error: 'Failed to get attendance trend' });
  }
});

// GET /api/analytics/department-stats
router.get('/department-stats', authMiddleware, adminOnly, (req, res) => {
  try {
    const companyId = req.user.company_id;
    const stats = db.prepare(`
      SELECT department, COUNT(*) as count FROM users WHERE company_id = ? GROUP BY department ORDER BY count DESC
    `).all(companyId);
    res.json(stats);
  } catch (err) {
    console.error('Analytics dept stats error:', err);
    res.status(500).json({ error: 'Failed to get department stats' });
  }
});

// GET /api/analytics/leave-distribution
router.get('/leave-distribution', authMiddleware, adminOnly, (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const companyId = req.user.company_id;
    
    const dist = db.prepare(`
      SELECT lr.leave_type, lr.status, COUNT(*) as count, SUM(lr.days) as total_days
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      WHERE strftime('%Y', lr.created_at) = ? AND u.company_id = ?
      GROUP BY lr.leave_type, lr.status
    `).all(String(currentYear), companyId);
    res.json(dist);
  } catch (err) {
    console.error('Analytics leave dist error:', err);
    res.status(500).json({ error: 'Failed to get leave distribution' });
  }
});

// GET /api/analytics/payroll-summary
router.get('/payroll-summary', authMiddleware, adminOnly, (req, res) => {
  try {
    const companyId = req.user.company_id;
    
    const summary = db.prepare(`
      SELECT 
        SUM(p.month_wage) as total_monthly_wage,
        SUM(p.net_salary) as total_net_salary,
        SUM(p.pf_employee) as total_pf_employee,
        SUM(p.pf_employer) as total_pf_employer,
        AVG(p.month_wage) as avg_salary,
        MIN(p.month_wage) as min_salary,
        MAX(p.month_wage) as max_salary,
        COUNT(*) as total_employees
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      WHERE u.company_id = ?
    `).get(companyId);

    const byDepartment = db.prepare(`
      SELECT u.department, COUNT(*) as count, SUM(p.month_wage) as total_wage, AVG(p.month_wage) as avg_wage
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      WHERE u.company_id = ?
      GROUP BY u.department
      ORDER BY total_wage DESC
    `).all(companyId);

    res.json({ summary, byDepartment });
  } catch (err) {
    console.error('Analytics payroll summary error:', err);
    res.status(500).json({ error: 'Failed to get payroll summary' });
  }
});

module.exports = router;
