import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../../../src/context/AuthContext';
import { useData } from '../../../src/context/DataContext';
import { colors } from '../../../src/theme/colors';
import { Query } from '../../../src/data/mockData';

export default function Chat() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const { user } = useAuth();
  const { getDoctorById, getQueriesByUser, createQuery } = useData();
  const scrollViewRef = useRef<ScrollView>(null);

  const doctor = getDoctorById(doctorId);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const queries = user
    ? getQueriesByUser(user.id).filter(q => q.doctorId === doctorId)
    : [];

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [queries.length]);

  const handleSend = async () => {
    if (!message.trim() || !user || !doctor) return;

    setSending(true);
    try {
      await createQuery({
        userId: user.id,
        doctorId: doctor.id,
        message: message.trim(),
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send query:', error);
    } finally {
      setSending(false);
    }
  };

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Doctor not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderMessage = (query: Query) => (
    <View key={query.id}>
      {/* User Message */}
      <View style={styles.messageContainer}>
        <View style={[styles.messageBubble, styles.userBubble]}>
          <Text style={styles.messageText}>{query.message}</Text>
          <Text style={styles.messageTime}>
            {format(new Date(query.createdAt), 'MMM d, h:mm a')}
          </Text>
        </View>
      </View>

      {/* Doctor Reply */}
      {query.reply && (
        <View style={[styles.messageContainer, styles.doctorContainer]}>
          <View style={styles.doctorAvatarSmall}>
            <Ionicons name="person" size={16} color={colors.doctorPrimary} />
          </View>
          <View style={[styles.messageBubble, styles.doctorBubble]}>
            <Text style={[styles.messageText, styles.doctorText]}>{query.reply}</Text>
            <Text style={[styles.messageTime, styles.doctorTime]}>
              {query.repliedAt && format(new Date(query.repliedAt), 'MMM d, h:mm a')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person" size={20} color={colors.doctorPrimary} />
          </View>
          <View>
            <Text style={styles.headerName}>{doctor.name}</Text>
            <Text style={styles.headerSpec}>{doctor.specialization}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push({
            pathname: '/(user)/booking',
            params: { doctorId: doctor.id, hospitalId: doctor.hospitalIds[0] }
          })}
        >
          <Ionicons name="calendar" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {queries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>Start a conversation</Text>
              <Text style={styles.emptyText}>
                Ask {doctor.name} any health-related questions
              </Text>
            </View>
          ) : (
            queries.map(renderMessage)
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your health query..."
            placeholderTextColor={colors.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            <Ionicons name="send" size={20} color={message.trim() ? '#FFF' : colors.textLight} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.doctorPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  headerSpec: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bookBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 22,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  doctorContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  doctorBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  doctorAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.doctorPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
  },
  doctorText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  doctorTime: {
    color: colors.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
