import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Card, Button, Input } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface MedicalRecord {
    id: string;
    title: string;
    description: string;
    file_type: string;
    file_id: string;
    upload_date: string;
}

export default function MedicalRecords() {
    const router = useRouter();
    const { user } = useAuth();
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [newRecordTitle, setNewRecordTitle] = useState('');
    const [newRecordDesc, setNewRecordDesc] = useState('');

    useEffect(() => {
        if (user) {
            fetchRecords();
        }
    }, [user]);

    const fetchRecords = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/api/records/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setRecords(data);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            Alert.alert('Error', 'Failed to load medical records');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickDocument = async () => {
        if (!newRecordTitle.trim()) {
            Alert.alert('Required', 'Please enter a title for the record');
            return;
        }

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                uploadFile(asset);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const uploadFile = async (asset: DocumentPicker.DocumentPickerAsset) => {
        if (!user) return;
        setIsUploading(true);

        const formData = new FormData();
        formData.append('user_id', user.id);
        formData.append('title', newRecordTitle);
        formData.append('description', newRecordDesc);

        if (Platform.OS === 'web') {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            formData.append('file', blob, asset.name);
        } else {
            formData.append('file', {
                uri: asset.uri,
                type: asset.mimeType || 'application/octet-stream',
                name: asset.name,
            } as any);
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/records/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                Alert.alert('Success', 'Medical record uploaded successfully');
                setShowUploadForm(false);
                setNewRecordTitle('');
                setNewRecordDesc('');
                fetchRecords();
            } else {
                const errorData = await response.json();
                Alert.alert('Upload Failed', errorData.detail || 'Failed to upload record');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Error', 'An error occurred during upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleViewRecord = async (fileId: string) => {
        const url = `${BACKEND_URL}/api/records/file/${fileId}`;
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', "Don't know how to open this URL: " + url);
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while opening the record');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Medical Records</Text>
                <TouchableOpacity
                    onPress={() => setShowUploadForm(!showUploadForm)}
                    style={[styles.addBtn, showUploadForm && styles.closeBtn]}
                >
                    <Ionicons name={showUploadForm ? "close" : "add"} size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                {showUploadForm && (
                    <Card style={styles.uploadCard}>
                        <Text style={styles.uploadTitle}>Upload New Record</Text>
                        <Input
                            label="Document Title"
                            placeholder="e.g. Blood Test Report Jan 2024"
                            value={newRecordTitle}
                            onChangeText={setNewRecordTitle}
                        />
                        <Input
                            label="Description (Optional)"
                            placeholder="Add some details about this record"
                            value={newRecordDesc}
                            onChangeText={setNewRecordDesc}
                            multiline
                            numberOfLines={3}
                        />
                        <Button
                            title={isUploading ? "Uploading..." : "Select & Upload File"}
                            onPress={handlePickDocument}
                            loading={isUploading}
                            disabled={isUploading || !newRecordTitle.trim()}
                            variant="primary"
                            icon={<Ionicons name="cloud-upload-outline" size={20} color="#FFF" />}
                        />
                        <Text style={styles.uploadHint}>Supported: PDF, JPG, PNG</Text>
                    </Card>
                )}

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : (
                    <View style={styles.listContainer}>
                        {records.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-text-outline" size={64} color={colors.textSecondary + '40'} />
                                <Text style={styles.emptyText}>No records found</Text>
                                <Text style={styles.emptySubtext}>Your uploaded medical reports will appear here</Text>
                            </View>
                        ) : (
                            records.map((record) => (
                                <Card key={record.id} style={styles.recordCard}>
                                    <View style={styles.recordIcon}>
                                        <Ionicons
                                            name={record.file_type.includes('pdf') ? 'document-text-outline' : 'image-outline'}
                                            size={24}
                                            color={colors.primary}
                                        />
                                    </View>
                                    <View style={styles.recordInfo}>
                                        <Text style={styles.recordTitle}>{record.title}</Text>
                                        <Text style={styles.recordDate}>{formatDate(record.upload_date)}</Text>
                                        {record.description && (
                                            <Text style={styles.recordDesc} numberOfLines={1}>{record.description}</Text>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        style={styles.viewBtn}
                                        onPress={() => handleViewRecord(record.file_id)}
                                    >
                                        <Ionicons name="eye-outline" size={22} color={colors.primary} />
                                    </TouchableOpacity>
                                </Card>
                            ))
                        )}
                    </View>
                )}

                <View style={styles.securityHint}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
                    <Text style={styles.securityText}>Records are stored securely in MongoDB</Text>
                </View>
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        backgroundColor: colors.error,
    },
    scroll: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loader: {
        marginTop: 40,
    },
    uploadCard: {
        marginBottom: 20,
        padding: 16,
    },
    uploadTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    uploadHint: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 12,
    },
    listContainer: {
        marginBottom: 20,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    recordCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginBottom: 12,
    },
    recordIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    recordInfo: {
        flex: 1,
    },
    recordTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    recordDate: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    recordDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    viewBtn: {
        padding: 8,
    },
    securityHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 40,
        paddingVertical: 12,
    },
    securityText: {
        fontSize: 13,
        color: colors.textSecondary,
    }
});
