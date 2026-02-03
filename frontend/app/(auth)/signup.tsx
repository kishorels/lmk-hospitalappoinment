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

const HOSPITAL_DEPARTMENTS = [
  'Emergency',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Oncology',
  'Radiology',
  'Pathology',
  'Dermatology',
  'ENT',
  'Ophthalmology',
  'Psychiatry',
  'Urology',
  'Nephrology',
  'Gastroenterology',
  'Pulmonology',
  'Endocrinology',
  'General Surgery',
  'Dental',
  'Physiotherapy',
  'ICU',
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
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

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
      if (!area) newErrors.area = 'Area is required';
      if (!city) newErrors.city = 'City is required';
      if (!state) newErrors.state = 'State is required';
      if (!pincode) newErrors.pincode = 'Pincode is required';
      const pendingDepartments = departmentInput
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
      const allDepartments = Array.from(new Set([...selectedDepartments, ...pendingDepartments]));
      if (allDepartments.length === 0) newErrors.departments = 'At least one department is required';
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
      const pendingDepartments = departmentInput
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
      const allDepartments = Array.from(new Set([...selectedDepartments, ...pendingDepartments]));

      const result = await signup({
        name,
        email,
        password,
        phone,
        role,
        specialization: role === 'doctor' ? specialization : undefined,
        experience: role === 'doctor' ? parseInt(experience) || 0 : undefined,
        address: role === 'hospital' ? address : undefined,
        area: role === 'hospital' ? area : undefined,
        city: role === 'hospital' ? city : undefined,
        state: role === 'hospital' ? state : undefined,
        pincode: role === 'hospital' ? pincode : undefined,
        departments: role === 'hospital' ? allDepartments : undefined,
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

  const filteredDepartmentSuggestions = HOSPITAL_DEPARTMENTS.filter((dept) => {
    const query = departmentInput.split(',').pop()?.trim().toLowerCase() || '';
    if (!query) return false;
    if (selectedDepartments.some(d => d.toLowerCase() === dept.toLowerCase())) return false;
    return dept.toLowerCase().includes(query);
  });

  const addDepartment = (dept: string) => {
    if (selectedDepartments.some(d => d.toLowerCase() === dept.toLowerCase())) return;
    setSelectedDepartments(prev => [...prev, dept]);
    setDepartmentInput('');
  };

  const removeDepartment = (dept: string) => {
    setSelectedDepartments(prev => prev.filter(d => d !== dept));
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
              label={role === 'hospital' ? 'Hospital Name' : 'Full Name'}
              placeholder={role === 'hospital' ? 'Enter hospital name' : 'Enter your name'}
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
                  placeholder="Street address, building, landmark"
                  value={address}
                  onChangeText={setAddress}
                  error={errors.address}
                  multiline
                  leftIcon={<Ionicons name="location-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="Area / Locality"
                  placeholder="Enter area or locality"
                  value={area}
                  onChangeText={setArea}
                  error={errors.area}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="map-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="City"
                  placeholder="Enter city"
                  value={city}
                  onChangeText={setCity}
                  error={errors.city}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="business-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="State"
                  placeholder="Enter state"
                  value={state}
                  onChangeText={setState}
                  error={errors.state}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="flag-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="Pincode"
                  placeholder="Enter pincode"
                  value={pincode}
                  onChangeText={setPincode}
                  error={errors.pincode}
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                />
                <Input
                  label="Departments"
                  placeholder="e.g., Cardiology, Orthopedics"
                  value={departmentInput}
                  onChangeText={setDepartmentInput}
                  leftIcon={<Ionicons name="list-outline" size={20} color={colors.textSecondary} />}
                />
                {errors.departments && <Text style={styles.errorText}>{errors.departments}</Text>}
                {selectedDepartments.length > 0 && (
                  <View style={styles.departmentChips}>
                    {selectedDepartments.map((dept) => (
                      <TouchableOpacity
                        key={dept}
                        style={styles.departmentChip}
                        onPress={() => removeDepartment(dept)}
                      >
                        <Text style={styles.departmentChipText}>{dept}</Text>
                        <Ionicons name="close" size={14} color={colors.text} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {filteredDepartmentSuggestions.length > 0 && (
                  <View style={styles.suggestionList}>
                    {filteredDepartmentSuggestions.map((dept) => (
                      <TouchableOpacity
                        key={dept}
                        style={styles.suggestionItem}
                        onPress={() => addDepartment(dept)}
                      >
                        <Text style={styles.suggestionText}>{dept}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingBottom: 32,
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
    paddingTop: 8,
  },
  roleIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    padding: 24,
    marginHorizontal: 24,
    marginTop: -20,
    borderRadius: 24,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
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
  departmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  departmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  departmentChipText: {
    fontSize: 12,
    color: colors.text,
  },
  suggestionList: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
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
