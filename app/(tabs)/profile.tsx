import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import Colors from '../../constants/Colors';
import CustomHeader from '../../components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAlert } from '../../contexts/AlertContext';

export default function ProfileScreen() {
  const { user, logout, refreshProfile, isLoading: isAuthLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (!user) return null;

  const fetchProfile = async () => {
    try {
      const res = await ApiService.getProfile();
      setProfile(res.data);
    } catch (e) {
      console.log('Profile fetch error:', e);
    }
  };

  const handleLogout = () => {
    showAlert({
      title: 'Logout',
      message: 'Are you sure you want to logout of your account?',
      type: 'confirm',
      confirmText: 'Logout',
      onConfirm: () => {
        logout();
        router.replace('/(auth)/login');
      }
    });
  };

  const getLevelColor = (name: string) => {
    const map: Record<string, string> = {
      Bronze: Colors.levels.bronze, Silver: Colors.levels.silver,
      Gold: Colors.levels.gold, Platinum: Colors.levels.platinum,
      Diamond: Colors.levels.diamond,
    };
    return map[name] || Colors.primary;
  };

  const menuItems = [
    { icon: 'trophy-outline', label: 'Level & Rewards', color: Colors.accent, onPress: () => router.push('/levels') },
    { icon: 'cash-outline', label: 'My Loans', color: Colors.secondary, onPress: () => router.push('/loans') },
    { icon: 'medical-outline', label: 'Hospital Directory', color: Colors.error, onPress: () => router.push('/hospitals') },
    { icon: 'notifications-outline', label: 'Notifications', color: Colors.info, onPress: () => router.push('/notifications') },
    ...(user?.role === 'admin' ? [{ icon: 'settings-outline', label: 'Admin Panel', color: Colors.primary, onPress: () => router.push('/admin') }] : []),
  ];

  const p = profile || user;

  return (
    <View style={styles.container}>
      <CustomHeader title="My Profile" showBack={false} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <LinearGradient
          colors={['rgba(99, 102, 241, 0.15)', Colors.dark.background]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={[styles.avatar, { borderColor: getLevelColor(p?.level_name || 'Bronze') }]}>
              <Text style={styles.avatarText}>{p?.full_name?.charAt(0)?.toUpperCase() || '?'}</Text>
            </View>
            <Text style={styles.name}>{p?.full_name}</Text>
            <Text style={styles.email}>{p?.email}</Text>
            <View style={styles.idRow}>
              <View style={styles.idBadge}>
                <Ionicons name="id-card" size={14} color={Colors.primary} />
                <Text style={styles.idText}>{p?.member_id}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: p?.role === 'admin' ? Colors.primary + '20' : Colors.secondary + '20' }]}>
                <Text style={[styles.roleText, { color: p?.role === 'admin' ? Colors.primary : Colors.secondary }]}>
                  {p?.role?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.total_contributions || 0}</Text>
            <Text style={styles.statLabel}>Payments</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{(profile?.total_contributed || 0).toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Contributed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.total_loans || 0}</Text>
            <Text style={styles.statLabel}>Loans</Text>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={[styles.levelBadge, { backgroundColor: getLevelColor(p?.level_name || 'Bronze') }]}>
              <Ionicons name={(p?.badge_icon || 'shield-outline') as any} size={20} color="#fff" />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelName}>{p?.level_name || 'Bronze'}</Text>
              <Text style={styles.levelPoints}>{p?.total_points || 0} points</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/levels')}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {profile?.next_level && (
            <View style={styles.nextLevelInfo}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, {
                  width: `${Math.min(100, ((p?.total_points || 0) / profile.next_level.min_points) * 100)}%`,
                  backgroundColor: getLevelColor(p?.level_name || 'Bronze'),
                }]} />
              </View>
              <Text style={styles.nextLevelText}>
                {profile.next_level.min_points - (p?.total_points || 0)} pts to {profile.next_level.level_name}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Personal Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Personal Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{p?.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Occupation</Text>
            <Text style={styles.infoValue}>{p?.occupation || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency</Text>
            <Text style={styles.infoValue}>{p?.emergency_contact || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>{p?.joined_at ? new Date(p.joined_at).toLocaleDateString() : '-'}</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  headerGradient: { paddingBottom: 20, paddingTop: 10 },
  header: { alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 24, borderWidth: 3,
    backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: Colors.dark.text },
  name: { fontSize: 22, fontWeight: '700', color: Colors.dark.text },
  email: { fontSize: 14, color: Colors.dark.textSecondary, marginTop: 2 },
  idRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  idBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  idText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 12, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row', marginHorizontal: 20, gap: 10, marginTop: 8,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.dark.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.dark.text },
  statLabel: { fontSize: 11, color: Colors.dark.textSecondary, marginTop: 4 },
  levelCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: Colors.dark.surface,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelBadge: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 16, fontWeight: '700', color: Colors.dark.text },
  levelPoints: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 2 },
  viewAll: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  nextLevelInfo: { marginTop: 12 },
  progressBar: { height: 6, backgroundColor: Colors.dark.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  nextLevelText: { fontSize: 11, color: Colors.dark.textSecondary, marginTop: 6 },
  menuContainer: { marginHorizontal: 20, marginTop: 16, gap: 6 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.dark.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.dark.text },
  infoCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: Colors.dark.surface,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark.text, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  infoLabel: { fontSize: 13, color: Colors.dark.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '500', color: Colors.dark.text },
  logoutButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 20, padding: 14,
    backgroundColor: Colors.error + '10', borderRadius: 14,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
});
