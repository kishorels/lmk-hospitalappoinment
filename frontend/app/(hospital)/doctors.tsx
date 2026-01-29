import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { Doctor } from '../../src/data/mockData';

export default function HospitalDoctors() {
    const { user } = useAuth();
    const {
        hospitals,
        getDoctorsByHospital,
        doctors: allDoctors,
        addDoctorToHospital,
        removeDoctorFromHospital,
    } = useData();

    const [showAvailable, setShowAvailable] = useState(false);

    const hospitalProfile = useMemo(() => {
        return hospitals.find(h => h.email === user?.email);
    }, [hospitals, user]);

    const hospitalDoctors = useMemo(() => {
        if (!hospitalProfile) return [];
        return getDoctorsByHospital(hospitalProfile.id);
    }, [hospitalProfile]);

    const availableDoctors = useMemo(() => {
        if (!hospitalProfile) return [];
        return allDoctors.filter(d => !d.hospitalIds.includes(hospitalProfile.id));
    }, [hospitalProfile, allDoctors]);

    const handleAddDoctor = async (doctorId: string) => {
        if (!hospitalProfile) return;
        try {
            await addDoctorToHospital(doctorId, hospitalProfile.id);
            Alert.alert('Success', 'Doctor added to hospital');
            setShowAvailable(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to add doctor');
        }
    };

    const handleRemoveDoctor = async (doctorId: string) => {
        if (!hospitalProfile) return;
        Alert.alert(
            'Remove Doctor',
            'Are you sure you want to remove this doctor from your hospital?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeDoctorFromHospital(doctorId, hospitalProfile.id);
                            Alert.alert('Success', 'Doctor removed from hospital');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove doctor');
                        }
                    }
                },
            ]
        );
    };

    const renderDoctor = ({ item }: { item: Doctor }) => (
        <Card style={styles.doctorCard}>
            <View style={styles.doctorRow}>
                <View style={styles.doctorAvatar}>
                    <Ionicons name="person" size={28} color={colors.doctorPrimary} />
                </View>
                <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{item.name}</Text>
                    <Text style={styles.doctorSpec}>{item.specialization}</Text>
                    <View style={styles.doctorMeta}>
                        <View style={styles.metaItem}>
                            <Ionicons name="star" size={14} color="#FFB800" />
                            <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="briefcase" size={14} color={colors.textLight} />
                            <Text style={styles.metaText}>{item.experience} yrs</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="cash" size={14} color={colors.textLight} />
                            <Text style={styles.metaText}>₹{item.consultationFee}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.doctorFooter}>
                {item.videoConsultation && (
                    <Badge text="Video Available" variant="success" />
                )}
                <View style={styles.footerRight}>
                    <Text style={styles.daysText}>
                        {item.availableDays.slice(0, 3).join(', ')}
                        {item.availableDays.length > 3 && '...'}
                    </Text>
                </View>
            </View>

            {!showAvailable && (
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveDoctor(item.id)}
                >
                    <Ionicons name="close-circle" size={18} color={colors.error} />
                    <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
            )}

            {showAvailable && (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddDoctor(item.id)}
                >
                    <Ionicons name="add-circle" size={18} color="#FFF" />
                    <Text style={styles.addButtonText}>Add to Hospital</Text>
                </TouchableOpacity>
            )}
        </Card>
    );

    const currentList = showAvailable ? availableDoctors : hospitalDoctors;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Doctors</Text>
                <Text style={styles.subtitle}>
                    {showAvailable
                        ? `${availableDoctors.length} available doctors`
                        : `${hospitalDoctors.length} doctors in your hospital`
                    }
                </Text>
            </View>

            {/* Toggle Tabs */}
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.toggleTab, !showAvailable && styles.toggleTabActive]}
                    onPress={() => setShowAvailable(false)}
                >
                    <Ionicons
                        name="people"
                        size={18}
                        color={!showAvailable ? '#FFF' : colors.textSecondary}
                    />
                    <Text style={[styles.toggleText, !showAvailable && styles.toggleTextActive]}>
                        Our Doctors
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleTab, showAvailable && styles.toggleTabActive]}
                    onPress={() => setShowAvailable(true)}
                >
                    <Ionicons
                        name="add-circle"
                        size={18}
                        color={showAvailable ? '#FFF' : colors.textSecondary}
                    />
                    <Text style={[styles.toggleText, showAvailable && styles.toggleTextActive]}>
                        Add Doctors
                    </Text>
                </TouchableOpacity>
            </View>

            {currentList.length > 0 ? (
                <FlatList
                    data={currentList}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDoctor}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons
                        name={showAvailable ? 'search' : 'medkit-outline'}
                        size={64}
                        color={colors.textLight}
                    />
                    <Text style={styles.emptyTitle}>
                        {showAvailable ? 'No available doctors' : 'No doctors yet'}
                    </Text>
                    <Text style={styles.emptyText}>
                        {showAvailable
                            ? 'All doctors are already added to your hospital'
                            : 'Add doctors to your hospital to get started'
                        }
                    </Text>
                    {!showAvailable && (
                        <Button
                            title="Add Doctors"
                            onPress={() => setShowAvailable(true)}
                            style={styles.addDoctorBtn}
                        />
                    )}
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
    toggleContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    toggleTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: colors.surface,
        gap: 8,
    },
    toggleTabActive: {
        backgroundColor: colors.hospitalPrimary,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    toggleTextActive: {
        color: '#FFF',
    },
    listContent: {
        padding: 20,
    },
    doctorCard: {
        marginBottom: 16,
    },
    doctorRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    doctorAvatar: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: colors.doctorPrimary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    doctorSpec: {
        fontSize: 14,
        color: colors.doctorPrimary,
        marginBottom: 6,
    },
    doctorMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    doctorFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    daysText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.errorLight,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 12,
        gap: 6,
    },
    removeButtonText: {
        color: colors.error,
        fontWeight: '600',
        fontSize: 14,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.hospitalPrimary,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 12,
        gap: 6,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
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
        marginBottom: 24,
    },
    addDoctorBtn: {
        backgroundColor: colors.hospitalPrimary,
    },
});
