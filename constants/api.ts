// Change this to your server IP/domain
export const API_BASE_URL = 'https://gardfund.edducare.in/api';

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',

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
  ADMIN_DASHBOARD: '/apanel/dashboard',
  ADMIN_APPROVE_CONTRIBUTION: '/apanel/approve_contribution',
  ADMIN_APPROVE_LOAN: '/apanel/approve_loan',
  ADMIN_APPROVE_REPAYMENT: '/apanel/approve_repayment',
};
