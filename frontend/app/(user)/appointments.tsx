import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { Appointment } from '../../src/data/mockData';

export default function Appointments() {
  const router = useRouter();
  const { user } = useAuth();
  const { getAppointmentsByUser, getDoctorById, getHospitalById } = useData();

  const appointments = useMemo(() => {
    if (!user) return [];
    return getAppointmentsByUser(user.id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [user]);

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
    const doctor = getDoctorById(item.doctorId);
    const hospital = getHospitalById(item.hospitalId);

    if (!doctor || !hospital) return null;

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
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
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
            <Text style={styles.detailText}>{item.timeSlot}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="business" size={18} color={colors.textLight} />
            <Text style={styles.detailText}>{hospital.name}</Text>
          </View>
        </View>

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

      {appointments.length > 0 ? (
        <FlatList
          data={appointments}
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
});
