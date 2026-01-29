import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useData, Doctor } from '../../../src/context/DataContext';
import { Card, Badge, Button } from '../../../src/components';
import { colors } from '../../../src/theme/colors';

export default function HospitalDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getHospitalById, doctors, isLoading } = useData();

  const hospital = useMemo(() => getHospitalById(id || ''), [id, isLoading]);

  const hospitalDoctors = useMemo(() => {
    return doctors.filter(d => d.hospital_id === id);
  }, [id, doctors]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!hospital) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Hospital not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const renderDoctorCard = (doctor: Doctor) => (
    <Card
      key={doctor.id}
      onPress={() => router.push(`/(user)/booking?doctorId=${doctor.id}`)}
      style={styles.doctorCard}
    >
      <View style={styles.doctorRow}>
        <View style={styles.doctorAvatar}>
          <Ionicons name="person-outline" size={28} color={colors.primary} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
          <View style={styles.doctorMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.metaText}>{doctor.rating?.toFixed(1) || '4.0'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textLight} />
              <Text style={styles.metaText}>{doctor.experience} yrs exp</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Hospital Profile */}
        <View style={styles.profileSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="business-outline" size={60} color={colors.primary} />
          </View>
          <Text style={styles.hospitalName}>{hospital.name}</Text>
          <View style={styles.locationBadge}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={styles.locationText}>{hospital.area}, {hospital.city}</Text>
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Departments</Text>
            <Text style={styles.detailValue}>{hospital.departments.length}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Rating</Text>
            <Text style={styles.detailValue}>{hospital.rating?.toFixed(1) || '4.0'}</Text>
          </View>
        </View>

        {/* Contact Info */}
        <Card style={styles.contactCard}>
          <View style={styles.contactRow}>
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.contactText}>{hospital.phone || 'Contact Private'}</Text>
          </View>
          <View style={[styles.contactRow, { marginTop: 16 }]}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.contactText}>{hospital.email}</Text>
          </View>
          <View style={[styles.contactRow, { marginTop: 16, alignItems: 'flex-start' }]}>
            <View style={styles.contactIcon}>
              <Ionicons name="map-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.contactText}>{hospital.address}</Text>
          </View>
        </Card>

        {/* Departments List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Departments</Text>
          <View style={styles.deptsContainer}>
            {hospital.departments.map((dept, index) => (
              <View key={index} style={styles.deptChip}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.deptText}>{dept}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Medical Staff */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Staff ({hospitalDoctors.length})</Text>
          {hospitalDoctors.length > 0 ? (
            hospitalDoctors.map(renderDoctorCard)
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={40} color={colors.textLight} />
              <Text style={styles.emptyText}>No doctors currently listed at this facility</Text>
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
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  hospitalName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
    backgroundColor: colors.primary + '08',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  detailDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  contactCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  deptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  deptText: {
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
  doctorAvatar: {
    width: 56,
    height: 56,
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  doctorSpec: {
    fontSize: 14,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
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
  emptyCard: {
    backgroundColor: colors.surface,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
  },
});
