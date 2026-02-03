import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData, Appointment } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function Appointments() {
  const router = useRouter();
  const { user } = useAuth();
  const { appointments, getUserAppointments, getDoctorById, getHospitalById } = useData();

  useEffect(() => {
    if (user) {
      getUserAppointments(user.id);
    }
  }, [user]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [appointments]);

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const doctor = getDoctorById(item.doctor_id);
    const hospital = item.hospital_id ? getHospitalById(item.hospital_id) : null;

    return (
      <Card style={styles.appointmentCard}>
        <View style={styles.cardHeader}>
          <Badge text={item.status.toUpperCase()} variant={getStatusVariant(item.status)} />
          <Badge
            text={item.type === 'video' ? 'Video' : 'In-Person'}
            variant="info"
          />
        </View>

        <View style={styles.doctorRow}>
          <View style={styles.doctorAvatar}>
            <Ionicons name="person" size={24} color={colors.doctorPrimary} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{item.doctor_name}</Text>
            <Text style={styles.doctorSpec}>{doctor?.specialization || 'Specialist'}</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={18} color={colors.textLight} />
            <Text style={styles.detailText}>
              {format(new Date(item.date), 'EEEE, MMM d, yyyy')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={18} color={colors.textLight} />
            <Text style={styles.detailText}>{item.time_slot}</Text>
          </View>
          {(hospital || item.hospital_name) && (
            <View style={styles.detailRow}>
              <Ionicons name="business" size={18} color={colors.textLight} />
              <Text style={styles.detailText}>{hospital?.name || item.hospital_name}</Text>
            </View>
          )}
        </View>

        {(item.patient_complaint || item.diagnosis || (item.prescription && item.prescription.length > 0) || item.record_notes) && (
          <View style={styles.recordSection}>
            <Text style={styles.recordTitle}>Doctor Record</Text>
            <Text style={styles.recordLabel}>Complaint</Text>
            <Text style={styles.recordText}>{item.patient_complaint || '—'}</Text>
            <Text style={styles.recordLabel}>Diagnosis</Text>
            <Text style={styles.recordText}>{item.diagnosis || '—'}</Text>
            <Text style={styles.recordLabel}>Notes</Text>
            <Text style={styles.recordText}>{item.record_notes || '—'}</Text>

            <Text style={styles.recordLabel}>Prescription</Text>
            {(item.prescription && item.prescription.length > 0) ? (
              item.prescription.map((med, idx) => (
                <View key={`${item.id}-med-${idx}`} style={styles.medRow}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medMeta}>
                    {med.dosage || 'Dose'} • {med.instructions || 'Instructions'} • {med.days ? `${med.days} days` : 'Days'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.recordText}>—</Text>
            )}
          </View>
        )}

        {item.status === 'rejected' && item.suggested_date && (
          <View style={styles.rescheduleSection}>
            <View style={styles.rescheduleHeader}>
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.doctorPrimary} />
              <Text style={styles.rescheduleTitle}>Doctor's Suggestion</Text>
            </View>
            <Text style={styles.doctorNote}>"{item.doctor_note}"</Text>
            <View style={styles.suggestionBox}>
              <Text style={styles.suggestionTitle}>New Suggested Time:</Text>
              <View style={styles.suggestionRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.text} />
                <Text style={styles.suggestionText}>{format(new Date(item.suggested_date), 'MMM d, yyyy')}</Text>
              </View>
              <View style={styles.suggestionRow}>
                <Ionicons name="time-outline" size={16} color={colors.text} />
                <Text style={styles.suggestionText}>{item.suggested_time}</Text>
              </View>
            </View>
            <Button
              title="Book Suggested Time"
              size="small"
              onPress={() => router.push({
                pathname: '/(user)/booking',
                params: {
                  doctorId: item.doctor_id,
                  preselectDate: item.suggested_date,
                  preselectTime: item.suggested_time
                }
              })}
              style={styles.bookSuggestedBtn}
            />
          </View>
        )}

        {item.type === 'video' && item.status === 'accepted' && (
          <TouchableOpacity style={styles.joinButton}>
            <Ionicons name="videocam" size={20} color="#FFF" />
            <Text style={styles.joinButtonText}>Join Video Call</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      {sortedAppointments.length > 0 ? (
        <FlatList
          data={sortedAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No appointments yet</Text>
          <Text style={styles.emptyText}>
            Book your first appointment with a doctor
          </Text>
          <Button
            title="Find Doctors"
            onPress={() => router.push('/(user)/hospitals')}
            style={styles.findButton}
          />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  listContent: {
    padding: 20,
  },
  appointmentCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
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
  },
  detailsContainer: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  recordSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 6,
  },
  recordText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  medRow: {
    marginTop: 6,
  },
  medName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  medMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  findButton: {
    paddingHorizontal: 32,
  },
  rescheduleSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.doctorPrimary + '05',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.doctorPrimary + '20',
  },
  rescheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rescheduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.doctorPrimary,
  },
  doctorNote: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bookSuggestedBtn: {
    marginTop: 4,
  },
});
