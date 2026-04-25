import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Colors from '../constants/Colors';
import ApiService from '../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await ApiService.getNotifications();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (e) {
      console.log('Notifications error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await ApiService.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) { console.log(e); }
  };

  const getTypeIcon = (type: string): { name: any; color: string } => {
    const map: Record<string, { name: any; color: string }> = {
      contribution: { name: 'card', color: Colors.success },
      loan: { name: 'cash', color: Colors.primary },
      alert: { name: 'warning', color: Colors.warning },
      reward: { name: 'trophy', color: Colors.accent },
      reminder: { name: 'alarm', color: Colors.error },
      general: { name: 'notifications', color: Colors.info },
    };
    return map[type] || map.general;
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderNotification = ({ item }: any) => {
    const typeInfo = getTypeIcon(item.type);
    return (
      <View style={[styles.notifCard, !item.is_read && styles.unreadCard]}>
        <View style={[styles.notifIcon, { backgroundColor: typeInfo.color + '15' }]}>
          <Ionicons name={typeInfo.name} size={20} color={typeInfo.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMessage}>{item.message}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
          <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
          <Text style={styles.markAllText}>Mark all as read ({unreadCount})</Text>
        </TouchableOpacity>
      )}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor={Colors.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No notifications</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  markAllBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    marginHorizontal: 20, marginTop: 10, padding: 10,
    backgroundColor: Colors.primaryGlow, borderRadius: 12,
  },
  markAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  notifCard: {
    flexDirection: 'row', gap: 12, padding: 14,
    backgroundColor: Colors.dark.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  unreadCard: { borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '05' },
  notifIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: Colors.dark.text, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifMessage: { fontSize: 13, color: Colors.dark.textSecondary, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: Colors.dark.textMuted },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.dark.textMuted },
});
