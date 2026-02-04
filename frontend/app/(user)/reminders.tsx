import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card, Button } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function Reminders() {
  const { user } = useAuth();
  const { createReminder, getUserReminders, deleteReminder, toggleReminder } = useData();

  const [reminders, setReminders] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [beforeAfter, setBeforeAfter] = useState<'before' | 'after'>('after');
  const [times, setTimes] = useState<string[]>([]);
  const [timeInput, setTimeInput] = useState('');
  const [frequency, setFrequency] = useState<'once' | 'twice' | 'thrice' | 'custom'>('once');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user) return;
    loadReminders();
    registerPushToken();
  }, [user]);

  const registerPushToken = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const projectId =
        process.env.EXPO_PUBLIC_PROJECT_ID ||
        Constants.easConfig?.projectId ||
        Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('Push token skipped: missing projectId (set EXPO_PUBLIC_PROJECT_ID)');
        return;
      }
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, expo_push_token: token }),
      });
    } catch (error) {
      console.error('Push token error:', error);
    }
  };

  const loadReminders = async () => {
    if (!user) return;
    const data = await getUserReminders(user.id);
    setReminders(data);
  };

  const addTime = () => {
    if (!timeInput.trim()) return;
    const value = timeInput.trim();
    if (!/^[0-2]\d:[0-5]\d$/.test(value)) {
      Alert.alert('Invalid time', 'Use 24h format like 08:30');
      return;
    }
    setTimes(prev => [...prev, value]);
    setTimeInput('');
  };

  const applyFrequency = (value: 'once' | 'twice' | 'thrice' | 'custom') => {
    setFrequency(value);
    if (value === 'once') setTimes(['08:00']);
    if (value === 'twice') setTimes(['08:00', '20:00']);
    if (value === 'thrice') setTimes(['08:00', '14:00', '20:00']);
    if (value === 'custom') setTimes([]);
  };

  const removeTime = (index: number) => {
    setTimes(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!medicineName || times.length === 0 || !startDate || !endDate) {
      Alert.alert('Missing info', 'Fill all fields and add at least one time.');
      return;
    }
    const tzOffsetMinutes = -new Date().getTimezoneOffset();
    const ok = await createReminder({
      user_id: user.id,
      medicine_name: medicineName,
      before_after: beforeAfter,
      times,
      start_date: startDate,
      end_date: endDate,
      tz_offset_minutes: tzOffsetMinutes,
    });
    if (ok) {
      setShowModal(false);
      setMedicineName('');
      setTimes([]);
      setFrequency('once');
      setStartDate('');
      setEndDate('');
      await loadReminders();
    } else {
      Alert.alert('Error', 'Could not create reminder.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Card style={styles.reminderCard}>
      <View style={styles.reminderHeader}>
        <Text style={styles.reminderTitle}>{item.medicine_name}</Text>
        <Switch
          value={item.active}
          onValueChange={async (val) => {
            await toggleReminder(item.id, val);
            await loadReminders();
          }}
        />
      </View>
      <Text style={styles.reminderMeta}>Times: {item.times.join(', ')}</Text>
      <Text style={styles.reminderMeta}>Before/After: {item.before_after}</Text>
      <Text style={styles.reminderMeta}>Range: {item.start_date} → {item.end_date}</Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={async () => {
        await deleteReminder(item.id);
        await loadReminders();
      }}>
        <Ionicons name="trash" size={16} color={colors.error} />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Medicine Reminders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="alarm-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No reminders yet</Text>
          </View>
        }
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Reminder</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Medicine name"
              value={medicineName}
              onChangeText={setMedicineName}
            />
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, beforeAfter === 'before' && styles.toggleBtnActive]}
                onPress={() => setBeforeAfter('before')}
              >
                <Text style={[styles.toggleText, beforeAfter === 'before' && styles.toggleTextActive]}>Before Food</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, beforeAfter === 'after' && styles.toggleBtnActive]}
                onPress={() => setBeforeAfter('after')}
              >
                <Text style={[styles.toggleText, beforeAfter === 'after' && styles.toggleTextActive]}>After Food</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, frequency === 'once' && styles.toggleBtnActive]}
                onPress={() => applyFrequency('once')}
              >
                <Text style={[styles.toggleText, frequency === 'once' && styles.toggleTextActive]}>Once</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, frequency === 'twice' && styles.toggleBtnActive]}
                onPress={() => applyFrequency('twice')}
              >
                <Text style={[styles.toggleText, frequency === 'twice' && styles.toggleTextActive]}>Twice</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, frequency === 'thrice' && styles.toggleBtnActive]}
                onPress={() => applyFrequency('thrice')}
              >
                <Text style={[styles.toggleText, frequency === 'thrice' && styles.toggleTextActive]}>Thrice</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, frequency === 'custom' && styles.toggleBtnActive]}
                onPress={() => applyFrequency('custom')}
              >
                <Text style={[styles.toggleText, frequency === 'custom' && styles.toggleTextActive]}>Custom</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="HH:MM"
                value={timeInput}
                onChangeText={setTimeInput}
              />
              <TouchableOpacity style={styles.timeAddBtn} onPress={addTime}>
                <Ionicons name="add-circle" size={18} color="#FFF" />
                <Text style={styles.timeAddText}>Add Time</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.timeChips}>
              {times.map((t, i) => (
                <TouchableOpacity key={`${t}-${i}`} style={styles.timeChip} onPress={() => removeTime(i)}>
                  <Text style={styles.timeChipText}>{t}</Text>
                  <Ionicons name="close" size={14} color={colors.text} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Start date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
            />
            <TextInput
              style={styles.input}
              placeholder="End date (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
            />
            <Button title="Create Reminder" onPress={handleCreate} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 20 },
  reminderCard: { marginBottom: 12 },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  reminderMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  deleteText: { color: colors.error, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 16, color: colors.textSecondary, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { color: colors.textSecondary, fontWeight: '600' },
  toggleTextActive: { color: '#FFF' },
  timeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  timeInput: { flex: 1 },
  timeAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10 },
  timeAddText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  timeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  timeChipText: { fontSize: 12, color: colors.text },
});
