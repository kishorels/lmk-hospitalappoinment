import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData, Appointment } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

type FilterType = 'all' | 'pending' | 'accepted' | 'paid' | 'rejected' | 'completed';

export default function DoctorAppointments() {
    const router = useRouter();
    const { user } = useAuth();
    const {
        appointments,
        getDoctorAppointments,
        updateAppointmentStatus,
        updateAppointmentRecord,
        doctors
    } = useData();

    const [filter, setFilter] = useState<FilterType>('all');
    const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
    const [suggestedDate, setSuggestedDate] = useState('');
    const [suggestedTime, setSuggestedTime] = useState('');
    const [doctorNote, setDoctorNote] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [recordModalVisible, setRecordModalVisible] = useState(false);
    const [recordAppointmentId, setRecordAppointmentId] = useState<string | null>(null);
    const [patientComplaint, setPatientComplaint] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [recordNotes, setRecordNotes] = useState('');
    const [medName, setMedName] = useState('');
    const [medDosage, setMedDosage] = useState('');
    const [medInstructions, setMedInstructions] = useState('');
    const [medDays, setMedDays] = useState('');
    const [prescription, setPrescription] = useState<{ name: string; dosage?: string; instructions?: string; days?: number }[]>([]);

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

    const handleStatusUpdate = useCallback(async (appointmentId: string, status: 'accepted' | 'rejected' | 'completed') => {
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
    }, [updateAppointmentStatus]);

    // ... lines 73-164 ...



    // ... keyExtractor ...

    // ... render return ...
    // Note: I am NOT replacing the whole render return, just the helper functions and renderAppointment usage.
    // However, I need to be careful with the Replace tool. It works on blocks.

    // I will target the block from handleStatusUpdate down to renderAppointment.
    // But that includes a lot of unchanged code.

    // Let's do multiple replacements.
    // 1. handleStatusUpdate
    // 2. renderAppointment and callbacks
    // 3. AppointmentCard component definition and return.

    // I will start with handleStatusUpdate signature change.
    // Actually, I can replace the whole functional component body if I am careful.
    // Or just chunks.

    // Chunk 1: handleStatusUpdate
    // Chunk 2: handleComplete + renderAppointment
    // Chunk 3: AppointmentCard props and JSX
    // Chunk 4: Styles


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

    const openRecordModal = useCallback((appointment: Appointment) => {
        setRecordAppointmentId(appointment.id);
        setPatientComplaint(appointment.patient_complaint || '');
        setDiagnosis(appointment.diagnosis || '');
        setRecordNotes(appointment.record_notes || '');
        setPrescription(appointment.prescription || []);
        setRecordModalVisible(true);
    }, []);

    const addMedicine = () => {
        if (!medName.trim()) return;
        setPrescription(prev => [
            ...prev,
            {
                name: medName.trim(),
                dosage: medDosage.trim() || undefined,
                instructions: medInstructions.trim() || undefined,
                days: medDays ? parseInt(medDays) : undefined,
            },
        ]);
        setMedName('');
        setMedDosage('');
        setMedInstructions('');
        setMedDays('');
    };

    const removeMedicine = (index: number) => {
        setPrescription(prev => prev.filter((_, i) => i !== index));
    };

    const saveRecord = async () => {
        if (!recordAppointmentId || !doctorProfile?.id) return;
        setIsUpdating(true);
        const updated = await updateAppointmentRecord(recordAppointmentId, {
            doctor_id: doctorProfile.id,
            patient_complaint: patientComplaint,
            diagnosis,
            record_notes: recordNotes,
            prescription,
        });
        setIsUpdating(false);
        if (updated) {
            Alert.alert('Saved', 'Patient record updated.');
            setRecordModalVisible(false);
        } else {
            Alert.alert('Error', 'Failed to save record.');
        }
    };

    const getStatusVariant = useCallback((status: Appointment['status']) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'accepted': return 'warning';
            case 'paid': return 'success';
            case 'rejected': return 'error';
            case 'completed': return 'info';
            default: return 'default';
        }
    }, []);

    const filters: { label: string; value: FilterType }[] = [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Paid', value: 'paid' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Completed', value: 'completed' },
    ];

    const handleAccept = useCallback((id: string) => handleStatusUpdate(id, 'accepted'), [handleStatusUpdate]);
    const handleReject = useCallback((id: string) => handleStatusUpdate(id, 'rejected'), [handleStatusUpdate]);
    const handleComplete = useCallback((id: string) => {
        Alert.alert(
            'Complete Appointment',
            'Are you sure you want to mark this appointment as completed?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes, Complete', onPress: () => handleStatusUpdate(id, 'completed') }
            ]
        );
    }, [handleStatusUpdate]);

    const renderAppointment = useCallback(({ item }: { item: Appointment }) => (
        <AppointmentCard
            item={item}
            onAccept={handleAccept}
            onReject={handleReject}
            onComplete={handleComplete}
            onOpenRecord={openRecordModal}
            getStatusVariant={getStatusVariant}
        />
    ), [handleAccept, handleReject, handleComplete, openRecordModal, getStatusVariant]);

    const keyExtractor = useCallback((item: Appointment) => item.id, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Appointments</Text>
                    <Text style={styles.subtitle}>{filteredAppointments.length} total</Text>
                </View>
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
                    keyExtractor={keyExtractor}
                    renderItem={renderAppointment}
                    contentContainerStyle={styles.listContent}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={7}
                    removeClippedSubviews
                    updateCellsBatchingPeriod={50}
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

            <Modal visible={recordModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Patient Record</Text>
                            <TouchableOpacity onPress={() => setRecordModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Patient Complaint</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={patientComplaint}
                                    onChangeText={setPatientComplaint}
                                    placeholder="What patient reported..."
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Diagnosis</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={diagnosis}
                                    onChangeText={setDiagnosis}
                                    placeholder="Your diagnosis"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Notes</Text>
                                <TextInput
                                    style={[styles.textInput, styles.textArea]}
                                    value={recordNotes}
                                    onChangeText={setRecordNotes}
                                    placeholder="Additional notes"
                                    multiline
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Prescription</Text>
                                <View style={styles.medicineRow}>
                                    <TextInput
                                        style={[styles.textInput, styles.medInput]}
                                        value={medName}
                                        onChangeText={setMedName}
                                        placeholder="Medicine name"
                                    />
                                    <TextInput
                                        style={[styles.textInput, styles.medInput]}
                                        value={medDosage}
                                        onChangeText={setMedDosage}
                                        placeholder="Dosage"
                                    />
                                </View>
                                <View style={styles.medicineRow}>
                                    <TextInput
                                        style={[styles.textInput, styles.medInput]}
                                        value={medInstructions}
                                        onChangeText={setMedInstructions}
                                        placeholder="Instructions"
                                    />
                                    <TextInput
                                        style={[styles.textInput, styles.medInput]}
                                        value={medDays}
                                        onChangeText={setMedDays}
                                        placeholder="Days"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <TouchableOpacity style={styles.addMedBtn} onPress={addMedicine}>
                                    <Ionicons name="add-circle" size={18} color="#FFF" />
                                    <Text style={styles.addMedText}>Add Medicine</Text>
                                </TouchableOpacity>

                                {prescription.map((m, idx) => (
                                    <View key={`${m.name}-${idx}`} style={styles.prescriptionItem}>
                                        <View style={styles.prescriptionInfo}>
                                            <Text style={styles.prescriptionName}>{m.name}</Text>
                                            <Text style={styles.prescriptionMeta}>
                                                {m.dosage || 'Dose'} • {m.instructions || 'Instructions'} • {m.days ? `${m.days} days` : 'Days'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeMedicine(idx)}>
                                            <Ionicons name="trash" size={18} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <Button
                                title={isUpdating ? 'Saving...' : 'Save Record'}
                                onPress={saveRecord}
                                disabled={isUpdating}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const AppointmentCard = React.memo(({
    item,
    onAccept,
    onReject,
    onComplete,
    onOpenRecord,
    getStatusVariant,
}: {
    item: Appointment;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onComplete: (id: string) => void;
    onOpenRecord: (appointment: Appointment) => void;
    getStatusVariant: (status: Appointment['status']) => 'success' | 'warning' | 'error' | 'info' | 'default';
}) => {
    const router = useRouter();

    // Get display label for status
    const getStatusLabel = (status: Appointment['status']) => {
        switch (status) {
            case 'accepted': return 'AWAITING PAYMENT';
            case 'paid': return 'PAID';
            default: return status.toUpperCase();
        }
    };

    return (
        <Card style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
                <Badge text={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} />
                <Badge text={item.type === 'video' ? 'Video' : 'In-Person'} variant="info" />
                {item.payment_status === 'paid' && (
                    <Badge text={`₹${item.payment_amount || 0}`} variant="success" />
                )}
            </View>

            <View style={styles.patientRow}>
                <View style={styles.patientAvatar}>
                    <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.patientInfoWrapper}>
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
                    <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => onAccept(item.id)}>
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                        <Text style={styles.actionBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => onReject(item.id)}>
                        <Ionicons name="close" size={20} color="#FFF" />
                        <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Show waiting for payment message when accepted but not paid */}
            {item.status === 'accepted' && (
                <View style={styles.waitingPaymentContainer}>
                    <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.waitingPaymentText}>Waiting for patient payment</Text>
                </View>
            )}

            {/* Show actions only when paid or completed */}
            {(item.status === 'paid' || item.status === 'completed') && (
                <View style={[styles.cardFooterActions, { flexDirection: 'column' }]}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {item.type === 'video' && item.status === 'paid' && (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.joinBtn]}
                                onPress={() => router.push({
                                    pathname: '/video-call',
                                    params: {
                                        appointmentId: item.id,
                                        patientName: item.user_name,
                                    }
                                })}
                            >
                                <Ionicons name="videocam" size={20} color="#FFF" />
                                <Text style={styles.actionBtnText}>Join Call</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.recordBtn} onPress={() => onOpenRecord(item)}>
                            <Ionicons name="document-text" size={18} color="#FFF" />
                            <Text style={styles.recordBtnText}>Add Record</Text>
                        </TouchableOpacity>
                    </View>

                    {item.status === 'paid' && (
                        <TouchableOpacity style={styles.completeBtn} onPress={() => onComplete(item.id)}>
                            <Text style={styles.completeBtnText}>Mark as Completed</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </Card>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: { fontSize: 20, fontWeight: '700', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
        backgroundColor: colors.surface,
    },
    filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    filterTabActive: { backgroundColor: colors.doctorPrimary, borderColor: colors.doctorPrimary },
    filterText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    filterTextActive: { color: '#FFF' },
    listContent: { padding: 20, paddingTop: 16 },
    appointmentCard: { marginBottom: 16 },
    cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    patientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    patientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    patientInfoWrapper: { flex: 1 },
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
    recordBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary },
    recordBtnText: { color: '#FFF', fontWeight: '700' },
    cardFooterActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    joinBtn: { backgroundColor: colors.secondary || '#10B981', flex: 1 },
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
    medicineRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    medInput: { flex: 1 },
    addMedBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginTop: 10, alignSelf: 'flex-start' },
    addMedText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
    prescriptionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    prescriptionInfo: { flex: 1, marginRight: 12 },
    prescriptionName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
    prescriptionMeta: { fontSize: 12, color: colors.textSecondary },
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
    waitingPaymentContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.background, padding: 12, borderRadius: 10, marginTop: 12 },
    waitingPaymentText: { fontSize: 13, color: colors.textSecondary },
    completeBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
    completeBtnText: { color: colors.primary, fontWeight: '600' },
});
