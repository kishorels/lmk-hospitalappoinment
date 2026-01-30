import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Badge } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function HospitalDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const {
        doctors,
        appointments,
        refreshData,
        getHospitalById,
        isLoading
    } = useData();

    const [refreshing, setRefreshing] = React.useState(false);

    useEffect(() => {
        refreshData();
    }, []);

    const hospitalDoctors = useMemo(() => {
        return doctors.filter(d => d.hospital_id === user?.id);
    }, [doctors, user]);

    const hospitalAppointments = useMemo(() => {
        return appointments.filter(a => a.hospital_id === user?.id);
    }, [appointments, user]);

    const stats = useMemo(() => {
        const pending = hospitalAppointments.filter(a => a.status === 'pending');
        const today = hospitalAppointments.filter(a => {
            const date = new Date(a.date).toDateString();
            return date === new Date().toDateString();
        });

        return [
            { label: 'Doctors', value: hospitalDoctors.length, icon: 'medkit-outline', color: colors.primary },
            { label: 'Pending', value: pending.length, icon: 'hourglass-outline', color: colors.warning },
            { label: "Today's", value: today.length, icon: 'today-outline', color: colors.success },
            { label: 'Total', value: hospitalAppointments.length, icon: 'calendar-outline', color: '#8B5CF6' },
        ];
    }, [hospitalDoctors, hospitalAppointments]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    if (!user || user.role !== 'hospital') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            <Ionicons name="business-outline" size={32} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.greeting}>Hospital Portal</Text>
                            <Text style={styles.hospitalName}>{user.name}</Text>
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                                <Text style={styles.location}>{user.area}, {user.city}</Text>
                            </View>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color={colors.error} />
                    </TouchableOpacity>
                </View>

                {/* Quick Info Card */}
                <LinearGradient
                    colors={[colors.primary, colors.primary + 'DD']}
                    style={styles.infoCard}
                >
                    <View style={styles.infoContent}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Rating</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoValue}>{user.rating?.toFixed(1) || '4.0'}</Text>
                                <Ionicons name="star" size={16} color="#FFB800" />
                            </View>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>Units</Text>
                            <Text style={styles.infoValue}>{user.departments?.length || 0}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <View key={index} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: stat.color + '10' }]}>
                                <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* My Doctors Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Medical Staff</Text>
                        <TouchableOpacity onPress={() => router.push('/(hospital)/doctors')}>
                            <Text style={styles.seeAll}>Manage</Text>
                        </TouchableOpacity>
                    </View>
                    {hospitalDoctors.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorsScroll}>
                            {hospitalDoctors.map((doctor) => (
                                <View key={doctor.id} style={styles.doctorCard}>
                                    <View style={styles.doctorAvatar}>
                                        <Ionicons name="person-outline" size={24} color={colors.primary} />
                                    </View>
                                    <Text style={styles.doctorCardName} numberOfLines={1}>{doctor.name}</Text>
                                    <Text style={styles.doctorSpec} numberOfLines={1}>{doctor.specialization}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="people-outline" size={40} color={colors.textLight} />
                            <Text style={styles.emptyText}>No staff registered</Text>
                        </View>
                    )}
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Bookings</Text>
                        <TouchableOpacity onPress={() => router.push('/(hospital)/appointments')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {hospitalAppointments.length > 0 ? (
                        hospitalAppointments.slice(0, 3).map((appointment) => (
                            <Card key={appointment.id} style={styles.appointmentCard}>
                                <View style={styles.appointmentRow}>
                                    <View style={styles.appointmentMain}>
                                        <Text style={styles.patientName}>{appointment.user_name}</Text>
                                        <Text style={styles.appointmentSub}>with {appointment.doctor_name}</Text>
                                        <Text style={styles.appointmentTime}>
                                            {format(new Date(appointment.date), 'MMM d')} • {appointment.time_slot}
                                        </Text>
                                    </View>
                                    <Badge
                                        text={appointment.status.toUpperCase()}
                                        variant={appointment.status === 'accepted' ? 'success' : appointment.status === 'pending' ? 'warning' : 'error'}
                                    />
                                </View>
                            </Card>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="calendar-outline" size={40} color={colors.textLight} />
                            <Text style={styles.emptyText}>No recent activity</Text>
                        </View>
                    )}
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
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    hospitalName: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    location: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    logoutBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.error + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        marginHorizontal: 20,
        padding: 24,
        borderRadius: 24,
        marginBottom: 24,
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
    },
    infoDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
    },
    statCard: {
        width: '48%',
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    section: {
        marginTop: 32,
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    seeAll: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    doctorsScroll: {
        gap: 12,
        paddingRight: 20,
    },
    doctorCard: {
        width: 140,
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    doctorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: colors.primary + '08',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    doctorCardName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    doctorSpec: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    appointmentCard: {
        marginBottom: 12,
        padding: 16,
    },
    appointmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    appointmentMain: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    appointmentSub: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    appointmentTime: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
