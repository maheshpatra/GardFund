import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Colors from '../../constants/Colors';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FundScreen() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [contributions, setContributions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const fetchContributions = useCallback(async () => {
    try {
      const res = await ApiService.getContributions(selectedYear);
      setContributions(res.data.contributions);
      setSummary(res.data.summary);
    } catch (e) {
      console.log('Contributions fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (user) {
      fetchContributions();
    }
  }, [fetchContributions, user]);

  const onRefresh = () => { setRefreshing(true); fetchContributions(); };

  if (!user) return null;
  const getCurrentMonthYear = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const hasCurrentMonthContribution = () => {
    return contributions.some(c => c.month_year === getCurrentMonthYear());
  };

  const handlePay = async () => {
    if (!transactionRef && paymentMethod !== 'cash') {
      showAlert({
        title: 'Reference Missing',
        message: 'Please enter the transaction reference ID.',
        type: 'warning',
      });
      return;
    }
    setSubmitting(true);
    try {
      await ApiService.submitContribution({
        amount: 1000,
        month_year: getCurrentMonthYear(),
        payment_method: paymentMethod,
        transaction_ref: transactionRef,
      });
      showAlert({
        title: 'Success',
        message: 'Contribution submitted for approval!',
        type: 'success',
      });
      setShowPayModal(false);
      setTransactionRef('');
      fetchContributions();
    } catch (e: any) {
      showAlert({
        title: 'Error',
        message: e.message || 'Failed to submit contribution.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return Colors.success;
      case 'pending': return Colors.warning;
      case 'rejected': return Colors.error;
      default: return Colors.dark.textMuted;
    }
  };

  const getMonthName = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    return `${MONTHS[parseInt(month) - 1]} ${year}`;
  };

  // Build calendar grid
  const calendarMonths = MONTHS.map((name, i) => {
    const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
    const contribution = contributions.find(c => c.month_year === monthKey);
    return { name, monthKey, contribution };
  });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Contributions</Text>
          <Text style={styles.subtitle}>₹1,000 / month</Text>
        </View>

        {/* Summary Card */}
        <LinearGradient
          colors={Colors.gradients.secondary as any}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue}>₹{(summary?.total_confirmed || 0).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Confirmed</Text>
              <Text style={styles.summaryValue}>{summary?.confirmed_count || 0}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue}>{summary?.pending_count || 0}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Pay Button */}
        {!hasCurrentMonthContribution() && (
          <TouchableOpacity style={styles.payButton} onPress={() => setShowPayModal(true)} activeOpacity={0.8}>
            <LinearGradient
              colors={Colors.gradients.primary as any}
              style={styles.payGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="card-outline" size={22} color="#fff" />
              <Text style={styles.payText}>Pay ₹1,000 for {getMonthName(getCurrentMonthYear())}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Year Selector */}
        <View style={styles.yearSelector}>
          <TouchableOpacity onPress={() => setSelectedYear(String(Number(selectedYear) - 1))}>
            <Ionicons name="chevron-back" size={20} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.yearText}>{selectedYear}</Text>
          <TouchableOpacity onPress={() => setSelectedYear(String(Number(selectedYear) + 1))}>
            <Ionicons name="chevron-forward" size={20} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarMonths.map((item, index) => (
            <View key={index} style={[
              styles.calendarItem,
              item.contribution?.status === 'confirmed' && styles.calendarPaid,
              item.contribution?.status === 'pending' && styles.calendarPending,
            ]}>
              <Text style={styles.calendarMonth}>{item.name}</Text>
              {item.contribution ? (
                <Ionicons
                  name={item.contribution.status === 'confirmed' ? 'checkmark-circle' : item.contribution.status === 'pending' ? 'time' : 'close-circle'}
                  size={22}
                  color={getStatusColor(item.contribution.status)}
                />
              ) : (
                <Ionicons name="ellipse-outline" size={22} color={Colors.dark.textMuted} />
              )}
              <Text style={[styles.calendarStatus, { color: item.contribution ? getStatusColor(item.contribution.status) : Colors.dark.textMuted }]}>
                {item.contribution?.status || 'Unpaid'}
              </Text>
            </View>
          ))}
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>Payment History</Text>
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : contributions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.dark.textMuted} />
            <Text style={styles.emptyText}>No contributions for {selectedYear}</Text>
          </View>
        ) : (
          contributions.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                <Ionicons name="card" size={18} color={getStatusColor(item.status)} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyMonth}>{getMonthName(item.month_year)}</Text>
                <Text style={styles.historyMethod}>{item.payment_method} • {item.transaction_ref || 'N/A'}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>₹{parseFloat(item.amount).toLocaleString()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pay Contribution</Text>
              <TouchableOpacity onPress={() => setShowPayModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.amountDisplay}>
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amountValue}>₹ 1,000</Text>
              <Text style={styles.amountMonth}>For {getMonthName(getCurrentMonthYear())}</Text>
            </View>

            <Text style={styles.fieldLabel}>Payment Method</Text>
            <View style={styles.methodGrid}>
              {['upi', 'bank_transfer', 'cash'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={[styles.methodItem, paymentMethod === method && styles.methodActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Ionicons
                    name={method === 'upi' ? 'phone-portrait' : method === 'bank_transfer' ? 'business' : 'cash'}
                    size={20}
                    color={paymentMethod === method ? Colors.primary : Colors.dark.textMuted}
                  />
                  <Text style={[styles.methodText, paymentMethod === method && { color: Colors.primary }]}>
                    {method === 'upi' ? 'UPI' : method === 'bank_transfer' ? 'Bank' : 'Cash'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {paymentMethod !== 'cash' && (
              <>
                <Text style={styles.fieldLabel}>Transaction Reference</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter transaction ID / reference"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={transactionRef}
                  onChangeText={setTransactionRef}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, submitting && { opacity: 0.7 }]}
              onPress={handlePay}
              disabled={submitting}
            >
              <LinearGradient
                colors={Colors.gradients.primary as any}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.submitText}>Submit Payment</Text>
                )}
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
  header: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.dark.text },
  subtitle: { fontSize: 14, color: Colors.dark.textSecondary, marginTop: 2 },
  summaryCard: {
    marginHorizontal: 20, borderRadius: 20, padding: 20, marginTop: 16,
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  payButton: { marginHorizontal: 20, marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  payGradient: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, gap: 8,
  },
  payText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  yearSelector: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginVertical: 20, gap: 20,
  },
  yearText: { fontSize: 18, fontWeight: '700', color: Colors.dark.text },
  calendarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    marginHorizontal: 20, gap: 10,
  },
  calendarItem: {
    width: '30%', backgroundColor: Colors.dark.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  calendarPaid: { borderColor: Colors.success + '40', backgroundColor: Colors.success + '08' },
  calendarPending: { borderColor: Colors.warning + '40', backgroundColor: Colors.warning + '08' },
  calendarMonth: { fontSize: 13, fontWeight: '600', color: Colors.dark.text },
  calendarStatus: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.dark.text,
    marginHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, padding: 14, backgroundColor: Colors.dark.surface,
    borderRadius: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  historyIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  historyInfo: { flex: 1 },
  historyMonth: { fontSize: 14, fontWeight: '600', color: Colors.dark.text },
  historyMethod: { fontSize: 11, color: Colors.dark.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 15, fontWeight: '700', color: Colors.dark.text },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.dark.textMuted },
  modalOverlay: {
    flex: 1, backgroundColor: Colors.dark.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.dark.text },
  amountDisplay: {
    alignItems: 'center', backgroundColor: Colors.primaryGlow,
    borderRadius: 16, padding: 20, marginBottom: 24,
  },
  amountLabel: { fontSize: 13, color: Colors.dark.textSecondary },
  amountValue: { fontSize: 36, fontWeight: '800', color: Colors.primary, marginVertical: 4 },
  amountMonth: { fontSize: 13, color: Colors.dark.textSecondary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark.textSecondary, marginBottom: 8 },
  methodGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  methodItem: {
    flex: 1, alignItems: 'center', gap: 6,
    padding: 14, borderRadius: 14, backgroundColor: Colors.dark.inputBg,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  methodActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  methodText: { fontSize: 12, fontWeight: '600', color: Colors.dark.textMuted },
  modalInput: {
    backgroundColor: Colors.dark.inputBg, borderRadius: 14,
    paddingHorizontal: 16, height: 50, color: Colors.dark.text,
    fontSize: 15, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 24,
  },
  submitButton: { borderRadius: 14, overflow: 'hidden' },
  submitGradient: { justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
