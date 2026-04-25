import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

export default function LoansScreen() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loanForm, setLoanForm] = useState({
    loan_type: 'emergency', amount: '', purpose: '', repayment_months: '6',
  });
  const [repayForm, setRepayForm] = useState({
    amount: '', payment_method: 'upi', transaction_ref: '',
  });

  const fetchLoans = useCallback(async () => {
    try {
      const params = activeTab === 'all' ? undefined : activeTab;
      const res = await ApiService.getLoans(params);
      setLoans(res.data.loans);
    } catch (e) {
      console.log('Loans error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleRequestLoan = async () => {
    if (!loanForm.amount || !loanForm.purpose) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await ApiService.requestLoan({
        ...loanForm,
        amount: parseFloat(loanForm.amount),
        repayment_months: parseInt(loanForm.repayment_months),
      });
      Alert.alert('Success', `Loan requested! EMI: ₹${res.data.monthly_emi}/month`);
      setShowRequestModal(false);
      setLoanForm({ loan_type: 'emergency', amount: '', purpose: '', repayment_months: '6' });
      fetchLoans();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRepay = async () => {
    if (!repayForm.amount) {
      Alert.alert('Error', 'Enter repayment amount');
      return;
    }
    setSubmitting(true);
    try {
      await ApiService.repayLoan({
        loan_id: selectedLoan.id,
        amount: parseFloat(repayForm.amount),
        payment_method: repayForm.payment_method,
        transaction_ref: repayForm.transaction_ref,
      });
      Alert.alert('Success', 'Repayment submitted for approval');
      setShowRepayModal(false);
      setRepayForm({ amount: '', payment_method: 'upi', transaction_ref: '' });
      fetchLoans();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      pending: { bg: Colors.warning + '15', color: Colors.warning },
      approved: { bg: Colors.info + '15', color: Colors.info },
      active: { bg: Colors.primary + '15', color: Colors.primary },
      completed: { bg: Colors.success + '15', color: Colors.success },
      rejected: { bg: Colors.error + '15', color: Colors.error },
      overdue: { bg: Colors.error + '15', color: Colors.error },
    };
    return map[status] || { bg: Colors.dark.border, color: Colors.dark.textMuted };
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLoans(); }} tintColor={Colors.primary} />}
      >
        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => { setActiveTab(tab.key); setLoading(true); }}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Request Loan Button */}
        <TouchableOpacity style={styles.requestButton} onPress={() => setShowRequestModal(true)} activeOpacity={0.8}>
          <LinearGradient
            colors={Colors.gradients.secondary as any}
            style={styles.requestGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.requestText}>Request New Loan</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Loans List */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : loans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={48} color={Colors.dark.textMuted} />
            <Text style={styles.emptyText}>No loans found</Text>
          </View>
        ) : loans.map((loan, index) => {
          const statusStyle = getStatusStyle(loan.status);
          return (
            <View key={index} style={styles.loanCard}>
              <View style={styles.loanHeader}>
                <View style={styles.loanTypeRow}>
                  <View style={[styles.loanTypeIcon, {
                    backgroundColor: loan.loan_type === 'emergency' ? Colors.error + '15' :
                      loan.loan_type === 'medical' ? Colors.info + '15' : Colors.secondary + '15'
                  }]}>
                    <Ionicons
                      name={loan.loan_type === 'emergency' ? 'flash' : loan.loan_type === 'medical' ? 'medical' : 'cash'}
                      size={18}
                      color={loan.loan_type === 'emergency' ? Colors.error :
                        loan.loan_type === 'medical' ? Colors.info : Colors.secondary}
                    />
                  </View>
                  <View>
                    <Text style={styles.loanType}>{loan.loan_type} Loan</Text>
                    <Text style={styles.loanId}>#{loan.id}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{loan.status}</Text>
                </View>
              </View>

              <View style={styles.loanAmount}>
                <Text style={styles.amountLabel}>Amount</Text>
                <Text style={styles.amountValue}>₹{parseFloat(loan.amount).toLocaleString('en-IN')}</Text>
              </View>

              <Text style={styles.purposeText}>{loan.purpose}</Text>

              {loan.status === 'active' && (
                <>
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Repayment Progress</Text>
                      <Text style={styles.progressPercent}>{loan.progress}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <LinearGradient
                        colors={Colors.gradients.secondary as any}
                        style={[styles.progressFill, { width: `${loan.progress}%` }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                    <View style={styles.progressStats}>
                      <Text style={styles.progressStat}>Paid: ₹{parseFloat(loan.total_repaid).toLocaleString()}</Text>
                      <Text style={styles.progressStat}>Remaining: ₹{parseFloat(loan.remaining_amount).toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={styles.loanDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>EMI</Text>
                      <Text style={styles.detailValue}>₹{parseFloat(loan.monthly_emi).toLocaleString()}/mo</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Interest</Text>
                      <Text style={[styles.detailValue, { color: Colors.success }]}>0%</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Due Date</Text>
                      <Text style={styles.detailValue}>{new Date(loan.due_date).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.repayButton}
                    onPress={() => { setSelectedLoan(loan); setShowRepayModal(true); }}
                  >
                    <Text style={styles.repayText}>Make Repayment</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Request Loan Modal */}
      <Modal visible={showRequestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Loan</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Loan Type</Text>
            <View style={styles.typeGrid}>
              {[
                { key: 'emergency', icon: 'flash', label: 'Emergency', color: Colors.error },
                { key: 'small', icon: 'cash', label: 'Small', color: Colors.secondary },
                { key: 'medical', icon: 'medical', label: 'Medical', color: Colors.info },
              ].map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.typeItem, loanForm.loan_type === type.key && { borderColor: type.color }]}
                  onPress={() => setLoanForm({ ...loanForm, loan_type: type.key })}
                >
                  <Ionicons name={type.icon as any} size={24} color={loanForm.loan_type === type.key ? type.color : Colors.dark.textMuted} />
                  <Text style={[styles.typeText, loanForm.loan_type === type.key && { color: type.color }]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput style={styles.modalInput} placeholder="Enter amount" placeholderTextColor={Colors.dark.textMuted} value={loanForm.amount} onChangeText={v => setLoanForm({ ...loanForm, amount: v })} keyboardType="numeric" />

            <Text style={styles.fieldLabel}>Purpose</Text>
            <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} placeholder="Describe the reason" placeholderTextColor={Colors.dark.textMuted} value={loanForm.purpose} onChangeText={v => setLoanForm({ ...loanForm, purpose: v })} multiline />

            <Text style={styles.fieldLabel}>Repayment Period (months)</Text>
            <View style={styles.monthsGrid}>
              {['3', '6', '9', '12'].map(m => (
                <TouchableOpacity key={m}
                  style={[styles.monthItem, loanForm.repayment_months === m && styles.monthActive]}
                  onPress={() => setLoanForm({ ...loanForm, repayment_months: m })}
                >
                  <Text style={[styles.monthText, loanForm.repayment_months === m && { color: Colors.primary }]}>{m} mo</Text>
                </TouchableOpacity>
              ))}
            </View>

            {loanForm.amount && (
              <View style={styles.emiPreview}>
                <Text style={styles.emiLabel}>Estimated EMI</Text>
                <Text style={styles.emiValue}>
                  ₹{Math.ceil(parseFloat(loanForm.amount || '0') / parseInt(loanForm.repayment_months || '6')).toLocaleString()}/month
                </Text>
              </View>
            )}

            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleRequestLoan} disabled={submitting}>
              <LinearGradient colors={Colors.gradients.primary as any} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Request</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Repay Modal */}
      <Modal visible={showRepayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Repayment</Text>
              <TouchableOpacity onPress={() => setShowRepayModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            {selectedLoan && (
              <View style={styles.emiPreview}>
                <Text style={styles.emiLabel}>Remaining: ₹{parseFloat(selectedLoan.remaining_amount).toLocaleString()}</Text>
                <Text style={styles.emiValue}>EMI: ₹{parseFloat(selectedLoan.monthly_emi).toLocaleString()}</Text>
              </View>
            )}
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput style={styles.modalInput} placeholder="Enter amount" placeholderTextColor={Colors.dark.textMuted} value={repayForm.amount} onChangeText={v => setRepayForm({ ...repayForm, amount: v })} keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Transaction Reference</Text>
            <TextInput style={styles.modalInput} placeholder="UPI/Bank ref" placeholderTextColor={Colors.dark.textMuted} value={repayForm.transaction_ref} onChangeText={v => setRepayForm({ ...repayForm, transaction_ref: v })} />
            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleRepay} disabled={submitting}>
              <LinearGradient colors={Colors.gradients.secondary as any} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Repayment</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  tabContainer: { marginTop: 10, marginBottom: 12 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  tabActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.dark.textMuted },
  tabTextActive: { color: Colors.primary },
  requestButton: { marginHorizontal: 20, marginBottom: 16, borderRadius: 14, overflow: 'hidden' },
  requestGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, gap: 8 },
  requestText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loanCard: {
    marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.dark.surface,
    borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  loanTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loanTypeIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  loanType: { fontSize: 15, fontWeight: '600', color: Colors.dark.text, textTransform: 'capitalize' },
  loanId: { fontSize: 11, color: Colors.dark.textMuted },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  loanAmount: { marginBottom: 8 },
  amountLabel: { fontSize: 11, color: Colors.dark.textSecondary },
  amountValue: { fontSize: 26, fontWeight: '800', color: Colors.dark.text },
  purposeText: { fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 14, lineHeight: 18 },
  progressSection: { marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: Colors.dark.textSecondary },
  progressPercent: { fontSize: 12, fontWeight: '700', color: Colors.secondary },
  progressBar: { height: 8, backgroundColor: Colors.dark.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressStat: { fontSize: 11, color: Colors.dark.textMuted },
  loanDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.dark.border },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 10, color: Colors.dark.textMuted, marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: '700', color: Colors.dark.text },
  repayButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primaryGlow,
  },
  repayText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.dark.textMuted },
  modalOverlay: { flex: 1, backgroundColor: Colors.dark.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.dark.surface, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.dark.text },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark.textSecondary, marginBottom: 8, marginTop: 4 },
  typeGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeItem: {
    flex: 1, alignItems: 'center', gap: 6, padding: 14, borderRadius: 14,
    backgroundColor: Colors.dark.inputBg, borderWidth: 1.5, borderColor: Colors.dark.border,
  },
  typeText: { fontSize: 12, fontWeight: '600', color: Colors.dark.textMuted },
  modalInput: {
    backgroundColor: Colors.dark.inputBg, borderRadius: 14, paddingHorizontal: 16,
    height: 50, color: Colors.dark.text, fontSize: 15,
    borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 12,
  },
  monthsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  monthItem: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 12,
    backgroundColor: Colors.dark.inputBg, borderWidth: 1, borderColor: Colors.dark.border,
  },
  monthActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  monthText: { fontSize: 13, fontWeight: '600', color: Colors.dark.textMuted },
  emiPreview: {
    backgroundColor: Colors.primaryGlow, borderRadius: 12, padding: 14,
    alignItems: 'center', marginBottom: 16,
  },
  emiLabel: { fontSize: 12, color: Colors.dark.textSecondary },
  emiValue: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  submitGradient: { justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
