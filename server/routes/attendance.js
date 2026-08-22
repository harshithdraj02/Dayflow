const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/attendance/check-in
router.post('/check-in', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(userId, today);
    
    if (existing && existing.check_in) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    if (existing) {
      db.prepare('UPDATE attendance SET check_in = ?, status = ? WHERE id = ?')
        .run(checkInTime, 'present', existing.id);
    } else {
      db.prepare('INSERT INTO attendance (user_id, date, check_in, status) VALUES (?, ?, ?, ?)')
        .run(userId, today, checkInTime, 'present');
    }

    res.json({ message: 'Checked in successfully', check_in: checkInTime, date: today });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// POST /api/attendance/check-out
router.post('/check-out', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const checkOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const existing = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(userId, today);
    
    if (!existing || !existing.check_in) {
      return res.status(400).json({ error: 'You must check in first' });
    }
    if (existing.check_out) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    // Calculate work hours
    const [inH, inM] = existing.check_in.split(':').map(Number);
    const [outH, outM] = checkOutTime.split(':').map(Number);
    const workHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 100) / 100;
    const extraHours = Math.max(0, Math.round((workHours - 8) * 100) / 100);
    const status = workHours < 5 ? 'half-day' : 'present';

    db.prepare('UPDATE attendance SET check_out = ?, work_hours = ?, extra_hours = ?, status = ? WHERE id = ?')
      .run(checkOutTime, workHours, extraHours, status, existing.id);

    res.json({ message: 'Checked out successfully', check_out: checkOutTime, work_hours: workHours, extra_hours: extraHours });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// GET /api/attendance/today - Get today's status for current user
router.get('/today', authMiddleware, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').get(req.user.id, today);
    res.json(record || { status: 'not_checked_in', date: today });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get today\'s attendance' });
  }
});

// GET /api/attendance/my - Get current user's attendance records
router.get('/my', authMiddleware, (req, res) => {
  try {
    const { month, year } = req.query;
    const y = year || new Date().getFullYear();
    const m = month || (new Date().getMonth() + 1);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-31`;

    const records = db.prepare(`
      SELECT * FROM attendance 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date DESC
    `).all(req.user.id, startDate, endDate);

    // Stats
    const presentDays = records.filter(r => r.status === 'present').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;
    const halfDays = records.filter(r => r.status === 'half-day').length;
    const absentDays = records.filter(r => r.status === 'absent').length;

    // Calculate total working days in month (exclude weekends)
    let totalWorkingDays = 0;
    const startD = new Date(`${y}-${String(m).padStart(2, '0')}-01`);
    const endD = new Date(y, m, 0);
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 0 && d.getDay() !== 6) totalWorkingDays++;
    }

    res.json({
      records,
      stats: { presentDays, leaveDays, halfDays, absentDays, totalWorkingDays }
    });
  } catch (err) {
    console.error('Get my attendance error:', err);
    res.status(500).json({ error: 'Failed to get attendance records' });
  }
});

// GET /api/attendance/all - Admin: Get all employees' attendance
router.get('/all', authMiddleware, adminOnly, (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;
    
    let records;
    if (date) {
      records = db.prepare(`
        SELECT a.*, u.first_name, u.last_name, u.employee_id, u.department
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date = ?
        ORDER BY u.first_name
      `).all(date);
    } else if (start_date && end_date) {
      records = db.prepare(`
        SELECT a.*, u.first_name, u.last_name, u.employee_id, u.department
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date BETWEEN ? AND ?
        ORDER BY a.date DESC, u.first_name
      `).all(start_date, end_date);
    } else {
      const today = new Date().toISOString().split('T')[0];
      records = db.prepare(`
        SELECT a.*, u.first_name, u.last_name, u.employee_id, u.department
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE a.date = ?
        ORDER BY u.first_name
      `).all(today);
    }

    res.json(records);
  } catch (err) {
    console.error('Get all attendance error:', err);
    res.status(500).json({ error: 'Failed to get attendance records' });
  }
});

module.exports = router;
