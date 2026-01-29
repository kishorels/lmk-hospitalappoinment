import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { DAYS_OF_WEEK } from '../../src/data/mockData';

export default function DoctorProfile() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { doctors, updateDoctor, getHospitalById } = useData();

    const doctorProfile = useMemo(() => {
        return doctors.find(d => d.email === user?.email);
    }, [doctors, user]);

    const [videoConsultation, setVideoConsultation] = useState(doctorProfile?.videoConsultation || false);
    const [availableDays, setAvailableDays] = useState<string[]>(doctorProfile?.availableDays || []);

    const handleToggleDay = async (day: string) => {
        if (!doctorProfile) return;

        const newDays = availableDays.includes(day)
            ? availableDays.filter(d => d !== day)
            : [...availableDays, day];

        setAvailableDays(newDays);
        await updateDoctor(doctorProfile.id, { availableDays: newDays });
    };

    const handleToggleVideoConsultation = async () => {
        if (!doctorProfile) return;

        const newValue = !videoConsultation;
        setVideoConsultation(newValue);
        await updateDoctor(doctorProfile.id, { videoConsultation: newValue });
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/');
                    }
                },
            ]
        );
    };

    if (!doctorProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorState}>
                    <Text style={styles.errorText}>Doctor profile not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                </View>

                {/* Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            <Ionicons name="medkit" size={40} color={colors.doctorPrimary} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.doctorName}>{doctorProfile.name}</Text>
                            <Text style={styles.specialization}>{doctorProfile.specialization}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={16} color="#FFB800" />
                                <Text style={styles.ratingText}>{doctorProfile.rating.toFixed(1)}</Text>
                                <Text style={styles.experienceText}>• {doctorProfile.experience} years exp</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>₹{doctorProfile.consultationFee}</Text>
                            <Text style={styles.statLabel}>Consultation Fee</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{doctorProfile.hospitalIds.length}</Text>
                            <Text style={styles.statLabel}>Hospitals</Text>
                        </View>
                    </View>
                </Card>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings</Text>

                    <Card style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.settingIcon, { backgroundColor: colors.secondary + '20' }]}>
                                    <Ionicons name="videocam" size={20} color={colors.secondary} />
                                </View>
                                <View>
                                    <Text style={styles.settingLabel}>Video Consultation</Text>
                                    <Text style={styles.settingDesc}>Accept video consultations</Text>
                                </View>
                            </View>
                            <Switch
                                value={videoConsultation}
                                onValueChange={handleToggleVideoConsultation}
                                trackColor={{ false: colors.border, true: colors.secondary }}
                                thumbColor="#FFF"
                            />
                        </View>
                    </Card>
                </View>

                {/* Availability Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Availability</Text>

                    <Card style={styles.availabilityCard}>
                        {DAYS_OF_WEEK.map((day) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.dayRow,
                                    availableDays.includes(day) && styles.dayRowActive,
                                ]}
                                onPress={() => handleToggleDay(day)}
                            >
                                <Text style={[
                                    styles.dayText,
                                    availableDays.includes(day) && styles.dayTextActive,
                                ]}>
                                    {day}
                                </Text>
                                <View style={[
                                    styles.dayCheck,
                                    availableDays.includes(day) && styles.dayCheckActive,
                                ]}>
                                    {availableDays.includes(day) && (
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </Card>
                </View>

                {/* Associated Hospitals */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Associated Hospitals</Text>

                    {doctorProfile.hospitalIds.map((hospitalId) => {
                        const hospital = getHospitalById(hospitalId);
                        if (!hospital) return null;
                        return (
                            <Card key={hospitalId} style={styles.hospitalCard}>
                                <View style={styles.hospitalRow}>
                                    <View style={styles.hospitalIcon}>
                                        <Ionicons name="business" size={24} color={colors.hospitalPrimary} />
                                    </View>
                                    <View style={styles.hospitalInfo}>
                                        <Text style={styles.hospitalName}>{hospital.name}</Text>
                                        <Text style={styles.hospitalAddress}>{hospital.area}, {hospital.city}</Text>
                                    </View>
                                </View>
                            </Card>
                        );
                    })}
                </View>

                {/* Logout Button */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color={colors.error} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    profileCard: {
        marginHorizontal: 20,
        marginTop: 16,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.doctorPrimary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    specialization: {
        fontSize: 14,
        color: colors.doctorPrimary,
        fontWeight: '500',
        marginBottom: 6,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    experienceText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 4,
    },
    statsRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    settingCard: {
        padding: 0,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    settingIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    settingDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    availabilityCard: {
        padding: 0,
        overflow: 'hidden',
    },
    dayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dayRowActive: {
        backgroundColor: colors.doctorPrimary + '10',
    },
    dayText: {
        fontSize: 15,
        color: colors.textSecondary,
    },
    dayTextActive: {
        color: colors.doctorPrimary,
        fontWeight: '600',
    },
    dayCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCheckActive: {
        backgroundColor: colors.doctorPrimary,
        borderColor: colors.doctorPrimary,
    },
    hospitalCard: {
        marginBottom: 12,
    },
    hospitalRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hospitalIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.hospitalPrimary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    hospitalInfo: {
        flex: 1,
    },
    hospitalName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    hospitalAddress: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.errorLight,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        marginBottom: 32,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.error,
    },
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
});
