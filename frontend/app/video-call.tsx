import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function VideoCall() {
    const router = useRouter();
    const { user } = useAuth();
    const { appointmentId, doctorName, patientName } = useLocalSearchParams<{
        appointmentId: string;
        doctorName?: string;
        patientName?: string;
    }>();

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        (async () => {
            const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
            const { status: audioStatus } = await Audio.requestPermissionsAsync();

            if (cameraStatus === 'granted' && audioStatus === 'granted') {
                setHasPermission(true);
            } else {
                setHasPermission(false);
                Alert.alert(
                    'Permissions Required',
                    'Camera and Microphone access are required for video calls.',
                    [{ text: 'Go Back', onPress: () => router.back() }]
                );
            }
        })();
    }, []);

    // Generate room name
    const roomName = useMemo(() => {
        const sanitizedId = (appointmentId || 'default-room').replace(/[^a-zA-Z0-9]/g, '');
        return `medbook-${sanitizedId}`;
    }, [appointmentId]);

    const displayName = useMemo(() => {
        return user?.name || patientName || doctorName || 'User';
    }, [user, patientName, doctorName]);

    // Optimized Jitsi URL with 480p and minimal lag settings
    const jitsiUrl = useMemo(() => {
        const baseUrl = 'https://meet.jit.si';
        const config = [
            `userInfo.displayName=${encodeURIComponent(displayName)}`,
            'config.prejoinPageEnabled=false',
            'config.prejoinConfig.enabled=false',
            'config.startWithAudioMuted=false',
            'config.startWithVideoMuted=false',
            'config.disableDeepLinking=true',
            'config.disableInviteFunctions=true',
            'config.enableP2P=true',
            'config.p2p.enabled=true',
            'config.p2p.preferH264=true',
            'config.resolution=480',
            'config.constraints.video.height.ideal=480',
            'config.constraints.video.height.max=480',
            'config.constraints.video.width.ideal=640',
            'config.constraints.video.width.max=640',
            'config.constraints.video.frameRate.ideal=24',
            'config.constraints.video.frameRate.max=30',
            'config.channelLastN=2',
            'config.disableAudioLevels=true',
            'config.disableAnimations=true',
            'config.enableNoisyMicDetection=false',
            'config.videoQuality.persist=true',
            'config.disableThirdPartyRequests=true',
            'config.hideConferenceTimer=true',
            'config.hideConferenceSubject=true',
            'config.hideParticipantsStats=true',
            'config.toolbarButtons=["microphone","camera"]',
            'interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera"]',
            'interfaceConfig.SHOW_JITSI_WATERMARK=false',
            'interfaceConfig.SHOW_BRAND_WATERMARK=false',
            'interfaceConfig.DISABLE_FOCUS_INDICATOR=true',
            'interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR=true',
        ].join('&');
        return `${baseUrl}/${roomName}#${config}`;
    }, [roomName, displayName]);

    const handleEndCall = () => {
        router.back();
    };

    if (!appointmentId) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                    <Text style={styles.errorTitle}>Invalid Appointment</Text>
                    <Text style={styles.errorText}>Could not load video call.</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (hasPermission === null) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Requesting permissions...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <View style={{ width: 44 }} />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Video Consultation</Text>
                    <Text style={styles.headerSubtitle}>
                        {doctorName ? `Dr. ${doctorName}` : patientName || 'In Call'}
                    </Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.webviewContainer}>
                <WebView
                    source={{ uri: jitsiUrl }}
                    style={styles.webview}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    originWhitelist={['*']}
                    allowsFullscreenVideo={true}
                    userAgent="Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/114.0.0.0 Mobile Safari/537.36"
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Connecting to video call...</Text>
                        </View>
                    )}
                    onError={(error: any) => {
                        console.error('WebView error:', error);
                        Alert.alert('Connection Error', 'Failed to connect to video call.');
                    }}
                />
            </View>

            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.endCallFullBtn} onPress={handleEndCall}>
                    <Ionicons name="call" size={24} color="#FFF" />
                    <Text style={styles.endCallFullText}>End Call</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#2a2a2a',
    },
    headerInfo: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    webviewContainer: {
        flex: 1,
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    bottomBar: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#2a2a2a',
    },
    endCallFullBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.error,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    endCallFullText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        backgroundColor: colors.background,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginTop: 16,
    },
    errorText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: colors.primary,
        borderRadius: 10,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
});
