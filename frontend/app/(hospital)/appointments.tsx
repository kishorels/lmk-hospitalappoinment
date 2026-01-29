import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Badge } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { Appointment } from '../../src/data/mockData';

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected' | 'completed';

export default function HospitalAppointments() {
    const { user } = useAuth();
    const { hospitals, appointments, doctors } = useData();

    const [filter, setFilter] = useState<FilterType>('all');

    const hospitalProfile = useMemo(() => {
        return hospitals.find(h => h.email === user?.email);
    }, [hospitals, user]);

    const hospitalAppointments = useMemo(() => {
        if (!hospitalProfile) return [];
        const allAppointments = appointments.filter(a => a.hospitalId === hospitalProfile.id);
        if (filter === 'all') return allAppointments;
        return allAppointments.filter(a => a.status === filter);
    }, [hospitalProfile, appointments, filter]);

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
        const doctor = doctors.find(d => d.id === item.doctorId);

        return (
            <Card style={styles.appointmentCard}>
                <View style={styles.cardHeader}>
                    <Badge text={item.status.toUpperCase()} variant={getStatusVariant(item.status)} />
                    <Badge text={item.type === 'video' ? 'Video' : 'In-Person'} variant="info" />
                </View>

                <View style={styles.doctorRow}>
                    <View style={styles.doctorAvatar}>
                        <Ionicons name="person" size={20} color={colors.doctorPrimary} />
                    </View>
                    <View>
                        <Text style={styles.doctorName}>{doctor?.name || 'Unknown Doctor'}</Text>
                        <Text style={styles.doctorSpec}>{doctor?.specialization || ''}</Text>
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
                </View>
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Appointments</Text>
                <Text style={styles.subtitle}>{hospitalAppointments.length} total</Text>
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

            {hospitalAppointments.length > 0 ? (
                <FlatList
                    data={hospitalAppointments}
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
        backgroundColor: colors.hospitalPrimary,
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
        marginBottom: 12,
    },
    doctorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    doctorAvatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.doctorPrimary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    doctorName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    doctorSpec: {
        fontSize: 13,
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
