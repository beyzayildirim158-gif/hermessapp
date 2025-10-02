import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/mysticTheme';
import { LinearGradient } from 'expo-linear-gradient';

/*
  MysticButton props:
  - title: string
  - onPress: () => void
  - loading?: boolean
  - disabled?: boolean
  - variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gold'
  - size?: 'sm' | 'md' | 'lg'
  - leftIcon?/rightIcon?: ReactNode
  - fullWidth?: boolean
  - gradient?: boolean (forces gradient primary look)
*/

const VARIANT_STYLES = {
  primary: {
    backgroundColor: colors.primary,
    textColor: colors.textPrimary,
  },
  secondary: {
    backgroundColor: colors.surface,
    textColor: colors.textSecondary,
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: colors.accent,
  },
  danger: {
    backgroundColor: colors.error,
    textColor: '#fff',
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)'
  },
  gold: {
    backgroundColor: colors.accent,
    textColor: '#1F1233'
  }
};

const SIZE_STYLES = {
  sm: { padY: spacing(2), padX: spacing(4), font: 12 },
  md: { padY: spacing(3), padX: spacing(5), font: 14 },
  lg: { padY: spacing(4), padX: spacing(6), font: 16 },
};

export default function MysticButton({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth,
  gradient,
  style,
  textStyle,
  containerStyle,
}) {
  const varStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isDisabled = disabled || loading;
  const content = (
    <View style={styles.contentRow}>
      {leftIcon ? <View style={styles.iconBox}>{leftIcon}</View> : null}
      <Text style={[styles.text, { color: varStyle.textColor, fontSize: sizeStyle.font }, textStyle]} numberOfLines={1}>
        {loading ? '' : title}
      </Text>
      {loading && <ActivityIndicator size="small" color={variant === 'gold' ? '#1F1233' : colors.accent} />}
      {rightIcon ? <View style={styles.iconBox}>{rightIcon}</View> : null}
    </View>
  );

  if (gradient || variant === 'primary') {
    return (
      <Pressable disabled={isDisabled} onPress={onPress} style={({ pressed }) => [containerStyle, fullWidth && { alignSelf: 'stretch' }]}> 
        <LinearGradient
          colors={variant === 'gold' ? ['#FFE27A', '#E0A82E'] : ['#7E3DFF', '#5128A8']}
          start={{ x:0, y:0 }} end={{ x:1, y:1 }}
          style={[styles.base, {
            paddingVertical: sizeStyle.padY,
            paddingHorizontal: sizeStyle.padX,
            opacity: isDisabled ? 0.55 : 1,
            width: fullWidth ? '100%' : undefined,
            borderRadius: radius.lg,
          }, style, pressed && { transform:[{ scale:0.97 }] }]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: varStyle.backgroundColor,
          paddingVertical: sizeStyle.padY,
          paddingHorizontal: sizeStyle.padX,
          opacity: isDisabled ? 0.55 : 1,
          width: fullWidth ? '100%' : undefined,
          borderRadius: radius.lg,
          borderWidth: varStyle.borderWidth,
          borderColor: varStyle.borderColor,
        },
        style,
        pressed && { transform:[{ scale:0.97 }] }
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
  },
  iconBox: { justifyContent:'center', alignItems:'center' }
});
