import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData, Appointment } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected' | 'completed';

export default function DoctorAppointments() {
    const { user } = useAuth();
    const {
        appointments,
        getDoctorAppointments,
        updateAppointmentStatus,
        doctors,
        getHospitalById
    } = useData();

    const [filter, setFilter] = useState<FilterType>('all');
    const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
    const [suggestedDate, setSuggestedDate] = useState('');
    const [suggestedTime, setSuggestedTime] = useState('');
    const [doctorNote, setDoctorNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const doctorProfile = useMemo(() => {
        return doctors.find(d => d.email === user?.email);
    }, [doctors, user]);

    useEffect(() => {
        if (doctorProfile) {
            getDoctorAppointments(doctorProfile.id);
        }
    }, [doctorProfile]);

    const filteredAppointments = useMemo(() => {
        if (filter === 'all') return appointments;
        return appointments.filter((a: Appointment) => a.status === filter);
    }, [appointments, filter]);

    const handleStatusUpdate = async (appointmentId: string, status: 'accepted' | 'rejected') => {
        if (status === 'rejected') {
            setSelectedAptId(appointmentId);
            setRescheduleModalVisible(true);
            return;
        }

        try {
            await updateAppointmentStatus(appointmentId, status);
            Alert.alert('Success', `Appointment ${status}!`);
        } catch (error) {
            Alert.alert('Error', 'Failed to update appointment status');
        }
    };

    const handleRescheduleSubmit = async () => {
        if (!selectedAptId) return;

        setIsUpdating(true);
        try {
            await updateAppointmentStatus(selectedAptId, 'rejected', {
                date: suggestedDate,
                time: suggestedTime,
                note: doctorNote || "Sorry, I can't make it at that time. Would this new time work for you?"
            });
            Alert.alert('Success', 'Reschedule suggestion sent to user');
            setRescheduleModalVisible(false);
            setSuggestedDate('');
            setSuggestedTime('');
            setDoctorNote('');
            setSelectedAptId(null);
        } catch (error) {
            Alert.alert('Error', 'Failed to send reschedule suggestion');
        } finally {
            setIsUpdating(false);
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
        const hospital = item.hospital_id ? getHospitalById(item.hospital_id) : null;
        return (
            <Card style={styles.appointmentCard}>
                <View style={styles.cardHeader}>
                    <Badge text={item.status.toUpperCase()} variant={getStatusVariant(item.status)} />
                    <Badge text={item.type === 'video' ? 'Video' : 'In-Person'} variant="info" />
                </View>

                <View style={styles.patientRow}>
                    <View style={styles.patientAvatar}>
                        <Ionicons name="person" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{item.user_name}</Text>
                        {item.reason && <Text style={styles.reasonText}>{item.reason}</Text>}
                    </View>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={18} color={colors.textLight} />
                        <Text style={styles.detailText}>{format(new Date(item.date), 'EEEE, MMM d, yyyy')}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Ionicons name="time" size={18} color={colors.textLight} />
                        <Text style={styles.detailText}>{item.time_slot}</Text>
                    </View>
                </View>

                {item.status === 'pending' && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleStatusUpdate(item.id, 'accepted')}>
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                            <Text style={styles.actionBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleStatusUpdate(item.id, 'rejected')}>
                            <Ionicons name="close" size={20} color="#FFF" />
                            <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Appointments</Text>
                <Text style={styles.subtitle}>{filteredAppointments.length} total</Text>
            </View>

            <View style={styles.filterContainer}>
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
                        onPress={() => setFilter(f.value)}
                    >
                        <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {filteredAppointments.length > 0 ? (
                <FlatList
                    data={filteredAppointments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAppointment}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>No appointments</Text>
                </View>
            )}

            <Modal visible={rescheduleModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reject & Reschedule</Text>
                            <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                            <Text style={styles.modalSubtitle}>Suggest a better time for the patient.</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Suggested Date</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datePickerScroll} contentContainerStyle={styles.datePickerContent}>
                                    {Array.from({ length: 14 }).map((_, i) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + i);
                                        const dateStr = format(date, 'yyyy-MM-dd');
                                        const dayName = format(date, 'EEE');
                                        const dayNum = format(date, 'd');
                                        const isActive = suggestedDate === dateStr;
                                        return (
                                            <TouchableOpacity key={i} style={[styles.dateChip, isActive && styles.dateChipActive]} onPress={() => setSuggestedDate(dateStr)}>
                                                <Text style={[styles.dayName, isActive && styles.activeTabText]}>{dayName}</Text>
                                                <Text style={[styles.dayNum, isActive && styles.activeTabText]}>{dayNum}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                                <TextInput style={styles.textInput} value={suggestedDate} onChangeText={setSuggestedDate} placeholder="YYYY-MM-DD" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Suggested Time</Text>
                                <View style={styles.quickOptions}>
                                    {['09:00 AM', '10:30 AM', '12:00 PM', '02:30 PM', '04:00 PM', '06:30 PM'].map((time) => {
                                        const isActive = suggestedTime === time;
                                        return (
                                            <TouchableOpacity key={time} style={[styles.quickBtn, isActive && styles.quickBtnActive]} onPress={() => setSuggestedTime(time)}>
                                                <Text style={[styles.quickBtnText, isActive && styles.quickBtnTextActive]}>{time}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <TextInput style={styles.textInput} value={suggestedTime} onChangeText={setSuggestedTime} placeholder="HH:MM AM/PM" />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Message</Text>
                                <TextInput style={[styles.textInput, styles.textArea]} value={doctorNote} onChangeText={setDoctorNote} multiline={true} numberOfLines={4} />
                            </View>
                            <Button title={isUpdating ? 'Sending...' : 'Send Request'} onPress={handleRescheduleSubmit} disabled={isUpdating} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: colors.textSecondary },
    filterContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 10 },
    filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface },
    filterTabActive: { backgroundColor: colors.doctorPrimary },
    filterText: { fontSize: 13, color: colors.textSecondary },
    filterTextActive: { color: '#FFF' },
    listContent: { padding: 20 },
    appointmentCard: { marginBottom: 16 },
    cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    patientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    patientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    patientName: { fontSize: 16, fontWeight: '600' },
    reasonText: { fontSize: 13, color: colors.textSecondary },
    detailsContainer: { backgroundColor: colors.background, padding: 12, borderRadius: 12, gap: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 14 },
    actionButtons: { flexDirection: 'row', gap: 12, marginTop: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    acceptBtn: { backgroundColor: colors.success },
    rejectBtn: { backgroundColor: colors.error },
    actionBtnText: { color: '#FFF', fontWeight: '600' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: 18, color: colors.textSecondary, marginTop: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalScroll: { flexGrow: 0 },
    modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    textInput: { backgroundColor: colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    datePickerScroll: { marginBottom: 12 },
    datePickerContent: { gap: 10, paddingRight: 20 },
    dateChip: { width: 55, height: 70, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    dateChipActive: { backgroundColor: colors.doctorPrimary, borderColor: colors.doctorPrimary },
    dayName: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
    dayNum: { fontSize: 18, fontWeight: 'bold' },
    activeTabText: { color: '#FFF' },
    quickOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    quickBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    quickBtnActive: { backgroundColor: colors.doctorPrimary, borderColor: colors.doctorPrimary },
    quickBtnText: { fontSize: 12, color: colors.textSecondary },
    quickBtnTextActive: { color: '#FFF' },
});
