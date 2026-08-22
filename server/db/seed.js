const db = require('./database');
const bcrypt = require('bcryptjs');

function calculatePayroll(monthWage) {
  const basic = monthWage * 0.50;
  const hra = basic * 0.50;
  const standardAllowance = basic * 0.1667;
  const performanceBonus = basic * 0.0833;
  const lta = basic * 0.0833;
  const fixedAllowance = monthWage - (basic + hra + standardAllowance + performanceBonus + lta);
  const pfEmployee = basic * 0.12;
  const pfEmployer = basic * 0.12;
  const professionalTax = 200;
  const net = monthWage - pfEmployee - professionalTax;
  return { basic, hra, standardAllowance, performanceBonus, lta, fixedAllowance, pfEmployee, pfEmployer, professionalTax, net };
}

function generateEmployeeId(firstName, lastName, year, serial) {
  return `${firstName.toLowerCase()}${lastName.toLowerCase()}${year}${String(serial).padStart(4, '0')}`;
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec('DELETE FROM holidays');
  db.exec('DELETE FROM payroll');
  db.exec('DELETE FROM leave_balance');
  db.exec('DELETE FROM leave_requests');
  db.exec('DELETE FROM attendance');
  db.exec('DELETE FROM certifications');
  db.exec('DELETE FROM skills');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM companies');

  // Create company
  const companyStmt = db.prepare('INSERT INTO companies (name, logo) VALUES (?, ?)');
  companyStmt.run('Dayflow Technologies', null);
  
  // Hash passwords
  const adminPass = await bcrypt.hash('Admin@123', 10);
  const empPass = await bcrypt.hash('Employee@123', 10);

  // Create admin user
  const userStmt = db.prepare(`
    INSERT INTO users (employee_id, email, password, role, first_name, last_name, phone, department, designation, company_id, location, join_date, about, job_love, interests)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  userStmt.run(
    generateEmployeeId('Priya', 'Sharma', 2024, 1),
    'priya.sharma@dayflow.com', adminPass, 'admin',
    'Priya', 'Sharma', '+91 98765 43210',
    'Human Resources', 'HR Director', 1, 'Bangalore HQ',
    '2024-01-15',
    'Passionate HR professional with 10+ years of experience in building great teams.',
    'Connecting people with their dream roles and watching them grow.',
    'Reading, Yoga, Travel photography'
  );

  // Create employees
  const employees = [
    { first: 'Arjun', last: 'Patel', email: 'arjun.patel@dayflow.com', dept: 'Engineering', desig: 'Senior Developer', phone: '+91 98765 43211', year: 2024, serial: 2, join: '2024-02-01', wage: 75000, about: 'Full-stack developer passionate about clean code.', love: 'Solving complex problems and mentoring juniors.', interests: 'Open source, Gaming, Cricket' },
    { first: 'Sneha', last: 'Reddy', email: 'sneha.reddy@dayflow.com', dept: 'Design', desig: 'UI/UX Lead', phone: '+91 98765 43212', year: 2024, serial: 3, join: '2024-03-10', wage: 65000, about: 'Design enthusiast creating beautiful digital experiences.', love: 'Turning complex workflows into simple, intuitive interfaces.', interests: 'Sketching, Photography, Cooking' },
    { first: 'Rahul', last: 'Kumar', email: 'rahul.kumar@dayflow.com', dept: 'Engineering', desig: 'Backend Developer', phone: '+91 98765 43213', year: 2024, serial: 4, join: '2024-04-20', wage: 55000, about: 'Backend specialist focused on scalable architectures.', love: 'Building systems that handle millions of requests.', interests: 'Chess, Hiking, Reading tech blogs' },
    { first: 'Ananya', last: 'Iyer', email: 'ananya.iyer@dayflow.com', dept: 'Marketing', desig: 'Marketing Manager', phone: '+91 98765 43214', year: 2025, serial: 1, join: '2025-01-05', wage: 60000, about: 'Creative marketer with a data-driven approach.', love: 'Crafting campaigns that resonate with people.', interests: 'Social media trends, Blogging, Dance' },
    { first: 'Vikram', last: 'Singh', email: 'vikram.singh@dayflow.com', dept: 'Engineering', desig: 'DevOps Engineer', phone: '+91 98765 43215', year: 2025, serial: 2, join: '2025-02-15', wage: 70000, about: 'Infrastructure wizard automating everything.', love: 'Seeing green builds and zero downtime deployments.', interests: 'Linux, Drones, Photography' },
    { first: 'Meera', last: 'Nair', email: 'meera.nair@dayflow.com', dept: 'Finance', desig: 'Financial Analyst', phone: '+91 98765 43216', year: 2025, serial: 3, join: '2025-03-22', wage: 58000, about: 'Numbers tell stories, and I love reading them.', love: 'Finding insights in financial data that drive decisions.', interests: 'Sudoku, Swimming, Music' },
    { first: 'Karthik', last: 'Menon', email: 'karthik.menon@dayflow.com', dept: 'Engineering', desig: 'Frontend Developer', phone: '+91 98765 43217', year: 2026, serial: 1, join: '2026-01-10', wage: 52000, about: 'React enthusiast building pixel-perfect interfaces.', love: 'The satisfaction of a perfectly responsive layout.', interests: 'UI animations, Football, Cooking' },
    { first: 'Divya', last: 'Joshi', email: 'divya.joshi@dayflow.com', dept: 'Human Resources', desig: 'HR Executive', phone: '+91 98765 43218', year: 2026, serial: 2, join: '2026-02-01', wage: 48000, about: 'People person ensuring everyone feels valued.', love: 'Making the workplace a better environment for everyone.', interests: 'Volunteering, Painting, Podcasts' },
  ];

  for (const emp of employees) {
    userStmt.run(
      generateEmployeeId(emp.first, emp.last, emp.year, emp.serial),
      emp.email, empPass, 'employee',
      emp.first, emp.last, emp.phone,
      emp.dept, emp.desig, 1, 'Bangalore HQ',
      emp.join, emp.about, emp.love, emp.interests
    );
  }

  // Add skills for employees
  const skillStmt = db.prepare('INSERT INTO skills (user_id, name, level) VALUES (?, ?, ?)');
  const allUsers = db.prepare('SELECT id, department FROM users').all();
  
  const skillsByDept = {
    'Engineering': [['JavaScript', 'Expert'], ['React', 'Advanced'], ['Node.js', 'Advanced'], ['Python', 'Intermediate'], ['Docker', 'Intermediate']],
    'Design': [['Figma', 'Expert'], ['Adobe XD', 'Advanced'], ['Sketch', 'Advanced'], ['CSS', 'Expert']],
    'Marketing': [['SEO', 'Advanced'], ['Google Analytics', 'Expert'], ['Content Writing', 'Advanced']],
    'Human Resources': [['Recruitment', 'Advanced'], ['Employee Relations', 'Expert'], ['HRIS', 'Intermediate']],
    'Finance': [['Excel', 'Expert'], ['Financial Modeling', 'Advanced'], ['SAP', 'Intermediate']],
  };

  for (const user of allUsers) {
    const skills = skillsByDept[user.department] || [['Communication', 'Advanced']];
    for (const [name, level] of skills.slice(0, 3)) {
      skillStmt.run(user.id, name, level);
    }
  }

  // Add certifications
  const certStmt = db.prepare('INSERT INTO certifications (user_id, name, issuer, date) VALUES (?, ?, ?, ?)');
  certStmt.run(2, 'AWS Solutions Architect', 'Amazon Web Services', '2024-06-15');
  certStmt.run(2, 'Google Cloud Professional', 'Google', '2024-09-20');
  certStmt.run(3, 'Google UX Design', 'Google', '2024-05-10');
  certStmt.run(5, 'Digital Marketing Pro', 'HubSpot', '2025-03-15');

  // Create payroll for all employees
  const payrollStmt = db.prepare(`
    INSERT INTO payroll (user_id, month_wage, yearly_wage, basic_salary, hra, standard_allowance, performance_bonus, lta, fixed_allowance, pf_employee, pf_employer, professional_tax, net_salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const allUsersForPayroll = db.prepare('SELECT id FROM users').all();
  const wages = [85000, 75000, 65000, 55000, 60000, 70000, 58000, 52000, 48000];
  
  for (let i = 0; i < allUsersForPayroll.length; i++) {
    const wage = wages[i] || 50000;
    const p = calculatePayroll(wage);
    payrollStmt.run(
      allUsersForPayroll[i].id, wage, wage * 12,
      p.basic, p.hra, p.standardAllowance, p.performanceBonus,
      p.lta, p.fixedAllowance, p.pfEmployee, p.pfEmployer,
      p.professionalTax, p.net
    );
  }

  // Create leave balances for current year
  const leaveBalStmt = db.prepare('INSERT INTO leave_balance (user_id, year, paid_total, paid_used, sick_total, sick_used, unpaid_used) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const currentYear = new Date().getFullYear();
  
  leaveBalStmt.run(1, currentYear, 24, 3, 7, 1, 0);
  leaveBalStmt.run(2, currentYear, 24, 5, 7, 2, 0);
  leaveBalStmt.run(3, currentYear, 24, 2, 7, 0, 1);
  leaveBalStmt.run(4, currentYear, 24, 4, 7, 1, 0);
  leaveBalStmt.run(5, currentYear, 24, 1, 7, 0, 0);
  leaveBalStmt.run(6, currentYear, 24, 3, 7, 2, 0);
  leaveBalStmt.run(7, currentYear, 24, 2, 7, 1, 0);
  leaveBalStmt.run(8, currentYear, 24, 0, 7, 0, 0);
  leaveBalStmt.run(9, currentYear, 24, 1, 7, 0, 0);

  // Generate attendance for last 30 days
  const attStmt = db.prepare(`
    INSERT OR IGNORE INTO attendance (user_id, date, check_in, check_out, status, work_hours, extra_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  for (let d = 30; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
    
    const dateStr = date.toISOString().split('T')[0];
    
    for (const user of allUsersForPayroll) {
      const rand = Math.random();
      let status, checkIn, checkOut, workHours, extraHours;
      
      if (d === 0) {
        // Today - some checked in, some not yet
        if (rand < 0.7) {
          const hour = 8 + Math.floor(Math.random() * 2);
          const min = Math.floor(Math.random() * 60);
          checkIn = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
          checkOut = null;
          status = 'present';
          workHours = 0;
          extraHours = 0;
        } else {
          continue; // Not checked in yet
        }
      } else if (rand < 0.85) {
        // Present
        const inHour = 8 + Math.floor(Math.random() * 2);
        const inMin = Math.floor(Math.random() * 60);
        const hoursWorked = 7 + Math.random() * 3;
        const outHour = inHour + Math.floor(hoursWorked);
        const outMin = Math.floor((hoursWorked % 1) * 60);
        
        checkIn = `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}`;
        checkOut = `${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}`;
        status = 'present';
        workHours = Math.round(hoursWorked * 100) / 100;
        extraHours = Math.max(0, Math.round((hoursWorked - 8) * 100) / 100);
      } else if (rand < 0.92) {
        // Half day
        const inHour = 9;
        checkIn = `09:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
        checkOut = `13:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
        status = 'half-day';
        workHours = 4;
        extraHours = 0;
      } else if (rand < 0.96) {
        // Leave
        checkIn = null; checkOut = null;
        status = 'leave';
        workHours = 0; extraHours = 0;
      } else {
        // Absent
        checkIn = null; checkOut = null;
        status = 'absent';
        workHours = 0; extraHours = 0;
      }
      
      attStmt.run(user.id, dateStr, checkIn, checkOut, status, workHours, extraHours);
    }
  }

  // Create some leave requests
  const leaveStmt = db.prepare(`
    INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days, reason, status, admin_comment, reviewed_by, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  leaveStmt.run(2, 'paid', '2026-08-25', '2026-08-27', 3, 'Family vacation planned to Goa', 'pending', null, null, null);
  leaveStmt.run(3, 'sick', '2026-08-20', '2026-08-20', 1, 'Fever and cold', 'approved', 'Get well soon!', 1, '2026-08-19T10:30:00');
  leaveStmt.run(4, 'paid', '2026-09-01', '2026-09-05', 5, 'Wedding in hometown', 'pending', null, null, null);
  leaveStmt.run(5, 'unpaid', '2026-08-28', '2026-08-29', 2, 'Personal work - moving to new apartment', 'pending', null, null, null);
  leaveStmt.run(6, 'sick', '2026-08-18', '2026-08-19', 2, 'Back pain - doctor advised rest', 'approved', 'Approved. Take care of your health.', 1, '2026-08-17T14:00:00');
  leaveStmt.run(7, 'paid', '2026-09-10', '2026-09-12', 3, 'Diwali celebrations with family', 'rejected', 'Too many people on leave that week, please reschedule.', 1, '2026-08-20T11:00:00');

  // Add holidays for 2026
  const holidayStmt = db.prepare('INSERT INTO holidays (name, date, year) VALUES (?, ?, ?)');
  const holidays2026 = [
    ['Makar Sankranti', '2026-01-14', 2026],
    ['Republic Day', '2026-01-26', 2026],
    ['Holi', '2026-03-17', 2026],
    ['Ugadi', '2026-03-29', 2026],
    ['Good Friday', '2026-04-03', 2026],
    ['May Day', '2026-05-01', 2026],
    ['Independence Day', '2026-08-15', 2026],
    ['Ganesh Chaturthi', '2026-08-26', 2026],
    ['Gandhi Jayanti', '2026-10-02', 2026],
    ['Dussehra', '2026-10-20', 2026],
    ['Diwali', '2026-11-08', 2026],
    ['Christmas', '2026-12-25', 2026],
  ];
  
  for (const [name, date, year] of holidays2026) {
    holidayStmt.run(name, date, year);
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('👤 Admin Login:');
  console.log('   Email: priya.sharma@dayflow.com');
  console.log('   Password: Admin@123');
  console.log('');
  console.log('👤 Employee Login (any):');
  console.log('   Email: arjun.patel@dayflow.com');
  console.log('   Password: Employee@123');
}

seed().catch(console.error);
