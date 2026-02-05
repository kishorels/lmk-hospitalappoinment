import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, UserRole } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Specializations list
const SPECIALIZATIONS = [
  'General Physician',
  'Family Medicine',
  'Internal Medicine',
  'Emergency Medicine',
  'Cardiologist',
  'Interventional Cardiologist',
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
  'Endocrinologist',
  'Nephrologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Oncologist',
  'Radiologist',
  'Pathologist',
  'Anesthesiologist',
  'Rheumatologist',
  'Hematologist',
  'Infectious Disease',
  'General Surgeon',
  'Cardiothoracic Surgeon',
  'Neurosurgeon',
  'Plastic Surgeon',
  'Vascular Surgeon',
  'Orthopedic Surgeon',
  'Pediatric Surgeon',
  'Obstetrician',
  'Diabetologist',
  'Allergist/Immunologist',
  'Physiotherapist',
  'Dietitian/Nutritionist',
];

const SPECIALIZATION_CATEGORIES: { label: string; items: string[] }[] = [
  { label: 'All', items: SPECIALIZATIONS },
  {
    label: 'Medicine', items: [
      'General Physician',
      'Family Medicine',
      'Internal Medicine',
      'Emergency Medicine',
      'Endocrinologist',
      'Nephrologist',
      'Gastroenterologist',
      'Pulmonologist',
      'Rheumatologist',
      'Hematologist',
      'Infectious Disease',
      'Diabetologist',
      'Allergist/Immunologist',
    ]
  },
  {
    label: 'Surgery', items: [
      'General Surgeon',
      'Cardiothoracic Surgeon',
      'Neurosurgeon',
      'Plastic Surgeon',
      'Vascular Surgeon',
      'Orthopedic Surgeon',
      'Pediatric Surgeon',
      'Obstetrician',
      'Anesthesiologist',
    ]
  },
  {
    label: 'Women', items: [
      'Gynecologist',
      'Obstetrician',
    ]
  },
  {
    label: 'Pediatrics', items: [
      'Pediatrician',
      'Pediatric Surgeon',
    ]
  },
  {
    label: 'Diagnostics', items: [
      'Radiologist',
      'Pathologist',
    ]
  },
  {
    label: 'Mental', items: [
      'Psychiatrist',
    ]
  },
  {
    label: 'Other', items: [
      'Cardiologist',
      'Interventional Cardiologist',
      'Dermatologist',
      'Orthopedic',
      'Neurologist',
      'ENT Specialist',
      'Ophthalmologist',
      'Dentist',
      'Urologist',
      'Physiotherapist',
      'Dietitian/Nutritionist',
      'Oncologist',
    ]
  },
];

const DEGREE_OPTIONS = [
  'MBBS',
  'MD',
  'MS',
  'DNB',
  'DM',
  'MCh',
  'BDS',
  'MDS',
  'BAMS',
  'BHMS',
  'BUMS',
  'BNYS',
  'BPT',
  'MPT',
  'BPharm',
  'MPharm',
  'PharmD',
  'DPM',
  'MPH',
  'MBA (Hospital Mgmt)',
];

// Custom hospital type for manually added hospitals
interface CustomHospital {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  phone: string;
}

