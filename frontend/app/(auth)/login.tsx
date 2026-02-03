import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar as RNStatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth, UserRole } from '../../src/context/AuthContext';
import { Button, Input } from '../../src/components';
import { colors, gradients } from '../../src/theme/colors';

export default function Login() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>((params.role as UserRole) || 'user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // Router will auto-redirect based on role in index.tsx
        router.replace('/');
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'user': return colors.userPrimary;
      case 'hospital': return colors.hospitalPrimary;
      case 'doctor': return colors.doctorPrimary;
    }
  };

  const getRoleIcon = (role: UserRole): keyof typeof Ionicons.glyphMap => {
    switch (role) {
      case 'user': return 'person';
      case 'hospital': return 'business';
      case 'doctor': return 'medkit';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          <LinearGradient
            colors={gradients.primary as [string, string]}
            style={styles.headerGradient}
          >
            <SafeAreaView edges={['top']}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <View style={styles.logoIconContainer}>
                  <Ionicons name="medical" size={40} color="#FFF" />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to access your healthcare portal</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  icon="mail-outline"
                />
              </View>

              <View style={styles.inputGroup}>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  error={errors.password}
                  icon="lock-closed-outline"
                />
              </View>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title={loading ? 'Signing in...' : 'Sign In'}
                onPress={handleLogin}
                disabled={loading}
                size="large"
                style={styles.loginButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.signupLink}
                onPress={() => router.push('/(auth)/signup')}
              >
                <Text style={styles.signupText}>
                  New to MedBook? <Text style={styles.signupTextBold}>Create Account</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 40,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 12,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 10,
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 28,
    marginTop: -24,
  },
  form: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  inputGroup: {
    marginBottom: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginVertical: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: colors.textLight,
    fontSize: 13,
    textTransform: 'lowercase',
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  signupText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  signupTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
