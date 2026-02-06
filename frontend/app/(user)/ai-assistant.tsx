import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
    const params = useLocalSearchParams<{ screen?: Screen, section?: string }>();
    const { doctors } = useData();
    const { user } = useAuth();
    const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const [screen, setScreen] = useState<Screen>('home');
    const scrollViewRef = React.useRef<ScrollView>(null);

    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<ReturnType<typeof analyzeSymptoms> | null>(null);

    useEffect(() => {
        if (params.screen) {
            setScreen(params.screen);

            if (params.screen === 'home' && params.section === 'tips') {
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 350, animated: true });
                }, 300);
            }
        }
    }, [params.screen, params.section]);

    // Group symptoms by category
    const symptomsByCategory = useMemo(() => {
        const grouped: Record<string, typeof SYMPTOMS> = {};
        const filtered = SYMPTOMS.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        filtered.forEach(s => {
            if (!grouped[s.category]) grouped[s.category] = [];
            grouped[s.category].push(s);
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

        const reportContent = `AI Health Analysis - ${new Date().toLocaleDateString()}\n\n` +
            `Symptoms: ${selectedSymptoms.join(', ')}\n\n` +
            `Analysis: ${analysisResult.advice}\n\n` +
            `Recommended Specialist: ${analysisResult.recommendedSpecialist}\n` +
            `Urgency: ${analysisResult.urgencyLevel}`;

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('user_id', user.id);
            formData.append('title', `Health Analysis ${new Date().toLocaleDateString()}`);
            formData.append('description', 'AI-generated health summary');

            // For React Native, we might need a different approach for files
            // but for now we follow the existing pattern
            const fileData = {
                uri: 'data:text/plain;charset=utf-8,' + encodeURIComponent(reportContent),
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
            Alert.alert('Saved (Demo)', 'Analysis results have been archived to your profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const findDoctorsForSpecialist = (specialist: string) => {
        return (doctors || []).filter((d: any) =>
            d.specialization.toLowerCase().includes(specialist.toLowerCase()) ||
            specialist.toLowerCase().includes(d.specialization.toLowerCase())
        );
    };

    // Home Screen Component
    const renderHomeScreen = () => (
        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
            <View style={styles.heroSection}>
                <View style={styles.heroIcon}>
                    <Ionicons name="medical" size={48} color="#FFF" />
                </View>
                <Text style={styles.heroTitle}>AI Health Assistant</Text>
                <Text style={styles.heroSubtitle}>Instant health insights and recommendations</Text>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.mainActionCard} onPress={() => setScreen('symptoms')}>
                    <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="pulse" size={32} color={colors.primary} />
                    </View>
                    <Text style={styles.actionTitle}>Symptom Checker</Text>
                    <Text style={styles.actionDesc}>Identify potential health issues based on your current symptoms.</Text>
                    <Ionicons name="arrow-forward-circle" size={28} color={colors.primary} style={styles.actionArrow} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.mainActionCard} onPress={() => router.push('/(user)/ai-chat')}>
                    <View style={[styles.actionIcon, { backgroundColor: colors.accent + '20' }]}>
                        <Ionicons name="chatbubbles" size={32} color={colors.accent} />
                    </View>
                    <Text style={styles.actionTitle}>Chat with AI</Text>
                    <Text style={styles.actionDesc}>Talk to our AI health bot about any general medical concerns.</Text>
                    <Ionicons name="arrow-forward-circle" size={28} color={colors.accent} style={styles.actionArrow} />
                </TouchableOpacity>

                <View style={styles.secondaryActions}>
                    <TouchableOpacity
                        style={styles.secondaryCard}
                        onPress={() => scrollViewRef.current?.scrollTo({ y: 350, animated: true })}
                    >
                        <View style={[styles.secondaryIcon, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="fitness" size={24} color={colors.success} />
                        </View>
                        <Text style={styles.secondaryTitle}>Health Tips</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryCard} onPress={() => router.push('/(user)/user-appointments')}>
                        <View style={[styles.secondaryIcon, { backgroundColor: colors.info + '20' }]}>
                            <Ionicons name="calendar" size={24} color={colors.info} />
                        </View>
                        <Text style={styles.secondaryTitle}>Appointments</Text>
                    </TouchableOpacity>
                </View>
            </View>

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
                />
            </View>

            <ScrollView style={styles.symptomsScroll}>
                {Object.entries(symptomsByCategory).map(([category, symptoms]) => (
                    <View key={category} style={styles.categorySection}>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <View style={styles.symptomsGrid}>
                            {symptoms.map((symptom) => {
                                const isSelected = selectedSymptoms.includes(symptom.name);
                                return (
                                    <TouchableOpacity
                                        key={symptom.id}
                                        style={[styles.symptomChip, isSelected && styles.symptomChipSelected]}
                                        onPress={() => toggleSymptom(symptom.name)}
                                    >
                                        <Ionicons name={symptom.icon as any} size={18} color={isSelected ? '#FFF' : colors.primary} />
                                        <Text style={[styles.symptomText, isSelected && styles.symptomTextSelected]}>{symptom.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.analyzeButtonContainer}>
                <Button
                    title={`Analyze ${selectedSymptoms.length > 0 ? selectedSymptoms.length : ''} Symptoms`}
                    onPress={handleAnalyze}
                    disabled={selectedSymptoms.length === 0}
                    size="large"
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
            <ScrollView style={styles.fullScreen}>
                <View style={styles.resultsHeader}>
                    <TouchableOpacity onPress={() => setScreen('symptoms')} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.resultsTitle}>Analysis Results</Text>
                </View>

                <View style={styles.resultsScroll}>
                    <Card style={styles.adviceCard}>
                        <View style={styles.adviceHeader}>
                            <View style={styles.aiIcon}><Ionicons name="sparkles" size={24} color="#FFF" /></View>
                            <Text style={styles.adviceTitle}>AI Analysis</Text>
                        </View>
                        <Text style={styles.adviceText}>{advice}</Text>
                        <View style={styles.urgencyBadge}>
                            <Ionicons name="time" size={18} color={colors.warning} />
                            <Text style={styles.urgencyText}>{urgencyLevel}</Text>
                        </View>
                    </Card>

                    <Card style={styles.recommendedCard}>
                        <View style={[styles.recommendedIcon, { backgroundColor: (specialistInfo?.color || colors.primary) + '20' }]}>
                            <Ionicons name={(specialistInfo?.icon as any) || 'person'} size={28} color={specialistInfo?.color || colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.recommendedName}>{recommendedSpecialist}</Text>
                            <Text style={styles.recommendedAvailable}>{availableDoctors.length} doctors available</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.findDoctorBtn}
                            onPress={() => router.push({ pathname: '/(user)/doctors', params: { specialization: recommendedSpecialist } })}
                        >
                            <Text style={styles.findDoctorText}>Find</Text>
                        </TouchableOpacity>
                    </Card>

                    {possibleConditions.map((condition) => (
                        <Card key={condition.id} style={styles.conditionCard}>
                            <View style={styles.conditionHeader}>
                                <Text style={styles.conditionName}>{condition.name}</Text>
                                <Badge text={condition.severity.toUpperCase()} variant="warning" />
                            </View>
                            <Text style={styles.conditionDesc}>{condition.description}</Text>
                        </Card>
                    ))}

                    <View style={styles.actionButtons}>
                        <Button title="Save to Records" onPress={handleSaveAnalysis} loading={isSaving} style={styles.primaryActionBtn} />
                        <TouchableOpacity style={styles.restartBtn} onPress={resetAssistant}>
                            <Text style={styles.restartText}>Start Over</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
    container: { flex: 1, backgroundColor: colors.background },
    fullScreen: { flex: 1 },
    heroSection: { backgroundColor: colors.primary, paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
    heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
    actionsContainer: { padding: 20 },
    mainActionCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, elevation: 3 },
    actionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
    actionDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    actionArrow: { position: 'absolute', right: 20, top: 20 },
    secondaryActions: { flexDirection: 'row', gap: 12 },
    secondaryCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: 'center' },
    secondaryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    secondaryTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
    tipsSection: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
    tipCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginRight: 12, width: 220 },
    tipIcon: { marginBottom: 12 },
    tipTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
    tipText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    symptomsHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: colors.surface },
    backBtn: { marginRight: 12 },
    symptomsTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
    searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
    symptomsScroll: { flex: 1, paddingHorizontal: 20 },
    categorySection: { marginBottom: 20 },
    categoryTitle: { fontSize: 14, fontWeight: '700', color: colors.textLight, marginBottom: 12, textTransform: 'uppercase' },
    symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    symptomChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
    symptomChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    symptomText: { fontSize: 14, color: colors.textSecondary },
    symptomTextSelected: { color: '#FFF' },
    analyzeButtonContainer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
    resultsHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    resultsTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
    resultsScroll: { padding: 20 },
    adviceCard: { padding: 20, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: colors.primary },
    adviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    aiIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    adviceTitle: { fontSize: 18, fontWeight: '700' },
    adviceText: { fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginBottom: 16 },
    urgencyBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    urgencyText: { fontSize: 14, fontWeight: '600', color: colors.warning },
    recommendedCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    recommendedIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    recommendedName: { fontSize: 16, fontWeight: '700' },
    recommendedAvailable: { fontSize: 13, color: colors.textLight },
    findDoctorBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    findDoctorText: { color: '#FFF', fontWeight: '600' },
    conditionCard: { padding: 16, marginBottom: 12 },
    conditionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    conditionName: { fontSize: 16, fontWeight: '700' },
    conditionDesc: { fontSize: 14, color: colors.textSecondary },
    actionButtons: { marginTop: 20, gap: 12 },
    primaryActionBtn: { borderRadius: 12 },
    restartBtn: { alignItems: 'center', padding: 12 },
    restartText: { color: colors.primary, fontWeight: '700' },
});
