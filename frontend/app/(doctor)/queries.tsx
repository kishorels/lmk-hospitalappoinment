import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';

export default function DoctorQueries() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Patient Queries</Text>
            </View>

            <View style={styles.emptyState}>
                <View style={styles.iconContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>Coming Soon</Text>
                <Text style={styles.emptyText}>
                    Patient query feature will be available in a future update
                </Text>
            </View>
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
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
    },
});
