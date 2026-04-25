import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';

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
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
    <TouchableOpacity 
      style={styles.memberCard} 
      activeOpacity={0.7}
      onPress={() => {
        setSelectedMember(item);
        setModalVisible(true);
      }}
    >
      <View style={[styles.avatar, { backgroundColor: getLevelColor(item.level_name) + '20' }]}>
        {item.avatar_url ? (
          <Image 
            source={{ uri: item.avatar_url.startsWith('http') ? item.avatar_url : ApiService.getBaseUrl() + item.avatar_url }} 
            style={{ width: '100%', height: '100%', borderRadius: 16 }} 
          />
        ) : (
          <Text style={[styles.avatarText, { color: getLevelColor(item.level_name) }]}>
            {item.full_name?.charAt(0)?.toUpperCase()}
          </Text>
        )}
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Members</Text>
        <View style={styles.countBadge}>
          <Ionicons name="people" size={14} color={Colors.primary} />
          <Text style={styles.countText}>{totalMembers}/100</Text>
        </View>
      </View>

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
          onEndReached={() => {
            if (members.length < totalMembers && !loading && !refreshing) {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchMembers(nextPage, search);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            members.length < totalMembers && !refreshing ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}

      {/* Member Details Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Member Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalProfileHeader}>
                  <View style={[styles.modalAvatar, { borderColor: getLevelColor(selectedMember.level_name) }]}>
                    {selectedMember.avatar_url ? (
                      <Image 
                        source={{ uri: selectedMember.avatar_url.startsWith('http') ? selectedMember.avatar_url : ApiService.getBaseUrl() + selectedMember.avatar_url }} 
                        style={{ width: '100%', height: '100%', borderRadius: 40 }} 
                      />
                    ) : (
                      <Text style={[styles.modalAvatarText, { color: getLevelColor(selectedMember.level_name) }]}>
                        {selectedMember.full_name?.charAt(0)?.toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.modalName}>{selectedMember.full_name}</Text>
                  <View style={[styles.levelPill, { backgroundColor: getLevelColor(selectedMember.level_name) + '20', marginTop: 4, paddingHorizontal: 12, paddingVertical: 4 }]}>
                    <Ionicons name={getLevelIcon(selectedMember.level_name)} size={12} color={getLevelColor(selectedMember.level_name)} />
                    <Text style={[styles.levelPillText, { color: getLevelColor(selectedMember.level_name), fontSize: 12 }]}>{selectedMember.level_name} Level</Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Member ID</Text>
                    <Text style={styles.detailValue}>{selectedMember.member_id}</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Total Points</Text>
                    <Text style={[styles.detailValue, { color: Colors.primary }]}>{selectedMember.total_points}</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Role</Text>
                    <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>{selectedMember.role}</Text>
                  </View>
                  <View style={styles.detailCard}>
                    <Text style={styles.detailLabel}>Contributions</Text>
                    <Text style={[styles.detailValue, { color: Colors.success }]}>{selectedMember.contributions_count}</Text>
                  </View>
                </View>

                <View style={styles.contactSection}>
                  <Text style={styles.sectionTitle}>Contact Info</Text>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={20} color={Colors.dark.textMuted} />
                    <Text style={styles.contactText}>{selectedMember.phone}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={20} color={Colors.dark.textMuted} />
                    <Text style={styles.contactText}>{selectedMember.email}</Text>
                  </View>
                  {selectedMember.occupation && (
                    <View style={styles.contactRow}>
                      <Ionicons name="briefcase-outline" size={20} color={Colors.dark.textMuted} />
                      <Text style={styles.contactText}>{selectedMember.occupation}</Text>
                    </View>
                  )}
                  <View style={styles.contactRow}>
                    <Ionicons name="calendar-outline" size={20} color={Colors.dark.textMuted} />
                    <Text style={styles.contactText}>Joined {new Date(selectedMember.joined_at).toLocaleDateString()}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.closeBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 8, paddingTop: 10,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.dark.text },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryGlow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
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
  modalOverlay: { flex: 1, backgroundColor: Colors.dark.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.dark.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.dark.text },
  modalProfileHeader: { alignItems: 'center', marginBottom: 24 },
  modalAvatar: { 
    width: 80, height: 80, borderRadius: 40, borderWidth: 2, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: Colors.dark.inputBg 
  },
  modalAvatarText: { fontSize: 32, fontWeight: '700' },
  modalName: { fontSize: 20, fontWeight: '700', color: Colors.dark.text },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  detailCard: { 
    width: '48%', backgroundColor: Colors.dark.inputBg, padding: 14, 
    borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.border 
  },
  detailLabel: { fontSize: 11, color: Colors.dark.textMuted, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '700', color: Colors.dark.text },
  contactSection: { backgroundColor: Colors.dark.inputBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.border, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.dark.text, marginBottom: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  contactText: { fontSize: 14, color: Colors.dark.textSecondary },
  closeBtn: { backgroundColor: Colors.dark.border, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  closeBtnText: { color: Colors.dark.text, fontSize: 15, fontWeight: '700' }
});
