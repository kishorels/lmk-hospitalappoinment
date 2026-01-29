import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useData } from '../../../src/context/DataContext';
import { Card, Badge, Button } from '../../../src/components';
import { colors } from '../../../src/theme/colors';

export default function DoctorDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDoctorById, getHospitalById } = useData();

  const doctor = getDoctorById(id);

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Doctor not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const hospitals = doctor.hospitalIds.map(id => getHospitalById(id)).filter(Boolean);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Doctor Profile</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Doctor Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={56} color={colors.doctorPrimary} />
          </View>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="star" size={20} color="#FFB800" />
              </View>
              <Text style={styles.statValue}>{doctor.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="ribbon" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{doctor.experience}</Text>
              <Text style={styles.statLabel}>Years Exp</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="cash" size={20} color={colors.secondary} />
              </View>
              <Text style={styles.statValue}>₹{doctor.consultationFee}</Text>
              <Text style={styles.statLabel}>Fee</Text>
            </View>
          </View>

          {doctor.videoConsultation && (
            <View style={styles.videoBadge}>
              <Ionicons name="videocam" size={18} color={colors.info} />
              <Text style={styles.videoBadgeText}>Video Consultation Available</Text>
            </View>
          )}
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.daysContainer}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index];
              const isAvailable = doctor.availableDays.includes(fullDay);
              return (
                <View
                  key={day}
                  style={[styles.dayChip, isAvailable && styles.dayChipActive]}
                >
                  <Text style={[styles.dayText, isAvailable && styles.dayTextActive]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Hospitals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Works At</Text>
          {hospitals.map((hospital) => (
            <Card
              key={hospital!.id}
              onPress={() => router.push(`/(user)/hospital/${hospital!.id}`)}
              style={styles.hospitalCard}
            >
              <View style={styles.hospitalRow}>
                <View style={styles.hospitalIcon}>
                  <Ionicons name="business" size={24} color={colors.hospitalPrimary} />
                </View>
                <View style={styles.hospitalInfo}>
                  <Text style={styles.hospitalName}>{hospital!.name}</Text>
                  <Text style={styles.hospitalAddress}>{hospital!.area}, {hospital!.city}</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookHereBtn}
                  onPress={() => router.push({
                    pathname: '/(user)/booking',
                    params: { doctorId: doctor.id, hospitalId: hospital!.id }
                  })}
                >
                  <Text style={styles.bookHereBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="Book Appointment"
            onPress={() => router.push({
              pathname: '/(user)/booking',
              params: { doctorId: doctor.id, hospitalId: doctor.hospitalIds[0] }
            })}
            size="large"
            style={styles.bookBtn}
          />
          <Button
            title="Ask a Query"
            onPress={() => router.push(`/(user)/chat/${doctor.id}`)}
            variant="outline"
            size="large"
            style={styles.queryBtn}
          />
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
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.doctorPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  doctorSpec: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  videoBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.info,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textLight,
  },
  dayTextActive: {
    color: '#FFF',
  },
  hospitalCard: {
    marginBottom: 12,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.hospitalPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  hospitalAddress: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bookHereBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookHereBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  actionsSection: {
    padding: 20,
    gap: 12,
  },
  bookBtn: {
    width: '100%',
  },
  queryBtn: {
    width: '100%',
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
