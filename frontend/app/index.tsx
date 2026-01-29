import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
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
        <LinearGradient
          colors={['#0066FF', '#00A3FF']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={['#0052CC', '#0066FF', '#00A3FF']}
        style={styles.gradientBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Elements */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>

          {/* Logo & Hero Section */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              }
            ]}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoInner}>
                <Ionicons name="medical" size={48} color="#FFF" />
              </View>
            </View>

            <Text style={styles.brandName}>MedBook</Text>
            <Text style={styles.tagline}>Your Health, Our Priority</Text>
          </Animated.View>

          {/* Middle Section - Features List */}
          <Animated.View
            style={[
              styles.featuresSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <FeatureItem icon="search" text="Find doctors and hospitals near you" />
            <FeatureItem icon="calendar" text="Book appointments instantly" />
            <FeatureItem icon="sparkles" text="AI-powered health assistance" />
            <FeatureItem icon="videocam" text="Video consultations available" />
            <FeatureItem icon="document-text" text="Store medical records securely" />
          </Animated.View>

          {/* Bottom CTA Section */}
          <Animated.View
            style={[
              styles.ctaSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/(auth)/role-select')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <View style={styles.arrowIcon}>
                <Ionicons name="arrow-forward" size={20} color="#0066FF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>I already have an account</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const FeatureItem = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon} size={20} color="#FFF" />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -width * 0.2,
    right: -width * 0.3,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: height * 0.15,
    left: -width * 0.25,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  brandName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  featuresSection: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  ctaSection: {
    gap: 14,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    height: 56,
    borderRadius: 16,
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0066FF',
  },
  arrowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondaryBtnText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
});
