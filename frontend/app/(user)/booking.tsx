import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Button } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { TIME_SLOTS } from '../../src/data/mockData';

export default function Booking() {
  const router = useRouter();
  const { doctorId, hospitalId } = useLocalSearchParams<{ doctorId: string; hospitalId: string }>();
  const { user } = useAuth();
  const { getDoctorById, getHospitalById, createAppointment } = useData();

  const doctor = getDoctorById(doctorId);
  const hospital = getHospitalById(hospitalId);

  const [appointmentType, setAppointmentType] = useState<'hospital' | 'video'>('hospital');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!doctor || !hospital) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Invalid booking details</Text>
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
    return doctor.availableDays.includes(dayName);
  });

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !user) {
      Alert.alert('Error', 'Please select date and time');
      return;
    }

    setLoading(true);
    try {
      await createAppointment({
        userId: user.id,
        doctorId: doctor.id,
        hospitalId: hospital.id,
        type: appointmentType,
        date: selectedDate.toISOString(),
        timeSlot: selectedTime,
        status: 'pending',
      });
      
      Alert.alert(
        'Appointment Booked!',
        `Your ${appointmentType === 'video' ? 'video consultation' : 'appointment'} with ${doctor.name} is pending confirmation.`,
        [{ text: 'OK', onPress: () => router.replace('/(user)/appointments') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Doctor Info */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorAvatar}>
            <Ionicons name="person" size={32} color={colors.doctorPrimary} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
            <View style={styles.hospitalRow}>
              <Ionicons name="business" size={14} color={colors.hospitalPrimary} />
              <Text style={styles.hospitalName}>{hospital.name}</Text>
            </View>
          </View>
        </View>

        {/* Appointment Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment Type</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                appointmentType === 'hospital' && styles.typeCardActive,
              ]}
              onPress={() => setAppointmentType('hospital')}
            >
              <View style={[styles.typeIcon, appointmentType === 'hospital' && styles.typeIconActive]}>
                <Ionicons name="business" size={24} color={appointmentType === 'hospital' ? '#FFF' : colors.primary} />
              </View>
              <Text style={[styles.typeText, appointmentType === 'hospital' && styles.typeTextActive]}>
                Hospital Visit
              </Text>
              <Text style={styles.typeDesc}>In-person consultation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeCard,
                appointmentType === 'video' && styles.typeCardActive,
                !doctor.videoConsultation && styles.typeCardDisabled,
              ]}
              onPress={() => doctor.videoConsultation && setAppointmentType('video')}
              disabled={!doctor.videoConsultation}
            >
              <View style={[styles.typeIcon, appointmentType === 'video' && styles.typeIconActive]}>
                <Ionicons
                  name="videocam"
                  size={24}
                  color={appointmentType === 'video' ? '#FFF' : doctor.videoConsultation ? colors.primary : colors.textLight}
                />
              </View>
              <Text style={[
                styles.typeText,
                appointmentType === 'video' && styles.typeTextActive,
                !doctor.videoConsultation && styles.typeTextDisabled,
              ]}>
                Video Call
              </Text>
              <Text style={styles.typeDesc}>
                {doctor.videoConsultation ? 'Online consultation' : 'Not available'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableDates.map((date) => {
              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.dateCard,
                    isSelected && styles.dateCardActive,
                  ]}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>
                    {format(date, 'EEE')}
                  </Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>
                    {format(date, 'd')}
                  </Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateMonthActive]}>
                    {format(date, 'MMM')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      isSelected && styles.timeSlotActive,
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeText, isSelected && styles.timeTextActive]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Summary */}
        {selectedDate && selectedTime && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Appointment Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.summaryText}>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time" size={20} color={colors.primary} />
                <Text style={styles.summaryText}>{selectedTime}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name={appointmentType === 'video' ? 'videocam' : 'business'} size={20} color={colors.primary} />
                <Text style={styles.summaryText}>
                  {appointmentType === 'video' ? 'Video Consultation' : `At ${hospital.name}`}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Consultation Fee</Text>
                <Text style={styles.feeValue}>₹{doctor.consultationFee}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Book Button */}
        <View style={styles.bookSection}>
          <Button
            title="Confirm Booking"
            onPress={handleBook}
            loading={loading}
            disabled={!selectedDate || !selectedTime}
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
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
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
    marginBottom: 8,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hospitalName: {
    fontSize: 13,
    color: colors.hospitalPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeCardDisabled: {
    opacity: 0.5,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconActive: {
    backgroundColor: colors.primary,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  typeTextActive: {
    color: colors.primary,
  },
  typeTextDisabled: {
    color: colors.textLight,
  },
  typeDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dateCard: {
    width: 72,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dateDayActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  dateNum: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 4,
  },
  dateNumActive: {
    color: '#FFF',
  },
  dateMonth: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dateMonthActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeSlotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  timeTextActive: {
    color: '#FFF',
  },
  summarySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: colors.text,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  feeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  bookSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
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
