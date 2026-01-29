import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function HospitalProfile() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { hospitals, updateHospital, getDoctorsByHospital, appointments } = useData();

    const hospitalProfile = useMemo(() => {
        return hospitals.find(h => h.email === user?.email);
    }, [hospitals, user]);

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: hospitalProfile?.name || '',
        address: hospitalProfile?.address || '',
        contact: hospitalProfile?.contact || '',
    });

    const doctorCount = useMemo(() => {
        if (!hospitalProfile) return 0;
        return getDoctorsByHospital(hospitalProfile.id).length;
    }, [hospitalProfile]);

    const appointmentCount = useMemo(() => {
        if (!hospitalProfile) return 0;
        return appointments.filter(a => a.hospitalId === hospitalProfile.id).length;
    }, [hospitalProfile, appointments]);

    const handleSave = async () => {
        if (!hospitalProfile) return;
        try {
            await updateHospital(hospitalProfile.id, editData);
            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        }
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

    if (!hospitalProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorState}>
                    <Text style={styles.errorText}>Hospital profile not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Hospital Profile</Text>
                    {!isEditing && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => setIsEditing(true)}
                        >
                            <Ionicons name="create-outline" size={20} color={colors.hospitalPrimary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatar}>
                            <Ionicons name="business" size={40} color={colors.hospitalPrimary} />
                        </View>
                        <View style={styles.profileInfo}>
                            {isEditing ? (
                                <TextInput
                                    style={styles.editInput}
                                    value={editData.name}
                                    onChangeText={(text) => setEditData({ ...editData, name: text })}
                                    placeholder="Hospital Name"
                                />
                            ) : (
                                <Text style={styles.hospitalName}>{hospitalProfile.name}</Text>
                            )}
                            <Text style={styles.location}>{hospitalProfile.area}, {hospitalProfile.city}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={16} color="#FFB800" />
                                <Text style={styles.ratingText}>{hospitalProfile.rating.toFixed(1)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{doctorCount}</Text>
                            <Text style={styles.statLabel}>Doctors</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{appointmentCount}</Text>
                            <Text style={styles.statLabel}>Appointments</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{hospitalProfile.departments.length}</Text>
                            <Text style={styles.statLabel}>Departments</Text>
                        </View>
                    </View>
                </Card>

                {/* Contact Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>

                    <Card style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
                                <Ionicons name="location" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Address</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.editInputSmall}
                                        value={editData.address}
                                        onChangeText={(text) => setEditData({ ...editData, address: text })}
                                        placeholder="Address"
                                    />
                                ) : (
                                    <Text style={styles.infoValue}>{hospitalProfile.address}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: colors.success + '20' }]}>
                                <Ionicons name="call" size={20} color={colors.success} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Phone</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.editInputSmall}
                                        value={editData.contact}
                                        onChangeText={(text) => setEditData({ ...editData, contact: text })}
                                        placeholder="Contact Number"
                                        keyboardType="phone-pad"
                                    />
                                ) : (
                                    <Text style={styles.infoValue}>{hospitalProfile.contact}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={[styles.infoIcon, { backgroundColor: colors.info + '20' }]}>
                                <Ionicons name="mail" size={20} color={colors.info} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{hospitalProfile.email}</Text>
                            </View>
                        </View>
                    </Card>
                </View>

                {/* Departments */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Departments</Text>
                    <View style={styles.deptGrid}>
                        {hospitalProfile.departments.map((dept, index) => (
                            <View key={index} style={styles.deptChip}>
                                <Text style={styles.deptChipText}>{dept}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Action Buttons */}
                {isEditing ? (
                    <View style={styles.editActions}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setIsEditing(false);
                                setEditData({
                                    name: hospitalProfile.name,
                                    address: hospitalProfile.address,
                                    contact: hospitalProfile.contact,
                                });
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={22} color={colors.error} />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    editButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.hospitalPrimary + '20',
        justifyContent: 'center',
        alignItems: 'center',
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
        backgroundColor: colors.hospitalPrimary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    hospitalName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    location: {
        fontSize: 14,
        color: colors.hospitalPrimary,
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
    infoCard: {
        padding: 0,
        overflow: 'hidden',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    infoIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: colors.text,
    },
    deptGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    deptChip: {
        backgroundColor: colors.hospitalPrimary + '15',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    deptChipText: {
        fontSize: 13,
        color: colors.hospitalPrimary,
        fontWeight: '500',
    },
    editInput: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        borderBottomWidth: 2,
        borderBottomColor: colors.hospitalPrimary,
        paddingBottom: 4,
        marginBottom: 4,
    },
    editInputSmall: {
        fontSize: 15,
        color: colors.text,
        borderBottomWidth: 1,
        borderBottomColor: colors.hospitalPrimary,
        paddingBottom: 2,
    },
    editActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginTop: 24,
        marginBottom: 32,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 16,
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.hospitalPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
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
