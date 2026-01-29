import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Badge } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function DoctorDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const {
        appointments,
        getDoctorAppointments,
        isLoading,
        getHospitalById
    } = useData();

    const [refreshing, setRefreshing] = React.useState(false);

    useEffect(() => {
        if (user?.id) {
            getDoctorAppointments(user.id);
        }
    }, [user]);

    const stats = useMemo(() => {
        const pending = appointments.filter(a => a.status === 'pending');
        const today = appointments.filter(a => {
            const appointmentDate = new Date(a.date).toDateString();
            const todayStr = new Date().toDateString();
            return appointmentDate === todayStr && a.status === 'accepted';
        });

        return [
            { label: 'Pending', value: pending.length, icon: 'hourglass-outline', color: colors.warning },
            { label: "Today's", value: today.length, icon: 'today-outline', color: colors.success },
            { label: 'Total', value: appointments.length, icon: 'calendar-outline', color: colors.primary },
            { label: 'Rating', value: user?.rating?.toFixed(1) || '4.0', icon: 'star-outline', color: '#FFB800' },
        ];
    }, [appointments, user]);

    const onRefresh = async () => {
        if (user?.id) {
            setRefreshing(true);
            await getDoctorAppointments(user.id);
            setRefreshing(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/');
    };

    if (!user || user.role !== 'doctor') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const pendingAppointments = appointments.filter(a => a.status === 'pending');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            <Ionicons name="medkit-outline" size={32} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.doctorName}>Dr. {user.name}</Text>
                            <Text style={styles.specialization}>{user.specialization}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color={colors.error} />
                    </TouchableOpacity>
                </View>

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

                {/* Main Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/(doctor)/appointments')}
                        >
                            <LinearGradient colors={['#EEF6FF', '#DBEAFE']} style={styles.actionIconBg}>
                                <Ionicons name="calendar" size={24} color={colors.primary} />
                            </LinearGradient>
                            <Text style={styles.actionLabel}>Appointments</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard}>
                            <LinearGradient colors={['#F3E8FF', '#E9D5FF']} style={styles.actionIconBg}>
                                <Ionicons name="people" size={24} color="#8B5CF6" />
                            </LinearGradient>
                            <Text style={styles.actionLabel}>My Patients</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard}>
                            <LinearGradient colors={['#FFF7ED', '#FFEDD5']} style={styles.actionIconBg}>
                                <Ionicons name="time" size={24} color="#F59E0B" />
                            </LinearGradient>
                            <Text style={styles.actionLabel}>Schedule</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Pending Appointments */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Pending Approvals</Text>
                        <TouchableOpacity onPress={() => router.push('/(doctor)/appointments')}>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {pendingAppointments.length > 0 ? (
                        pendingAppointments.slice(0, 3).map((appointment) => (
                            <Card key={appointment.id} style={styles.appointmentCard}>
                                <View style={styles.appointmentRow}>
                                    <View style={styles.appointmentInfo}>
                                        <Text style={styles.patientName}>{appointment.user_name}</Text>
                                        <Text style={styles.appointmentDate}>
                                            {format(new Date(appointment.date), 'MMM d, yyyy')} • {appointment.time_slot}
                                        </Text>
                                    </View>
                                    <View style={styles.badgeRow}>
                                        <Badge text={appointment.type === 'video' ? 'Video' : 'In-Person'} variant="info" />
                                        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                                    </View>
                                </View>
                            </Card>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
                            <Text style={styles.emptyText}>No pending appointments</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Re-using styles with some improvements
import { LinearGradient } from 'expo-linear-gradient';

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
    doctorName: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
    },
    specialization: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    logoutBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.error + '10',
        justifyContent: 'center',
        alignItems: 'center',
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
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionIconBg: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },
    appointmentCard: {
        marginBottom: 12,
        padding: 16,
    },
    appointmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    appointmentInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    appointmentDate: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 4,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
        fontWeight: '500',
    },
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
