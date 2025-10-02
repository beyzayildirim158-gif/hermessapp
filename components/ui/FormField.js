import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../../theme/mysticTheme';
import Ionicons from '@expo/vector-icons/Ionicons';

/**
 * Reusable form field with icon (optional), label and input.
 * Props:
 * - label?: string
 * - icon?: string (Ionicons name)
 * - value: string
 * - onChangeText: (text)=>void
 * - placeholder?: string
 * - secureTextEntry?: boolean
 * - keyboardType?: TextInput props
 * - containerStyle?: style overrides
 * - multiline?: boolean
 */
export default function FormField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  containerStyle,
  multiline,
  autoCapitalize,
  placeholderTextColor,
  editable = true,
  rightSlot,
  error,
  helperText,
  required,
  enableVisibilityToggle,
  onBlur,
}) {
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const showToggle = enableVisibilityToggle && secureTextEntry;
  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}{required ? <Text style={{ color: colors.accent }}> *</Text> : null}
        </Text>
      ) : null}
      <View style={[
        styles.fieldWrapper,
        !editable && { opacity: 0.6 },
        hasError && { borderColor: colors.error, shadowColor: colors.error, shadowOpacity:0.35 }
      ]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={hasError ? colors.error : colors.accent} style={{ marginRight: spacing(2) }} />
        ) : null}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor || colors.textMuted}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onBlur={onBlur}
        />
        {showToggle && (
          <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={8} style={{ paddingLeft: spacing(2) }}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {rightSlot}
      </View>
      {hasError ? <Text style={styles.errorText}>{error}</Text> : helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing(3),
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing(1),
    letterSpacing: 0.5,
  },
  fieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: spacing(2.5),
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width:0, height:2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  errorText: {
    marginTop: spacing(1),
    color: colors.error,
    fontSize: 11,
    fontWeight: '600'
  },
  helperText: {
    marginTop: spacing(1),
    color: colors.textMuted,
    fontSize: 11,
  }
});
