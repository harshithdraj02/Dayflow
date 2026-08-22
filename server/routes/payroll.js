const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { createNotification } = require('./notifications');

const router = express.Router();

// Helper to calculate Loss-of-Pay (LOP) deductions for unpaid leaves
function enrichPayroll(payroll, userId) {
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const monthPattern = `${currentYear}-${currentMonth}%`;
  
  const lopResult = db.prepare(`
    SELECT SUM(days) as days FROM leave_requests
    WHERE user_id = ? 
      AND leave_type = 'unpaid' 
      AND status = 'approved'
      AND (start_date LIKE ? OR end_date LIKE ?)
  `).get(userId, monthPattern, monthPattern);
  
  const unpaidDays = lopResult && lopResult.days ? lopResult.days : 0;
  const dailyRate = payroll.month_wage / 30;
  const penaltyMultiplier = 1.25;
  const lopDeduction = Math.round(unpaidDays * dailyRate * penaltyMultiplier);
  const netSalaryAdjusted = Math.max(0, payroll.net_salary - lopDeduction);
  
  return {
    ...payroll,
    unpaid_days_this_month: unpaidDays,
    daily_rate: Math.round(dailyRate),
    penalty_multiplier: penaltyMultiplier,
    lop_deduction: lopDeduction,
    net_salary_adjusted: netSalaryAdjusted
  };
}

// GET /api/payroll/my - Employee's own payroll
router.get('/my', authMiddleware, (req, res) => {
  try {
    const payroll = db.prepare('SELECT * FROM payroll WHERE user_id = ?').get(req.user.id);
    if (!payroll) return res.status(404).json({ error: 'Payroll data not found' });
    res.json(enrichPayroll(payroll, req.user.id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get payroll' });
  }
});

// GET /api/payroll/all - Admin: all employees' payroll
router.get('/all', authMiddleware, adminOnly, (req, res) => {
  try {
    const payrolls = db.prepare(`
      SELECT p.*, u.first_name, u.last_name, u.employee_id, u.department, u.designation
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      WHERE u.company_id = ?
      ORDER BY u.first_name
    `).all(req.user.company_id);
    
    const enriched = payrolls.map(p => enrichPayroll(p, p.user_id));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get payroll data' });
  }
});

// GET /api/payroll/:userId - Admin: specific employee payroll (or employee themselves)
router.get('/:userId', authMiddleware, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const payroll = db.prepare('SELECT * FROM payroll WHERE user_id = ?').get(userId);
    if (!payroll) return res.status(404).json({ error: 'Payroll data not found' });
    res.json(enrichPayroll(payroll, userId));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get payroll' });
  }
});

// PUT /api/payroll/:userId - Admin: update salary
router.put('/:userId', authMiddleware, adminOnly, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { month_wage } = req.body;
    
    if (!month_wage || month_wage <= 0) return res.status(400).json({ error: 'Valid monthly wage is required' });

    const wage = parseFloat(month_wage);
    const basic = wage * 0.50;
    const hra = basic * 0.50;
    const sa = basic * 0.1667;
    const pb = basic * 0.0833;
    const lta = basic * 0.0833;
    const fa = wage - (basic + hra + sa + pb + lta);
    const pfE = basic * 0.12;
    const pfR = basic * 0.12;
    const pt = 200;
    const net = wage - pfE - pt;

    const existing = db.prepare('SELECT id FROM payroll WHERE user_id = ?').get(userId);
    
    if (existing) {
      db.prepare(`
        UPDATE payroll SET month_wage = ?, yearly_wage = ?, basic_salary = ?, hra = ?, 
        standard_allowance = ?, performance_bonus = ?, lta = ?, fixed_allowance = ?,
        pf_employee = ?, pf_employer = ?, professional_tax = ?, net_salary = ?
        WHERE user_id = ?
      `).run(wage, wage * 12, basic, hra, sa, pb, lta, fa, pfE, pfR, pt, net, userId);
    } else {
      db.prepare(`
        INSERT INTO payroll (user_id, month_wage, yearly_wage, basic_salary, hra, standard_allowance, 
        performance_bonus, lta, fixed_allowance, pf_employee, pf_employer, professional_tax, net_salary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, wage, wage * 12, basic, hra, sa, pb, lta, fa, pfE, pfR, pt, net);
    }

    // Notify employee of payroll updates
    createNotification(userId, 'Salary Configured / Updated', `Your HR administrator updated your salary structure. Dynamic Gross Pay: ₹${wage.toLocaleString('en-IN')}`, 'info');

    res.json({ message: 'Salary updated successfully' });
  } catch (err) {
    console.error('Update payroll error:', err);
    res.status(500).json({ error: 'Failed to update salary' });
  }
});

module.exports = router;