// Custom animated input component
const AnimatedInput: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'words' | 'sentences';
  multiline?: boolean;
  accentColor: string;
}> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  accentColor,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [isFocused]);

    const borderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.border, accentColor],
    });

    return (
      <View style={inputStyles.container}>
        <Text style={inputStyles.label}>{label}</Text>
        <Animated.View style={[inputStyles.inputWrapper, { borderColor }]}>
          <Animated.View style={{ opacity: 1 }}>
            <Ionicons name={icon} size={20} color={isFocused ? accentColor : colors.textLight} />
          </Animated.View>
          <TextInput
            style={[inputStyles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder={placeholder}
            placeholderTextColor={colors.textLight}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
          />
        </Animated.View>
        {error && (
          <View style={inputStyles.errorContainer}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <Text style={inputStyles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  };

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
  },
});

export default function Signup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { signup } = useAuth();
  const { osmHospitals, getOsmHospitals, saveDoctorHospitals, addCustomHospital } = useData();

  const role = (params.role as UserRole) || 'user';

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Doctor fields
  const [specialization, setSpecialization] = useState('');
  const [experience, setExperience] = useState('');
  const [specializationSearch, setSpecializationSearch] = useState('');
  const [specializationCategory, setSpecializationCategory] = useState('All');
  const [degree, setDegree] = useState('');
  const [degreeSearch, setDegreeSearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedHospitalIds, setSelectedHospitalIds] = useState<string[]>([]);
  const [isHospitalsLoading, setIsHospitalsLoading] = useState(false);

  // Custom hospitals added by doctor
  const [customHospitals, setCustomHospitals] = useState<CustomHospital[]>([]);
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');
  const [newHospitalAddress, setNewHospitalAddress] = useState('');
  const [newHospitalCity, setNewHospitalCity] = useState('');
  const [newHospitalArea, setNewHospitalArea] = useState('');
  const [newHospitalPhone, setNewHospitalPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Define steps based on role (removed hospital role)
  const getSteps = () => {
    switch (role) {
      case 'user':
        return [
          { id: 'basic', title: 'Personal Info', icon: 'person-outline' as const },
          { id: 'security', title: 'Security', icon: 'shield-checkmark-outline' as const },
        ];
      case 'doctor':
        return [
          { id: 'basic', title: 'Personal Info', icon: 'person-outline' as const },
          { id: 'professional', title: 'Professional', icon: 'medical-outline' as const },
          { id: 'hospital', title: 'Hospital', icon: 'business-outline' as const },
          { id: 'security', title: 'Security', icon: 'shield-checkmark-outline' as const },
        ];
      default:
        return [
          { id: 'basic', title: 'Personal Info', icon: 'person-outline' as const },
          { id: 'security', title: 'Security', icon: 'shield-checkmark-outline' as const },
        ];
    }
  };

  const steps = getSteps();
  const totalSteps = steps.length;

  // Animate progress bar
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep + 1) / totalSteps,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [currentStep, totalSteps]);

  const animateStepTransition = (direction: 'forward' | 'back') => {
    const toValue = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};
    const currentStepId = steps[currentStep]?.id;

    switch (currentStepId) {
      case 'basic':
        if (!name.trim()) newErrors.name = 'Name is required';
        if (!email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
        if (!phone.trim()) newErrors.phone = 'Phone is required';
        break;
      case 'professional':
        if (!specialization) newErrors.specialization = 'Specialization is required';
        if (!degree) newErrors.degree = 'Degree is required';
        break;
      case 'hospital':
        if (selectedHospitalIds.length === 0 && customHospitals.length === 0) {
          newErrors.hospitals = 'Select at least one hospital or add a new one';
        }
        break;
      case 'security':
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStep < totalSteps - 1) {
      animateStepTransition('forward');
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateStepTransition('back');
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const handleAddCustomHospital = () => {
    if (!newHospitalName.trim()) {
      Alert.alert('Error', 'Please enter a hospital name');
      return;
    }
    if (!newHospitalAddress.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }
    if (!newHospitalCity.trim()) {
      Alert.alert('Error', 'Please enter a city');
      return;
    }

    const customId = `custom_${Date.now()}`;
    const newHospital: CustomHospital = {
      id: customId,
      name: newHospitalName.trim(),
      address: newHospitalAddress.trim(),
      city: newHospitalCity.trim(),
      area: newHospitalArea.trim(),
      phone: newHospitalPhone.trim(),
    };

    setCustomHospitals(prev => [...prev, newHospital]);
    setShowAddHospitalModal(false);

    // Clear form
    setNewHospitalName('');
    setNewHospitalAddress('');
    setNewHospitalCity('');
    setNewHospitalArea('');
    setNewHospitalPhone('');
  };

  const removeCustomHospital = (id: string) => {
    setCustomHospitals(prev => prev.filter(h => h.id !== id));
  };

  const handleSignup = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    try {
      const result = await signup({
        name,
        email,
        password,
        phone,
        role,
        specialization: role === 'doctor' ? specialization : undefined,
        degree: role === 'doctor' ? degree : undefined,
        experience: role === 'doctor' ? parseInt(experience) || 0 : undefined,
      });

      if (result.success) {
        if (role === 'doctor' && result.user) {
          // Save OSM hospital associations
          if (selectedHospitalIds.length > 0) {
            await saveDoctorHospitals(result.user.id, selectedHospitalIds);
          }

          // Save custom hospitals
          for (const hospital of customHospitals) {
            try {
              await addCustomHospital({
                name: hospital.name,
                address: hospital.address,
                city: hospital.city,
                area: hospital.area,
                phone: hospital.phone,
                doctor_id: result.user.id,
              });
            } catch (err) {
              console.error('Failed to add custom hospital:', err);
            }
          }
        }
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
      case 'doctor': return colors.doctorPrimary;
      default: return colors.primary;
    }
  };

  const getRoleGradient = (): [string, string, string] => {
    const baseColor = getRoleColor();
    return [baseColor, baseColor + 'DD', baseColor + 'AA'];
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'user': return 'Patient';
      case 'doctor': return 'Doctor';
      default: return 'Account';
    }
  };

  const getRoleIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (role) {
      case 'user': return 'person';
      case 'doctor': return 'medkit';
      default: return 'person';
    }
  };

  useEffect(() => {
    if (role !== 'doctor') return;
    if (osmHospitals.length > 0) return;
    setIsHospitalsLoading(true);
    getOsmHospitals().finally(() => setIsHospitalsLoading(false));
  }, [role, osmHospitals.length]);

  const filteredHospitals = useMemo(() => {
    const q = hospitalSearch.trim().toLowerCase().replace(/\s+/g, '');
    if (!q) return osmHospitals;
    return osmHospitals.filter(h => {
      const name = (h.name || '').toLowerCase().replace(/\s+/g, '');
      const locality = (h.locality || '').toLowerCase().replace(/\s+/g, '');
      const city = (h.city || '').toLowerCase().replace(/\s+/g, '');
      return name.includes(q) || locality.includes(q) || city.includes(q);
    });
  }, [hospitalSearch, osmHospitals]);

  const toggleHospital = (id: string) => {
    setSelectedHospitalIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const availableSpecializations = useMemo(() => {
    const category = SPECIALIZATION_CATEGORIES.find(c => c.label === specializationCategory);
    const base = category ? category.items : SPECIALIZATIONS;
    const q = specializationSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter(s => s.toLowerCase().includes(q));
  }, [specializationCategory, specializationSearch]);

  const filteredDegrees = useMemo(() => {
    const q = degreeSearch.trim().toLowerCase();
    if (!q) return DEGREE_OPTIONS;
    return DEGREE_OPTIONS.filter(d => d.toLowerCase().includes(q));
  }, [degreeSearch]);

  const accentColor = getRoleColor();

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Render step content
  const renderStepContent = () => {
    const stepId = steps[currentStep]?.id;

    switch (stepId) {
      case 'basic':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrapper, { backgroundColor: accentColor + '15' }]}>
                <Ionicons name={getRoleIcon()} size={28} color={accentColor} />
              </View>
              <Text style={styles.stepTitle}>Personal Information</Text>
              <Text style={styles.stepSubtitle}>
                {"Let's start with your basic details"}
              </Text>
            </View>

            <AnimatedInput
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              icon="person-outline"
              autoCapitalize="words"
              accentColor={accentColor}
            />

            <AnimatedInput
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              accentColor={accentColor}
            />

            <AnimatedInput
              label="Phone Number"
              placeholder="Enter phone number"
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              icon="call-outline"
              keyboardType="phone-pad"
              accentColor={accentColor}
            />
          </View>
        );

      case 'professional':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrapper, { backgroundColor: accentColor + '15' }]}>
                <Ionicons name="medical-outline" size={28} color={accentColor} />
              </View>
              <Text style={styles.stepTitle}>Professional Details</Text>
              <Text style={styles.stepSubtitle}>Tell patients about your expertise</Text>
            </View>

            {/* Specialization Category */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Specialization Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryChips}>
                  {SPECIALIZATION_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.label}
                      style={[
                        styles.categoryChip,
                        specializationCategory === cat.label && {
                          backgroundColor: accentColor,
                          borderColor: accentColor
                        },
                      ]}
                      onPress={() => setSpecializationCategory(cat.label)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          specializationCategory === cat.label && { color: '#FFF' },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Specialization Selection */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Select Specialization</Text>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search specialization..."
                  placeholderTextColor={colors.textLight}
                  value={specializationSearch}
                  onChangeText={setSpecializationSearch}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionScroll}>
                <View style={styles.selectionChips}>
                  {availableSpecializations.map((spec) => (
                    <TouchableOpacity
                      key={spec}
                      style={[
                        styles.selectionChip,
                        specialization === spec && {
                          backgroundColor: accentColor,
                          borderColor: accentColor
                        },
                      ]}
                      onPress={() => setSpecialization(spec)}
                    >
                      {specialization === spec && (
                        <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                      )}
                      <Text
                        style={[
                          styles.selectionChipText,
                          specialization === spec && { color: '#FFF' },
                        ]}
                      >
                        {spec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors.specialization && (
                <View style={inputStyles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={inputStyles.errorText}>{errors.specialization}</Text>
                </View>
              )}
            </View>

            {/* Degree Selection */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Medical Degree</Text>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color={colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search degree..."
                  placeholderTextColor={colors.textLight}
                  value={degreeSearch}
                  onChangeText={setDegreeSearch}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectionScroll}>
                <View style={styles.selectionChips}>
                  {filteredDegrees.map((deg) => (
                    <TouchableOpacity
                      key={deg}
                      style={[
                        styles.selectionChip,
                        degree === deg && {
                          backgroundColor: accentColor,
                          borderColor: accentColor
                        },
                      ]}
                      onPress={() => setDegree(deg)}
                    >
                      {degree === deg && (
                        <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                      )}
                      <Text
                        style={[
                          styles.selectionChipText,
                          degree === deg && { color: '#FFF' },
                        ]}
                      >
                        {deg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors.degree && (
                <View style={inputStyles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={colors.error} />
                  <Text style={inputStyles.errorText}>{errors.degree}</Text>
                </View>
              )}
            </View>

            <AnimatedInput
              label="Years of Experience"
              placeholder="Enter years"
              value={experience}
              onChangeText={setExperience}
              icon="ribbon-outline"
              keyboardType="numeric"
              accentColor={accentColor}
            />
          </View>
        );

      case 'hospital':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrapper, { backgroundColor: accentColor + '15' }]}>
                <Ionicons name="business-outline" size={28} color={accentColor} />
              </View>
              <Text style={styles.stepTitle}>Hospital Affiliation</Text>
              <Text style={styles.stepSubtitle}>Where can patients find you?</Text>
            </View>

            {/* Selected OSM Hospitals */}
            {selectedHospitalIds.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.selectedLabel}>Selected Hospitals ({selectedHospitalIds.length})</Text>
                <View style={styles.chipContainer}>
                  {selectedHospitalIds.map((id) => {
                    const hospital = osmHospitals.find(h => h.id === id);
                    if (!hospital) return null;
                    return (
                      <TouchableOpacity
                        key={hospital.id}
                        style={[styles.chip, { backgroundColor: accentColor + '15', borderColor: accentColor + '30' }]}
                        onPress={() => toggleHospital(hospital.id)}
                      >
                        <Text style={[styles.chipText, { color: accentColor }]} numberOfLines={1}>
                          {hospital.name}
                        </Text>
                        <Ionicons name="close" size={14} color={accentColor} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Custom Added Hospitals */}
            {customHospitals.length > 0 && (
              <View style={styles.selectedSection}>
                <Text style={styles.selectedLabel}>Added Hospitals ({customHospitals.length})</Text>
                <View style={styles.chipContainer}>
                  {customHospitals.map((hospital) => (
                    <TouchableOpacity
                      key={hospital.id}
                      style={[styles.chip, { backgroundColor: '#4CAF50' + '15', borderColor: '#4CAF50' + '30' }]}
                      onPress={() => removeCustomHospital(hospital.id)}
                    >
                      <Ionicons name="add-circle" size={14} color="#4CAF50" />
                      <Text style={[styles.chipText, { color: '#4CAF50' }]} numberOfLines={1}>
                        {hospital.name}
                      </Text>
                      <Ionicons name="close" size={14} color="#4CAF50" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search hospitals..."
                placeholderTextColor={colors.textLight}
                value={hospitalSearch}
                onChangeText={setHospitalSearch}
              />
            </View>

            {errors.hospitals && (
              <View style={inputStyles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={colors.error} />
                <Text style={inputStyles.errorText}>{errors.hospitals}</Text>
              </View>
            )}

            {isHospitalsLoading ? (
              <View style={styles.hospitalLoadingContainer}>
                <View style={styles.loadingDots}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.loadingDot, { backgroundColor: accentColor }]} />
                  ))}
                </View>
                <Text style={styles.loadingText}>Loading hospitals...</Text>
              </View>
            ) : hospitalSearch.trim().length < 2 ? (
              <View style={styles.hospitalEmptyState}>
                <Ionicons name="search-outline" size={48} color={colors.textLight} />
                <Text style={styles.emptyStateText}>Type at least 2 letters to search</Text>
                <Text style={styles.emptyStateSubtext}>Or add your hospital manually</Text>
              </View>
            ) : (
              <ScrollView style={styles.hospitalList} showsVerticalScrollIndicator={false}>
                {filteredHospitals.length === 0 ? (
                  <View style={styles.hospitalEmptyState}>
                    <Ionicons name="business-outline" size={48} color={colors.textLight} />
                    <Text style={styles.emptyStateText}>No hospitals found</Text>
                    <Text style={styles.emptyStateSubtext}>Add your hospital manually below</Text>
                  </View>
                ) : (
                  filteredHospitals.slice(0, 30).map((item) => {
                    const isSelected = selectedHospitalIds.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.hospitalItem,
                          isSelected && { backgroundColor: accentColor + '08', borderColor: accentColor + '30' },
                        ]}
                        onPress={() => toggleHospital(item.id)}
                      >
                        <View style={[styles.hospitalItemIcon, isSelected && { backgroundColor: accentColor + '15' }]}>
                          <Ionicons
                            name="business"
                            size={20}
                            color={isSelected ? accentColor : colors.textSecondary}
                          />
                        </View>
                        <View style={styles.hospitalItemInfo}>
                          <Text style={[styles.hospitalItemName, isSelected && { color: accentColor }]}>
                            {item.name}
                          </Text>
                          <Text style={styles.hospitalItemLocation} numberOfLines={1}>
                            {[item.locality, item.city, item.district, item.state].filter(Boolean).join(', ') || 'Location not available'}
                          </Text>
                        </View>
                        <View style={[
                          styles.checkCircle,
                          isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                        ]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Add Hospital Button */}
            <TouchableOpacity
              style={styles.addHospitalButton}
              onPress={() => setShowAddHospitalModal(true)}
            >
              <LinearGradient
                colors={[accentColor, accentColor + 'DD']}
                style={styles.addHospitalGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add-circle-outline" size={22} color="#FFF" />
                <Text style={styles.addHospitalText}>Add Hospital Manually</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.addHospitalHint}>
              {"Can't find your hospital? Add it here"}
            </Text>
          </View>
        );

      case 'security':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepIconWrapper, { backgroundColor: accentColor + '15' }]}>
                <Ionicons name="shield-checkmark-outline" size={28} color={accentColor} />
              </View>
              <Text style={styles.stepTitle}>Secure Your Account</Text>
              <Text style={styles.stepSubtitle}>Create a strong password</Text>
            </View>

            <View style={styles.passwordContainer}>
              <AnimatedInput
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                icon="lock-closed-outline"
                secureTextEntry={!showPassword}
                accentColor={accentColor}
              />
            </View>

            <AnimatedInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              icon="lock-closed-outline"
              secureTextEntry={!showPassword}
              accentColor={accentColor}
            />

            <TouchableOpacity
              style={styles.showPasswordBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.showPasswordText}>
                {showPassword ? 'Hide' : 'Show'} passwords
              </Text>
            </TouchableOpacity>

            {/* Password strength indicator */}
            <View style={styles.passwordStrength}>
              <Text style={styles.strengthLabel}>Password Strength</Text>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map((i) => {
                  const strength = password.length >= 6 ? (
                    password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 :
                      password.length >= 8 && (/[A-Z]/.test(password) || /[0-9]/.test(password)) ? 3 :
                        password.length >= 6 ? 2 : 1
                  ) : password.length > 0 ? 1 : 0;
                  const isActive = i < strength;
                  const barColor = strength <= 1 ? colors.error : strength === 2 ? '#FFB800' : strength === 3 ? '#4CAF50' : '#2E7D32';
                  return (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        isActive && { backgroundColor: barColor }
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.strengthText}>
                {password.length === 0 ? 'Enter a password' :
                  password.length < 6 ? 'Too weak' :
                    password.length < 8 ? 'Fair' :
                      password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Strong' : 'Good'}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Add Hospital Modal
  const renderAddHospitalModal = () => (
    <Modal
      visible={showAddHospitalModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddHospitalModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddHospitalModal(false)} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add New Hospital</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
          <View style={styles.modalIconWrapper}>
            <LinearGradient
              colors={[accentColor, accentColor + 'AA']}
              style={styles.modalIconGradient}
            >
              <Ionicons name="business" size={32} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={styles.modalSubtitle}>
            {"Can't find your hospital in the list? Add it here and we'll register it in our system."}
          </Text>

          <AnimatedInput
            label="Hospital Name *"
            placeholder="Enter hospital name"
            value={newHospitalName}
            onChangeText={setNewHospitalName}
            icon="business-outline"
            autoCapitalize="words"
            accentColor={accentColor}
          />

          <AnimatedInput
            label="Address *"
            placeholder="Street address, building, landmark"
            value={newHospitalAddress}
            onChangeText={setNewHospitalAddress}
            icon="location-outline"
            multiline
            accentColor={accentColor}
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <AnimatedInput
                label="City *"
                placeholder="Enter city"
                value={newHospitalCity}
                onChangeText={setNewHospitalCity}
                icon="business-outline"
                accentColor={accentColor}
              />
            </View>
            <View style={styles.halfInput}>
              <AnimatedInput
                label="Area"
                placeholder="Enter area"
                value={newHospitalArea}
                onChangeText={setNewHospitalArea}
                icon="map-outline"
                accentColor={accentColor}
              />
            </View>
          </View>

          <AnimatedInput
            label="Phone Number"
            placeholder="Hospital contact number"
            value={newHospitalPhone}
            onChangeText={setNewHospitalPhone}
            icon="call-outline"
            keyboardType="phone-pad"
            accentColor={accentColor}
          />

          <TouchableOpacity
            style={[styles.modalSubmitBtn, { backgroundColor: accentColor }]}
            onPress={handleAddCustomHospital}
          >
            <Ionicons name="add-circle" size={22} color="#FFF" />
            <Text style={styles.modalSubmitText}>Add Hospital</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={getRoleGradient()}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Create {getRoleTitle()} Account</Text>
              <Text style={styles.headerSubtitle}>Step {currentStep + 1} of {totalSteps}</Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth, backgroundColor: '#FFF' }
                ]}
              />
            </View>
            <View style={styles.stepsIndicator}>
              {steps.map((step, index) => (
                <View key={step.id} style={styles.stepIndicator}>
                  <View style={[
                    styles.stepDot,
                    index <= currentStep && styles.stepDotActive,
                    index < currentStep && styles.stepDotCompleted,
                  ]}>
                    {index < currentStep ? (
                      <Ionicons name="checkmark" size={12} color={accentColor} />
                    ) : (
                      <Ionicons
                        name={step.icon}
                        size={12}
                        color={index <= currentStep ? accentColor : colors.textLight}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Form Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.formCard,
                {
                  transform: [{ translateX: slideAnim }],
                  opacity: fadeAnim,
                },
              ]}
            >
              {renderStepContent()}
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.buttonRow}>
                {currentStep > 0 && (
                  <TouchableOpacity style={styles.backStepButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                    <Text style={styles.backStepText}>Back</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.nextButton,
                    { backgroundColor: accentColor },
                    currentStep === 0 && { flex: 1 },
                  ]}
                  onPress={currentStep === totalSteps - 1 ? handleSignup : handleNext}
                  disabled={loading}
                >
                  <Text style={styles.nextButtonText}>
                    {loading
                      ? 'Creating...'
                      : currentStep === totalSteps - 1
                        ? 'Create Account'
                        : 'Continue'
                    }
                  </Text>
                  {!loading && (
                    <Ionicons
                      name={currentStep === totalSteps - 1 ? 'checkmark-circle' : 'arrow-forward'}
                      size={20}
                      color="#FFF"
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.signInRow}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={[styles.signInLink, { color: accentColor }]}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {renderAddHospitalModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#FFF',
  },
  stepDotCompleted: {
    backgroundColor: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  stepContent: {
    minHeight: 300,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  stepIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 150,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  categoryChips: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  selectionScroll: {
    maxHeight: 120,
  },
  selectionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  selectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  selectedSection: {
    marginBottom: 16,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hospitalLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  hospitalEmptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  hospitalList: {
    maxHeight: 220,
    marginTop: 8,
  },
  hospitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    gap: 12,
  },
  hospitalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hospitalItemInfo: {
    flex: 1,
  },
  hospitalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  hospitalItemLocation: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addHospitalButton: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  addHospitalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  addHospitalText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  addHospitalHint: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  passwordContainer: {
    marginBottom: 0,
  },
  showPasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  showPasswordText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  passwordStrength: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  strengthText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  footer: {
    marginTop: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backStepText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 24,
  },
  modalIconWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
