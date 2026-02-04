import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated, Text, TouchableWithoutFeedback, Modal, ScrollView } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/theme/colors';
import { HEALTH_TIPS } from '../../src/data/healthAI';

export default function UserLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tabBarHeight = 60 + insets.bottom;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHealthTips, setShowHealthTips] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const navTo = (path: string) => {
    setIsMenuOpen(false);
    animation.setValue(0);
    router.push(path as any);
  };

  const openHealthTips = () => {
    setIsMenuOpen(false);
    animation.setValue(0);
    setShowHealthTips(true);
  };

  const subMenuTranslateYTop = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -130], // Top
  });

  const subMenuTranslateXLeft = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -110], // Left
  });

  const subMenuTranslateXArc = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100], // Diagonal Left-Top (further left)
  });

  const subMenuTranslateYArc = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -75], // Diagonal Left-Top (lower)
  });

  const subMenuScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const subMenuOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.userPrimary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: tabBarHeight,
            paddingBottom: insets.bottom + 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="reminders"
          options={{
            title: 'Reminders',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="alarm" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="hospitals"
          options={{
            title: 'Hospitals',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="business" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai-assistant"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="diseases"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="hospital/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="doctor/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="booking"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="chat/[doctorId]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="doctors"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="medical-records"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="ai-chat"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Backdrop */}
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={toggleMenu}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: animation }]}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          </Animated.View>
        </TouchableWithoutFeedback>
      )}

      {/* Sub Menu Items */}
      <View style={[styles.fabContainer, { bottom: tabBarHeight + 20 }]}>

        {/* Chat with AI - Top */}
        <Animated.View style={[
          styles.subMenuItem,
          {
            transform: [{ translateY: subMenuTranslateYTop }, { scale: subMenuScale }],
            opacity: subMenuOpacity
          }
        ]}>
          <TouchableOpacity style={styles.subMenuBtn} onPress={() => navTo('/(user)/ai-chat')} activeOpacity={0.9}>
            <View style={styles.labelContainer}>
              <Text style={styles.subMenuLabelText}>Health Chat</Text>
            </View>
            <LinearGradient
              colors={[colors.accent, '#A78BFA']}
              style={styles.subMenuIcon}
            >
              <Ionicons name="chatbubbles" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Health Tips - Diagonal */}
        <Animated.View style={[
          styles.subMenuItem,
          {
            transform: [
              { translateX: subMenuTranslateXArc },
              { translateY: subMenuTranslateYArc },
              { scale: subMenuScale }
            ],
            opacity: subMenuOpacity
          }
        ]}>
          <TouchableOpacity style={styles.subMenuBtn} onPress={openHealthTips} activeOpacity={0.9}>
            <View style={styles.labelContainer}>
              <Text style={styles.subMenuLabelText}>Health Tips</Text>
            </View>
            <LinearGradient
              colors={['#10B981', '#34D399']}
              style={styles.subMenuIcon}
            >
              <Ionicons name="bulb" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Symptom Checker - Left */}
        <Animated.View style={[
          styles.subMenuItem,
          {
            transform: [{ translateX: subMenuTranslateXLeft }, { scale: subMenuScale }],
            opacity: subMenuOpacity
          }
        ]}>
          <TouchableOpacity style={styles.subMenuBtn} onPress={() => navTo('/(user)/ai-assistant?screen=symptoms')} activeOpacity={0.9}>
            <View style={styles.labelContainer}>
              <Text style={styles.subMenuLabelText}>Symptoms</Text>
            </View>
            <LinearGradient
              colors={[colors.userPrimary, '#60A5FA']}
              style={styles.subMenuIcon}
            >
              <Ionicons name="pulse" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB */}
        <TouchableOpacity
          onPress={toggleMenu}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.userPrimary, '#1D4ED8']}
            style={styles.fab}
          >
            <Animated.View style={{ transform: [{ rotate: rotation }] }}>
              <Ionicons name={isMenuOpen ? "close" : "sparkles"} size={28} color="#FFF" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Health Tips Modal */}
      <Modal
        visible={showHealthTips}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHealthTips(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconBg}>
                  <Ionicons name="bulb" size={24} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Daily Health Tips</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHealthTips(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.tipsScrollView} showsVerticalScrollIndicator={false}>
              {HEALTH_TIPS.map((tip, index) => (
                <View key={tip.id} style={styles.tipCard}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name={tip.icon as any} size={22} color={colors.primary} />
                  </View>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipText}>{tip.tip}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: colors.userPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  subMenuItem: {
    position: 'absolute',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 200,
    right: 0,
  },
  subMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  subMenuIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  labelContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subMenuLabelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  // Health Tips Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10B98120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsScrollView: {
    padding: 20,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  tipIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
