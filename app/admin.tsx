import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import Colors from '../constants/Colors';
import CustomHeader from '../components/CustomHeader';

export default function AdminScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState('contributions');

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

  useEffect(() => { fetchData(); }, []);

  const handleApproveContribution = (id: number, action: string) => {
    Alert.alert(
      `${action === 'approve' ? 'Approve' : 'Reject'} Contribution`,
      `Are you sure you want to ${action} this contribution?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : 'Reject',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await ApiService.approveContribution(id, action);
              Alert.alert('Success', `Contribution ${action}d`);
              fetchData();
            } catch (e: any) { Alert.alert('Error', e.message); }
          }
        }
      ]
    );
  };

  const handleApproveLoan = (id: number, action: string) => {
    Alert.alert(
      `${action === 'approve' ? 'Approve' : 'Reject'} Loan`,
      `Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'approve' ? 'Approve' : 'Reject',
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await ApiService.approveLoan(id, action);
              Alert.alert('Success', `Loan ${action}d`);
              fetchData();
            } catch (e: any) { Alert.alert('Error', e.message); }
          }
        }
      ]
    );
  };

  const handleApproveRepayment = (id: number, action: string) => {
    Alert.alert(`${action === 'approve' ? 'Approve' : 'Reject'} Repayment`, 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action === 'approve' ? 'Approve' : 'Reject',
        onPress: async () => {
          try {
            await ApiService.approveRepayment(id, action);
            Alert.alert('Success', `Repayment ${action}d`);
            fetchData();
          } catch (e: any) { Alert.alert('Error', e.message); }
        }
      }
    ]);
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
    { key: 'overdue', icon: 'alert-circle', label: 'Overdue', count: data?.stats?.overdue_loans || 0 },
    { key: 'defaulters', icon: 'person-remove', label: 'Defaulters', count: data?.stats?.defaulters || 0 },
  ];

  return (
    <View style={styles.container}>
      <CustomHeader title="Admin Panel" />
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
});
