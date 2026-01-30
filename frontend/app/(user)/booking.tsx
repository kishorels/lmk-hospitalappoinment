import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData, Doctor, COMMISSION_RATE } from '../../src/context/DataContext';
import { Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

export default function Booking() {
  const router = useRouter();
  const { doctorId, preselectDate, preselectTime } = useLocalSearchParams<{
    doctorId: string,
    preselectDate?: string,
    preselectTime?: string
  }>();
  const { user } = useAuth();
  const { getDoctorById, createAppointment, isLoading: dataLoading } = useData();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'video'>('in-person');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    preselectDate ? new Date(preselectDate) : null
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(preselectTime || null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (doctorId) {
      const d = getDoctorById(doctorId);
      if (d) setDoctor(d);
    }
  }, [doctorId, dataLoading]);

  if (dataLoading && !doctor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorText}>Doctor not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  // Filter dates by doctor availability
  const availableDates = dates.filter(date => {
    const dayName = format(date, 'EEEE');
    return doctor.available_days.includes(dayName);
  });

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !user) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    setBookingLoading(true);
    try {
      const appointment = await createAppointment({
        user_id: user.id,
        user_name: user.name,
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        hospital_id: doctor.hospital_id,
        hospital_name: doctor.hospital_name,
        date: selectedDate.toISOString().split('T')[0],
        time_slot: selectedTime,
        type: appointmentType,
        reason: 'General Consultation',
      });

      if (appointment) {
        Alert.alert(
          'Booking Successful',
          `Your appointment with ${doctor.name} has been scheduled for ${format(selectedDate, 'MMM d')} at ${selectedTime}.`,
          [{ text: 'View Appointments', onPress: () => router.replace('/(user)/appointments') }]
        );
      } else {
        throw new Error('Booking failed');
      }
    } catch (error) {
      Alert.alert('Booking Error', 'Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Schedule</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Doctor Minimal Info */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorAvatar}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
            {doctor.hospital_name && (
              <View style={styles.hospitalRow}>
                <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.hospitalName}>{doctor.hospital_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consultation Type</Text>
          <View style={styles.typeGrid}>
            <TouchableOpacity
              style={[styles.typeCard, appointmentType === 'in-person' && styles.typeCardActive]}
              onPress={() => setAppointmentType('in-person')}
            >
              <Ionicons
                name="business"
                size={24}
                color={appointmentType === 'in-person' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.typeText, appointmentType === 'in-person' && styles.typeTextActive]}>In-Person</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeCard, appointmentType === 'video' && styles.typeCardActive]}
              onPress={() => setAppointmentType('video')}
            >
              <Ionicons
                name="videocam"
                size={24}
                color={appointmentType === 'video' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.typeText, appointmentType === 'video' && styles.typeTextActive]}>Video Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesScroll}>
            {availableDates.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>{format(date, 'EEE')}</Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{format(date, 'd')}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time Slot</Text>
            <View style={styles.timeGrid}>
              {doctor.available_slots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeCard, isSelected && styles.timeCardActive]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeText, isSelected && styles.timeTextActive]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Summary Card */}
        {selectedDate && selectedTime && (
          <View style={styles.summarySection}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryInfo}>
                <View style={styles.summaryRow}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.summaryText}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text style={styles.summaryText}>{selectedTime}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Ionicons name="card-outline" size={18} color={colors.primary} />
                  <Text style={styles.summaryText}>Fee: ₹{Math.round((doctor.consultation_fee || 0) * (1 + COMMISSION_RATE))}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Button
            title={bookingLoading ? 'Confirming...' : 'Confirm Appointment'}
            onPress={handleBook}
            disabled={!selectedDate || !selectedTime || bookingLoading}
            size="large"
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
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
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  doctorSpec: {
    fontSize: 14,
    color: colors.textSecondary,
    marginVertical: 2,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hospitalName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTextActive: {
    color: colors.primary,
  },
  datesScroll: {
    gap: 12,
  },
  dateCard: {
    width: 64,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateDayActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  dateNumActive: {
    color: '#FFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    width: (width - 60) / 3,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  timeTextActive: {
    color: '#FFF',
  },
  summarySection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    padding: 20,
    borderRadius: 20,
  },
  summaryInfo: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    marginTop: 8,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});
