import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../../src/context/DataContext';
import { Card, Badge, Button } from '../../../src/components';
import { colors } from '../../../src/theme/colors';
import { Doctor } from '../../../src/data/mockData';

export default function HospitalDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getHospitalById, getDoctorsByHospital } = useData();

  const hospital = getHospitalById(id);
  const doctors = getDoctorsByHospital(id);

  if (!hospital) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Hospital not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const renderDoctorCard = (doctor: Doctor) => (
    <Card
      key={doctor.id}
      onPress={() => router.push(`/(user)/doctor/${doctor.id}`)}
      style={styles.doctorCard}
    >
      <View style={styles.doctorRow}>
        <View style={styles.doctorAvatar}>
          <Ionicons name="person" size={28} color={colors.doctorPrimary} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
          <View style={styles.doctorMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.metaText}>{doctor.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="ribbon" size={14} color={colors.textLight} />
              <Text style={styles.metaText}>{doctor.experience} yrs</Text>
            </View>
            {doctor.videoConsultation && (
              <Badge text="Video" variant="info" />
            )}
          </View>
        </View>
      </View>
      <View style={styles.doctorActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push({
            pathname: '/(user)/booking',
            params: { doctorId: doctor.id, hospitalId: hospital.id }
          })}
        >
          <Ionicons name="calendar" size={18} color={colors.primary} />
          <Text style={styles.actionBtnText}>Book</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.queryBtn]}
          onPress={() => router.push(`/(user)/chat/${doctor.id}`)}
        >
          <Ionicons name="chatbubble" size={18} color={colors.secondary} />
          <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Query</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hospital Details</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Hospital Info */}
        <View style={styles.hospitalSection}>
          <View style={styles.hospitalIcon}>
            <Ionicons name="business" size={48} color={colors.hospitalPrimary} />
          </View>
          <Text style={styles.hospitalName}>{hospital.name}</Text>
          
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={16} color="#FFB800" />
            <Text style={styles.ratingText}>{hospital.rating.toFixed(1)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>{hospital.address}</Text>
              <Text style={styles.infoSubtext}>{hospital.area}, {hospital.city}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{hospital.contact}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{hospital.email}</Text>
          </View>
        </View>

        {/* Departments */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Departments</Text>
          <View style={styles.departmentsGrid}>
            {hospital.departments.map((dept, index) => (
              <View key={index} style={styles.deptCard}>
                <Ionicons name="medical" size={20} color={colors.primary} />
                <Text style={styles.deptName}>{dept}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Doctors */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Doctors ({doctors.length})</Text>
          {doctors.length > 0 ? (
            doctors.map(renderDoctorCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>No doctors available</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  hospitalSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hospitalIcon: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: colors.hospitalPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  hospitalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
  },
  infoSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  departmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  deptName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  doctorCard: {
    marginBottom: 12,
  },
  doctorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
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
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  doctorSpec: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  doctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  doctorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  queryBtn: {
    backgroundColor: colors.secondaryLight,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
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
