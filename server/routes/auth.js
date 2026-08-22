const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authMiddleware, adminOnly } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

// Ensure uploads directories exist programmatically
const uploadDir = path.join(__dirname, '../uploads');
const logosDir = path.join(uploadDir, 'logos');
const leavesDir = path.join(uploadDir, 'leaves');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });
if (!fs.existsSync(leavesDir)) fs.mkdirSync(leavesDir, { recursive: true });

// Config Multer for company logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  }
});
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper: generate employee ID
function generateEmployeeId(firstName, lastName) {
  const year = new Date().getFullYear();
  const count = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE join_date LIKE ?').get(`${year}%`);
  const serial = (count?.cnt || 0) + 1;
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${year}${String(serial).padStart(4, '0')}`;
}

// Helper: generate random password
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let pass = '';
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

// POST /api/auth/signup - Admin creates new employee account
router.post('/signup', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, department, designation, role, month_wage } = req.body;
    
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    // Generate employee ID and password
    const employee_id = generateEmployeeId(first_name, last_name);
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const stmt = db.prepare(`
      INSERT INTO users (employee_id, email, password, role, first_name, last_name, phone, department, designation, company_id, location, join_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Head Office', ?)
    `);

    const result = stmt.run(
      employee_id, email, hashedPassword, role || 'employee',
      first_name, last_name, phone || '',
      department || 'General', designation || 'Employee',
      req.user.company_id,
      new Date().toISOString().split('T')[0]
    );

    // Create leave balance for current year
    const currentYear = new Date().getFullYear();
    db.prepare('INSERT INTO leave_balance (user_id, year, paid_total, sick_total) VALUES (?, ?, 24, 7)')
      .run(result.lastInsertRowid, currentYear);

    // Create payroll
    const wage = month_wage || 50000;
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

    db.prepare(`
      INSERT INTO payroll (user_id, month_wage, yearly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_employee, pf_employer, professional_tax, net_salary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(result.lastInsertRowid, wage, wage * 12, basic, hra, sa, pb, lta, fa, pfE, pfR, pt, net);

    res.status(201).json({
      message: 'Employee account created successfully',
      employee_id,
      generated_password: rawPassword,
      email
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = db.prepare(`
      SELECT u.*, c.name as company_name, c.logo as company_logo
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.email = ? OR u.employee_id = ?
    `).get(email, email);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, employee_id: user.employee_id, company_id: user.company_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare(`
    SELECT u.*, c.name as company_name, c.logo as company_logo
    FROM users u
    LEFT JOIN companies c ON u.company_id = c.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    
    const valid = await bcrypt.compare(current_password, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    if (new_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const hashed = await bcrypt.hash(new_password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/auth/register-company - Registers a new company with an admin user
router.post('/register-company', uploadLogo.single('logo'), async (req, res) => {
  try {
    const { company_name, admin_first_name, admin_last_name, email, password, phone } = req.body;

    if (!company_name || !admin_first_name || !admin_last_name || !email || !password) {
      return res.status(400).json({ error: 'All fields (Company Name, First Name, Last Name, Email, Password) are required' });
    }

    // Check if email already registered
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered. Please go to Log In.' });
    }

    // Store Company logo suffix/path
    let logoUrl = null;
    if (req.file) {
      logoUrl = `/uploads/logos/${req.file.filename}`;
    }

    // 1. Insert Company
    const compStmt = db.prepare('INSERT INTO companies (name, logo) VALUES (?, ?)');
    const compResult = compStmt.run(company_name, logoUrl);
    const companyId = compResult.lastInsertRowid;

    // 2. Generate Admin Employee ID
    const employee_id = generateEmployeeId(admin_first_name, admin_last_name);
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert Admin User
    const userStmt = db.prepare(`
      INSERT INTO users (employee_id, email, password, role, first_name, last_name, phone, company_id, location, join_date)
      VALUES (?, ?, ?, 'admin', ?, ?, ?, ?, 'Head Office', ?)
    `);
    const userResult = userStmt.run(
      employee_id,
      email,
      hashedPassword,
      admin_first_name,
      admin_last_name,
      phone || '',
      companyId,
      new Date().toISOString().split('T')[0]
    );
    const userId = userResult.lastInsertRowid;

    // 4. Create initial Leave Balance for the admin
    const currentYear = new Date().getFullYear();
    db.prepare('INSERT INTO leave_balance (user_id, year, paid_total, sick_total) VALUES (?, ?, 24, 7)')
      .run(userId, currentYear);

    // 5. Create default Admin Payroll component
    const defaultWage = 120000; // default admin salary component
    const basic = defaultWage * 0.50;
    const hra = basic * 0.50;
    const sa = basic * 0.1667;
    const pb = basic * 0.0833;
    const lta = basic * 0.0833;
    const fa = defaultWage - (basic + hra + sa + pb + lta);
    const pfE = basic * 0.12;
    const pfR = basic * 0.12;
    const pt = 200;
    const net = defaultWage - pfE - pt;

    db.prepare(`
      INSERT INTO payroll (user_id, month_wage, yearly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_employee, pf_employer, professional_tax, net_salary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, defaultWage, defaultWage * 12, basic, hra, sa, pb, lta, fa, pfE, pfR, pt, net);

    // 6. Generate JWT Token
    const token = jwt.sign(
      { id: userId, email: email, role: 'admin', employee_id: employee_id, company_id: companyId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const user = db.prepare(`
      SELECT u.*, c.name as company_name, c.logo as company_logo
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = ?
    `).get(userId);
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Company and Admin registered successfully',
      token,
      user: userWithoutPassword
    });

  } catch (err) {
    console.error('Company registration error:', err);
    res.status(500).json({ error: 'Failed to register company' });
  }
});

module.exports = router;
