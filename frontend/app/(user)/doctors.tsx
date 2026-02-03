import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useData, Doctor, DISEASE_CATEGORIES, COMMISSION_RATE } from '../../src/context/DataContext';
import { Card, Badge } from '../../src/components';
import { colors } from '../../src/theme/colors';

// Common specializations for filtering if no category is selected
const COMMON_SPECS = [
  'General Physician', 'Cardiologist', 'Dermatologist',
  'Pediatrician', 'Orthopedic', 'Neurologist', 'Dentist'
];

export default function Doctors() {
  const router = useRouter();
  const { specialization: urlSpec } = useLocalSearchParams<{ specialization?: string }>();
  const { doctors, hospitals, isLoading } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string | null>(urlSpec || null);
  const [selectedLocation, setSelectedLocation] = useState<{ city: string; area: string } | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [hospitalSearch, setHospitalSearch] = useState('');

  // Get unique locations from hospitals where doctors are available
  // Get all unique locations from hospitals and doctors
  const allSupportedLocations = useMemo(() => {
    const locationMap = new Map<string, { city: string; area: string; doctorCount: number; hospitalCount: number }>();

    // Check hospitals for locations
    hospitals.forEach(h => {
      // Find how many doctors are in this hospital
      const doctorCountInHospital = doctors.filter(d => d.hospital_id === h.id).length;
      const key = `${h.area}-${h.city}`;
      if (locationMap.has(key)) {
        const loc = locationMap.get(key)!;
        loc.doctorCount += doctorCountInHospital;
        loc.hospitalCount += 1;
      } else {
        locationMap.set(key, { city: h.city, area: h.area, doctorCount: doctorCountInHospital, hospitalCount: 1 });
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

  const filteredDoctors = useMemo(() => {
    let result = doctors;

    // Filter by location (Region/City)
    if (selectedLocation) {
      const hospitalIdsInLocation = hospitals
        .filter(h =>
          (h.city?.toLowerCase() || '') === (selectedLocation.city?.toLowerCase() || '') &&
          (h.area?.toLowerCase() || '') === (selectedLocation.area?.toLowerCase() || '')
        )
        .map(h => h.id);

      result = result.filter(d => d.hospital_id && hospitalIdsInLocation.includes(d.hospital_id));
    }

    // Filter by specific hospital
    if (selectedHospital) {
      result = result.filter(d => d.hospital_id === selectedHospital.id);
    }

    // Filter by selected specialization (from URL or chip)
    if (selectedSpec) {
      result = result.filter(d => (d.specialization?.toLowerCase() || '').includes(selectedSpec.toLowerCase()));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        (d.name?.toLowerCase() || '').includes(query) ||
        (d.specialization?.toLowerCase() || '').includes(query)
      );
    }

    return result;
  }, [doctors, hospitals, selectedSpec, searchQuery, selectedLocation, selectedHospital]);

  const filteredHospitals = useMemo(() => {
    if (!hospitalSearch) return hospitals;
    return hospitals.filter(h =>
      (h.name?.toLowerCase() || '').includes(hospitalSearch.toLowerCase()) ||
      (h.area?.toLowerCase() || '').includes(hospitalSearch.toLowerCase())
    );
  }, [hospitals, hospitalSearch]);

  const clearLocationFilter = () => {
    setSelectedLocation(null);
  };

  const renderDoctor = ({ item }: { item: Doctor }) => {
    // Find hospital for location display if needed
    const hospital = hospitals.find(h => h.id === item.hospital_id);

    return (
      <Card
        onPress={() => router.push(`/(user)/booking?doctorId=${item.id}`)}
        style={styles.doctorCard}
        elevation="medium"
      >
        <View style={styles.doctorHeader}>
          <View style={styles.doctorAvatar}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.doctorSpec}>{item.specialization}</Text>
            {hospital && (
              <View style={styles.hospitalRow}>
                <Ionicons name="business-outline" size={14} color={colors.textLight} />
                <Text style={styles.hospitalText} numberOfLines={1}>{hospital.name}</Text>
              </View>
            )}
            <View style={[styles.metaRow, { marginTop: 4 }]}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.metaText}>{item.rating?.toFixed(1) || '4.0'}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{item.experience} yrs exp</Text>
              {hospital && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Ionicons name="location-outline" size={12} color={colors.textLight} />
                  <Text style={styles.metaText} numberOfLines={1}>{hospital.area}, {hospital.city}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.doctorFooter}>
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Consultation</Text>
            <Text style={styles.feeValue}>₹{Math.round((item.consultation_fee || 0) * (1 + COMMISSION_RATE))}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push({
              pathname: '/(user)/booking',
              params: { doctorId: item.id }
            })}
          >
            <Text style={styles.bookBtnText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedSpec ? selectedSpec : 'All Doctors'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Filters Row */}
      <View style={styles.filtersRow}>
        {/* Location Filter Button */}
        <TouchableOpacity
          style={[styles.filterHalfBtn, selectedLocation && styles.filterBtnActive]}
          onPress={() => setShowLocationModal(true)}
        >
          <Ionicons name="location" size={16} color={selectedLocation ? colors.primary : colors.textLight} />
          <Text style={[styles.filterBtnText, selectedLocation && styles.filterBtnTextActive]} numberOfLines={1}>
            {selectedLocation ? selectedLocation.area : 'Location'}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textLight} />
        </TouchableOpacity>

        {/* Hospital Filter Button */}
        <TouchableOpacity
          style={[styles.filterHalfBtn, selectedHospital && styles.filterBtnActive]}
          onPress={() => setShowHospitalModal(true)}
        >
          <Ionicons name="business" size={16} color={selectedHospital ? colors.primary : colors.textLight} />
          <Text style={[styles.filterBtnText, selectedHospital && styles.filterBtnTextActive]} numberOfLines={1}>
            {selectedHospital ? selectedHospital.name : 'Hospital'}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors, symptoms..."
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

      {/* Specialization Filter Scroll */}
      <View style={styles.specsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specsScroll}>
          <TouchableOpacity
            style={[styles.specChip, !selectedSpec && styles.specChipActive]}
            onPress={() => setSelectedSpec(null)}
          >
            <Text style={[styles.specText, !selectedSpec && styles.specTextActive]}>All</Text>
          </TouchableOpacity>
          {COMMON_SPECS.map((spec) => (
            <TouchableOpacity
              key={spec}
              style={[styles.specChip, selectedSpec === spec && styles.specChipActive]}
              onPress={() => setSelectedSpec(spec)}
            >
              <Text style={[styles.specText, selectedSpec === spec && styles.specTextActive]}>{spec}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Doctors List */}
      {filteredDoctors.length > 0 ? (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.id}
          renderItem={renderDoctor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="medkit-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No doctors found</Text>
          <Text style={styles.emptyText}>
            {selectedLocation
              ? `No doctors in ${selectedLocation.area} with these filters`
              : 'Try adjusting your search or filters'}
          </Text>
          {selectedLocation && (
            <TouchableOpacity style={styles.clearFilterBtn} onPress={clearLocationFilter}>
              <Text style={styles.clearFilterText}>Clear Location Filter</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
              <Text style={styles.modalTitle}>Select Location</Text>
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
              {/* Show All option when no search */}
              {!locationSearch && (
                <TouchableOpacity
                  style={[styles.locationItem, !selectedLocation && styles.locationItemActive]}
                  onPress={() => {
                    setSelectedLocation(null);
                    setShowLocationModal(false);
                  }}
                >
                  <View style={styles.locationItemIcon}>
                    <Ionicons name="apps" size={22} color={!selectedLocation ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={styles.locationItemInfo}>
                    <Text style={[styles.locationItemName, !selectedLocation && styles.locationItemNameActive]}>All Locations</Text>
                    <Text style={styles.locationItemCount}>
                      {doctors.length} doctors • {hospitals.length} hospitals
                    </Text>
                  </View>
                  {!selectedLocation && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                </TouchableOpacity>
              )}

              {filteredLocations.length > 0 ? (
                <>
                  {locationSearch && <Text style={styles.modalSectionTitle}>Search Results</Text>}
                  {filteredLocations.map((loc, index) => {
                    const isSelected = selectedLocation?.area === loc.area && selectedLocation?.city === loc.city;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.locationItem, isSelected && styles.locationItemActive]}
                        onPress={() => {
                          setSelectedLocation({ city: loc.city, area: loc.area });
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
                            {loc.doctorCount} doctors • {loc.hospitalCount} hospitals
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
                    const isSelected = selectedLocation?.area === loc.area && selectedLocation?.city === loc.city;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.locationItem, isSelected && styles.locationItemActive]}
                        onPress={() => {
                          setSelectedLocation({ city: loc.city, area: loc.area });
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
                            {loc.doctorCount} doctors • {loc.hospitalCount} hospitals
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
      {/* Hospital Selection Modal */}
      <Modal
        visible={showHospitalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHospitalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Hospital</Text>
              <TouchableOpacity onPress={() => setShowHospitalModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchContainer}>
              <Ionicons name="search-outline" size={20} color={colors.textLight} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search hospital..."
                placeholderTextColor={colors.textLight}
                value={hospitalSearch}
                onChangeText={setHospitalSearch}
              />
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.locationItem, !selectedHospital && styles.locationItemActive]}
                onPress={() => {
                  setSelectedHospital(null);
                  setShowHospitalModal(false);
                }}
              >
                <View style={styles.locationItemIcon}>
                  <Ionicons name="apps" size={22} color={!selectedHospital ? colors.primary : colors.textSecondary} />
                </View>
                <View style={styles.locationItemInfo}>
                  <Text style={[styles.locationItemName, !selectedHospital && styles.locationItemNameActive]}>All Hospitals</Text>
                  <Text style={styles.locationItemCount}>Show data from all facilities</Text>
                </View>
                {!selectedHospital && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>

              {filteredHospitals.map((h) => {
                const isSelected = selectedHospital?.id === h.id;
                return (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.locationItem, isSelected && styles.locationItemActive]}
                    onPress={() => {
                      setSelectedHospital(h);
                      setShowHospitalModal(false);
                    }}
                  >
                    <View style={styles.locationItemIcon}>
                      <Ionicons name="business" size={22} color={isSelected ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={styles.locationItemInfo}>
                      <Text style={[styles.locationItemName, isSelected && styles.locationItemNameActive]}>{h.name}</Text>
                      <Text style={styles.locationItemCity}>{h.area}, {h.city}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  specsWrapper: {
    marginTop: 16,
  },
  specsScroll: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  specChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  specText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  specTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 12,
  },
  doctorCard: {
    marginBottom: 16,
    padding: 16,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  doctorSpec: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaDot: {
    color: colors.textLight,
  },
  doctorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feeContainer: {},
  feeLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  feeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hospitalText: {
    fontSize: 13,
    color: colors.textLight,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  filterHalfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  filterBtnText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  clearFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  clearFilterText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
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
    textAlign: 'center',
  },
});
