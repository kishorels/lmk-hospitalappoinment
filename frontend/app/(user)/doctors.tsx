import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useData, Doctor, DISEASE_CATEGORIES } from '../../src/context/DataContext';
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
  const { doctors, isLoading, searchDoctors } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string | null>(urlSpec || null);

  const filteredDoctors = useMemo(() => {
    let result = doctors;

    // Filter by selected specialization (from URL or chip)
    if (selectedSpec) {
      result = result.filter(d => d.specialization.toLowerCase().includes(selectedSpec.toLowerCase()));
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
  }, [doctors, selectedSpec, searchQuery]);

  const renderDoctor = ({ item }: { item: Doctor }) => {
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
            <View style={styles.metaRow}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.metaText}>{item.rating?.toFixed(1) || '4.0'}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{item.experience} yrs exp</Text>
            </View>
          </View>
        </View>

        <View style={styles.doctorFooter}>
          <View style={styles.feeContainer}>
            <Text style={styles.feeLabel}>Consultation</Text>
            <Text style={styles.feeValue}>₹{item.consultation_fee}</Text>
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
          <Text style={styles.emptyText}>Try adjusting your search or filters</Text>
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
});
