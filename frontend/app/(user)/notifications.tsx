import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { format } from 'date-fns';
import { useData } from '../../src/context/DataContext';
import { colors } from '../../src/theme/colors';

export default function Notifications() {
    const router = useRouter();
    const { appointments } = useData();

    const notifications = useMemo(() => {
        // Generate simulated notifications based on appointment status changes
        return appointments
            .map(apt => {
                let title = '';
                let message = '';
                let icon = '';
                let color = '';

                if (apt.status === 'accepted') {
                    title = 'Appointment Confirmed';
                    message = `Your appointment with Dr. ${apt.doctor_name} has been accepted.`;
                    icon = 'checkmark-circle';
                    color = colors.success;
                } else if (apt.status === 'completed') {
                    title = 'Appointment Completed';
                    message = `You have completed your visit with Dr. ${apt.doctor_name}.`;
                    icon = 'medical';
                    color = colors.primary;
                } else if (apt.status === 'rejected') {
                    title = 'Appointment Rejected';
                    message = `Sorry, your appointment with Dr. ${apt.doctor_name} was not accepted.`;
                    icon = 'close-circle';
                    color = colors.error;
                } else {
                    title = 'Appointment Pending';
                    message = `Your appointment with Dr. ${apt.doctor_name} is awaiting confirmation.`;
                    icon = 'time';
                    color = colors.warning;
                }

                return {
                    id: apt.id,
                    title,
                    message,
                    time: apt.date,
                    icon,
                    color,
                    status: apt.status
                };
            })
            .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }, [appointments]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {notifications.length > 0 ? (
                    notifications.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.notificationCard}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person-circle" size={48} color={item.color} />
                            </View>
                            <View style={styles.textContainer}>
                                <View style={styles.titleRow}>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.time}>{format(new Date(item.time), 'MMM d')}</Text>
                                </View>
                                <Text style={styles.message}>{item.message}</Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.textLight} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                )}
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
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
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
    content: {
        padding: 16,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: colors.background,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    time: {
        fontSize: 12,
        color: colors.textLight,
    },
    message: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    emptyState: {
        flex: 1,
        height: 400,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
});
