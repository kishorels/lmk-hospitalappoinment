import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Badge } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { CITIES, AREAS, DISEASE_CATEGORIES } from '../../src/data/mockData';

export default function UserHome() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { doctors, getHospitalsByLocation, getAppointmentsByUser } = useData();

  const [showLocationPicker, setShowLocationPicker] = useState(!user?.selectedCity);
  const [selectedCity, setSelectedCity] = useState(user?.selectedCity || '');
  const [selectedArea, setSelectedArea] = useState(user?.selectedArea || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const nearbyHospitals = getHospitalsByLocation(selectedCity, selectedArea);
  const upcomingAppointments = user ? getAppointmentsByUser(user.id).filter(a => a.status === 'accepted' || a.status === 'pending') : [];

  const filteredDoctors = searchQuery
    ? doctors.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleLocationSave = async () => {
    if (selectedCity) {
      await updateUser({ selectedCity, selectedArea });
      setShowLocationPicker(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (showLocationPicker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.locationPicker}>
          <Ionicons name="location" size={64} color={colors.primary} />
          <Text style={styles.locationTitle}>Select Your Location</Text>
          <Text style={styles.locationSubtitle}>Find hospitals and doctors near you</Text>

          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityScroll}>
              {CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityChip,
                    selectedCity === city && styles.cityChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedCity(city);
                    setSelectedArea('');
                  }}
                >
                  <Text
                    style={[
                      styles.cityChipText,
                      selectedCity === city && styles.cityChipTextSelected,
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedCity && (
            <View style={styles.pickerSection}>
              <Text style={styles.pickerLabel}>Area (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.areaScroll}>
                {AREAS[selectedCity]?.map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.areaChip,
                      selectedArea === area && styles.areaChipSelected,
                    ]}
                    onPress={() => setSelectedArea(area)}
                  >
                    <Text
                      style={[
                        styles.areaChipText,
                        selectedArea === area && styles.areaChipTextSelected,
                      ]}
                    >
                      {area}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={[styles.continueButton, !selectedCity && styles.continueButtonDisabled]}
            onPress={handleLocationSave}
            disabled={!selectedCity}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => setShowLocationPicker(true)}
            >
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.locationText}>
                {selectedArea ? `${selectedArea}, ${selectedCity}` : selectedCity}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Search */}
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

        {/* Search Results */}
        {searchQuery && filteredDoctors.length > 0 && (
          <View style={styles.searchResults}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {filteredDoctors.slice(0, 5).map((doctor) => (
              <Card
                key={doctor.id}
                onPress={() => router.push(`/(user)/doctor/${doctor.id}`)}
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
              <Text style={styles.appointmentDate}>
                {new Date(upcomingAppointments[0].date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.appointmentTime}>{upcomingAppointments[0].timeSlot}</Text>
            </Card>
          </View>
        )}

        {/* Disease Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Find by Health Issue</Text>
            <TouchableOpacity onPress={() => router.push('/(user)/diseases')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DISEASE_CATEGORIES.slice(0, 5).map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: '/(user)/doctors', params: { categoryId: category.id } })}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon as any} size={28} color={colors.primary} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
                onPress={() => router.push(`/(user)/hospital/${hospital.id}`)}
                style={styles.hospitalCard}
              >
                <View style={styles.hospitalRow}>
                  <View style={styles.hospitalIcon}>
                    <Ionicons name="business" size={28} color={colors.hospitalPrimary} />
                  </View>
                  <View style={styles.hospitalInfo}>
                    <Text style={styles.hospitalName}>{hospital.name}</Text>
                    <Text style={styles.hospitalAddress}>{hospital.area}, {hospital.city}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={styles.ratingText}>{hospital.rating.toFixed(1)}</Text>
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
              <Text style={styles.emptyText}>No hospitals found in your area</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(true)}>
                <Text style={styles.changeLocation}>Change Location</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
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
    backgroundColor: colors.error,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  searchResults: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  searchResultCard: {
    marginBottom: 8,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  categoryCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
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
    borderRadius: 12,
    backgroundColor: colors.hospitalPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  hospitalAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  deptText: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 8,
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
  },
  appointmentCard: {
    backgroundColor: colors.primaryLight,
  },
  appointmentHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  appointmentTime: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  changeLocation: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  // Location Picker Styles
  locationPicker: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  locationSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  pickerSection: {
    width: '100%',
    marginBottom: 24,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  cityScroll: {
    flexDirection: 'row',
  },
  cityChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: colors.surface,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  cityChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  cityChipTextSelected: {
    color: colors.primary,
  },
  areaScroll: {
    flexDirection: 'row',
  },
  areaChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  areaChipText: {
    fontSize: 13,
    color: colors.text,
  },
  areaChipTextSelected: {
    color: '#FFF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
