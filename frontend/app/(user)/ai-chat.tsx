import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

export default function AIChat() {
    const router = useRouter();
    const { user } = useAuth();
    const scrollViewRef = useRef<ScrollView>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        // Send initial greeting
        initializeChat();
    }, []);

    const initializeChat = async () => {
        setIsInitializing(true);
        const welcomeMessage: Message = {
            id: Date.now().toString(),
            text: "Hello! I'm MedBook AI, your personal health assistant. 🏥\n\nI can help you understand your symptoms, suggest what type of specialist you might need, and provide general health guidance.\n\n**How can I help you today?**\n\nYou can tell me about:\n• Any symptoms you're experiencing\n• Health concerns or questions\n• When to seek medical attention",
            isUser: false,
            timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setIsInitializing(false);
    };

    const sendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id || 'guest',
                    message: userMessage.text,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: data.response,
                    isUser: false,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I apologize, but I'm having trouble connecting right now. Please try again or consult a healthcare professional for immediate concerns.",
                isUser: false,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = async () => {
        try {
            await fetch(`${BACKEND_URL}/api/chat/clear/${user?.id || 'guest'}`, {
                method: 'POST',
            });
        } catch (e) {
            // Ignore errors
        }
        initializeChat();
    };

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const renderMessage = (message: Message) => (
        <View
            key={message.id}
            style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble
            ]}
        >
            {!message.isUser && (
                <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={16} color="#FFF" />
                </View>
            )}
            <View style={[
                styles.messageContent,
                message.isUser ? styles.userContent : styles.aiContent
            ]}>
                <Text style={[
                    styles.messageText,
                    message.isUser && styles.userMessageText
                ]}>
                    {message.text}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Gradient Header */}
            <LinearGradient
                colors={['#8B5CF6', '#A855F7', '#C084FC'] as [string, string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="sparkles" size={22} color="#FFF" />
                            </View>
                            <View>
                                <Text style={styles.headerTitle}>MedBook AI</Text>
                                <View style={styles.statusDot}>
                                    <View style={styles.onlineDot} />
                                    <Text style={styles.headerSubtitle}>Online • Health Assistant</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
                            <Ionicons name="refresh" size={22} color="rgba(255,255,255,0.9)" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Chat Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
            >
                {isInitializing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : (
                    messages.map(renderMessage)
                )}
                {isLoading && (
                    <View style={[styles.messageBubble, styles.aiBubble]}>
                        <View style={styles.aiAvatar}>
                            <Ionicons name="sparkles" size={16} color="#FFF" />
                        </View>
                        <View style={[styles.messageContent, styles.aiContent]}>
                            <View style={styles.typingIndicator}>
                                <View style={[styles.typingDot, styles.dot1]} />
                                <View style={[styles.typingDot, styles.dot2]} />
                                <View style={[styles.typingDot, styles.dot3]} />
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Describe your symptoms..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            (!inputText.trim() || isLoading) && styles.sendBtnDisabled
                        ]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={inputText.trim() && !isLoading ? '#FFF' : colors.textLight}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Disclaimer */}
            <SafeAreaView edges={['bottom']} style={styles.disclaimerContainer}>
                <View style={styles.disclaimer}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.secondary} />
                    <Text style={styles.disclaimerText}>
                        AI responses are for informational purposes only. Always consult a doctor.
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerGradient: {
        paddingBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        gap: 12,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    statusDot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00D68F',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
    },
    clearBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    loader: {
        marginTop: 40,
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    userBubble: {
        justifyContent: 'flex-end',
    },
    aiBubble: {
        justifyContent: 'flex-start',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    messageContent: {
        maxWidth: '80%',
        padding: 14,
        borderRadius: 18,
    },
    userContent: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
        marginLeft: 'auto',
    },
    aiContent: {
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        color: colors.text,
    },
    userMessageText: {
        color: '#FFF',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textSecondary,
    },
    dot1: {
        opacity: 0.4,
    },
    dot2: {
        opacity: 0.6,
    },
    dot3: {
        opacity: 0.8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: 10,
    },
    textInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        backgroundColor: colors.background,
        borderRadius: 22,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.text,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: {
        backgroundColor: colors.border,
    },
    disclaimerContainer: {
        backgroundColor: colors.surface,
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 8,
    },
    disclaimerText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
});
