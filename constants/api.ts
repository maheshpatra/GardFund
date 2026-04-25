// Change this to your server IP/domain
export const API_BASE_URL = 'https://gardfund.edducare.in/api';

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  UPLOAD_AVATAR: '/auth/upload_avatar',


  // Members
  MEMBERS: '/members/list',

  // Contributions
  CONTRIBUTIONS: '/contributions/index',

  // Loans
  LOANS: '/loans/index',
  LOAN_REPAY: '/loans/repay',

  // Fund
  FUND_DASHBOARD: '/fund/dashboard',

  // Hospitals
  HOSPITALS: '/hospitals/index',

  // Notifications
  NOTIFICATIONS: '/notifications/index',

  // Levels
  LEVELS: '/levels/index',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_APPROVE_CONTRIBUTION: '/admin/approve_contribution',
  ADMIN_APPROVE_LOAN: '/admin/approve_loan',
  ADMIN_APPROVE_REPAYMENT: '/admin/approve_repayment',
  ADMIN_APPROVE_USER: '/admin/approve_user',
  ADMIN_SETTINGS: '/admin/settings',
};
