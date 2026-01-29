import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../src/context/DataContext';
import { Card, Badge } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { Doctor, DISEASE_CATEGORIES, SPECIALIZATIONS } from '../../src/data/mockData';

export default function Doctors() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { doctors, getDoctorsBySpecialization, getHospitalById } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const category = categoryId ? DISEASE_CATEGORIES.find(c => c.id === categoryId) : null;

  const filteredDoctors = useMemo(() => {
    let result = doctors;

    // Filter by category specializations
    if (category) {
      result = getDoctorsBySpecialization(category.specializations);
    }

    // Filter by selected specialization
    if (selectedSpec) {
      result = result.filter(d => d.specialization === selectedSpec);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.specialization.toLowerCase().includes(query)
      );
    }

    return result;
  }, [doctors, category, selectedSpec, searchQuery]);

  const availableSpecs = category
    ? category.specializations
    : SPECIALIZATIONS;

  const renderDoctor = ({ item }: { item: Doctor }) => {
    const hospitals = item.hospitalIds.map(id => getHospitalById(id)).filter(Boolean);
    
    return (
      <Card
        onPress={() => router.push(`/(user)/doctor/${item.id}`)}
        style={styles.doctorCard}
        elevation="medium"
      >
        <View style={styles.doctorHeader}>
          <View style={styles.doctorAvatar}>
            <Ionicons name="person" size={32} color={colors.doctorPrimary} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.doctorSpec}>{item.specialization}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{item.experience} yrs exp</Text>
            </View>
          </View>
          {item.videoConsultation && (
            <Badge text="Video" variant="info" />
          )}
        </View>

        <View style={styles.hospitalList}>
          <Text style={styles.hospitalLabel}>Works at:</Text>
          <View style={styles.hospitalChips}>
            {hospitals.slice(0, 2).map((hospital) => (
              <View key={hospital!.id} style={styles.hospitalChip}>
                <Ionicons name="business" size={12} color={colors.hospitalPrimary} />
                <Text style={styles.hospitalChipText}>{hospital!.name}</Text>
              </View>
            ))}
            {hospitals.length > 2 && (
              <Text style={styles.moreHospitals}>+{hospitals.length - 2} more</Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Consultation</Text>
            <Text style={styles.feeValue}>₹{item.consultationFee}</Text>
          </View>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => router.push({
              pathname: '/(user)/booking',
              params: { doctorId: item.id, hospitalId: item.hospitalIds[0] }
            })}
          >
            <Text style={styles.bookBtnText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {category ? category.name : 'All Doctors'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors..."
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

      {/* Specialization Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedSpec && styles.filterChipActive,
          ]}
          onPress={() => setSelectedSpec(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              !selectedSpec && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {availableSpecs.map((spec) => (
          <TouchableOpacity
            key={spec}
            style={[
              styles.filterChip,
              selectedSpec === spec && styles.filterChipActive,
            ]}
            onPress={() => setSelectedSpec(selectedSpec === spec ? null : spec)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedSpec === spec && styles.filterChipTextActive,
              ]}
            >
              {spec}
            </Text>
          </TouchableOpacity>
        ))}
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
          <Ionicons name="search" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No doctors found</Text>
          <Text style={styles.emptyText}>Try adjusting your filters</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
  },
  doctorCard: {
    marginBottom: 16,
  },
  doctorHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.doctorPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
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
    marginHorizontal: 4,
  },
  hospitalList: {
    marginBottom: 16,
  },
  hospitalLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 8,
  },
  hospitalChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  hospitalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.hospitalPrimary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  hospitalChipText: {
    fontSize: 12,
    color: colors.hospitalPrimary,
    fontWeight: '500',
  },
  moreHospitals: {
    fontSize: 12,
    color: colors.textLight,
  },
  footer: {
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
