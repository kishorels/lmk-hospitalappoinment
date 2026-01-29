import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
  icon,
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.focused,
        error && styles.errorBorder,
        !editable && styles.disabled,
      ]}>
        {icon && (
          <Ionicons name={icon} size={20} color="#666" style={styles.icon} />
        )}
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            icon && styles.inputWithIcon,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)} style={styles.eyeIcon}>
            <Ionicons name={isSecure ? 'eye-off' : 'eye'} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  focused: {
    borderColor: '#2196F3',
    backgroundColor: '#FFF',
  },
  errorBorder: {
    borderColor: '#F44336',
  },
  disabled: {
    backgroundColor: '#E0E0E0',
  },
  icon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  inputWithIcon: {
    paddingLeft: 8,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  eyeIcon: {
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
});
