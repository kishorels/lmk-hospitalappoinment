import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '../../src/context/AuthContext';
import { Button, Input } from '../../src/components';
import { colors } from '../../src/theme/colors';

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
      const success = await login(email, password, selectedRole);
      if (success) {
        switch (selectedRole) {
          case 'user':
            router.replace('/(user)/home');
            break;
          case 'hospital':
            router.replace('/(hospital)/dashboard');
            break;
          case 'doctor':
            router.replace('/(doctor)/dashboard');
            break;
        }
      } else {
        Alert.alert('Login Failed', 'Invalid credentials. Please try again.');
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Login as:</Text>
            <View style={styles.roleTabs}>
              {(['user', 'hospital', 'doctor'] as UserRole[]).map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleTab,
                    selectedRole === role && { backgroundColor: getRoleColor(role) + '20', borderColor: getRoleColor(role) },
                  ]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Ionicons
                    name={getRoleIcon(role)}
                    size={20}
                    color={selectedRole === role ? getRoleColor(role) : colors.textLight}
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      selectedRole === role && { color: getRoleColor(role) },
                    ]}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              icon="mail"
              error={errors.email}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed"
              error={errors.password}
            />
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="large"
            style={[styles.loginButton, { backgroundColor: getRoleColor(selectedRole) }]}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/signup', params: { role: selectedRole } })}>
              <Text style={[styles.footerLink, { color: getRoleColor(selectedRole) }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  header: {
    marginTop: 16,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  roleSelector: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  roleTabs: {
    flexDirection: 'row',
    gap: 12,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    gap: 6,
  },
  roleTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  form: {
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
