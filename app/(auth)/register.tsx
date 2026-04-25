import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Image
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';

import { useAlert } from '../../contexts/AlertContext';

const InputField = ({ icon, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry = false, required = false }: any) => (
  <View style={styles.inputWrapper}>
    <Ionicons name={icon} size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={`${placeholder}${required ? ' *' : ''}`}
      placeholderTextColor={Colors.dark.textMuted}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
    />
  </View>
);

export default function RegisterScreen() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    occupation: '',
    emergency_contact: '',
    aadhaar_no: '',
    pan_number: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { showAlert } = useAlert();

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    if (!form.full_name || !form.email || !form.phone || !form.password) {
      showAlert({
        title: 'Required Fields',
        message: 'Please fill in all the required fields marked with *',
        type: 'warning',
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      showAlert({
        title: 'Password Mismatch',
        message: 'The password and confirmation password do not match.',
        type: 'error',
      });
      return;
    }
    if (form.password.length < 6) {
      showAlert({
        title: 'Weak Password',
        message: 'Your password must be at least 6 characters long.',
        type: 'warning',
      });
      return;
    }
    setLoading(true);
    try {
      await register(form);
      showAlert({
        title: 'Registration Successful',
        message: 'Your account has been created. Please wait for admin approval to log in.',
        type: 'success',
      });
      router.replace('/(auth)/login');
    } catch (e: any) {
      showAlert({
        title: 'Registration Failed',
        message: e.message || 'We could not create your account at this time.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </Link>
          <View style={styles.headerCenter}>
            <Image 
              source={require('../../assets/images/logo.jpg')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>Join GardFund</Text>
            <Text style={styles.subtitle}>Create your account & start saving together</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>

          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.inputGroup}>
            <InputField icon="person-outline" placeholder="Full Name" value={form.full_name} onChangeText={(v: string) => updateForm('full_name', v)} required />
            <InputField icon="mail-outline" placeholder="Email" value={form.email} onChangeText={(v: string) => updateForm('email', v)} keyboardType="email-address" required />
            <InputField icon="call-outline" placeholder="Phone Number" value={form.phone} onChangeText={(v: string) => updateForm('phone', v)} keyboardType="phone-pad" required />
            <InputField icon="briefcase-outline" placeholder="Occupation" value={form.occupation} onChangeText={(v: string) => updateForm('occupation', v)} />
            <InputField icon="call-outline" placeholder="Emergency Contact" value={form.emergency_contact} onChangeText={(v: string) => updateForm('emergency_contact', v)} keyboardType="phone-pad" />
          </View>

          <Text style={styles.sectionTitle}>Identity Verification</Text>
          <View style={styles.inputGroup}>
            <InputField icon="card-outline" placeholder="Aadhaar Number (12 digits)" value={form.aadhaar_no} onChangeText={(v: string) => updateForm('aadhaar_no', v)} keyboardType="numeric" required />
            <InputField icon="wallet-outline" placeholder="PAN Number" value={form.pan_number} onChangeText={(v: string) => updateForm('pan_number', v)} required />
          </View>

          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password *"
                placeholderTextColor={Colors.dark.textMuted}
                value={form.password}
                onChangeText={v => updateForm('password', v)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>
            <InputField icon="lock-closed-outline" placeholder="Confirm Password" value={form.confirmPassword} onChangeText={(v: string) => updateForm('confirmPassword', v)} secureTextEntry={!showPassword} required />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.gradients.secondary as any}
              style={styles.registerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already a member? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 24 },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: Colors.dark.border,
  },
  headerCenter: { alignItems: 'center' },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.dark.text },
  subtitle: { fontSize: 14, color: Colors.dark.textSecondary, marginTop: 4 },
  formContainer: {
    backgroundColor: Colors.dark.surface, borderRadius: 24,
    padding: 24, borderWidth: 1, borderColor: Colors.dark.cardBorder,
  },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12, padding: 12, marginBottom: 16, gap: 8,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: Colors.primary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 4,
  },
  inputGroup: { gap: 12, marginBottom: 20 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark.inputBg, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.dark.border,
    paddingHorizontal: 16, height: 52,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: Colors.dark.text, fontSize: 15, height: '100%' },
  registerButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  registerGradient: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', paddingVertical: 16, gap: 8,
  },
  registerButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: Colors.dark.textSecondary, fontSize: 14 },
  loginLink: { color: Colors.secondary, fontSize: 14, fontWeight: '600' },
});
