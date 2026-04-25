import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Colors from '../constants/Colors';
import ApiService from '../services/api';

export default function LevelsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const res = await ApiService.getLevels();
      setData(res.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const getLevelGradient = (name: string): string[] => {
    const map: Record<string, string[]> = {
      Bronze: ['#CD7F32', '#A0522D'],
      Silver: ['#C0C0C0', '#808080'],
      Gold: ['#FFD700', '#FFA500'],
      Platinum: ['#E5E4E2', '#B8B8B8'],
      Diamond: ['#B9F2FF', '#87CEEB'],
    };
    return map[name] || Colors.gradients.primary;
  };

  const getLevelIcon = (name: string): any => {
    const map: Record<string, any> = {
      Bronze: 'shield-outline',
      Silver: 'medal-outline',
      Gold: 'trophy-outline',
      Platinum: 'diamond-outline',
      Diamond: 'sparkles-outline',
    };
    return map[name] || 'shield-outline';
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Current Points */}
        <LinearGradient
          colors={Colors.gradients.primary as any}
          style={styles.pointsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="star" size={32} color="#fff" />
          <Text style={styles.pointsValue}>{data?.current_points || 0}</Text>
          <Text style={styles.pointsLabel}>Total Points</Text>
        </LinearGradient>

        {/* All Levels */}
        <Text style={styles.sectionTitle}>Level Tiers</Text>
        {(data?.levels || []).map((level: any, index: number) => {
          const isCurrent = level.id === data?.current_level_id;
          const isLocked = level.min_points > (data?.current_points || 0);
          return (
            <View key={index} style={[styles.levelCard, isCurrent && styles.currentLevel]}>
              <LinearGradient
                colors={getLevelGradient(level.level_name) as any}
                style={styles.levelBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={getLevelIcon(level.level_name)} size={24} color="#fff" />
              </LinearGradient>
              <View style={styles.levelInfo}>
                <View style={styles.levelHeader}>
                  <Text style={styles.levelName}>{level.level_name}</Text>
                  {isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentText}>CURRENT</Text>
                    </View>
                  )}
                  {isLocked && (
                    <Ionicons name="lock-closed" size={14} color={Colors.dark.textMuted} />
                  )}
                </View>
                <Text style={styles.levelDesc}>{level.description}</Text>
                <View style={styles.levelDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="star" size={12} color={Colors.accent} />
                    <Text style={styles.detailText}>{level.min_points} pts</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash" size={12} color={Colors.success} />
                    <Text style={styles.detailText}>Max ₹{parseFloat(level.max_loan_amount).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
                <Text style={styles.benefitsText}>🎁 {level.benefits}</Text>
              </View>
            </View>
          );
        })}

        {/* Points History */}
        <Text style={styles.sectionTitle}>Points History</Text>
        {(data?.point_history || []).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={40} color={Colors.dark.textMuted} />
            <Text style={styles.emptyText}>No points earned yet</Text>
          </View>
        ) : (
          (data?.point_history || []).map((item: any, index: number) => (
            <View key={index} style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: item.points > 0 ? Colors.success + '15' : Colors.error + '15' }]}>
                <Ionicons
                  name={item.points > 0 ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={item.points > 0 ? Colors.success : Colors.error}
                />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyAction}>{item.action?.replace('_', ' ')}</Text>
                <Text style={styles.historyDesc}>{item.description}</Text>
              </View>
              <Text style={[styles.historyPoints, { color: item.points > 0 ? Colors.success : Colors.error }]}>
                {item.points > 0 ? '+' : ''}{item.points}
              </Text>
            </View>
          ))
        )}

        {/* How to earn */}
        <View style={styles.earnCard}>
          <Text style={styles.earnTitle}>💡 How to Earn Points</Text>
          <View style={styles.earnItem}>
            <Text style={styles.earnPoints}>+10</Text>
            <Text style={styles.earnDesc}>Registration welcome bonus</Text>
          </View>
          <View style={styles.earnItem}>
            <Text style={styles.earnPoints}>+10</Text>
            <Text style={styles.earnDesc}>Each monthly contribution on time</Text>
          </View>
          <View style={styles.earnItem}>
            <Text style={styles.earnPoints}>+5</Text>
            <Text style={styles.earnDesc}>Each loan repayment</Text>
          </View>
          <View style={styles.earnItem}>
            <Text style={styles.earnPoints}>+25</Text>
            <Text style={styles.earnDesc}>Completing full loan repayment</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  pointsCard: {
    borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16,
  },
  pointsValue: { fontSize: 48, fontWeight: '900', color: '#fff', marginTop: 8 },
  pointsLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.dark.text, marginBottom: 14, marginTop: 8 },
  levelCard: {
    flexDirection: 'row', gap: 14, padding: 16, marginBottom: 10,
    backgroundColor: Colors.dark.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  currentLevel: { borderColor: Colors.primary + '60', backgroundColor: Colors.primary + '08' },
  levelBadge: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  levelInfo: { flex: 1 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  levelName: { fontSize: 17, fontWeight: '700', color: Colors.dark.text },
  currentBadge: { backgroundColor: Colors.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  currentText: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },
  levelDesc: { fontSize: 12, color: Colors.dark.textSecondary, marginBottom: 8 },
  levelDetails: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 12, fontWeight: '600', color: Colors.dark.textMuted },
  benefitsText: { fontSize: 11, color: Colors.primary, lineHeight: 16 },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  historyIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  historyInfo: { flex: 1 },
  historyAction: { fontSize: 13, fontWeight: '600', color: Colors.dark.text, textTransform: 'capitalize' },
  historyDesc: { fontSize: 11, color: Colors.dark.textSecondary, marginTop: 2 },
  historyPoints: { fontSize: 16, fontWeight: '800' },
  earnCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 18, marginTop: 20,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  earnTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark.text, marginBottom: 14 },
  earnItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  earnPoints: { fontSize: 16, fontWeight: '800', color: Colors.success, width: 40 },
  earnDesc: { fontSize: 13, color: Colors.dark.textSecondary, flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyText: { fontSize: 13, color: Colors.dark.textMuted },
});
