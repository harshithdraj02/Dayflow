const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/employees - Get all employees (admin: all, employee: only self)
router.get('/', authMiddleware, (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const employees = db.prepare(`
        SELECT u.id, u.employee_id, u.email, u.role, u.first_name, u.last_name, u.phone, 
               u.department, u.designation, u.location, u.join_date, u.profile_picture,
               u.about, u.job_love, u.interests,
               a.status as today_status, a.check_in as today_check_in, a.check_out as today_check_out
        FROM users u
        LEFT JOIN attendance a ON u.id = a.user_id AND a.date = date('now')
        ORDER BY u.first_name
      `).all();
      
      // Check if any employee has approved leave today
      const onLeave = db.prepare(`
        SELECT user_id FROM leave_requests 
        WHERE status = 'approved' AND date('now') BETWEEN start_date AND end_date
      `).all().map(r => r.user_id);
      
      const enriched = employees.map(e => ({
        ...e,
        attendance_status: onLeave.includes(e.id) ? 'leave' : (e.today_status || 'absent')
      }));
      
      res.json(enriched);
    } else {
      const user = db.prepare(`
        SELECT id, employee_id, email, role, first_name, last_name, phone, 
               department, designation, location, join_date, profile_picture,
               about, job_love, interests
        FROM users WHERE id = ?
      `).get(req.user.id);
      res.json([user]);
    }
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'Failed to get employees' });
  }
});

// GET /api/employees/:id - Get single employee profile
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = db.prepare(`
      SELECT id, employee_id, email, role, first_name, last_name, phone, address,
             department, designation, location, join_date, profile_picture,
             about, job_love, interests, company_id, manager_id, created_at
      FROM users WHERE id = ?
    `).get(id);

    if (!user) return res.status(404).json({ error: 'Employee not found' });

    const skills = db.prepare('SELECT * FROM skills WHERE user_id = ?').all(id);
    const certifications = db.prepare('SELECT * FROM certifications WHERE user_id = ?').all(id);
    const company = db.prepare('SELECT name FROM companies WHERE id = ?').get(user.company_id);
    const manager = user.manager_id ? db.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(user.manager_id) : null;

    res.json({
      ...user,
      skills,
      certifications,
      company_name: company?.name || 'Dayflow Technologies',
      manager_name: manager ? `${manager.first_name} ${manager.last_name}` : 'N/A'
    });
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Failed to get employee' });
  }
});

// PUT /api/employees/:id - Update employee profile
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.id === id;

    if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Access denied' });

    const { phone, address, about, job_love, interests, department, designation, location } = req.body;

    if (isAdmin) {
      db.prepare(`
        UPDATE users SET phone = COALESCE(?, phone), address = COALESCE(?, address),
        about = COALESCE(?, about), job_love = COALESCE(?, job_love), interests = COALESCE(?, interests),
        department = COALESCE(?, department), designation = COALESCE(?, designation), location = COALESCE(?, location)
        WHERE id = ?
      `).run(phone, address, about, job_love, interests, department, designation, location, id);
    } else {
      db.prepare(`
        UPDATE users SET phone = COALESCE(?, phone), address = COALESCE(?, address),
        about = COALESCE(?, about), job_love = COALESCE(?, job_love), interests = COALESCE(?, interests)
        WHERE id = ?
      `).run(phone, address, about, job_love, interests, id);
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/employees/:id/skills
router.post('/:id/skills', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    
    const { name, level } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name is required' });
    
    const result = db.prepare('INSERT INTO skills (user_id, name, level) VALUES (?, ?, ?)').run(id, name, level || 'Beginner');
    res.status(201).json({ id: result.lastInsertRowid, user_id: id, name, level: level || 'Beginner' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add skill' });
  }
});

// DELETE /api/employees/:id/skills/:skillId
router.delete('/:id/skills/:skillId', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    db.prepare('DELETE FROM skills WHERE id = ? AND user_id = ?').run(parseInt(req.params.skillId), id);
    res.json({ message: 'Skill removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove skill' });
  }
});

// POST /api/employees/:id/certifications
router.post('/:id/certifications', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    
    const { name, issuer, date } = req.body;
    if (!name) return res.status(400).json({ error: 'Certification name is required' });
    
    const result = db.prepare('INSERT INTO certifications (user_id, name, issuer, date) VALUES (?, ?, ?, ?)').run(id, name, issuer || '', date || '');
    res.status(201).json({ id: result.lastInsertRowid, user_id: id, name, issuer, date });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add certification' });
  }
});

module.exports = router;
