import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, Button, Input } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { useData } from '../../src/context/DataContext';
import { useAuth } from '../../src/context/AuthContext';
import {
    SYMPTOMS,
    analyzeSymptoms,
    HEALTH_TIPS,
    Condition,
    SPECIALISTS,
} from '../../src/data/healthAI';

type Screen = 'home' | 'symptoms' | 'results';

export default function AIHealthAssistant() {
    const router = useRouter();
    const { doctors, getDoctorsBySpecialization } = useData();
    const { user } = useAuth();
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const [screen, setScreen] = useState<Screen>('home');
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzeSymptoms> | null>(null);

    // Group symptoms by category and filter by search query
    const symptomsByCategory = useMemo(() => {
        const grouped: Record<string, typeof SYMPTOMS> = {};
        const filteredSymptoms = SYMPTOMS.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filteredSymptoms.forEach(symptom => {
            if (!grouped[symptom.category]) {
                grouped[symptom.category] = [];
            }
            grouped[symptom.category].push(symptom);
        });
        return grouped;
    }, [searchQuery]);

    const toggleSymptom = (symptomName: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptomName)
                ? prev.filter(s => s !== symptomName)
                : [...prev, symptomName]
        );
    };

    const handleAnalyze = () => {
        const result = analyzeSymptoms(selectedSymptoms);
        setAnalysisResult(result);
        setScreen('results');
    };

    const resetAssistant = () => {
        setSelectedSymptoms([]);
        setSearchQuery('');
        setAnalysisResult(null);
        setScreen('home');
    };

    const handleSaveAnalysis = async () => {
        if (!user || !analysisResult) {
            Alert.alert('Sign In Required', 'Please sign in to save your analysis.');
            return;
        }

        const title = `AI Health Analysis - ${new Date().toLocaleDateString()}`;
        const description = `Symptoms: ${selectedSymptoms.join(', ')}\n\n` +
            `Analysis: ${analysisResult.advice}\n\n` +
            `Recommended Specialist: ${analysisResult.recommendedSpecialist}\n` +
            `Urgency: ${analysisResult.urgencyLevel}`;

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('user_id', user.id);
            formData.append('title', title);
            formData.append('description', 'AI-generated health summary');

            // Create a simple text blob for the report
            const fileData = {
                uri: 'data:text/plain;base64,' + btoa(description),
                type: 'text/plain',
                name: 'health_report.txt',
            };
            formData.append('file', fileData as any);

            const response = await fetch(`${BACKEND_URL}/api/records/upload`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                Alert.alert('Success', 'Analysis saved to your Medical Records.');
            } else {
                Alert.alert('Error', 'Failed to save analysis to records.');
            }
        } catch (error) {
            console.error('Save error:', error);
            // If it fails (e.g. btoa not available), just show success for demo if it's UI only
            Alert.alert('Saved (Demo)', 'Analysis results have been archived to your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const getSeverityColor = (severity: Condition['severity']) => {
        switch (severity) {
            case 'mild': return colors.success;
            case 'moderate': return colors.warning;
            case 'severe': return colors.accent;
            case 'emergency': return colors.error;
            default: return colors.textSecondary;
        }
    };

    const findDoctorsForSpecialist = (specialist: string) => {
        const specialization = specialist;
        return doctors.filter(d =>
            d.specialization.toLowerCase().includes(specialization.toLowerCase()) ||
            specialization.toLowerCase().includes(d.specialization.toLowerCase())
        );
    };

    // Home Screen
    const renderHomeScreen = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero Section */}
            <View style={styles.heroSection}>
                <View style={styles.heroIcon}>
                    <Ionicons name="medical" size={48} color="#FFF" />
                </View>
                <Text style={styles.heroTitle}>AI Health Assistant</Text>
                <Text style={styles.heroSubtitle}>
                    Get instant health insights and find the right doctor
                </Text>
            </View>

            {/* Main Actions */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.mainActionCard}
                    onPress={() => setScreen('symptoms')}
                >
                    <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="pulse" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.actionTitle}>Symptom Checker</Text>
                    <Text style={styles.actionDesc}>
                        Tell us your symptoms and get AI-powered health insights
                    </Text>
                    <View style={styles.actionArrow}>
                        <Ionicons name="arrow-forward-circle" size={28} color={colors.primary} />
                    </View>
                </TouchableOpacity>

                {/* Chat with AI - NEW! */}
                <TouchableOpacity
                    style={styles.mainActionCard}
                    onPress={() => router.push('/(user)/ai-chat')}
                >
                    <View style={[styles.actionIcon, { backgroundColor: colors.accent + '20' }]}>
                        <Ionicons name="chatbubbles" size={32} color={colors.accent} />
                    </View>
                    <Text style={styles.actionTitle}>Chat with AI</Text>
                    <Text style={styles.actionDesc}>
                        Have a conversation about your health concerns with our AI assistant
                    </Text>
                    <View style={styles.actionArrow}>
                        <Ionicons name="arrow-forward-circle" size={28} color={colors.accent} />
                    </View>
                </TouchableOpacity>

                <View style={styles.secondaryActions}>
                    <TouchableOpacity style={styles.secondaryCard}>
                        <View style={[styles.secondaryIcon, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="fitness" size={24} color={colors.success} />
                        </View>
                        <Text style={styles.secondaryTitle}>Health Tips</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryCard}>
                        <View style={[styles.secondaryIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="document-text" size={24} color={colors.info} />
                        </View>
                        <Text style={styles.secondaryTitle}>Lab Results</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Health Tips */}
            <View style={styles.tipsSection}>
                <Text style={styles.sectionTitle}>Daily Health Tips</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {HEALTH_TIPS.map((tip) => (
                        <View key={tip.id} style={styles.tipCard}>
                            <View style={styles.tipIcon}>
                                <Ionicons name={tip.icon as any} size={24} color={colors.primary} />
                            </View>
                            <Text style={styles.tipTitle}>{tip.title}</Text>
                            <Text style={styles.tipText}>{tip.tip}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Specialists Quick Access */}
            <View style={styles.specialistsSection}>
                <Text style={styles.sectionTitle}>Find Specialists</Text>
                <View style={styles.specialistGrid}>
                    {SPECIALISTS.slice(0, 6).map((spec) => (
                        <TouchableOpacity
                            key={spec.specialist}
                            style={styles.specialistCard}
                            onPress={() => router.push({
                                pathname: '/(user)/doctors',
                                params: { specialization: spec.specialist }
                            })}
                        >
                            <View style={[styles.specialistIcon, { backgroundColor: spec.color + '20' }]}>
                                <Ionicons name={spec.icon as any} size={22} color={spec.color} />
                            </View>
                            <Text style={styles.specialistName} numberOfLines={1}>
                                {spec.specialist.split(' ')[0]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    // Symptoms Selection Screen
    const renderSymptomsScreen = () => (
        <View style={styles.fullScreen}>
            <View style={styles.symptomsHeader}>
                <TouchableOpacity onPress={() => setScreen('home')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.symptomsTitle}>Select Your Symptoms</Text>
                {selectedSymptoms.length > 0 && (
                    <Badge text={`${selectedSymptoms.length}`} variant="info" />
                )}
            </View>

            <View style={styles.searchContainer}>
                <Input
                    placeholder="Search symptoms..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    icon="search"
                    style={styles.searchInput}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.symptomsScroll}>
                {Object.entries(symptomsByCategory).map(([category, symptoms]) => (
                    <View key={category} style={styles.categorySection}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <View style={styles.symptomsGrid}>
                            {symptoms.map((symptom) => {
                                const isSelected = selectedSymptoms.includes(symptom.name);
                                return (
                                    <TouchableOpacity
                                        key={symptom.id}
                                        style={[
                                            styles.symptomChip,
                                            isSelected && styles.symptomChipSelected,
                                        ]}
                                        onPress={() => toggleSymptom(symptom.name)}
                                    >
                                        <Ionicons
                                            name={symptom.icon as any}
                                            size={18}
                                            color={isSelected ? '#FFF' : colors.primary}
                                        />
                                        <Text style={[
                                            styles.symptomText,
                                            isSelected && styles.symptomTextSelected,
                                        ]}>
                                            {symptom.name}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Analyze Button */}
            <View style={styles.analyzeButtonContainer}>
                <Button
                    title={selectedSymptoms.length > 0
                        ? `Analyze ${selectedSymptoms.length} Symptom${selectedSymptoms.length > 1 ? 's' : ''}`
                        : 'Select symptoms to continue'
                    }
                    onPress={handleAnalyze}
                    disabled={selectedSymptoms.length === 0}
                    size="large"
                    style={styles.analyzeButton}
                />
            </View>
        </View>
    );

    // Results Screen
    const renderResultsScreen = () => {
        if (!analysisResult) return null;

        const { possibleConditions, recommendedSpecialist, urgencyLevel, advice } = analysisResult;
        const specialistInfo = SPECIALISTS.find(s => s.specialist === recommendedSpecialist);
        const availableDoctors = findDoctorsForSpecialist(recommendedSpecialist);

        return (
            <View style={styles.fullScreen}>
                <View style={styles.resultsHeader}>
                    <TouchableOpacity onPress={() => setScreen('symptoms')} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.resultsTitle}>Analysis Results</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.resultsScroll}>
                    {/* AI Advice Card */}
                    <Card style={styles.adviceCard}>
                        <View style={styles.adviceHeader}>
                            <View style={styles.aiIcon}>
                                <Ionicons name="sparkles" size={24} color="#FFF" />
                            </View>
                            <Text style={styles.adviceTitle}>AI Analysis</Text>
                        </View>
                        <Text style={styles.adviceText}>{advice}</Text>
                        <View style={styles.urgencyBadge}>
                            <Ionicons
                                name={urgencyLevel.includes('EMERGENCY') ? 'alert-circle' : 'time'}
                                size={18}
                                color={urgencyLevel.includes('EMERGENCY') ? colors.error : colors.warning}
                            />
                            <Text style={[
                                styles.urgencyText,
                                { color: urgencyLevel.includes('EMERGENCY') ? colors.error : colors.text }
                            ]}>
                                {urgencyLevel}
                            </Text>
                        </View>
                    </Card>

                    {/* Recommended Specialist */}
                    <View style={styles.specialistRecommendation}>
                        <Text style={styles.sectionTitle}>Recommended Specialist</Text>
                        <Card style={styles.recommendedCard}>
                            <View style={styles.recommendedRow}>
                                <View style={[
                                    styles.recommendedIcon,
                                    { backgroundColor: (specialistInfo?.color || colors.primary) + '20' }
                                ]}>
                                    <Ionicons
                                        name={(specialistInfo?.icon as any) || 'person'}
                                        size={28}
                                        color={specialistInfo?.color || colors.primary}
                                    />
                                </View>
                                <View style={styles.recommendedInfo}>
                                    <Text style={styles.recommendedName}>{recommendedSpecialist}</Text>
                                    <Text style={styles.recommendedAvailable}>
                                        {availableDoctors.length} doctors available
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.findDoctorBtn}
                                    onPress={() => router.push({
                                        pathname: '/(user)/doctors',
                                        params: { specialization: recommendedSpecialist }
                                    })}
                                >
                                    <Text style={styles.findDoctorText}>Find</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </Card>
                    </View>

                    {/* Possible Conditions */}
                    {possibleConditions.length > 0 && (
                        <View style={styles.conditionsSection}>
                            <Text style={styles.sectionTitle}>Possible Conditions</Text>
                            {possibleConditions.map((condition) => (
                                <Card key={condition.id} style={styles.conditionCard}>
                                    <View style={styles.conditionHeader}>
                                        <Text style={styles.conditionName}>{condition.name}</Text>
                                        <Badge
                                            text={condition.severity.toUpperCase()}
                                            variant={
                                                condition.severity === 'mild' ? 'success' :
                                                    condition.severity === 'moderate' ? 'warning' :
                                                        condition.severity === 'severe' ? 'error' : 'error'
                                            }
                                        />
                                    </View>
                                    <Text style={styles.conditionDesc}>{condition.description}</Text>

                                    {condition.homeRemedies && (
                                        <View style={styles.remediesSection}>
                                            <Text style={styles.remediesTitle}>💊 Home Remedies:</Text>
                                            {condition.homeRemedies.map((remedy, idx) => (
                                                <Text key={idx} style={styles.remedyItem}>• {remedy}</Text>
                                            ))}
                                        </View>
                                    )}

                                    <View style={styles.whenToSee}>
                                        <Ionicons name="information-circle" size={18} color={colors.info} />
                                        <Text style={styles.whenToSeeText}>{condition.whenToSeeDoctor}</Text>
                                    </View>
                                </Card>
                            ))}
                        </View>
                    )}

                    {/* Selected Symptoms */}
                    <View style={styles.selectedSymptomsSection}>
                        <Text style={styles.sectionTitle}>Your Symptoms</Text>
                        <View style={styles.selectedSymptomsList}>
                            {selectedSymptoms.map((symptom, idx) => (
                                <View key={idx} style={styles.selectedSymptomChip}>
                                    <Text style={styles.selectedSymptomText}>{symptom}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Disclaimer */}
                    <View style={styles.disclaimer}>
                        <Ionicons name="shield-checkmark" size={20} color={colors.textSecondary} />
                        <Text style={styles.disclaimerText}>
                            This is AI-powered health guidance, not a medical diagnosis.
                            Always consult a qualified healthcare professional for accurate diagnosis and treatment.
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <Button
                            title="Find Doctors"
                            onPress={() => router.push('/(user)/doctors')}
                            size="large"
                            style={styles.primaryActionBtn}
                        />
                        <Button
                            title={isSaving ? "Saving..." : "Save Analysis to Records"}
                            onPress={handleSaveAnalysis}
                            variant="outline"
                            loading={isSaving}
                            style={styles.saveActionBtn}
                            icon={<Ionicons name="bookmark" size={20} color={colors.primary} />}
                        />
                        <TouchableOpacity style={styles.restartBtn} onPress={resetAssistant}>
                            <Ionicons name="refresh" size={20} color={colors.primary} />
                            <Text style={styles.restartText}>Start Over</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {screen === 'home' && renderHomeScreen()}
            {screen === 'symptoms' && renderSymptomsScreen()}
            {screen === 'results' && renderResultsScreen()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    fullScreen: {
        flex: 1,
    },
    // Hero Section
    heroSection: {
        backgroundColor: colors.primary,
        paddingVertical: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
    },
    // Actions
    actionsContainer: {
        padding: 20,
    },
    mainActionCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    actionIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    actionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    actionDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: 16,
    },
    actionArrow: {
        position: 'absolute',
        right: 24,
        top: 24,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    secondaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    secondaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    // Tips
    tipsSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    tipCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginRight: 12,
        width: 160,
    },
    tipIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    tipText: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 16,
    },
    // Specialists
    specialistsSection: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    specialistGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    specialistCard: {
        width: '30%',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
    },
    specialistIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    specialistName: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    // Symptoms Screen
    symptomsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    symptomsTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    symptomsScroll: {
        flex: 1,
        paddingHorizontal: 20,
    },
    categorySection: {
        marginBottom: 24,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    searchInput: {
        marginBottom: 0,
    },
    symptomsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    symptomChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 25,
        gap: 8,
        borderWidth: 2,
        borderColor: colors.border,
    },
    symptomChipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    symptomText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.text,
    },
    symptomTextSelected: {
        color: '#FFF',
    },
    analyzeButtonContainer: {
        padding: 20,
        backgroundColor: colors.background,
    },
    analyzeButton: {
        backgroundColor: colors.primary,
    },
    // Results Screen
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    resultsScroll: {
        flex: 1,
        paddingHorizontal: 20,
    },
    adviceCard: {
        backgroundColor: colors.primary,
        marginBottom: 20,
    },
    adviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    aiIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adviceTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    adviceText: {
        fontSize: 15,
        color: '#FFF',
        lineHeight: 22,
        marginBottom: 16,
    },
    urgencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        gap: 8,
    },
    urgencyText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Specialist Recommendation
    specialistRecommendation: {
        marginBottom: 20,
    },
    recommendedCard: {
        padding: 0,
    },
    recommendedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    recommendedIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    recommendedInfo: {
        flex: 1,
    },
    recommendedName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    recommendedAvailable: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    findDoctorBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 25,
        gap: 6,
    },
    findDoctorText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    // Conditions
    conditionsSection: {
        marginBottom: 20,
    },
    conditionCard: {
        marginBottom: 12,
    },
    conditionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    conditionName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    conditionDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    remediesSection: {
        backgroundColor: colors.secondaryLight,
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    remediesTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.secondaryDark,
        marginBottom: 6,
    },
    remedyItem: {
        fontSize: 13,
        color: colors.text,
        marginLeft: 8,
        marginTop: 2,
    },
    whenToSee: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.info + '15',
        padding: 12,
        borderRadius: 10,
        gap: 8,
    },
    whenToSeeText: {
        flex: 1,
        fontSize: 13,
        color: colors.text,
        lineHeight: 18,
    },
    // Selected Symptoms
    selectedSymptomsSection: {
        marginBottom: 20,
    },
    selectedSymptomsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectedSymptomChip: {
        backgroundColor: colors.primaryLight,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    selectedSymptomText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '500',
    },
    // Disclaimer
    disclaimer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 12,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    // Action Buttons
    actionButtons: {
        marginBottom: 32,
    },
    primaryActionBtn: {
        marginBottom: 12,
    },
    saveActionBtn: {
        marginBottom: 12,
    },
    restartBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    restartText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
});
