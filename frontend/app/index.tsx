import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Button } from '../src/components';
import { colors } from '../src/theme/colors';

export default function Welcome() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on role
      switch (user.role) {
        case 'user':
          router.replace('/(user)/home');
          break;
        case 'hospital':
          router.replace('/(hospital)/dashboard');
          break;
        case 'doctor':
          router.replace('/(doctor)/dashboard');
          break;
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="medical" size={60} color={colors.primary} />
          </View>
          <Text style={styles.title}>MedBook</Text>
          <Text style={styles.subtitle}>Find Doctors. Book Appointments.{"\n"}Stay Healthy.</Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="search" text="Find hospitals & doctors near you" />
          <FeatureItem icon="calendar" text="Book appointments easily" />
          <FeatureItem icon="videocam" text="Video consultations available" />
          <FeatureItem icon="chatbubbles" text="Ask health queries online" />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/role-select')}
            size="large"
            style={styles.button}
          />
          <Button
            title="I already have an account"
            onPress={() => router.push('/(auth)/login')}
            variant="outline"
            size="medium"
            style={styles.buttonOutline}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const FeatureItem = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={24} color={colors.primary} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
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
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
  buttonOutline: {
    width: '100%',
  },
});
