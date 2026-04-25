import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import Colors from '../../constants/Colors';
import CustomHeader from '../../components/CustomHeader';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  const fetchMembers = useCallback(async (p = 1, s = '') => {
    try {
      const res = await ApiService.getMembers(p, s);
      if (p === 1) {
        setMembers(res.data.members);
      } else {
        setMembers(prev => [...prev, ...res.data.members]);
      }
      setTotalMembers(res.data.pagination.total);
    } catch (e) {
      console.log('Members fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    if (user) {
      fetchMembers(); 
    }
  }, [fetchMembers, user]);

  if (!user) return null;

  const handleSearch = (text: string) => {
    setSearch(text);
    setPage(1);
    fetchMembers(1, text);
  };

  const onRefresh = () => { setRefreshing(true); setPage(1); fetchMembers(1, search); };

  const getLevelColor = (levelName: string) => {
    const colors: Record<string, string> = {
      Bronze: Colors.levels.bronze,
      Silver: Colors.levels.silver,
      Gold: Colors.levels.gold,
      Platinum: Colors.levels.platinum,
      Diamond: Colors.levels.diamond,
    };
    return colors[levelName] || Colors.primary;
  };

  const getLevelIcon = (name: string) => {
    const map: Record<string, any> = {
      Bronze: 'shield-outline',
      Silver: 'medal-outline',
      Gold: 'trophy-outline',
      Platinum: 'diamond-outline',
      Diamond: 'sparkles-outline',
    };
    return map[name] || 'shield-outline';
  };

  const renderMember = ({ item }: any) => (
    <View style={styles.memberCard}>
      <View style={[styles.avatar, { backgroundColor: getLevelColor(item.level_name) + '20' }]}>
        <Text style={[styles.avatarText, { color: getLevelColor(item.level_name) }]}>
          {item.full_name?.charAt(0)?.toUpperCase()}
        </Text>
      </View>
      <View style={styles.memberInfo}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{item.full_name}</Text>
          <View style={[styles.levelPill, { backgroundColor: getLevelColor(item.level_name) + '20' }]}>
            <Ionicons name={getLevelIcon(item.level_name)} size={10} color={getLevelColor(item.level_name)} />
            <Text style={[styles.levelPillText, { color: getLevelColor(item.level_name) }]}>{item.level_name}</Text>
          </View>
        </View>
        <Text style={styles.memberId}>{item.member_id} • {item.phone}</Text>
        <View style={styles.memberStats}>
          <View style={styles.statItem}>
            <Ionicons name="card" size={12} color={Colors.success} />
            <Text style={styles.statText}>{item.contributions_count} paid</Text>
          </View>
          {item.occupation && (
            <View style={styles.statItem}>
              <Ionicons name="briefcase" size={12} color={Colors.primary} />
              <Text style={styles.statText}>{item.occupation}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CustomHeader 
        title="Members" 
        showBack={false} 
        rightAction={
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalMembers}</Text>
          </View>
        }
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or phone..."
            placeholderTextColor={Colors.dark.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMember}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  countText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark.surface, borderRadius: 14,
    paddingHorizontal: 14, height: 48, gap: 10,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 15 },
  memberCard: {
    flexDirection: 'row', padding: 16,
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.dark.cardBorder, gap: 14,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  memberName: { fontSize: 15, fontWeight: '600', color: Colors.dark.text, flex: 1 },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  levelPillText: { fontSize: 10, fontWeight: '700' },
  memberId: { fontSize: 12, color: Colors.dark.textSecondary, marginBottom: 6 },
  memberStats: { flexDirection: 'row', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: Colors.dark.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.dark.textMuted },
});
