import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { Appointment } from '../../src/data/mockData';

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected' | 'completed';

export default function DoctorAppointments() {
    const { user } = useAuth();
    const {
        getAppointmentsByDoctor,
        updateAppointmentStatus,
        doctors,
        getHospitalById
    } = useData();

    const [filter, setFilter] = useState<FilterType>('all');

    const doctorProfile = useMemo(() => {
        return doctors.find(d => d.email === user?.email);
    }, [doctors, user]);

    const appointments = useMemo(() => {
        if (!doctorProfile) return [];
        const allAppointments = getAppointmentsByDoctor(doctorProfile.id);
        if (filter === 'all') return allAppointments;
        return allAppointments.filter(a => a.status === filter);
    }, [doctorProfile, filter]);

    const handleStatusUpdate = async (appointmentId: string, status: 'accepted' | 'rejected') => {
        try {
            await updateAppointmentStatus(appointmentId, status);
            Alert.alert('Success', `Appointment ${status}!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update appointment status');
        }
    };

    const getStatusVariant = (status: Appointment['status']) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'accepted': return 'success';
            case 'rejected': return 'error';
            case 'completed': return 'info';
            default: return 'default';
        }
    };

    const filters: { label: string; value: FilterType }[] = [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Completed', value: 'completed' },
    ];

    const renderAppointment = ({ item }: { item: Appointment }) => {
        const hospital = getHospitalById(item.hospitalId);

        return (
            <Card style={styles.appointmentCard}>
                <View style={styles.cardHeader}>
                    <Badge text={item.status.toUpperCase()} variant={getStatusVariant(item.status)} />
                    <Badge text={item.type === 'video' ? 'Video' : 'In-Person'} variant="info" />
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
                        <Text style={styles.detailText}>{hospital?.name || 'Unknown Hospital'}</Text>
                    </View>
                </View>

                {item.status === 'pending' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.acceptBtn]}
                            onPress={() => handleStatusUpdate(item.id, 'accepted')}
                        >
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                            <Text style={styles.actionBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={() => handleStatusUpdate(item.id, 'rejected')}
                        >
                            <Ionicons name="close" size={20} color="#FFF" />
                            <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {item.type === 'video' && item.status === 'accepted' && (
                    <TouchableOpacity style={styles.videoButton}>
                        <Ionicons name="videocam" size={20} color="#FFF" />
                        <Text style={styles.videoButtonText}>Start Video Call</Text>
                    </TouchableOpacity>
                )}
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Appointments</Text>
                <Text style={styles.subtitle}>{appointments.length} total</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
                        onPress={() => setFilter(f.value)}
                    >
                        <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
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
                    <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>No appointments</Text>
                    <Text style={styles.emptyText}>
                        {filter === 'all' ? 'No appointments yet' : `No ${filter} appointments`}
                    </Text>
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
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    filterTabActive: {
        backgroundColor: colors.doctorPrimary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: '#FFF',
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
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    acceptBtn: {
        backgroundColor: colors.success,
    },
    rejectBtn: {
        backgroundColor: colors.error,
    },
    actionBtnText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    videoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.secondary,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 16,
        gap: 8,
    },
    videoButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});
