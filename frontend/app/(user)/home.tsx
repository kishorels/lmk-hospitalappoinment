import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { useAuth } from '../../src/context/AuthContext';
import { useData, DISEASE_CATEGORIES, COMMISSION_RATE } from '../../src/context/DataContext';
import { Card, Badge } from '../../src/components';
import { colors, gradients } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

export default function UserHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { doctors, hospitals, appointments, isLoading, refreshData, getUserAppointments, searchDoctors } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ city: string; area: string } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  useEffect(() => {
    getLocation();
  }, []);

  const setFallbackLocation = () => {
    setLocation({ city: 'Kanyakumari', area: 'Nagercoil' });
  };

  const getLocation = async () => {
    try {
      setLoadingLocation(true);
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setFallbackLocation();
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback to default if permission denied
        setFallbackLocation();
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address) {
        setLocation({
          city: address.city || 'Kanyakumari',
          area: address.district || address.name || 'Nagercoil',
        });
      } else {
        setFallbackLocation();
      }
    } catch (error) {
      console.warn('Location unavailable, using default.', error);
      setFallbackLocation();
    } finally {
      setLoadingLocation(false);
    }
  };

  // Get all unique locations from hospitals
  const allSupportedLocations = useMemo(() => {
    const locationMap = new Map<string, { city: string; area: string; hospitalCount: number; doctorCount: number }>();

    hospitals.forEach(h => {
      const key = `${h.area}-${h.city}`;
      if (locationMap.has(key)) {
        locationMap.get(key)!.hospitalCount++;
      } else {
        locationMap.set(key, { city: h.city, area: h.area, hospitalCount: 1, doctorCount: 0 });
      }
    });

    doctors.forEach(d => {
      const hospital = hospitals.find(h => h.id === d.hospital_id);
      if (hospital) {
        const key = `${hospital.area}-${hospital.city}`;
        if (locationMap.has(key)) {
          locationMap.get(key)!.doctorCount++;
        }
      }
    });

    return Array.from(locationMap.values());
  }, [hospitals, doctors]);

  // Filtered list based on search
  const filteredLocations = useMemo(() => {
    if (!locationSearch) return allSupportedLocations;
    return allSupportedLocations.filter(loc =>
      (loc.city?.toLowerCase() || '').includes(locationSearch.toLowerCase()) ||
      (loc.area?.toLowerCase() || '').includes(locationSearch.toLowerCase())
    );
  }, [allSupportedLocations, locationSearch]);

  const filteredDoctors = searchQuery ? searchDoctors(searchQuery) : [];

  const featuredDoctors = useMemo(() => {
    let result = doctors;
    if (location) {
      const hospitalIdsInLocation = hospitals
        .filter(h =>
          (h.city?.toLowerCase() || '') === (location.city?.toLowerCase() || '') &&
          (h.area?.toLowerCase() || '') === (location.area?.toLowerCase() || '')
        )
        .map(h => h.id);
      result = result.filter(d => d.hospital_id && hospitalIdsInLocation.includes(d.hospital_id));
    }
    return result.slice(0, 5);
  }, [doctors, hospitals, location]);

  // Nearby hospitals filtered by location if set
  const nearbyHospitals = useMemo(() => {
    let result = hospitals;
    if (location) {
      result = result.filter(h =>
        (h.city?.toLowerCase() || '') === (location.city?.toLowerCase() || '') &&
        (h.area?.toLowerCase() || '') === (location.area?.toLowerCase() || '')
      );
    }
    return result.slice(0, 5);
  }, [hospitals, location]);

  const upcomingAppointments = appointments.filter(a => a.status === 'accepted' || a.status === 'pending');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    if (user) {
      await getUserAppointments(user.id);
    }
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <SafeAreaView style={{ backgroundColor: colors.primary }} edges={['top']} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
              <Text style={styles.greetingSubtext}>Find your doctor and book an appointment</Text>

              <TouchableOpacity
                style={styles.locationRow}
                onPress={() => setShowLocationModal(true)}
              >
                <Ionicons name="location-sharp" size={16} color="#FFF" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location ? `${location.area}, ${location.city}` : 'Loading location...'}
                </Text>
                <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.7)" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push('/(user)/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#FFF" />
              {upcomingAppointments.length > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors, specializations..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        {/* Search Results */}
        {searchQuery && filteredDoctors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {filteredDoctors.slice(0, 5).map((doctor) => (
              <Card
                key={doctor.id}
                onPress={() => router.push(`/(user)/booking?doctorId=${doctor.id}`)}
                style={styles.searchResultCard}
              >
                <View style={styles.searchResultRow}>
                  <View style={styles.doctorAvatar}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
              <TouchableOpacity onPress={() => router.push('/(user)/appointments')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <Card style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Badge
                  text={upcomingAppointments[0].status}
                  variant={upcomingAppointments[0].status === 'accepted' ? 'success' : 'warning'}
                />
                <Badge
                  text={upcomingAppointments[0].type === 'video' ? 'Video' : 'In-Person'}
                  variant="info"
                />
              </View>
              <Text style={styles.appointmentDoctor}>{upcomingAppointments[0].doctor_name}</Text>
              <Text style={styles.appointmentDate}>
                {new Date(upcomingAppointments[0].date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.appointmentTime}>{upcomingAppointments[0].time_slot}</Text>
            </Card>
          </View>
        )}

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(user)/hospitals')}
            >
              <LinearGradient
                colors={['#EEF6FF', '#DBEAFE']}
                style={styles.serviceIconBg}
              >
                <Ionicons name="business" size={28} color={colors.primary} />
              </LinearGradient>
              <Text style={styles.serviceTitle}>Hospitals</Text>
              <Text style={styles.serviceCount}>Find nearby</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(user)/doctors')}
            >
              <LinearGradient
                colors={['#E0FFF4', '#CCFBF1']}
                style={styles.serviceIconBg}
              >
                <Ionicons name="medkit" size={28} color={colors.secondary} />
              </LinearGradient>
              <Text style={styles.serviceTitle}>Doctors</Text>
              <Text style={styles.serviceCount}>Book now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(user)/ai-chat')}
            >
              <LinearGradient
                colors={['#F3E8FF', '#E9D5FF']}
                style={styles.serviceIconBg}
              >
                <Ionicons name="sparkles" size={28} color="#8B5CF6" />
              </LinearGradient>
              <Text style={styles.serviceTitle}>AI Health</Text>
              <Text style={styles.serviceCount}>Ask anything</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(user)/appointments')}
            >
              <LinearGradient
                colors={['#FFF7ED', '#FFEDD5']}
                style={styles.serviceIconBg}
              >
                <Ionicons name="calendar" size={28} color={colors.accent} />
              </LinearGradient>
              <Text style={styles.serviceTitle}>My Appointments</Text>
              <Text style={styles.serviceCountHighlight}>{appointments.length} booked</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Find by Specialty - 2 Column Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Find by Specialty</Text>
            <TouchableOpacity onPress={() => router.push('/(user)/doctors')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.specialtyGrid}>
            {DISEASE_CATEGORIES.map((category, index) => {
              const iconColors = [colors.primary, colors.secondary, '#8B5CF6', colors.accent, '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];
              const bgColors = [
                ['#EEF6FF', '#DBEAFE'],
                ['#E0FFF4', '#CCFBF1'],
                ['#F3E8FF', '#E9D5FF'],
                ['#FFF7ED', '#FFEDD5'],
                ['#FCE7F3', '#FBCFE8'],
                ['#E0F7FA', '#B2EBF2'],
                ['#ECFDF5', '#D1FAE5'],
                ['#FFFBEB', '#FEF3C7'],
              ];
              // Pass the actual specializations array to the doctors page
              const specializations = category.specializations;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.specialtyCard}
                  onPress={() => router.push({
                    pathname: '/(user)/doctors',
                    params: { specialization: specializations.join(',') }
                  })}
                >
                  <LinearGradient
                    colors={bgColors[index % bgColors.length] as [string, string]}
                    style={styles.specialtyIconBg}
                  >
                    <Ionicons name={category.icon as any} size={24} color={iconColors[index % iconColors.length]} />
                  </LinearGradient>
                  <View style={styles.specialtyInfo}>
                    <Text style={styles.specialtyName}>{category.name}</Text>
                    <Text style={styles.specialtyCount}>{specializations.length > 1 ? `${specializations.length} types` : specializations[0]}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Nearby Hospitals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
            <TouchableOpacity onPress={() => router.push('/(user)/hospitals')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {nearbyHospitals.length > 0 ? (
            nearbyHospitals.slice(0, 3).map((hospital) => (
              <Card
                key={hospital.id}
                onPress={() => router.push(`/(user)/hospitals?id=${hospital.id}`)}
                style={styles.hospitalCard}
              >
                <View style={styles.hospitalRow}>
                  <View style={styles.hospitalIcon}>
                    <Ionicons name="business" size={28} color={colors.hospitalPrimary} />
                  </View>
                  <View style={styles.hospitalInfo}>
                    <Text style={styles.hospitalName}>{hospital.name}</Text>
                    <View style={styles.hospitalMeta}>
                      <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.hospitalAddress}>{hospital.area}, {hospital.city}</Text>
                    </View>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={styles.ratingText}>{(hospital.rating ?? 4.0).toFixed(1)}</Text>
                      <Text style={styles.deptText}>{hospital.departments.length} departments</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No hospitals in your area</Text>
              <Text style={styles.emptySubtext}>Try selecting a different area</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={20} color={colors.textLight} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search city or area..."
                placeholderTextColor={colors.textLight}
                value={locationSearch}
                onChangeText={setLocationSearch}
              />
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {/* Auto detect option */}
              <TouchableOpacity
                style={styles.locationItem}
                onPress={() => {
                  getLocation();
                  setShowLocationModal(false);
                }}
              >
                <View style={styles.locationItemIcon}>
                  <Ionicons name="navigate-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.locationItemInfo}>
                  <Text style={styles.locationItemName}>Detect Current Location</Text>
                  <Text style={styles.locationItemCount}>Using GPS</Text>
                </View>
                {loadingLocation && <ActivityIndicator size="small" color={colors.primary} />}
              </TouchableOpacity>

              {/* Show All option when no search */}
              {!locationSearch && (
                <TouchableOpacity
                  style={[styles.locationItem, !location && styles.locationItemActive]}
                  onPress={() => {
                    setLocation(null);
                    setShowLocationModal(false);
                  }}
                >
                  <View style={styles.locationItemIcon}>
                    <Ionicons name="apps" size={22} color={!location ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={styles.locationItemInfo}>
                    <Text style={[styles.locationItemName, !location && styles.locationItemNameActive]}>All Locations</Text>
                    <Text style={styles.locationItemCount}>
                      {hospitals.length} hospitals • {doctors.length} doctors
                    </Text>
                  </View>
                  {!location && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              )}

              {filteredLocations.length > 0 ? (
                <>
                  {locationSearch && <Text style={styles.modalSectionTitle}>Search Results</Text>}
                  {filteredLocations.map((loc, index) => {
                    const isSelected = location?.area === loc.area && location?.city === loc.city;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.locationItem, isSelected && styles.locationItemActive]}
                        onPress={() => {
                          setLocation({ city: loc.city, area: loc.area });
                          setShowLocationModal(false);
                          setLocationSearch('');
                        }}
                      >
                        <View style={styles.locationItemIcon}>
                          <Ionicons name="location" size={22} color={isSelected ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={styles.locationItemInfo}>
                          <Text style={[styles.locationItemName, isSelected && styles.locationItemNameActive]}>
                            {loc.area}
                          </Text>
                          <Text style={styles.locationItemCity}>{loc.city}</Text>
                          <Text style={styles.locationItemCount}>
                            {loc.hospitalCount} hospitals • {loc.doctorCount} doctors
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </>
              ) : (
                <>
                  <View style={styles.noLocationsFound}>
                    <Ionicons name="search-outline" size={48} color={colors.textLight} />
                    <Text style={styles.noLocationsText}>No matches for "{locationSearch}"</Text>
                  </View>
                  <Text style={styles.modalSectionTitle}>Currently Served Areas</Text>
                  {allSupportedLocations.map((loc, index) => {
                    const isSelected = location?.area === loc.area && location?.city === loc.city;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.locationItem, isSelected && styles.locationItemActive]}
                        onPress={() => {
                          setLocation({ city: loc.city, area: loc.area });
                          setShowLocationModal(false);
                          setLocationSearch('');
                        }}
                      >
                        <View style={styles.locationItemIcon}>
                          <Ionicons name="location" size={22} color={isSelected ? colors.primary : colors.textSecondary} />
                        </View>
                        <View style={styles.locationItemInfo}>
                          <Text style={[styles.locationItemName, isSelected && styles.locationItemNameActive]}>
                            {loc.area}
                          </Text>
                          <Text style={styles.locationItemCity}>{loc.city}</Text>
                          <Text style={styles.locationItemCount}>
                            {loc.hospitalCount} hospitals • {loc.doctorCount} doctors
                          </Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  greetingSmall: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  greetingSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  waveIcon: {
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  locationText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  seeAll: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  searchResultCard: {
    marginBottom: 10,
    padding: 12,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  doctorSpec: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  appointmentCard: {
    padding: 16,
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  appointmentHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  appointmentDoctor: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  serviceCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  serviceCountHighlight: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  specialtyGrid: {
    gap: 10,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  specialtyIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  specialtyInfo: {
    flex: 1,
  },
  specialtyName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  specialtyCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoriesScroll: {
    marginLeft: -20,
    marginRight: -20,
    paddingHorizontal: 20,
  },
  categoryChip: {
    marginRight: 12,
    alignItems: 'center',
    width: 80,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  doctorCard: {
    marginBottom: 12,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatarLarge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorNameLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  doctorSpecLarge: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  doctorMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  doctorFee: {
    alignItems: 'flex-end',
    gap: 4,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  hospitalCard: {
    marginBottom: 12,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.hospitalPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  hospitalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hospitalAddress: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  deptText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  modalList: {
    paddingHorizontal: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    gap: 14,
  },
  locationItemActive: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  locationItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  locationItemInfo: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  locationItemNameActive: {
    color: colors.primary,
  },
  locationItemCity: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationItemCount: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  noLocationsFound: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  noLocationsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
