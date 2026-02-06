import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, PermissionsAndroid, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType, RtcSurfaceView, IRtcEngine, RtcConnection, VideoCanvas } from 'react-native-agora';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '0815afcf011c41f59852314647c5cb86';
// Using temp token for secured Agora project
const TEMP_TOKEN = '007eJxTYODNmuotse/x4YUvXfX0Uny1dvzxrit6tZ9B3NVtb2u8ab8Cg4GFoWliWnKagaFhsolhmqmlhamRsaGJmYl5smlykoVZ2+TWzIZARoZr06YzMjJAIIjPzpCbmpKUn5/NwAAARKQfgw==';
const CHANNEL_NAME = 'medbook';

const VideoCall = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { appointmentId, doctorName, patientName } = useLocalSearchParams<{
        appointmentId: string;
        doctorName?: string;
        patientName?: string;
    }>();

    const agoraEngineRef = useRef<IRtcEngine | null>(null);
    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    useEffect(() => {
        setupVideoSDK();
    }, []);

    const setupVideoSDK = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                ]);
                if (
                    granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED &&
                    granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED
                ) {
                    setPermissionGranted(true);
                    initAgora();
                } else {
                    Alert.alert('Permissions', 'Camera and Mic permissions are required');
                    router.back();
                }
            } else {
                setPermissionGranted(true);
                initAgora();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const initAgora = async () => {
        try {
            agoraEngineRef.current = createAgoraRtcEngine();
            const engine = agoraEngineRef.current;
            engine.initialize({
                appId: AGORA_APP_ID,
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
            });

            engine.registerEventHandler({
                onJoinChannelSuccess: (_connection: RtcConnection, uid: number) => {
                    console.log('Successfully joined channel:', uid);
                    setIsJoined(true);
                },
                onUserJoined: (_connection: RtcConnection, uid: number) => {
                    console.log('Remote user joined:', uid);
                    setRemoteUid(uid);
                },
                onUserOffline: (_connection: RtcConnection, uid: number) => {
                    console.log('Remote user left:', uid);
                    setRemoteUid(0);
                },
                onError: (err: number, msg: string) => {
                    console.error('Agora Connection Error', err, msg);
                    if (err === 110) {
                        Alert.alert('Error', 'Token expired or invalid security settings');
                    }
                }
            });

            engine.enableVideo();
            engine.startPreview();

            engine.joinChannel(TEMP_TOKEN, CHANNEL_NAME, user?.id ? parseInt(user.id.substring(0, 6), 16) : 0, {});
        } catch (e) {
            console.error('Init Error', e);
            Alert.alert('Error', 'Failed to initialize video engine');
        }
    };

    const toggleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        try {
            agoraEngineRef.current?.muteLocalAudioStream(newState);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleVideo = () => {
        const newState = !isVideoOff;
        setIsVideoOff(newState);
        try {
            agoraEngineRef.current?.muteLocalVideoStream(newState);
        } catch (e) {
            console.error(e);
        }
    };

    const leave = () => {
        try {
            agoraEngineRef.current?.leaveChannel();
            agoraEngineRef.current?.release();
            router.back();
        } catch (e) {
            console.error(e);
            router.back();
        }
    };

    // If permission not yet checked/granted, show loading
    if (!permissionGranted) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Requesting Permissions...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={leave} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {doctorName ? `Dr. ${doctorName}` : patientName || 'Consultation'}
                </Text>
            </View>

            <View style={styles.videoContainer}>
                {isJoined ? (
                    <React.Fragment>
                        {/* Remote Video (Full Screen) */}
                        {remoteUid !== 0 ? (
                            <RtcSurfaceView
                                style={styles.fullScreenVideo}
                                zOrderMediaOverlay={false}
                                canvas={{ uid: remoteUid }}
                            />
                        ) : (
                            <View style={styles.waitingContainer}>
                                <ActivityIndicator size="large" color="#FFF" />
                                <Text style={styles.waitingText}>Waiting for other person...</Text>
                            </View>
                        )}

                        {/* Local Video (Small Floating) */}
                        {!isVideoOff ? (
                            <RtcSurfaceView
                                style={styles.localVideo}
                                zOrderMediaOverlay={true}
                                canvas={{ uid: 0 }}
                            />
                        ) : (
                            <View style={[styles.localVideo, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="videocam-off" size={24} color="#666" />
                            </View>
                        )}
                    </React.Fragment>
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Joining Room...</Text>
                    </View>
                )}
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={[styles.controlBtn, isMuted && styles.controlBtnActive]} onPress={toggleMute}>
                    <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? "#000" : "#FFF"} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.endCallBtn} onPress={leave}>
                    <Ionicons name="call" size={32} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]} onPress={toggleVideo}>
                    <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={28} color={isVideoOff ? "#000" : "#FFF"} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        position: 'absolute', top: 40, left: 0, right: 0,
        zIndex: 100, flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20
    },
    backButton: { marginRight: 15, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3 },

    videoContainer: { flex: 1 },
    fullScreenVideo: { flex: 1 },
    localVideo: {
        position: 'absolute',
        top: 100, right: 20,
        width: 100, height: 150,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 2, borderColor: '#FFF',
        backgroundColor: '#333'
    },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
    loadingText: { color: '#FFF', marginTop: 10 },

    waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' },
    waitingText: { color: '#aaa', marginTop: 15 },

    controls: {
        position: 'absolute', bottom: 40, alignSelf: 'center',
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 25,
    },
    controlBtn: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    controlBtnActive: {
        backgroundColor: '#FFF',
    },
    endCallBtn: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#FF3B30',
        justifyContent: 'center', alignItems: 'center',
        elevation: 5,
        borderWidth: 4, borderColor: 'rgba(255, 59, 48, 0.3)'
    }
});

export default VideoCall;
