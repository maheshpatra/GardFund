import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';

import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [recentLimit, setRecentLimit] = useState(12);

  const fetchData = useCallback(async (limit = 12) => {
    try {
      const [fundRes, notifRes] = await Promise.all([
        ApiService.getFundDashboard(limit),
        ApiService.getNotifications(true),
      ]);
      setDashboard(fundRes.data);
      setNotifCount(notifRes.data?.unread_count || 0);
    } catch (e) {
      console.log('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData(recentLimit);
    }
  }, [fetchData, user]);

  const loadMoreActivity = async () => {
    const newLimit = recentLimit + 12;
    setRecentLimit(newLimit);
    try {
       const res = await ApiService.getFundDashboard(newLimit);
       setDashboard((prev: any) => ({ ...prev, recent_transactions: res.data.recent_transactions }));
    } catch(e) { console.log(e); }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(recentLimit); };

  const formatCurrency = (amount: number) => {
    return '₹' + (amount || 0).toLocaleString('en-IN');
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) return null;

  const quickActions = [
    { icon: 'card-outline', label: 'Pay', color: Colors.primary, onPress: () => router.push('/fund') },
    { icon: 'cash-outline', label: 'Loans', color: Colors.secondary, onPress: () => router.push('/loans') },
    { icon: 'medical-outline', label: 'Hospitals', color: Colors.error, onPress: () => router.push('/hospitals') },
    { icon: 'trophy-outline', label: 'Levels', color: Colors.accent, onPress: () => router.push('/levels') },
  ];

  if (!user) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user.full_name?.split(' ')[0]} 👋</Text>
            <Text style={styles.memberId}>ID: {user.member_id}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={Colors.dark.text} />
              {notifCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            {user.role === 'admin' && (
              <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/admin')}>
                <Ionicons name="settings-outline" size={22} color={Colors.dark.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Fund Balance Card */}
        <LinearGradient
          colors={Colors.gradients.primary as any}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Fund Balance</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(dashboard?.fund_balance || 0)}</Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Members</Text>
              <Text style={styles.balanceStatValue}>{dashboard?.member_count || 0}/100</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Active Loans</Text>
              <Text style={styles.balanceStatValue}>{formatCurrency(dashboard?.active_loans_total || 0)}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Collected</Text>
              <Text style={styles.balanceStatValue}>{formatCurrency(dashboard?.total_contributions || 0)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Monthly Collection Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Collection</Text>
            <Text style={styles.cardSubtitle}>{dashboard?.monthly_collection?.month || ''}</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={Colors.gradients.secondary as any}
                style={[styles.progressFill, { width: `${dashboard?.monthly_collection?.collection_rate || 0}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>
              {dashboard?.monthly_collection?.paid_count || 0}/{dashboard?.monthly_collection?.total_members || 0} members paid
              ({dashboard?.monthly_collection?.collection_rate || 0}%)
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionItem} onPress={action.onPress} activeOpacity={0.7}>
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon as any} size={26} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Level Card */}
        <TouchableOpacity style={styles.levelCard} onPress={() => router.push('/levels')} activeOpacity={0.8}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.05)']}
            style={styles.levelCardInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.levelInfo}>
              <View style={[styles.levelBadge, { backgroundColor: user.badge_color || Colors.levels.bronze }]}>
                <Ionicons
                  name={
                    user.level_name === 'Silver' ? 'medal-outline' :
                      user.level_name === 'Gold' ? 'trophy-outline' :
                        user.level_name === 'Platinum' ? 'diamond-outline' :
                          user.level_name === 'Diamond' ? 'sparkles-outline' :
                            'shield-outline'
                  }
                  size={18}
                  color="#fff"
                />
              </View>
              <View>
                <Text style={styles.levelName}>{user.level_name || 'Bronze'} Member</Text>
                <Text style={styles.levelPoints}>{user.total_points || 0} points</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.dark.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activity</Text>
            <Ionicons name="time-outline" size={18} color={Colors.dark.textMuted} />
          </View>
          {(dashboard?.recent_transactions || []).length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            (dashboard?.recent_transactions || []).map((tx: any, index: number) => (
              <View key={index} style={styles.transactionItem}>
                <View style={[
                  styles.txIcon,
                  { backgroundColor: tx.direction === 'credit' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                ]}>
                  <Ionicons
                    name={tx.direction === 'credit' ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={tx.direction === 'credit' ? Colors.success : Colors.error}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txType}>{tx.transaction_type?.replace('_', ' ')}</Text>
                  <Text style={styles.txMember}>{tx.full_name || 'System'}</Text>
                </View>
                <Text style={[
                  styles.txAmount,
                  { color: tx.direction === 'credit' ? Colors.success : Colors.error }
                ]}>
                  {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </View>
            ))
          )}

          {(dashboard?.recent_transactions || []).length >= recentLimit && (
            <TouchableOpacity 
              style={{ marginTop: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.dark.inputBg, borderRadius: 12, borderWidth: 1, borderColor: Colors.dark.border }} 
              onPress={loadMoreActivity}
            >
              <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>Load Next</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.dark.text },
  memberId: { fontSize: 13, color: Colors.dark.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.error, borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  balanceCard: {
    marginHorizontal: 20, borderRadius: 24, padding: 24, marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  liveText: { fontSize: 10, color: '#fff', fontWeight: '700', letterSpacing: 1 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 16 },
  balanceStats: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceStat: { flex: 1, alignItems: 'center' },
  balanceStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceStatValue: { fontSize: 13, color: '#fff', fontWeight: '700' },
  balanceDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  card: {
    marginHorizontal: 20, backgroundColor: Colors.dark.surface,
    borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark.text },
  cardSubtitle: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  progressContainer: { gap: 8 },
  progressBar: {
    height: 10, backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 5, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 5 },
  progressText: { fontSize: 13, color: Colors.dark.textSecondary },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.dark.text,
    marginHorizontal: 20, marginBottom: 12, marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 16,
  },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  actionLabel: { fontSize: 12, color: Colors.dark.textSecondary, fontWeight: '500' },
  levelCard: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  levelCardInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderWidth: 1, borderColor: Colors.dark.cardBorder, borderRadius: 16,
  },
  levelInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelBadge: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  levelName: { fontSize: 15, fontWeight: '600', color: Colors.dark.text },
  levelPoints: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: Colors.dark.textMuted },
  transactionItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  txIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '600', color: Colors.dark.text, textTransform: 'capitalize' },
  txMember: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700' },
});
