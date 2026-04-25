import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Linking, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';
import Colors from '../constants/Colors';

export default function HospitalsScreen() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchHospitals = async (s = '', type = '') => {
    setLoading(true);
    try {
      const res = await ApiService.getHospitals(s, type === 'all' ? '' : type);
      setHospitals(res.data.hospitals);
    } catch (e) {
      console.log('Hospitals error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    fetchHospitals(text, activeFilter);
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    fetchHospitals(search, filter);
  };

  const callHospital = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'private', label: 'Private' },
    { key: 'government', label: 'Govt' },
    { key: 'charitable', label: 'NGO' },
  ];

  const renderHospital = ({ item }: any) => (
    <View style={styles.hospitalCard}>
      <View style={styles.hospitalHeader}>
        <View style={styles.hospitalInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            {item.is_partnered == 1 && (
              <View style={styles.partnerBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={styles.partnerText}>Partner</Text>
              </View>
            )}
          </View>
          <Text style={styles.hospitalAddress}>{item.address}, {item.city}</Text>
          {item.specialities && (
            <Text style={styles.specialities}>{item.specialities}</Text>
          )}
        </View>
      </View>

      <View style={styles.hospitalStats}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={14} color={Colors.accent} />
          <Text style={styles.statText}>{item.rating}</Text>
        </View>
        <View style={[styles.typeBadge, {
          backgroundColor: item.type === 'government' ? Colors.success + '15' :
            item.type === 'charitable' ? Colors.info + '15' : Colors.primary + '15'
        }]}>
          <Text style={[styles.typeText, {
            color: item.type === 'government' ? Colors.success :
              item.type === 'charitable' ? Colors.info : Colors.primary
          }]}>{item.type}</Text>
        </View>
        {item.has_emergency == 1 && (
          <View style={[styles.typeBadge, { backgroundColor: Colors.error + '15' }]}>
            <Ionicons name="flash" size={10} color={Colors.error} />
            <Text style={[styles.typeText, { color: Colors.error }]}>24/7</Text>
          </View>
        )}
        {item.discount_percentage > 0 && (
          <View style={[styles.typeBadge, { backgroundColor: Colors.success + '15' }]}>
            <Text style={[styles.typeText, { color: Colors.success }]}>{item.discount_percentage}% OFF</Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        {item.phone && (
          <TouchableOpacity style={styles.actionButton} onPress={() => callHospital(item.phone)}>
            <Ionicons name="call" size={16} color={Colors.primary} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}
        {item.emergency_phone && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.error + '10', borderColor: Colors.error + '30' }]}
            onPress={() => callHospital(item.emergency_phone)}
          >
            <Ionicons name="flash" size={16} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Emergency</Text>
          </TouchableOpacity>
        )}
        {item.has_ambulance == 1 && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.warning + '10', borderColor: Colors.warning + '30' }]}
            onPress={() => callHospital(item.emergency_phone || item.phone)}
          >
            <Ionicons name="car" size={16} color={Colors.warning} />
            <Text style={[styles.actionText, { color: Colors.warning }]}>Ambulance</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color={Colors.dark.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals, speciality, city..."
            placeholderTextColor={Colors.dark.textMuted}
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterItem, activeFilter === f.key && styles.filterActive]}
            onPress={() => handleFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={item => item.id.toString()}
          renderItem={renderHospital}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={48} color={Colors.dark.textMuted} />
              <Text style={styles.emptyText}>No hospitals found</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  searchContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface,
    borderRadius: 14, paddingHorizontal: 14, height: 48, gap: 10,
    borderWidth: 1, borderColor: Colors.dark.border,
  },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 15 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterItem: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.dark.surface, borderWidth: 1, borderColor: Colors.dark.border,
  },
  filterActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.dark.textMuted },
  filterTextActive: { color: Colors.primary },
  hospitalCard: {
    backgroundColor: Colors.dark.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  hospitalHeader: { marginBottom: 12 },
  hospitalInfo: {},
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  hospitalName: { fontSize: 16, fontWeight: '700', color: Colors.dark.text },
  partnerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Colors.success + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  partnerText: { fontSize: 10, fontWeight: '700', color: Colors.success },
  hospitalAddress: { fontSize: 13, color: Colors.dark.textSecondary, marginBottom: 4 },
  specialities: { fontSize: 11, color: Colors.dark.textMuted, fontStyle: 'italic' },
  hospitalStats: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, fontWeight: '700', color: Colors.dark.text },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.primaryGlow, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.dark.textMuted },
});
