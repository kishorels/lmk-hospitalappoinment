import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../../src/context/AuthContext';
import { useData, Appointment } from '../../../src/context/DataContext';
import { Card } from '../../../src/components';
import { colors } from '../../../src/theme/colors';

export default function PatientTimeline() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { doctors, getPatientTimeline } = useData();

  const doctorProfile = useMemo(() => {
    return doctors.find(d => d.email === user?.email);
  }, [doctors, user]);

  const [timeline, setTimeline] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorProfile?.id || !id) return;
    setLoading(true);
    getPatientTimeline(doctorProfile.id, id).then((items) => {
      setTimeline(items);
      setLoading(false);
    });
  }, [doctorProfile?.id, id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Patient Timeline</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {timeline.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyTitle}>No records yet</Text>
            </View>
          ) : (
            timeline.map((appt) => (
              <Card key={appt.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{format(new Date(appt.date), 'MMM d, yyyy')}</Text>
                  <Text style={styles.recordStatus}>{appt.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.recordLabel}>Complaint</Text>
                <Text style={styles.recordText}>{appt.patient_complaint || '—'}</Text>
                <Text style={styles.recordLabel}>Diagnosis</Text>
                <Text style={styles.recordText}>{appt.diagnosis || '—'}</Text>
                <Text style={styles.recordLabel}>Notes</Text>
                <Text style={styles.recordText}>{appt.record_notes || '—'}</Text>

                <Text style={styles.recordLabel}>Prescription</Text>
                {(appt.prescription && appt.prescription.length > 0) ? (
                  appt.prescription.map((med, idx) => (
                    <View key={`${appt.id}-med-${idx}`} style={styles.medRow}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medMeta}>
                        {med.dosage || 'Dose'} • {med.instructions || 'Instructions'} • {med.days ? `${med.days} days` : 'Days'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.recordText}>—</Text>
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  recordCard: { marginBottom: 16 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recordDate: { fontSize: 14, fontWeight: '700', color: colors.text },
  recordStatus: { fontSize: 12, color: colors.textSecondary },
  recordLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginTop: 8 },
  recordText: { fontSize: 14, color: colors.text, marginTop: 4 },
  medRow: { marginTop: 6 },
  medName: { fontSize: 14, fontWeight: '700', color: colors.text },
  medMeta: { fontSize: 12, color: colors.textSecondary },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, color: colors.textSecondary, marginTop: 12 },
});
