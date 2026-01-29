import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, UserRole } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Button, Input } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { SPECIALIZATIONS, DAYS_OF_WEEK } from '../../src/data/mockData';

export default function Signup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { signup } = useAuth();
  const { addHospital, addDoctor } = useData();

  const role = (params.role as UserRole) || 'user';

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Hospital fields
  const [hospitalName, setHospitalName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [departments, setDepartments] = useState('');

  // Doctor fields
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [videoConsultation, setVideoConsultation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!phone) newErrors.phone = 'Phone is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    // Hospital validations
    if (role === 'hospital') {
      if (!hospitalName) newErrors.hospitalName = 'Hospital name is required';
      if (!address) newErrors.address = 'Address is required';
      if (!city) newErrors.city = 'City is required';
    }

    // Doctor validations
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
      let hospitalId: string | undefined;
      let doctorId: string | undefined;

      // Create hospital record if hospital role
      if (role === 'hospital') {
        const hospital = await addHospital({
          name: hospitalName,
          address,
          city,
          area,
          departments: departments.split(',').map(d => d.trim()),
          rating: 4.0,
          image: 'hospital',
          contact: phone,
          email,
        });
        hospitalId = hospital.id;
      }

      // Create doctor record if doctor role
      if (role === 'doctor') {
        const doctor = await addDoctor({
          name,
          email,
          specialization,
          hospitalIds: [],
          availableDays: DAYS_OF_WEEK.slice(0, 5),
          videoConsultation,
          image: 'person',
          experience: parseInt(experience) || 0,
          rating: 4.0,
          consultationFee: parseInt(consultationFee) || 500,
        });
        doctorId = doctor.id;
      }

      const success = await signup({
        name,
        email,
        phone,
        password,
        role,
        hospitalId,
        doctorId,
      });

      if (success) {
        switch (role) {
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
        Alert.alert('Signup Failed', 'This email is already registered.');
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
            <View style={[styles.roleIndicator, { backgroundColor: getRoleColor() + '20' }]}>
              <Text style={[styles.roleText, { color: getRoleColor() }]}>{getRoleTitle()}</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Fill in your details to get started</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              icon="person"
              error={errors.name}
              autoCapitalize="words"
            />
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
              label="Phone Number"
              placeholder="Enter your phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              icon="call"
              error={errors.phone}
            />

            {/* Hospital specific fields */}
            {role === 'hospital' && (
              <>
                <Input
                  label="Hospital Name"
                  placeholder="Enter hospital name"
                  value={hospitalName}
                  onChangeText={setHospitalName}
                  icon="business"
                  error={errors.hospitalName}
                  autoCapitalize="words"
                />
                <Input
                  label="Address"
                  placeholder="Enter full address"
                  value={address}
                  onChangeText={setAddress}
                  icon="location"
                  error={errors.address}
                  multiline
                />
                <Input
                  label="City"
                  placeholder="Enter city"
                  value={city}
                  onChangeText={setCity}
                  icon="map"
                  error={errors.city}
                  autoCapitalize="words"
                />
                <Input
                  label="Area"
                  placeholder="Enter area/locality"
                  value={area}
                  onChangeText={setArea}
                  icon="navigate"
                  autoCapitalize="words"
                />
                <Input
                  label="Departments"
                  placeholder="e.g., Cardiology, Orthopedics"
                  value={departments}
                  onChangeText={setDepartments}
                  icon="list"
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
                  icon="ribbon"
                />
                <Input
                  label="Consultation Fee (₹)"
                  placeholder="Enter fee"
                  value={consultationFee}
                  onChangeText={setConsultationFee}
                  keyboardType="numeric"
                  icon="cash"
                />
                <TouchableOpacity
                  style={styles.videoToggle}
                  onPress={() => setVideoConsultation(!videoConsultation)}
                >
                  <Ionicons
                    name={videoConsultation ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={videoConsultation ? getRoleColor() : colors.textLight}
                  />
                  <Text style={styles.videoToggleText}>Available for Video Consultations</Text>
                </TouchableOpacity>
              </>
            )}

            <Input
              label="Password"
              placeholder="Create password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed"
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon="lock-closed"
              error={errors.confirmPassword}
            />
          </View>

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            size="large"
            style={[styles.signupButton, { backgroundColor: getRoleColor() }]}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/login', params: { role } })}>
              <Text style={[styles.footerLink, { color: getRoleColor() }]}>Sign In</Text>
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
    marginTop: 8,
    marginBottom: 24,
  },
  roleIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
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
  form: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  specializationContainer: {
    marginBottom: 16,
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
  videoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  videoToggleText: {
    fontSize: 16,
    color: colors.text,
  },
  signupButton: {
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
