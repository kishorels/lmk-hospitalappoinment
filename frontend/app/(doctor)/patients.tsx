import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData, Appointment } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

interface Patient {
    id: string;
    name: string;
    appointmentsCount: number;
    lastVisit: string;
    appointments: Appointment[];
}

export default function MyPatients() {
    const router = useRouter();
    const { user } = useAuth();
    const { appointments, getDoctorAppointments, doctors, isLoading, getPatientTimeline } = useData();
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [timeline, setTimeline] = useState<Appointment[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const doctorProfile = useMemo(() => {
        return doctors.find(d => d.email === user?.email);
    }, [doctors, user]);

    useEffect(() => {
        if (doctorProfile?.id) {
            getDoctorAppointments(doctorProfile.id);
        }
    }, [doctorProfile?.id]);

    // Get unique patients from accepted/completed appointments only
    const patients = useMemo(() => {
        const acceptedAppointments = appointments.filter(
            a => a.status === 'accepted' || a.status === 'completed'
        );

        // Group by patient (user_id)
        const patientMap = new Map<string, Patient>();

        acceptedAppointments.forEach(appointment => {
            const existingPatient = patientMap.get(appointment.user_id);

            if (existingPatient) {
                existingPatient.appointmentsCount += 1;
                existingPatient.appointments.push(appointment);
                // Update last visit if this appointment is more recent
                if (new Date(appointment.date) > new Date(existingPatient.lastVisit)) {
                    existingPatient.lastVisit = appointment.date;
                }
            } else {
                patientMap.set(appointment.user_id, {
                    id: appointment.user_id,
                    name: appointment.user_name,
                    appointmentsCount: 1,
                    lastVisit: appointment.date,
                    appointments: [appointment],
                });
            }
        });

        // Convert to array and sort by last visit (most recent first)
        return Array.from(patientMap.values()).sort(
            (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
        );
    }, [appointments]);

    const openTimeline = async (patient: Patient) => {
        if (!doctorProfile?.id) return;
        setSelectedPatient(patient);
        setTimelineLoading(true);
        try {
            const data = await getPatientTimeline(doctorProfile.id, patient.id);
            setTimeline(data);
        } finally {
            setTimelineLoading(false);
        }
    };

    const renderPatient = ({ item }: { item: Patient }) => {
        return (
            <Card style={styles.patientCard} onPress={() => openTimeline(item)}>
                <View style={styles.patientRow}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={28} color={colors.primary} />
                        </View>
                    </View>
                    <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{item.name}</Text>
                        <View style={styles.metaRow}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textLight} />
                            <Text style={styles.metaText}>
                                Last visit: {format(new Date(item.lastVisit), 'MMM d, yyyy')}
                            </Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Ionicons name="medical-outline" size={14} color={colors.textLight} />
                            <Text style={styles.metaText}>
                                {item.appointmentsCount} appointment{item.appointmentsCount > 1 ? 's' : ''}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.badgeContainer}>
                        <Badge
                            text={item.appointments.some(a => a.status === 'accepted') ? 'Active' : 'Past'}
                            variant={item.appointments.some(a => a.status === 'accepted') ? 'success' : 'default'}
                        />
                    </View>
                </View>
            </Card>
        );
    };

    if (isLoading && patients.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>My Patients</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{patients.length}</Text>
                    <Text style={styles.statLabel}>Total Patients</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                        {patients.filter(p => p.appointments.some(a => a.status === 'accepted')).length}
                    </Text>
                    <Text style={styles.statLabel}>Active</Text>
                </View>
            </View>

            {/* Patients List */}
            {patients.length > 0 ? (
                <FlatList
                    data={patients}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPatient}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="people-outline" size={64} color={colors.textLight} />
                    </View>
                    <Text style={styles.emptyTitle}>No patients yet</Text>
                    <Text style={styles.emptyText}>
                        Patients will appear here once you accept their appointments
                    </Text>
                </View>
            )}
            <Modal
                visible={!!selectedPatient}
                animationType="slide"
                transparent
                onRequestClose={() => setSelectedPatient(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedPatient?.name || 'Patient Timeline'}</Text>
                            <TouchableOpacity onPress={() => setSelectedPatient(null)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        {timelineLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.timelineList}>
                                {timeline.length > 0 ? (
                                    timeline.map((appt) => (
                                        <Card key={appt.id} style={styles.timelineCard}>
                                            <View style={styles.timelineHeader}>
                                                <Text style={styles.timelineDate}>
                                                    {format(new Date(appt.date), 'MMM d, yyyy')} • {appt.time_slot}
                                                </Text>
                                                <Badge text={appt.status.toUpperCase()} variant="info" />
                                            </View>
                                            <Text style={styles.timelineMeta}>Reason: {appt.reason || '—'}</Text>
                                            <Text style={styles.timelineSectionTitle}>Complaint</Text>
                                            <Text style={styles.timelineText}>{appt.patient_complaint || '—'}</Text>
                                            <Text style={styles.timelineSectionTitle}>Diagnosis</Text>
                                            <Text style={styles.timelineText}>{appt.diagnosis || '—'}</Text>
                                            <Text style={styles.timelineSectionTitle}>Notes</Text>
                                            <Text style={styles.timelineText}>{appt.record_notes || '—'}</Text>
                                        </Card>
                                    ))
                                ) : (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyTitle}>No timeline yet</Text>
                                        <Text style={styles.emptyText}>No records are available for this patient.</Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 12,
        marginBottom: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    listContent: {
        padding: 20,
        paddingTop: 8,
    },
    patientCard: {
        marginBottom: 12,
        padding: 16,
    },
    patientRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    metaText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    timelineList: {
        padding: 16,
        paddingBottom: 24,
    },
    timelineCard: {
        marginBottom: 12,
        padding: 16,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    timelineDate: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    timelineMeta: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 6,
    },
    timelineSectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
        marginTop: 10,
    },
    timelineText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    badgeContainer: {
        marginLeft: 8,
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
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
