const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure Multer for medical certificate uploads
const leavesDir = path.join(__dirname, '../uploads/leaves');
if (!fs.existsSync(leavesDir)) {
  fs.mkdirSync(leavesDir, { recursive: true });
}

const leafStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, leavesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `medical-${Date.now()}${ext}`);
  }
});

const uploadAttachment = multer({
  storage: leafStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg, .png and .pdf files are allowed'));
    }
  }
});

const router = express.Router();

// POST /api/leave/apply - Employee applies for leave
router.post('/apply', authMiddleware, (req, res) => {
  uploadAttachment.single('attachment')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { leave_type, start_date, end_date, reason } = req.body;
      
      if (!leave_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'Leave type, start date, and end date are required' });
      }

      // Enforce file attachment specifically for sick leave
      if (leave_type === 'sick' && !req.file) {
        return res.status(400).json({ error: 'Medical certificate upload is required for sick leave.' });
      }

      // Future Date Validation: Guard against applying for past dates unless sick leave
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (leave_type !== 'sick' && start_date < todayStr) {
        return res.status(400).json({ error: 'Leave start date cannot be in the past. Only sick leave may be applied retrospectively.' });
      }

      // Calculate working days (Monday - Friday) safely across local timezone
      const [sYear, sMonth, sDay] = start_date.split('-').map(Number);
      const [eYear, eMonth, eDay] = end_date.split('-').map(Number);
      const start = new Date(sYear, sMonth - 1, sDay);
      const end = new Date(eYear, eMonth - 1, eDay);
      if (end < start) return res.status(400).json({ error: 'End date must be after or equal to start date' });
      
      let days = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) days++;
      }

      // 0-Day Working Range Block
      if (days <= 0) {
        return res.status(400).json({ error: 'Selected date range contains 0 working days (weekends only).' });
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
        AND start_date <= ? AND end_date >= ?
      `).get(req.user.id, end_date, start_date);

      if (overlap) return res.status(400).json({ error: 'You already have an active leave request for overlapping dates.' });

      // Save attachment url path if present
      const attachmentUrl = req.file ? `/uploads/leaves/${req.file.filename}` : null;

      const result = db.prepare(`
        INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days, reason, attachment)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, leave_type, start_date, end_date, days, reason || '', attachmentUrl);

      // Notify company admins of this new request
      const admins = db.prepare("SELECT id FROM users WHERE company_id = ? AND role = 'admin'").all(req.user.company_id);
      for (const admin of admins) {
        createNotification(admin.id, 'New Leave Request', `${req.user.first_name} ${req.user.last_name} applied for ${leave_type} leave.`, 'warning');
      }

      res.status(201).json({
        message: 'Leave request submitted successfully',
        id: result.lastInsertRowid,
        days,
        status: 'pending',
        attachment: attachmentUrl
      });
    } catch (err) {
      console.error('Apply leave error:', err);
      res.status(500).json({ error: 'Failed to submit leave request' });
    }
  });
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
    const companyId = req.user.company_id;
    let query = `
      SELECT lr.*, u.first_name, u.last_name, u.employee_id, u.department,
             r.first_name as reviewer_first, r.last_name as reviewer_last
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users r ON lr.reviewed_by = r.id
      WHERE u.company_id = ?
    `;
    
    const params = [companyId];
    if (status) {
      query += ' AND lr.status = ?';
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
    const [sYear, sMonth, sDay] = leave.start_date.split('-').map(Number);
    const [eYear, eMonth, eDay] = leave.end_date.split('-').map(Number);
    const start = new Date(sYear, sMonth - 1, sDay);
    const end = new Date(eYear, eMonth - 1, eDay);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      db.prepare(`
        INSERT OR REPLACE INTO attendance (user_id, date, status, work_hours, extra_hours)
        VALUES (?, ?, 'leave', 0, 0)
      `).run(leave.user_id, dateStr);
    }

    // Notify employee of approval
    createNotification(leave.user_id, 'Leave Request Approved', `Your ${leave.leave_type} leave request (${leave.start_date} to ${leave.end_date}) has been approved.`, 'success');

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

    // Notify employee of rejection
    createNotification(leave.user_id, 'Leave Request Refused', `Your ${leave.leave_type} leave request (${leave.start_date} to ${leave.end_date}) was rejected.`, 'danger');

    res.json({ message: 'Leave rejected' });
  } catch (err) {
    console.error('Reject leave error:', err);
    res.status(500).json({ error: 'Failed to reject leave' });
  }
});

// GET /api/leave/all-balances - Admin: Get all employees' leave balances for the company
router.get('/all-balances', authMiddleware, adminOnly, (req, res) => {
  try {
    const companyId = req.user.company_id;
    const currentYear = new Date().getFullYear();

    // Ensure all employees of this company have a leave balance record initialized
    const employees = db.prepare("SELECT id FROM users WHERE company_id = ? AND role = 'employee'").all(companyId);
    for (const emp of employees) {
      const balance = db.prepare('SELECT id FROM leave_balance WHERE user_id = ? AND year = ?').get(emp.id, currentYear);
      if (!balance) {
        db.prepare('INSERT INTO leave_balance (user_id, year, paid_total, paid_used, sick_total, sick_used, unpaid_used) VALUES (?, ?, 24, 0, 7, 0, 0)')
          .run(emp.id, currentYear);
      }
    }

    const balances = db.prepare(`
      SELECT lb.*, u.first_name, u.last_name, u.employee_id, u.department, u.designation
      FROM leave_balance lb
      JOIN users u ON lb.user_id = u.id
      WHERE u.company_id = ? AND lb.year = ?
      ORDER BY u.first_name ASC
    `).all(companyId, currentYear);

    res.json(balances);
  } catch (err) {
    console.error('Get all balances error:', err);
    res.status(500).json({ error: 'Failed to get leave balances' });
  }
});

// PUT /api/leave/update-balance - Admin: Update employee's leave balance
router.put('/update-balance', authMiddleware, adminOnly, (req, res) => {
  try {
    const { user_id, paid_total, sick_total } = req.body;

    if (!user_id || paid_total === undefined || sick_total === undefined) {
      return res.status(400).json({ error: 'user_id, paid_total, and sick_total are required' });
    }

    // Verify company matching (Multi-tenant check)
    const emp = db.prepare('SELECT company_id FROM users WHERE id = ?').get(user_id);
    if (!emp || emp.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied: Employee not in your company' });
    }

    const currentYear = new Date().getFullYear();
    db.prepare(`
      UPDATE leave_balance 
      SET paid_total = ?, sick_total = ?
      WHERE user_id = ? AND year = ?
    `).run(paid_total, sick_total, user_id, currentYear);

    res.json({ message: 'Leave balance updated successfully' });
  } catch (err) {
    console.error('Update leave balance error:', err);
    res.status(500).json({ error: 'Failed to update leave balance' });
  }
});

module.exports = router;
