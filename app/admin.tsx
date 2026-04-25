import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Colors from '../constants/Colors';

import ApiService from '../services/api';
import { useAlert } from '../contexts/AlertContext';

export default function AdminScreen() {
  const { showAlert } = useAlert();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState('contributions');
  const [settings, setSettings] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState({
    qr_code_url: '',
    upi_id: '',
    fund_bank_details: '',
  });
  const [submitting, setSubmitting] = useState(false);


  const fetchData = async () => {
    try {
      const res = await ApiService.getAdminDashboard();
      setData(res.data);
    } catch (e) {
      console.log('Admin error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await ApiService.getSettings();
      setSettings(res.data);
      setSettingsForm({
        qr_code_url: res.data.qr_code_url || '',
        upi_id: res.data.upi_id || '',
        fund_bank_details: res.data.fund_bank_details || '',
      });
    } catch (e) { console.log('Settings error:', e); }
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const handleUpdateSettings = async () => {
    setSubmitting(true);
    try {
      await ApiService.updateSettings(settingsForm);
      showAlert({ title: 'Success', message: 'Payment settings updated', type: 'success' });
      fetchSettings();
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveContribution = (id: number, action: string) => {
    showAlert({
      title: `${action === 'approve' ? 'Approve' : 'Reject'} Contribution`,
      message: `Are you sure you want to ${action} this contribution?`,
      type: 'confirm',
      confirmText: action === 'approve' ? 'Approve' : 'Reject',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await ApiService.approveContribution(id, action);
          showAlert({ title: 'Success', message: `Contribution ${action}d`, type: 'success' });
          fetchData();
        } catch (e: any) { showAlert({ title: 'Error', message: e.message, type: 'error' }); }
      }
    });
  };

  const handleApproveLoan = (id: number, action: string) => {
    showAlert({
      title: `${action === 'approve' ? 'Approve' : 'Reject'} Loan`,
      message: `Are you sure?`,
      type: 'confirm',
      confirmText: action === 'approve' ? 'Approve' : 'Reject',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await ApiService.approveLoan(id, action);
          showAlert({ title: 'Success', message: `Loan ${action}d`, type: 'success' });
          fetchData();
        } catch (e: any) { showAlert({ title: 'Error', message: e.message, type: 'error' }); }
      }
    });
  };

  const handleApproveUser = (id: number, action: string) => {
    showAlert({
      title: `${action === 'approve' ? 'Approve' : 'Reject'} User`,
      message: `Are you sure you want to ${action} this registration?`,
      type: 'confirm',
      confirmText: action === 'approve' ? 'Approve' : 'Reject',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await ApiService.approveUser(id, action);
          showAlert({ title: 'Success', message: `User registration ${action}d`, type: 'success' });
          fetchData();
        } catch (e: any) { showAlert({ title: 'Error', message: e.message, type: 'error' }); }
      }
    });
  };

  const handleApproveRepayment = (id: number, action: string) => {
    showAlert({
      title: `${action === 'approve' ? 'Approve' : 'Reject'} Repayment`,
      message: 'Are you sure?',
      type: 'confirm',
      confirmText: action === 'approve' ? 'Approve' : 'Reject',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await ApiService.approveRepayment(id, action);
          showAlert({ title: 'Success', message: `Repayment ${action}d`, type: 'success' });
          fetchData();
        } catch (e: any) { showAlert({ title: 'Error', message: e.message, type: 'error' }); }
      }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const sections = [
    { key: 'contributions', icon: 'card', label: 'Contributions', count: data?.stats?.pending_contributions || 0 },
    { key: 'loans', icon: 'cash', label: 'Loans', count: data?.stats?.pending_loans || 0 },
    { key: 'repayments', icon: 'return-down-back', label: 'Repayments', count: data?.stats?.pending_repayments || 0 },
    { key: 'users', icon: 'person-add', label: 'Approvals', count: data?.stats?.pending_users || 0 },
    { key: 'overdue', icon: 'alert-circle', label: 'Overdue', count: data?.stats?.overdue_loans || 0 },
    { key: 'defaulters', icon: 'person-remove', label: 'Defaulters', count: data?.stats?.defaulters || 0 },
    { key: 'settings', icon: 'settings', label: 'Settings', count: '' },
  ];


  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
      >
        {/* Stats Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingVertical: 12 }}>
          {sections.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.statCard, activeSection === s.key && styles.statCardActive]}
              onPress={() => setActiveSection(s.key)}
            >
              <Ionicons name={s.icon as any} size={20} color={activeSection === s.key ? Colors.primary : Colors.dark.textMuted} />
              <Text style={[styles.statCount, activeSection === s.key && { color: Colors.primary }]}>{s.count}</Text>
              <Text style={[styles.statLabel, activeSection === s.key && { color: Colors.primary }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pending Contributions */}
        {activeSection === 'contributions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Contributions</Text>
            {(data?.pending_contributions || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                <Text style={styles.emptyText}>All caught up!</Text>
              </View>
            ) : (
              (data?.pending_contributions || []).map((item: any, i: number) => (
                <View key={i} style={styles.approvalCard}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalName}>{item.full_name}</Text>
                    <Text style={styles.approvalDetail}>{item.member_id} • {item.month_year}</Text>
                    <Text style={styles.approvalAmount}>₹{parseFloat(item.amount).toLocaleString()} via {item.payment_method}</Text>
                    {item.transaction_ref && <Text style={styles.approvalRef}>Ref: {item.transaction_ref}</Text>}
                  </View>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveContribution(item.id, 'approve')}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleApproveContribution(item.id, 'reject')}>
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Pending Loans */}
        {activeSection === 'loans' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Loan Requests</Text>
            {(data?.pending_loans || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                <Text style={styles.emptyText}>No pending loans</Text>
              </View>
            ) : (
              (data?.pending_loans || []).map((item: any, i: number) => (
                <View key={i} style={styles.approvalCard}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalName}>{item.full_name}</Text>
                    <Text style={styles.approvalDetail}>{item.member_id} • {item.loan_type}</Text>
                    <Text style={styles.approvalAmount}>₹{parseFloat(item.amount).toLocaleString()}</Text>
                    <Text style={styles.approvalRef}>{item.purpose}</Text>
                    <Text style={styles.approvalRef}>Repay: {item.repayment_months} months • EMI: ₹{parseFloat(item.monthly_emi).toLocaleString()}</Text>
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, color: Colors.dark.textSecondary }}>Payout Preference: <Text style={{ color: Colors.primary }}>{item.disbursement_method === 'upi' ? 'UPI' : 'Bank Transfer'}</Text></Text>
                      {item.disbursement_method === 'upi' ? (
                        <Text style={{ fontSize: 13, color: Colors.dark.text, marginTop: 2 }}>{item.upi_id || 'No UPI ID Provided'}</Text>
                      ) : (
                        <Text style={{ fontSize: 13, color: Colors.dark.text, marginTop: 2 }}>Acc: {item.account_no || 'Missing'} • IFSC: {item.ifsc_code || 'Missing'}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveLoan(item.id, 'approve')}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleApproveLoan(item.id, 'reject')}>
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Pending Users */}
        {activeSection === 'users' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending User Registrations</Text>
            {(data?.pending_users || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                <Text style={styles.emptyText}>No pending registrations</Text>
              </View>
            ) : (
              (data?.pending_users || []).map((item: any, i: number) => (
                <View key={i} style={styles.approvalCard}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalName}>{item.full_name}</Text>
                    <Text style={styles.approvalDetail}>ID: {item.member_id}</Text>
                    <Text style={styles.approvalRef}>Phone: {item.phone}</Text>
                    <View style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                      <Text style={{ fontSize: 12, color: Colors.dark.textSecondary }}>Identity Verification</Text>
                      <Text style={{ fontSize: 13, color: Colors.dark.text, marginTop: 2 }}>Aadhaar: {item.aadhaar_no || 'Not provided'}</Text>
                      <Text style={{ fontSize: 13, color: Colors.dark.text, marginTop: 2 }}>PAN: {item.pan_number || 'Not provided'}</Text>
                    </View>
                  </View>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveUser(item.id, 'approve')}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleApproveUser(item.id, 'reject')}>
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Pending Repayments */}
        {activeSection === 'repayments' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Repayments</Text>
            {(data?.pending_repayments || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                <Text style={styles.emptyText}>No pending repayments</Text>
              </View>
            ) : (
              (data?.pending_repayments || []).map((item: any, i: number) => (
                <View key={i} style={styles.approvalCard}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalName}>{item.full_name}</Text>
                    <Text style={styles.approvalDetail}>{item.member_id} • {item.loan_type} Loan</Text>
                    <Text style={styles.approvalAmount}>₹{parseFloat(item.amount).toLocaleString()} via {item.payment_method}</Text>
                  </View>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveRepayment(item.id, 'approve')}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleApproveRepayment(item.id, 'reject')}>
                      <Ionicons name="close" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Overdue Loans */}
        {activeSection === 'overdue' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overdue Loans</Text>
            {(data?.overdue_loans || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                <Text style={styles.emptyText}>No overdue loans</Text>
              </View>
            ) : (
              (data?.overdue_loans || []).map((item: any, i: number) => (
                <View key={i} style={[styles.approvalCard, { borderColor: Colors.error + '40' }]}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalName}>{item.full_name}</Text>
                    <Text style={styles.approvalDetail}>{item.member_id} • {item.phone}</Text>
                    <Text style={[styles.approvalAmount, { color: Colors.error }]}>
                      ₹{parseFloat(item.remaining_amount).toLocaleString()} remaining
                    </Text>
                    <Text style={styles.approvalRef}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Defaulters */}
        {activeSection === 'defaulters' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month's Defaulters</Text>
            {(data?.defaulters || []).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                <Text style={styles.emptyText}>Everyone has paid!</Text>
              </View>
            ) : (
              (data?.defaulters || []).map((item: any, i: number) => (
                <View key={i} style={[styles.approvalCard, { borderColor: Colors.warning + '40' }]}>
                  <View style={styles.approvalInfo}>
                    <Text style={styles.approvalName}>{item.full_name}</Text>
                    <Text style={styles.approvalDetail}>{item.member_id} • {item.phone}</Text>
                    <Text style={styles.approvalRef}>{item.level_name} Member</Text>
                  </View>
                  <View style={[styles.defaultBadge]}>
                    <Ionicons name="warning" size={14} color={Colors.warning} />
                    <Text style={styles.defaultText}>Unpaid</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
        {/* Settings */}
        {activeSection === 'settings' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Configuration</Text>
            <View style={styles.settingsCard}>
              <Text style={styles.fieldLabel}>Payment QR Code URL</Text>
              <TextInput
                style={styles.adminInput}
                placeholder="https://example.com/qr.png"
                placeholderTextColor={Colors.dark.textMuted}
                value={settingsForm.qr_code_url}
                onChangeText={v => setSettingsForm({ ...settingsForm, qr_code_url: v })}
              />
              <Text style={styles.inputHint}>Link to the QR code image that users will scan.</Text>

              <Text style={styles.fieldLabel}>Fund UPI ID</Text>
              <TextInput
                style={styles.adminInput}
                placeholder="fund@upi"
                placeholderTextColor={Colors.dark.textMuted}
                value={settingsForm.upi_id}
                onChangeText={v => setSettingsForm({ ...settingsForm, upi_id: v })}
              />

              <Text style={styles.fieldLabel}>Bank Details (optional)</Text>
              <TextInput
                style={[styles.adminInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Account No, IFSC, etc."
                placeholderTextColor={Colors.dark.textMuted}
                value={settingsForm.fund_bank_details}
                onChangeText={v => setSettingsForm({ ...settingsForm, fund_bank_details: v })}
                multiline
              />

              <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.7 }]} onPress={handleUpdateSettings} disabled={submitting}>
                <LinearGradient colors={Colors.gradients.primary as any} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Settings</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  statCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14,
    alignItems: 'center', width: 100, borderWidth: 1, borderColor: Colors.dark.border,
  },
  statCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  statCount: { fontSize: 22, fontWeight: '800', color: Colors.dark.text, marginTop: 4 },
  statLabel: { fontSize: 10, color: Colors.dark.textMuted, marginTop: 2, fontWeight: '600' },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.dark.text, marginBottom: 12, marginTop: 4 },
  approvalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: Colors.dark.surface, borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  approvalInfo: { flex: 1 },
  approvalName: { fontSize: 15, fontWeight: '600', color: Colors.dark.text },
  approvalDetail: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 },
  approvalAmount: { fontSize: 14, fontWeight: '700', color: Colors.success, marginTop: 4 },
  approvalRef: { fontSize: 11, color: Colors.dark.textMuted, marginTop: 2 },
  approvalActions: { gap: 8 },
  approveBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.success,
    justifyContent: 'center', alignItems: 'center',
  },
  rejectBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.error,
    justifyContent: 'center', alignItems: 'center',
  },
  defaultBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.warning + '15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  defaultText: { fontSize: 11, fontWeight: '700', color: Colors.warning },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.dark.textMuted },
  settingsCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark.textSecondary, marginBottom: 8, marginTop: 12 },
  adminInput: {
    backgroundColor: Colors.dark.inputBg, borderRadius: 12, paddingHorizontal: 16,
    height: 50, color: Colors.dark.text, fontSize: 14,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  inputHint: { fontSize: 11, color: Colors.dark.textMuted, marginTop: 4 },
  saveBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 24 },
  saveGradient: { justifyContent: 'center', alignItems: 'center', paddingVertical: 14 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

