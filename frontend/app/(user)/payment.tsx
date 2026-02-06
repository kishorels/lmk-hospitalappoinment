import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData, COMMISSION_RATE } from '../../src/context/DataContext';
import { Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

export default function Payment() {
    const router = useRouter();
    const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
    const { user } = useAuth();
    const { appointments, getDoctorById, processPayment } = useData();

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(0));

    const appointment = appointments.find(a => a.id === appointmentId);
    const doctor = appointment ? getDoctorById(appointment.doctor_id) : null;

    // Calculate fees
    const consultationFee = doctor?.consultation_fee || 500;
    const commissionFee = Math.round(consultationFee * COMMISSION_RATE);
    const totalAmount = consultationFee + commissionFee;

    useEffect(() => {
        if (paymentSuccess) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
    }, [paymentSuccess]);

    const handlePayment = async () => {
        if (!user || !appointmentId) {
            Alert.alert('Error', 'Unable to process payment');
            return;
        }

        setIsProcessing(true);

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = await processPayment(appointmentId, user.id, totalAmount);

        if (result) {
            setPaymentSuccess(true);
        } else {
            Alert.alert('Payment Failed', 'Unable to process your payment. Please try again.');
        }

        setIsProcessing(false);
    };

    const handleDone = () => {
        router.replace('/(user)/user-appointments');
    };

    if (!appointment) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorState}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                    <Text style={styles.errorText}>Appointment not found</Text>
                    <Button title="Go Back" onPress={() => router.back()} variant="outline" />
                </View>
            </SafeAreaView>
        );
    }

    if (paymentSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successContainer}>
                    <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>
                        <View style={styles.successCircle}>
                            <Ionicons name="checkmark" size={64} color="#FFF" />
                        </View>
                    </Animated.View>

                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successSubtitle}>
                        Your appointment with {appointment.doctor_name} is confirmed.
                    </Text>

                    <View style={styles.receiptCard}>
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Transaction ID</Text>
                            <Text style={styles.receiptValue}>TXN{Date.now().toString().slice(-8)}</Text>
                        </View>
                        <View style={styles.receiptDivider} />
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Amount Paid</Text>
                            <Text style={styles.receiptAmount}>₹{totalAmount}</Text>
                        </View>
                        <View style={styles.receiptDivider} />
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Date</Text>
                            <Text style={styles.receiptValue}>{format(new Date(), 'MMM d, yyyy')}</Text>
                        </View>
                        <View style={styles.receiptDivider} />
                        <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Appointment</Text>
                            <Text style={styles.receiptValue}>
                                {format(new Date(appointment.date), 'MMM d')} • {appointment.time_slot}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.successNote}>
                        <Ionicons name="information-circle" size={20} color={colors.primary} />
                        <Text style={styles.successNoteText}>
                            You will receive a confirmation notification before your appointment
                        </Text>
                    </View>

                    <Button
                        title="View My Appointments"
                        onPress={handleDone}
                        size="large"
                        style={styles.doneButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payment</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Appointment Summary */}
                <View style={styles.appointmentCard}>
                    <View style={styles.appointmentHeader}>
                        <View style={styles.doctorAvatar}>
                            <Ionicons name="person" size={28} color={colors.primary} />
                        </View>
                        <View style={styles.appointmentInfo}>
                            <Text style={styles.doctorName}>{appointment.doctor_name}</Text>
                            <Text style={styles.doctorSpec}>{doctor?.specialization || 'Specialist'}</Text>
                        </View>
                    </View>

                    <View style={styles.appointmentDetails}>
                        <View style={styles.detailRow}>
                            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                            <Text style={styles.detailText}>
                                {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                            <Text style={styles.detailText}>{appointment.time_slot}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons
                                name={appointment.type === 'video' ? 'videocam-outline' : 'business-outline'}
                                size={18}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.detailText}>
                                {appointment.type === 'video' ? 'Video Consultation' : 'In-Person Visit'}
                            </Text>
                        </View>
                        {appointment.hospital_name && (
                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                                <Text style={styles.detailText}>{appointment.hospital_name}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Payment Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>

                    <View style={styles.paymentCard}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Consultation Fee</Text>
                            <Text style={styles.paymentValue}>₹{consultationFee}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Platform Fee</Text>
                            <Text style={styles.paymentValue}>₹{commissionFee}</Text>
                        </View>
                        <View style={styles.paymentDivider} />
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentTotalLabel}>Total Amount</Text>
                            <Text style={styles.paymentTotalValue}>₹{totalAmount}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

                    <TouchableOpacity style={[styles.methodCard, styles.methodCardActive]}>
                        <View style={styles.methodIcon}>
                            <Ionicons name="card" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodName}>Card / UPI / Net Banking</Text>
                            <Text style={styles.methodDesc}>Pay securely with any method</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Secure Payment Note */}
                <View style={styles.secureNote}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                    <Text style={styles.secureText}>
                        Your payment is secured with 256-bit SSL encryption
                    </Text>
                </View>

                {/* Pay Button */}
                <View style={styles.footer}>
                    <Button
                        title={isProcessing ? 'Processing...' : `Pay ₹${totalAmount}`}
                        onPress={handlePayment}
                        disabled={isProcessing}
                        size="large"
                    />
                </View>
            </ScrollView>

            {/* Processing Overlay */}
            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <View style={styles.processingCard}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.processingText}>Processing Payment...</Text>
                        <Text style={styles.processingSubtext}>Please do not close this screen</Text>
                    </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    appointmentCard: {
        backgroundColor: colors.surface,
        marginHorizontal: 20,
        marginTop: 8,
        padding: 20,
        borderRadius: 20,
    },
    appointmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    doctorAvatar: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    appointmentInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    doctorSpec: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 2,
    },
    appointmentDetails: {
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 12,
        gap: 10,
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
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    paymentCard: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    paymentDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    paymentTotalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    paymentTotalValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.primary,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 12,
    },
    methodCardActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '08',
    },
    methodIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodInfo: {
        flex: 1,
    },
    methodName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    methodDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    secureNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    secureText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        marginTop: 8,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingCard: {
        backgroundColor: colors.surface,
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        gap: 16,
        width: width - 80,
    },
    processingText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    processingSubtext: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    errorState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    successContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        alignItems: 'center',
    },
    successIcon: {
        marginBottom: 24,
    },
    successCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    receiptCard: {
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: 20,
        width: '100%',
        marginBottom: 16,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    receiptLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    receiptValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    receiptAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.success,
    },
    receiptDivider: {
        height: 1,
        backgroundColor: colors.border,
    },
    successNote: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.primary + '10',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    successNoteText: {
        fontSize: 13,
        color: colors.textSecondary,
        flex: 1,
    },
    doneButton: {
        width: '100%',
    },
});
