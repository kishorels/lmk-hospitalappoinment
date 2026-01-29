import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Badge, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { Query } from '../../src/data/mockData';

export default function DoctorQueries() {
    const { user } = useAuth();
    const { getQueriesByDoctor, replyToQuery, doctors } = useData();

    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState<'all' | 'unanswered' | 'answered'>('all');

    const doctorProfile = useMemo(() => {
        return doctors.find(d => d.email === user?.email);
    }, [doctors, user]);

    const queries = useMemo(() => {
        if (!doctorProfile) return [];
        const allQueries = getQueriesByDoctor(doctorProfile.id);
        if (filter === 'all') return allQueries;
        if (filter === 'unanswered') return allQueries.filter(q => !q.reply);
        return allQueries.filter(q => q.reply);
    }, [doctorProfile, filter]);

    const handleReply = async () => {
        if (!selectedQuery || !replyText.trim()) {
            Alert.alert('Error', 'Please enter a reply');
            return;
        }

        try {
            await replyToQuery(selectedQuery.id, replyText.trim());
            Alert.alert('Success', 'Reply sent successfully!');
            setSelectedQuery(null);
            setReplyText('');
        } catch (error) {
            Alert.alert('Error', 'Failed to send reply');
        }
    };

    const renderQuery = ({ item }: { item: Query }) => (
        <Card style={styles.queryCard}>
            <View style={styles.queryHeader}>
                <Badge
                    text={item.reply ? 'ANSWERED' : 'PENDING'}
                    variant={item.reply ? 'success' : 'warning'}
                />
                <Text style={styles.queryDate}>
                    {format(new Date(item.createdAt), 'MMM d, yyyy')}
                </Text>
            </View>

            <Text style={styles.queryLabel}>Patient's Question:</Text>
            <Text style={styles.queryMessage}>{item.message}</Text>

            {item.reply ? (
                <View style={styles.replySection}>
                    <Text style={styles.replyLabel}>Your Reply:</Text>
                    <Text style={styles.replyText}>{item.reply}</Text>
                    <Text style={styles.replyDate}>
                        Replied on {format(new Date(item.repliedAt!), 'MMM d, yyyy')}
                    </Text>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.replyButton}
                    onPress={() => setSelectedQuery(item)}
                >
                    <Ionicons name="chatbubble" size={18} color="#FFF" />
                    <Text style={styles.replyButtonText}>Reply</Text>
                </TouchableOpacity>
            )}
        </Card>
    );

    const filters = [
        { label: 'All', value: 'all' },
        { label: 'Unanswered', value: 'unanswered' },
        { label: 'Answered', value: 'answered' },
    ] as const;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Patient Queries</Text>
                <Text style={styles.subtitle}>{queries.length} queries</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {filters.map((f) => (
                    <TouchableOpacity
                        key={f.value}
                        style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
                        onPress={() => setFilter(f.value)}
                    >
                        <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {queries.length > 0 ? (
                <FlatList
                    data={queries}
                    keyExtractor={(item) => item.id}
                    renderItem={renderQuery}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={64} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>No queries</Text>
                    <Text style={styles.emptyText}>
                        {filter === 'all' ? 'No patient queries yet' : `No ${filter} queries`}
                    </Text>
                </View>
            )}

            {/* Reply Modal */}
            {selectedQuery && (
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reply to Query</Text>
                            <TouchableOpacity onPress={() => setSelectedQuery(null)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>Patient's Question:</Text>
                        <Text style={styles.modalQuestion}>{selectedQuery.message}</Text>

                        <Text style={styles.modalLabel}>Your Reply:</Text>
                        <TextInput
                            style={styles.replyInput}
                            placeholder="Type your reply here..."
                            placeholderTextColor={colors.textLight}
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setSelectedQuery(null);
                                    setReplyText('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleReply}
                            >
                                <Ionicons name="send" size={18} color="#FFF" />
                                <Text style={styles.sendButtonText}>Send Reply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
    },
    filterTabActive: {
        backgroundColor: colors.doctorPrimary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: '#FFF',
    },
    listContent: {
        padding: 20,
    },
    queryCard: {
        marginBottom: 16,
    },
    queryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    queryDate: {
        fontSize: 12,
        color: colors.textLight,
    },
    queryLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    queryMessage: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
    },
    replySection: {
        marginTop: 16,
        backgroundColor: colors.secondaryLight,
        padding: 12,
        borderRadius: 10,
    },
    replyLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.secondaryDark,
        marginBottom: 4,
    },
    replyText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
    },
    replyDate: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 8,
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.doctorPrimary,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 16,
        gap: 6,
    },
    replyButtonText: {
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
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    modalLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 6,
    },
    modalQuestion: {
        fontSize: 15,
        color: colors.text,
        backgroundColor: colors.background,
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    replyInput: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: colors.text,
        minHeight: 120,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.background,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 16,
    },
    sendButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.doctorPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    sendButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
