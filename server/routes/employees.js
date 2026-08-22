const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

// Ensure upload directories
const uploadDir = path.join(__dirname, '../uploads');
const avatarsDir = path.join(uploadDir, 'avatars');
const docsDir = path.join(uploadDir, 'documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.params.id}-${Date.now()}${ext}`);
  }
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, docsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc-${Date.now()}${ext}`);
  }
});
const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });

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
        WHERE u.company_id = ?
        ORDER BY u.first_name
      `).all(req.user.company_id);
      
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
      res.json(user ? [user] : []);
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
    const documents = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC').all(id);
    const company = db.prepare('SELECT name FROM companies WHERE id = ?').get(user.company_id);
    const manager = user.manager_id ? db.prepare('SELECT first_name, last_name FROM users WHERE id = ?').get(user.manager_id) : null;

    res.json({
      ...user,
      skills,
      certifications,
      documents,
      company_name: company?.name || 'Dayflow Technologies',
      manager_name: manager ? `${manager.first_name} ${manager.last_name}` : 'N/A'
    });
  } catch (err) {
    console.error('Get employee error:', err);
    res.status(500).json({ error: 'Failed to get employee' });
  }
});

// PUT /api/employees/:id - Update employee profile (SRS 3.3.2)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.id === id;

    if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Access denied' });

    const { first_name, last_name, email, phone, address, about, job_love, interests, department, designation, location, profile_picture } = req.body;

    if (isAdmin) {
      db.prepare(`
        UPDATE users SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          about = COALESCE(?, about),
          job_love = COALESCE(?, job_love),
          interests = COALESCE(?, interests),
          department = COALESCE(?, department),
          designation = COALESCE(?, designation),
          location = COALESCE(?, location),
          profile_picture = COALESCE(?, profile_picture)
        WHERE id = ?
      `).run(first_name, last_name, email, phone, address, about, job_love, interests, department, designation, location, profile_picture, id);
    } else {
      // Employees can edit limited fields (SRS 3.3.2: address, phone, avatar, personal bio)
      db.prepare(`
        UPDATE users SET
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          about = COALESCE(?, about),
          job_love = COALESCE(?, job_love),
          interests = COALESCE(?, interests),
          profile_picture = COALESCE(?, profile_picture)
        WHERE id = ?
      `).run(phone, address, about, job_love, interests, profile_picture, id);
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Update employee error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/employees/:id/avatar - Upload profile picture
router.post('/:id/avatar', authMiddleware, uploadAvatar.single('avatar'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    db.prepare('UPDATE users SET profile_picture = ? WHERE id = ?').run(avatarUrl, id);
    res.json({ profile_picture: avatarUrl, message: 'Profile picture updated successfully' });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// GET /api/employees/:id/documents - Get employee documents
router.get('/:id/documents', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    const docs = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC').all(id);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /api/employees/:id/documents - Upload document
router.post('/:id/documents', authMiddleware, uploadDoc.single('file'), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });

    const { name, type } = req.body;
    let filePath = '';

    if (req.file) {
      filePath = `/uploads/documents/${req.file.filename}`;
    } else if (req.body.file_url) {
      filePath = req.body.file_url;
    } else {
      return res.status(400).json({ error: 'File upload or URL is required' });
    }

    const docName = name || (req.file ? req.file.originalname : 'Document');
    const docType = type || 'General';

    const result = db.prepare('INSERT INTO documents (user_id, name, type, file_path) VALUES (?, ?, ?, ?)').run(id, docName, docType, filePath);
    res.status(201).json({ id: result.lastInsertRowid, user_id: id, name: docName, type: docType, file_path: filePath });
  } catch (err) {
    console.error('Upload document error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// DELETE /api/employees/:id/documents/:docId - Remove document
router.delete('/:id/documents/:docId', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    const docId = parseInt(req.params.docId);
    db.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?').run(docId, id);
    res.json({ message: 'Document removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove document' });
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

// DELETE /api/employees/:id/certifications/:certId
router.delete('/:id/certifications/:certId', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ error: 'Access denied' });
    
    const certId = parseInt(req.params.certId);
    db.prepare('DELETE FROM certifications WHERE id = ? AND user_id = ?').run(certId, id);
    res.json({ message: 'Certification removed' });
  } catch (err) {
    console.error('Delete certification error:', err);
    res.status(500).json({ error: 'Failed to remove certification' });
  }
});

// DELETE /api/employees/:id - Admin only: Offboard employee
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Safety Guard: Admins cannot delete their own account
    if (req.user.id === id) {
      return res.status(403).json({ error: 'Admins cannot delete their own account.' });
    }

    // Verify employee exists and belongs to admin's company
    const emp = db.prepare('SELECT id, company_id, first_name, last_name FROM users WHERE id = ?').get(id);
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    if (emp.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied: Employee belongs to a different company.' });
    }

    // Clear nullable foreign key references (manager_id, reviewed_by)
    db.prepare('UPDATE users SET manager_id = NULL WHERE manager_id = ?').run(id);
    db.prepare('UPDATE leave_requests SET reviewed_by = NULL WHERE reviewed_by = ?').run(id);

    // Delete user (cascades to skills, certs, attendance, leaves, balance, payroll, notifications, documents)
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    res.json({ message: `Employee ${emp.first_name} ${emp.last_name} offboarded and deleted successfully.` });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Failed to offboard employee.' });
  }
});

module.exports = router;
