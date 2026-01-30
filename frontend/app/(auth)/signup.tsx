import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, UserRole } from '../../src/context/AuthContext';
import { Button, Input } from '../../src/components';
import { colors, gradients } from '../../src/theme/colors';

// Specializations list
const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Orthopedic',
  'Neurologist',
  'ENT Specialist',
  'Ophthalmologist',
  'Dentist',
  'Gynecologist',
  'Psychiatrist',
  'Urologist',
];

export default function Signup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { signup } = useAuth();

  const role = (params.role as UserRole) || 'user';

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Hospital fields
  const [address, setAddress] = useState('');
  const [departments, setDepartments] = useState('');

  // Doctor fields
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!phone) newErrors.phone = 'Phone is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (role === 'hospital') {
      if (!address) newErrors.address = 'Address is required';
    }

    if (role === 'doctor') {
      if (!specialization) newErrors.specialization = 'Specialization is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signup({
        name,
        email,
        password,
        phone,
        role,
        specialization: role === 'doctor' ? specialization : undefined,
        experience: role === 'doctor' ? parseInt(experience) || 0 : undefined,
        address: role === 'hospital' ? address : undefined,
        departments: role === 'hospital' ? departments.split(',').map(d => d.trim()) : undefined,
      });

      if (result.success) {
        router.replace('/');
      } else {
        Alert.alert('Signup Failed', result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'user': return colors.userPrimary;
      case 'hospital': return colors.hospitalPrimary;
      case 'doctor': return colors.doctorPrimary;
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'user': return 'Patient';
      case 'hospital': return 'Hospital';
      case 'doctor': return 'Doctor';
    }
  };

  const getRoleIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (role) {
      case 'user': return 'person';
      case 'hospital': return 'business';
      case 'doctor': return 'medkit';
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={[getRoleColor(), getRoleColor() + 'CC']}
            style={styles.headerGradient}
          >
            <SafeAreaView edges={['top']}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <View style={styles.roleIconContainer}>
                  <Ionicons name={getRoleIcon()} size={32} color="#FFF" />
                </View>
                <Text style={styles.title}>Create {getRoleTitle()} Account</Text>
                <Text style={styles.subtitle}>Fill in your details to get started</Text>
              </View>
            </SafeAreaView>
          </LinearGradient>
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
            />
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            />
            <Input
              label="Phone Number"
              placeholder="Enter your phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
              leftIcon={<Ionicons name="call-outline" size={20} color={colors.textSecondary} />}
            />

            {/* Hospital specific fields */}
            {role === 'hospital' && (
              <>
                <Input
                  label="Hospital Address"
                  placeholder="Enter full address"
                  value={address}
                  onChangeText={setAddress}
                  error={errors.address}
                  multiline
                  leftIcon={<Ionicons name="location-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="Departments"
                  placeholder="e.g., Cardiology, Orthopedics"
                  value={departments}
                  onChangeText={setDepartments}
                  leftIcon={<Ionicons name="list-outline" size={20} color={colors.textSecondary} />}
                />
              </>
            )}

            {/* Doctor specific fields */}
            {role === 'doctor' && (
              <>
                <View style={styles.specializationContainer}>
                  <Text style={styles.fieldLabel}>Specialization</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specializationScroll}>
                    {SPECIALIZATIONS.map((spec) => (
                      <TouchableOpacity
                        key={spec}
                        style={[
                          styles.specializationChip,
                          specialization === spec && { backgroundColor: getRoleColor(), borderColor: getRoleColor() },
                        ]}
                        onPress={() => setSpecialization(spec)}
                      >
                        <Text
                          style={[
                            styles.specializationText,
                            specialization === spec && { color: '#FFF' },
                          ]}
                        >
                          {spec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}
                </View>
                <Input
                  label="Years of Experience"
                  placeholder="Enter years"
                  value={experience}
                  onChangeText={setExperience}
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="ribbon-outline" size={20} color={colors.textSecondary} />}
                />
              </>
            )}

            <Input
              label="Password"
              placeholder="Create password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            />

            <Button
              title={loading ? 'Creating Account...' : 'Create Account'}
              onPress={handleSignup}
              disabled={loading}
              size="large"
              style={[styles.signupButton, { backgroundColor: getRoleColor() }]}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={[styles.footerLink, { color: getRoleColor() }]}>Sign In</Text>
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
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    gap: 12,
    padding: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  specializationContainer: {
    marginBottom: 8,
  },
  specializationScroll: {
    marginBottom: 4,
  },
  specializationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  specializationText: {
    fontSize: 14,
    color: colors.text,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  signupButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
