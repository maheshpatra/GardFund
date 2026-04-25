import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions,
  Image
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';

import { useAlert } from '../../contexts/AlertContext';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showAlert } = useAlert();

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert({
        title: 'Missing Fields',
        message: 'Please enter both email and password to sign in.',
        type: 'warning',
      });
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      showAlert({
        title: 'Login Failed',
        message: e.message || 'The email or password you entered is incorrect.',
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
        {/* Header with Logo */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'transparent']}
            style={styles.headerGlow}
          />
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.jpg')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>GardFund</Text>
          <Text style={styles.tagline}>Secure Group Fund Management</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your account</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.dark.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.dark.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Colors.gradients.primary as any}
              style={styles.loginGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Bottom decoration */}
        <View style={styles.bottomDecor}>
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
              <Text style={styles.featureText}>Secure</Text>
            </View>
            <View style={styles.featureDot} />
            <View style={styles.featureItem}>
              <Ionicons name="people" size={16} color={Colors.secondary} />
              <Text style={styles.featureText}>100 Members</Text>
            </View>
            <View style={styles.featureDot} />
            <View style={styles.featureItem}>
              <Ionicons name="wallet" size={16} color={Colors.accent} />
              <Text style={styles.featureText}>0% Interest</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  headerGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomDecor: {
    marginTop: 32,
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.textMuted,
  },
});
