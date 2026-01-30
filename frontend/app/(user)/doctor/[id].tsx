import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, StatusBar as RNStatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useData, COMMISSION_RATE } from '../../../src/context/DataContext';
import { useAuth } from '../../../src/context/AuthContext';
import { Card, Badge, Button } from '../../../src/components';
import { colors } from '../../../src/theme/colors';

export default function DoctorDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDoctorById, getHospitalById, appointments } = useData();

  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doctor = getDoctorById(id!);

  const hospital = useMemo(() => {
    return doctor?.hospital_id ? getHospitalById(doctor.hospital_id) : null;
  }, [doctor, getHospitalById]);

  const hasCompletedAppointment = useMemo(() => {
    if (!user || !id) return false;
    return appointments.some(a =>
      a.user_id === user.id &&
      a.doctor_id === id &&
      a.status === 'completed'
    );
  }, [user, id, appointments]);

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

  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }
    setIsSubmitting(true);
    // Mimic API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Success', 'Thank you for your review!');
      setReviewText('');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
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
              <Text style={styles.statValue}>{(doctor.rating ?? 4.0).toFixed(1)}</Text>
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
              <Text style={styles.statValue}>₹{Math.round((doctor.consultation_fee || 0) * (1 + COMMISSION_RATE))}</Text>
              <Text style={styles.statLabel}>Fee</Text>
            </View>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.daysContainer}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
              const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index];
              const isAvailable = doctor.available_days?.includes(fullDay);
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

        {/* Hospital */}
        {hospital && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Works At</Text>
            <Card
              onPress={() => router.push(`/(user)/hospitals?id=${hospital.id}`)}
              style={styles.hospitalCard}
            >
              <View style={styles.hospitalRow}>
                <View style={styles.hospitalIcon}>
                  <Ionicons name="business" size={24} color={colors.hospitalPrimary} />
                </View>
                <View style={styles.hospitalInfo}>
                  <Text style={styles.hospitalName}>{hospital.name}</Text>
                  <Text style={styles.hospitalAddress}>{hospital.area}, {hospital.city}</Text>
                </View>
                <TouchableOpacity
                  style={styles.bookHereBtn}
                  onPress={() => router.push({
                    pathname: '/(user)/booking',
                    params: { doctorId: doctor.id, hospitalId: hospital.id }
                  })}
                >
                  <Text style={styles.bookHereBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Reviews</Text>

          {hasCompletedAppointment ? (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewPrompt}>Share your experience with Dr. {doctor.name.split(' ').pop()}</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={32}
                      color="#FFB800"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.reviewInput}
                placeholder="Write your review here..."
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={4}
              />
              <Button
                title={isSubmitting ? "Submitting..." : "Submit Review"}
                onPress={handleSubmitReview}
                disabled={isSubmitting}
              />
            </View>
          ) : (
            <View style={styles.reviewLocked}>
              <Ionicons name="lock-closed" size={24} color={colors.textLight} />
              <Text style={styles.reviewLockedText}>
                Reviews are only allowed for patients who have completed an appointment with this doctor.
              </Text>
            </View>
          )}

          {/* Placeholder Reviews */}
          <View style={styles.placeholderReviews}>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>John Doe</Text>
                <View style={styles.starRow}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={styles.reviewRating}>5.0</Text>
                </View>
              </View>
              <Text style={styles.reviewBody}>Very professional and helpful. Highly recommended!</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="Book Appointment"
            onPress={() => router.push({
              pathname: '/(user)/booking',
              params: { doctorId: doctor.id, hospitalId: doctor.hospital_id }
            })}
            size="large"
            style={styles.bookBtn}
          />
          <Button
            title="Ask a Query"
            onPress={() => router.push(`/(user)/ai-assistant`)}
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.doctorPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  doctorSpec: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textLight,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
  },
  dayTextActive: {
    color: '#FFF',
  },
  hospitalCard: {
    marginBottom: 8,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
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
  },
  hospitalAddress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bookHereBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookHereBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewForm: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  reviewPrompt: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  reviewInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  reviewLockedText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  placeholderReviews: {
    marginTop: 20,
    gap: 12,
  },
  reviewCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  reviewBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
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
