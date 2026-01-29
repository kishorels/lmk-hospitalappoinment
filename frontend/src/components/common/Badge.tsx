import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ text, variant = 'default', style }) => {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: '#E0E0E0',
  },
  success: {
    backgroundColor: '#E8F5E9',
  },
  warning: {
    backgroundColor: '#FFF3E0',
  },
  error: {
    backgroundColor: '#FFEBEE',
  },
  info: {
    backgroundColor: '#E3F2FD',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  defaultText: {
    color: '#616161',
  },
  successText: {
    color: '#2E7D32',
  },
  warningText: {
    color: '#EF6C00',
  },
  errorText: {
    color: '#C62828',
  },
  infoText: {
    color: '#1565C0',
  },
});
