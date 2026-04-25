import { API_BASE_URL, ENDPOINTS } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  private static token: string | null = null;

  static async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    this.token = await AsyncStorage.getItem('auth_token');
    return this.token;
  }

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      AsyncStorage.setItem('auth_token', token);
    } else {
      AsyncStorage.removeItem('auth_token');
    }
  }

  static async request(endpoint: string, method: string = 'GET', body?: any, params?: Record<string, string>) {
    const token = await this.getToken();
    let url = `${API_BASE_URL}${endpoint}`;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error: any) {
      if (error.message === 'Invalid or expired token.') {
        this.setToken(null);
      }
      throw error;
    }
  }

  // Auth
  static login(email: string, password: string) {
    return this.request(ENDPOINTS.LOGIN, 'POST', { email, password });
  }

  static register(data: any) {
    return this.request(ENDPOINTS.REGISTER, 'POST', data);
  }

  static getProfile() {
    return this.request(ENDPOINTS.PROFILE);
  }

  static updateProfile(data: any) {
    return this.request(ENDPOINTS.PROFILE, 'PUT', data);
  }

  // Members
  static getMembers(page = 1, search = '') {
    return this.request(ENDPOINTS.MEMBERS, 'GET', undefined, { page: String(page), search });
  }

  // Contributions
  static getContributions(year?: string) {
    const params: Record<string, string> = {};
    if (year) params.year = year;
    return this.request(ENDPOINTS.CONTRIBUTIONS, 'GET', undefined, params);
  }

  static submitContribution(data: any) {
    return this.request(ENDPOINTS.CONTRIBUTIONS, 'POST', data);
  }

  // Loans
  static getLoans(status?: string) {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    return this.request(ENDPOINTS.LOANS, 'GET', undefined, params);
  }

  static requestLoan(data: any) {
    return this.request(ENDPOINTS.LOANS, 'POST', data);
  }

  static repayLoan(data: any) {
    return this.request(ENDPOINTS.LOAN_REPAY, 'POST', data);
  }

  // Fund
  static getFundDashboard() {
    return this.request(ENDPOINTS.FUND_DASHBOARD);
  }

  // Hospitals
  static getHospitals(search = '', type = '', city = '') {
    return this.request(ENDPOINTS.HOSPITALS, 'GET', undefined, { search, type, city });
  }

  // Notifications
  static getNotifications(unread = false) {
    return this.request(ENDPOINTS.NOTIFICATIONS, 'GET', undefined, unread ? { unread: '1' } : {});
  }

  static markNotificationsRead(notificationId?: number) {
    const body = notificationId ? { notification_id: notificationId } : { mark_all_read: true };
    return this.request(ENDPOINTS.NOTIFICATIONS, 'PUT', body);
  }

  // Levels
  static getLevels() {
    return this.request(ENDPOINTS.LEVELS);
  }

  // Admin
  static getAdminDashboard() {
    return this.request(ENDPOINTS.ADMIN_DASHBOARD);
  }

  static approveContribution(contributionId: number, action: string, reason?: string) {
    return this.request(ENDPOINTS.ADMIN_APPROVE_CONTRIBUTION, 'POST', {
      contribution_id: contributionId, action, reason
    });
  }

  static approveLoan(loanId: number, action: string, notes?: string) {
    return this.request(ENDPOINTS.ADMIN_APPROVE_LOAN, 'POST', {
      loan_id: loanId, action, notes
    });
  }

  static approveRepayment(repaymentId: number, action: string) {
    return this.request(ENDPOINTS.ADMIN_APPROVE_REPAYMENT, 'POST', {
      repayment_id: repaymentId, action
    });
  }
}

export default ApiService;
