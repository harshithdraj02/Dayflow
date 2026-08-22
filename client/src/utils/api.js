const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('dayflow_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('dayflow_token');
      localStorage.removeItem('dayflow_user');
      window.location.href = '/login';
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signup: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  changePassword: (data) => request('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),

  // Employees
  getEmployees: () => request('/employees'),
  getEmployee: (id) => request(`/employees/${id}`),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addSkill: (id, data) => request(`/employees/${id}/skills`, { method: 'POST', body: JSON.stringify(data) }),
  deleteSkill: (id, skillId) => request(`/employees/${id}/skills/${skillId}`, { method: 'DELETE' }),
  addCertification: (id, data) => request(`/employees/${id}/certifications`, { method: 'POST', body: JSON.stringify(data) }),

  // Attendance
  checkIn: () => request('/attendance/check-in', { method: 'POST' }),
  checkOut: () => request('/attendance/check-out', { method: 'POST' }),
  getToday: () => request('/attendance/today'),
  getMyAttendance: (month, year) => request(`/attendance/my?month=${month}&year=${year}`),
  getAllAttendance: (params) => request(`/attendance/all?${new URLSearchParams(params)}`),

  // Leave
  applyLeave: (data) => request('/leave/apply', { method: 'POST', body: JSON.stringify(data) }),
  getMyLeaves: () => request('/leave/my'),
  getAllLeaves: (status) => request(`/leave/all${status ? `?status=${status}` : ''}`),
  approveLeave: (id, comment) => request(`/leave/${id}/approve`, { method: 'PUT', body: JSON.stringify({ comment }) }),
  rejectLeave: (id, comment) => request(`/leave/${id}/reject`, { method: 'PUT', body: JSON.stringify({ comment }) }),

  // Payroll
  getMyPayroll: () => request('/payroll/my'),
  getAllPayroll: () => request('/payroll/all'),
  getPayroll: (userId) => request(`/payroll/${userId}`),
  updatePayroll: (userId, data) => request(`/payroll/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Analytics
  getOverview: () => request('/analytics/overview'),
  getAttendanceTrend: (days) => request(`/analytics/attendance-trend?days=${days || 14}`),
  getDepartmentStats: () => request('/analytics/department-stats'),
  getLeaveDistribution: () => request('/analytics/leave-distribution'),
  getPayrollSummary: () => request('/analytics/payroll-summary'),
};
