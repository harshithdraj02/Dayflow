const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/leave/apply - Employee applies for leave
router.post('/apply', authMiddleware, (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    
    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Leave type, start date, and end date are required' });
    }

    // Calculate days
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end < start) return res.status(400).json({ error: 'End date must be after start date' });
    
    let days = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) days++;
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    let balance = db.prepare('SELECT * FROM leave_balance WHERE user_id = ? AND year = ?').get(req.user.id, currentYear);
    
    if (!balance) {
      db.prepare('INSERT INTO leave_balance (user_id, year) VALUES (?, ?)').run(req.user.id, currentYear);
      balance = db.prepare('SELECT * FROM leave_balance WHERE user_id = ? AND year = ?').get(req.user.id, currentYear);
    }

    if (leave_type === 'paid' && (balance.paid_used + days) > balance.paid_total) {
      return res.status(400).json({ error: `Insufficient paid leave balance. Available: ${balance.paid_total - balance.paid_used} days` });
    }
    if (leave_type === 'sick' && (balance.sick_used + days) > balance.sick_total) {
      return res.status(400).json({ error: `Insufficient sick leave balance. Available: ${balance.sick_total - balance.sick_used} days` });
    }

    // Check for overlapping leave
    const overlap = db.prepare(`
      SELECT id FROM leave_requests 
      WHERE user_id = ? AND status != 'rejected'
      AND ((start_date BETWEEN ? AND ?) OR (end_date BETWEEN ? AND ?) OR (start_date <= ? AND end_date >= ?))
    `).get(req.user.id, start_date, end_date, start_date, end_date, start_date, end_date);

    if (overlap) return res.status(400).json({ error: 'You already have a leave request for overlapping dates' });

    const result = db.prepare(`
      INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, leave_type, start_date, end_date, days, reason || '');

    res.status(201).json({
      message: 'Leave request submitted successfully',
      id: result.lastInsertRowid,
      days,
      status: 'pending'
    });
  } catch (err) {
    console.error('Apply leave error:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// GET /api/leave/my - Get current user's leave requests
router.get('/my', authMiddleware, (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT lr.*, u.first_name as reviewer_first, u.last_name as reviewer_last
      FROM leave_requests lr
      LEFT JOIN users u ON lr.reviewed_by = u.id
      WHERE lr.user_id = ?
      ORDER BY lr.created_at DESC
    `).all(req.user.id);

    const currentYear = new Date().getFullYear();
    let balance = db.prepare('SELECT * FROM leave_balance WHERE user_id = ? AND year = ?').get(req.user.id, currentYear);
    
    if (!balance) {
      db.prepare('INSERT INTO leave_balance (user_id, year) VALUES (?, ?)').run(req.user.id, currentYear);
      balance = db.prepare('SELECT * FROM leave_balance WHERE user_id = ? AND year = ?').get(req.user.id, currentYear);
    }

    const holidays = db.prepare('SELECT * FROM holidays WHERE year = ? ORDER BY date').all(currentYear);

    res.json({ requests, balance, holidays });
  } catch (err) {
    console.error('Get my leaves error:', err);
    res.status(500).json({ error: 'Failed to get leave requests' });
  }
});

// GET /api/leave/all - Admin: Get all leave requests
router.get('/all', authMiddleware, adminOnly, (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT lr.*, u.first_name, u.last_name, u.employee_id, u.department,
             r.first_name as reviewer_first, r.last_name as reviewer_last
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users r ON lr.reviewed_by = r.id
    `;
    
    const params = [];
    if (status) {
      query += ' WHERE lr.status = ?';
      params.push(status);
    }
    query += ' ORDER BY lr.created_at DESC';

    const requests = db.prepare(query).all(...params);
    res.json(requests);
  } catch (err) {
    console.error('Get all leaves error:', err);
    res.status(500).json({ error: 'Failed to get leave requests' });
  }
});

// PUT /api/leave/:id/approve
router.put('/:id/approve', authMiddleware, adminOnly, (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    const { comment } = req.body;

    const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ error: 'Can only approve pending requests' });

    db.prepare(`
      UPDATE leave_requests SET status = 'approved', admin_comment = ?, reviewed_by = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(comment || '', req.user.id, leaveId);

    // Update leave balance
    const currentYear = new Date().getFullYear();
    if (leave.leave_type === 'paid') {
      db.prepare('UPDATE leave_balance SET paid_used = paid_used + ? WHERE user_id = ? AND year = ?')
        .run(leave.days, leave.user_id, currentYear);
    } else if (leave.leave_type === 'sick') {
      db.prepare('UPDATE leave_balance SET sick_used = sick_used + ? WHERE user_id = ? AND year = ?')
        .run(leave.days, leave.user_id, currentYear);
    } else if (leave.leave_type === 'unpaid') {
      db.prepare('UPDATE leave_balance SET unpaid_used = unpaid_used + ? WHERE user_id = ? AND year = ?')
        .run(leave.days, leave.user_id, currentYear);
    }

    // Mark attendance as leave for the dates
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const dateStr = d.toISOString().split('T')[0];
      db.prepare(`
        INSERT OR REPLACE INTO attendance (user_id, date, status, work_hours, extra_hours)
        VALUES (?, ?, 'leave', 0, 0)
      `).run(leave.user_id, dateStr);
    }

    res.json({ message: 'Leave approved successfully' });
  } catch (err) {
    console.error('Approve leave error:', err);
    res.status(500).json({ error: 'Failed to approve leave' });
  }
});

// PUT /api/leave/:id/reject
router.put('/:id/reject', authMiddleware, adminOnly, (req, res) => {
  try {
    const leaveId = parseInt(req.params.id);
    const { comment } = req.body;

    const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(leaveId);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (leave.status !== 'pending') return res.status(400).json({ error: 'Can only reject pending requests' });

    db.prepare(`
      UPDATE leave_requests SET status = 'rejected', admin_comment = ?, reviewed_by = ?, reviewed_at = datetime('now')
      WHERE id = ?
    `).run(comment || '', req.user.id, leaveId);

    res.json({ message: 'Leave rejected' });
  } catch (err) {
    console.error('Reject leave error:', err);
    res.status(500).json({ error: 'Failed to reject leave' });
  }
});

module.exports = router;
