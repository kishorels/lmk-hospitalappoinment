import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Dimensions, ActivityIndicator, Alert } from 'react-native';
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

  useEffect(() => {
    getLocation();
    if (user) {
      getUserAppointments(user.id);
    }
  }, [user]);

  const getLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation({ city: 'Kanyakumari', area: 'Nagercoil' });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (place) {
        setLocation({
          city: place.city || place.district || 'Kanyakumari',
          area: place.subregion || place.name || 'Nagercoil',
        });
      } else {
        setLocation({ city: 'Kanyakumari', area: 'Nagercoil' });
      }
    } catch (error) {
      console.error('Location error:', error);
      setLocation({ city: 'Kanyakumari', area: 'Nagercoil' });
    } finally {
      setLoadingLocation(false);
    }
  };

  const filteredDoctors = searchQuery ? searchDoctors(searchQuery) : [];
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
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Gradient Header - Goes to the top, content uses SafeAreaView */}
        <LinearGradient
          colors={gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greetingSmall}>Welcome back,</Text>
                <View style={styles.greetingRow}>
                  <Text style={styles.greeting}>{user?.name || 'User'}</Text>
                  <Ionicons name="hand-right" size={22} color="#FFF" style={styles.waveIcon} />
                </View>
                <TouchableOpacity style={styles.locationRow} onPress={getLocation}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.9)" />
                  {loadingLocation ? (
                    <Text style={styles.locationText}>Getting location...</Text>
                  ) : (
                    <Text style={styles.locationText}>{location?.area}, {location?.city}</Text>
                  )}
                  <Ionicons name="refresh" size={12} color="rgba(255,255,255,0.7)" />
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
          </SafeAreaView>
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
              <Text style={styles.serviceCount}>{hospitals.length} available</Text>
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
              <Text style={styles.serviceCount}>{doctors.length} available</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(user)/ai-assistant')}
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
              <Text style={styles.serviceTitle}>My Bookings</Text>
              <Text style={styles.serviceCount}>{appointments.length} total</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disease Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Find by Specialty</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {DISEASE_CATEGORIES.map((category, index) => {
              const iconColors = [colors.primary, colors.secondary, '#8B5CF6', colors.accent, '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];
              return (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryChip}
                  onPress={() => router.push({ pathname: '/(user)/doctors', params: { specialization: category.name } })}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: iconColors[index % iconColors.length] + '15' }]}>
                    <Ionicons name={category.icon as any} size={22} color={iconColors[index % iconColors.length]} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Available Doctors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Doctors</Text>
            <TouchableOpacity onPress={() => router.push('/(user)/doctors')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {doctors.length > 0 ? (
            doctors.slice(0, 3).map((doctor) => (
              <Card
                key={doctor.id}
                onPress={() => router.push(`/(user)/booking?doctorId=${doctor.id}`)}
                style={styles.doctorCard}
              >
                <View style={styles.doctorRow}>
                  <View style={styles.doctorAvatarLarge}>
                    <Ionicons name="person" size={28} color={colors.primary} />
                  </View>
                  <View style={styles.doctorDetails}>
                    <Text style={styles.doctorNameLarge}>{doctor.name}</Text>
                    <Text style={styles.doctorSpecLarge}>{doctor.specialization}</Text>
                    <View style={styles.doctorMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                        <Text style={styles.metaText}>{doctor.experience} yrs</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="star" size={12} color="#FFB800" />
                        <Text style={styles.metaText}>{(doctor.rating ?? 4.0).toFixed(1)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.doctorFee}>
                    <Text style={styles.feeAmount}>₹{Math.round((doctor.consultation_fee || 0) * (1 + COMMISSION_RATE))}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medkit-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No doctors available yet</Text>
              <Text style={styles.emptySubtext}>Doctors will appear here once they register</Text>
            </View>
          )}
        </View>

        {/* Nearby Hospitals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
            <TouchableOpacity onPress={() => router.push('/(user)/hospitals')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {hospitals.length > 0 ? (
            hospitals.slice(0, 2).map((hospital) => (
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
              <Text style={styles.emptyText}>No hospitals registered yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
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
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4757',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
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
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  searchResultCard: {
    marginBottom: 8,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
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
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  appointmentCard: {
    padding: 16,
  },
  appointmentHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  appointmentDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    color: colors.text,
  },
  appointmentTime: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  serviceCard: {
    width: (width - 52) / 2,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  serviceIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  serviceCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoriesScroll: {
    marginTop: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    gap: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  doctorCard: {
    marginBottom: 12,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorNameLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  doctorSpecLarge: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
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
    color: colors.textSecondary,
    marginTop: 4,
  },
});
