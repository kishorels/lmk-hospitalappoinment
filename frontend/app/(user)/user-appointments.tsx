import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData, Appointment, COMMISSION_RATE } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function Appointments() {
  const router = useRouter();
  const { user } = useAuth();
  const { appointments, getUserAppointments, getDoctorById, getHospitalById, processPayment } = useData();

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (user) {
      getUserAppointments(user.id);
    }
  }, [user]);

  const groupedAppointments = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    appointments.forEach((appt) => {
      const key = appt.doctor_id || appt.doctor_name || 'unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(appt);
    });
    const grouped = Array.from(groups.entries()).map(([doctorId, items]) => {
      const sorted = [...items].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return { doctorId, items: sorted };
    });
    grouped.sort((a, b) => {
      const aDate = a.items[0]?.date ? new Date(a.items[0].date).getTime() : 0;
      const bDate = b.items[0]?.date ? new Date(b.items[0].date).getTime() : 0;
      return bDate - aDate;
    });
    return grouped;
  }, [appointments]);

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'warning';
      case 'paid': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Appointment['status']) => {
    switch (status) {
      case 'accepted': return 'AWAITING PAYMENT';
      case 'paid': return 'PAID';
      default: return status.toUpperCase();
    }
  };

  const renderAppointment = ({ item }: { item: { doctorId: string; items: Appointment[] } }) => {
    const latest = item.items[0];
    const doctor = getDoctorById(latest?.doctor_id);

    return (
      <Card style={styles.appointmentCard}>
        <View style={styles.doctorRow}>
          <View style={styles.doctorAvatar}>
            <Ionicons name="person" size={24} color={colors.doctorPrimary} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{latest?.doctor_name}</Text>
            <Text style={styles.doctorSpec}>{doctor?.specialization || 'Specialist'}</Text>
            <Text style={styles.timelineCount}>{item.items.length} visits</Text>
          </View>
        </View>

        <View style={styles.timelineContainer}>
          {item.items.map((appt, index) => {
            const hospital = appt.hospital_id ? getHospitalById(appt.hospital_id) : null;
            const showLine = index < item.items.length - 1;
            return (
              <View key={appt.id} style={styles.timelineItem}>
                <View style={styles.timelineMarker}>
                  <View style={styles.timelineDot} />
                  {showLine && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={styles.timelineDate}>
                      {format(new Date(appt.date), 'MMM d, yyyy')} • {appt.time_slot}
                    </Text>
                    <Badge text={getStatusLabel(appt.status)} variant={getStatusVariant(appt.status)} />
                  </View>
                  <View style={styles.timelineMetaRow}>
                    <Badge text={appt.type === 'video' ? 'Video' : 'In-Person'} variant="info" />
                    {(hospital || appt.hospital_name) && (
                      <Text style={styles.timelineMetaText}>{hospital?.name || appt.hospital_name}</Text>
                    )}
                  </View>
                  {(appt.patient_complaint || appt.diagnosis || (appt.prescription && appt.prescription.length > 0) || appt.record_notes) && (
                    <View style={styles.recordSection}>
                      <Text style={styles.recordTitle}>Doctor Record</Text>
                      <Text style={styles.recordLabel}>Complaint</Text>
                      <Text style={styles.recordText}>{appt.patient_complaint || '—'}</Text>
                      <Text style={styles.recordLabel}>Diagnosis</Text>
                      <Text style={styles.recordText}>{appt.diagnosis || '—'}</Text>
                      <Text style={styles.recordLabel}>Notes</Text>
                      <Text style={styles.recordText}>{appt.record_notes || '—'}</Text>
                      <Text style={styles.recordLabel}>Prescription</Text>
                      {(appt.prescription && appt.prescription.length > 0) ? (
                        appt.prescription.map((med, idx) => (
                          <View key={`${appt.id}-med-${idx}`} style={styles.medRow}>
                            <Text style={styles.medName}>{med.name}</Text>
                            <Text style={styles.medMeta}>
                              {med.dosage || 'Dose'} • {med.instructions || 'Instructions'} • {med.days ? `${med.days} days` : 'Days'}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.recordText}>—</Text>
                      )}
                    </View>
                  )}
                  {appt.status === 'rejected' && appt.suggested_date && (
                    <View style={styles.rescheduleSection}>
                      <View style={styles.rescheduleHeader}>
                        <Ionicons name="chatbubble-ellipses" size={20} color={colors.doctorPrimary} />
                        <Text style={styles.rescheduleTitle}>Doctor&apos;s Suggestion</Text>
                      </View>
                      <Text style={styles.doctorNote}>&quot;{appt.doctor_note}&quot;</Text>
                      <View style={styles.suggestionBox}>
                        <Text style={styles.suggestionTitle}>New Suggested Time:</Text>
                        <View style={styles.suggestionRow}>
                          <Ionicons name="calendar-outline" size={16} color={colors.text} />
                          <Text style={styles.suggestionText}>{format(new Date(appt.suggested_date), 'MMM d, yyyy')}</Text>
                        </View>
                        <View style={styles.suggestionRow}>
                          <Ionicons name="time-outline" size={16} color={colors.text} />
                          <Text style={styles.suggestionText}>{appt.suggested_time}</Text>
                        </View>
                      </View>
                      <Button
                        title="Book Suggested Time"
                        size="small"
                        onPress={() => router.push({
                          pathname: '/(user)/booking',
                          params: {
                            doctorId: appt.doctor_id,
                            preselectDate: appt.suggested_date,
                            preselectTime: appt.suggested_time
                          }
                        })}
                        style={styles.bookSuggestedBtn}
                      />
                    </View>
                  )}
                  {/* Pay Now Button - Show when doctor accepted but not yet paid */}
                  {appt.status === 'accepted' && (
                    <TouchableOpacity
                      style={styles.payButton}
                      onPress={() => {
                        setSelectedAppt(appt);
                        setPaymentModalVisible(true);
                      }}
                    >
                      <Ionicons name="card" size={20} color="#FFF" />
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}
                  {/* Video Call Button - Show when paid for video appointments */}
                  {appt.type === 'video' && appt.status === 'paid' && (
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => router.push({
                        pathname: '/video-call',
                        params: {
                          appointmentId: appt.id,
                          doctorName: appt.doctor_name,
                        }
                      })}
                    >
                      <Ionicons name="videocam" size={20} color="#FFF" />
                      <Text style={styles.joinButtonText}>Join Video Call</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  const handleConfirmPayment = async () => {
    if (!selectedAppt || !user) return;

    setIsPaying(true);
    try {
      const doctor = getDoctorById(selectedAppt.doctor_id);
      const consultationFee = doctor?.consultation_fee || 500;
      const commissionFee = Math.round(consultationFee * (COMMISSION_RATE || 0.1));
      const totalAmount = consultationFee + commissionFee;

      const result = await processPayment(selectedAppt.id, user.id, totalAmount);
      if (result) {
        Alert.alert('Success', 'Payment processed successfully!');
        setPaymentModalVisible(false);
        setSelectedAppt(null);
      } else {
        Alert.alert('Error', 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsPaying(false);
    }
  };

  const renderPaymentModal = () => {
    if (!selectedAppt) return null;
    const doctor = getDoctorById(selectedAppt.doctor_id);
    const consultationFee = doctor?.consultation_fee || 500;
    const commissionFee = Math.round(consultationFee * (COMMISSION_RATE || 0.1));
    const totalAmount = consultationFee + commissionFee;

    return (
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.paymentSummary}>
                <View style={styles.paymentDoctorRow}>
                  <View style={styles.miniAvatar}>
                    <Ionicons name="person" size={20} color={colors.doctorPrimary} />
                  </View>
                  <View>
                    <Text style={styles.paymentDoctorName}>{selectedAppt.doctor_name}</Text>
                    <Text style={styles.paymentDateText}>
                      {format(new Date(selectedAppt.date), 'MMM d, yyyy')} • {selectedAppt.time_slot}
                    </Text>
                  </View>
                </View>

                <View style={styles.feeBreakdown}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Consultation Fee</Text>
                    <Text style={styles.feeValue}>₹{consultationFee}</Text>
                  </View>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Service Fee</Text>
                    <Text style={styles.feeValue}>₹{commissionFee}</Text>
                  </View>
                  <View style={[styles.feeRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{totalAmount}</Text>
                  </View>
                </View>

                <View style={styles.paymentMethodNotice}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                  <Text style={styles.noticeText}>Secure encrypted payment</Text>
                </View>
              </View>

              <Button
                title={isPaying ? "Processing..." : `Pay ₹${totalAmount}`}
                onPress={handleConfirmPayment}
                disabled={isPaying}
                style={styles.confirmPayButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Appointments</Text>
      </View>

      {groupedAppointments.length > 0 ? (
        <FlatList
          data={groupedAppointments}
          keyExtractor={(item) => item.doctorId}
          renderItem={renderAppointment}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={64} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No appointments yet</Text>
          <Text style={styles.emptyText}>
            Book your first appointment with a doctor
          </Text>
          <Button
            title="Find Doctors"
            onPress={() => router.push('/(user)/hospitals')}
            style={styles.findButton}
          />
        </View>
      )}
      {renderPaymentModal()}
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
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  listContent: {
    padding: 20,
  },
  appointmentCard: {
    marginBottom: 16,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.doctorPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  doctorSpec: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timelineCount: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  timelineContainer: {
    marginTop: 12,
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineMarker: {
    width: 18,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  timelineMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
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
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  recordSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 6,
  },
  recordText: {
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  medRow: {
    marginTop: 6,
  },
  medName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  medMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  findButton: {
    paddingHorizontal: 32,
  },
  rescheduleSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.doctorPrimary + '05',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.doctorPrimary + '20',
  },
  rescheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rescheduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.doctorPrimary,
  },
  doctorNote: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  suggestionBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bookSuggestedBtn: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  paymentSummary: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  paymentDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.doctorPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentDoctorName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  paymentDateText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  feeBreakdown: {
    gap: 10,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  paymentMethodNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  noticeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  confirmPayButton: {
    marginBottom: 20,
  },
});
