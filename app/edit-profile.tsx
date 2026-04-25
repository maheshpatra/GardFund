import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';
import { API_BASE_URL } from '../constants/api';

const InputField = ({ label, icon, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.textAreaWrapper]}>
      <Ionicons name={icon} size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.dark.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  </View>
);

export default function EditProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    occupation: '',
    emergency_contact: '',
    address: '',
    bank_name: '',
    account_no: '',
    ifsc_code: '',
    upi_id: '',
    avatar_url: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await ApiService.getProfile();
      const p = res.data;
      setForm({
        full_name: p.full_name || '',
        phone: p.phone || '',
        occupation: p.occupation || '',
        emergency_contact: p.emergency_contact || '',
        address: p.address || '',
        bank_name: p.bank_name || '',
        account_no: p.account_no || '',
        ifsc_code: p.ifsc_code || '',
        upi_id: p.upi_id || '',
        avatar_url: p.avatar_url || '',
      });
    } catch (e) {
      console.log('Fetch profile error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({ title: 'Permission Needed', message: 'Gallery access is required to change profile photo.', type: 'warning' });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleUploadAvatar(result.assets[0]);
    }
  };

  const handleUploadAvatar = async (asset: any) => {
    setUploading(true);
    try {
      const fileData = {
        uri: asset.uri,
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: asset.fileName || `avatar_${Date.now()}.jpg`,
      };
      const res = await ApiService.uploadAvatar(fileData);
      setForm({ ...form, avatar_url: res.data.avatar_url });
      showAlert({ title: 'Success', message: 'Profile photo updated!', type: 'success' });
      refreshProfile();
    } catch (e: any) {
      showAlert({ title: 'Upload Error', message: e.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await ApiService.updateProfile(form);
      showAlert({ title: 'Success', message: 'Profile updated successfully!', type: 'success' });
      refreshProfile();
      router.back();
    } catch (e: any) {
      showAlert({ title: 'Error', message: e.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const avatarSource = form.avatar_url 
    ? { uri: form.avatar_url.startsWith('http') ? form.avatar_url : `${API_BASE_URL.replace('/api', '')}${form.avatar_url}` }
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                  <Text style={styles.avatarText}>{form.full_name?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage} disabled={uploading}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>Tap camera to change photo</Text>
          </View>

          {/* Form Sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <InputField label="Full Name" icon="person-outline" value={form.full_name} onChangeText={(v: string) => setForm({...form, full_name: v})} placeholder="Your full name" />
            <InputField label="Phone Number" icon="call-outline" value={form.phone} onChangeText={(v: string) => setForm({...form, phone: v})} placeholder="Primary phone" keyboardType="phone-pad" />
            <InputField label="Occupation" icon="briefcase-outline" value={form.occupation} onChangeText={(v: string) => setForm({...form, occupation: v})} placeholder="What do you do?" />
            <InputField label="Emergency Contact" icon="call-outline" value={form.emergency_contact} onChangeText={(v: string) => setForm({...form, emergency_contact: v})} placeholder="Friend or family number" keyboardType="phone-pad" />
            <InputField label="Address" icon="location-outline" value={form.address} onChangeText={(v: string) => setForm({...form, address: v})} placeholder="Current city/address" multiline />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Important for Loan Payouts</Text>
              </View>
            </View>
            <InputField label="Bank Name" icon="business-outline" value={form.bank_name} onChangeText={(v: string) => setForm({...form, bank_name: v})} placeholder="e.g. State Bank of India" />
            <InputField label="Account Number" icon="card-outline" value={form.account_no} onChangeText={(v: string) => setForm({...form, account_no: v})} placeholder="1234 5678 9012" keyboardType="numeric" />
            <InputField label="IFSC Code" icon="key-outline" value={form.ifsc_code} onChangeText={(v: string) => setForm({...form, ifsc_code: v})} placeholder="SBIN000XXXX" />
            <InputField label="UPI ID" icon="phone-portrait-outline" value={form.upi_id} onChangeText={(v: string) => setForm({...form, upi_id: v})} placeholder="username@bank" />
          </View>

          <TouchableOpacity style={[styles.saveButton, submitting && { opacity: 0.7 }]} onPress={handleSave} disabled={submitting}>
            <LinearGradient colors={Colors.gradients.primary as any} style={styles.saveGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save All Changes</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  loadingContainer: { flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.dark.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.dark.text },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarWrapper: { width: 120, height: 120, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: Colors.primary },
  placeholderAvatar: { backgroundColor: Colors.dark.surface, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 40, fontWeight: '800', color: Colors.dark.text },
  uploadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' 
  },
  cameraButton: {
    position: 'absolute', bottom: 0, right: 0,
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.dark.background,
  },
  avatarHint: { fontSize: 12, color: Colors.dark.textSecondary, marginTop: 12 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1 },
  badge: { backgroundColor: Colors.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  inputContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.dark.textSecondary, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.inputBg,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.dark.border, paddingHorizontal: 16, height: 52,
  },
  textAreaWrapper: { height: 100, alignItems: 'flex-start', paddingTop: 12 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: Colors.dark.text, fontSize: 15, height: '100%' },
  textArea: { textAlignVertical: 'top' },
  saveButton: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  saveGradient: { paddingVertical: 18, justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
