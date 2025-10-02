import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, shadows } from './mysticTheme';

export const MysticBackground = ({ children, variant = 'app', style }) => {
  const gradient = variant === 'app' ? gradients.appBackground : gradients.card;
  return (
    <LinearGradient colors={gradient} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={[styles.bg, style]}>
      <View style={styles.bgOverlay} />
      {children}
    </LinearGradient>
  );
};

export const GlassCard = ({ children, style, padding = 4, gradientColors }) => {
  return (
    <LinearGradient
      colors={gradientColors || ['rgba(255,255,255,0.12)','rgba(255,255,255,0.04)']}
      start={{ x:0, y:0 }} end={{ x:1, y:1 }}
      style={[styles.card, { padding: spacing(padding) }, style]}
    >
      {children}
    </LinearGradient>
  );
};

export const GradientButton = ({ title, onPress, icon, colorsOverride, style, disabled }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={[disabled && { opacity:0.55 }]}> 
      <LinearGradient
        colors={colorsOverride || gradients.buttonPrimary}
        start={{ x:0, y:0 }} end={{ x:1, y:1 }}
        style={[styles.buttonBase, style]}
      >
        {icon ? <View style={{ marginRight: spacing(2) }}>{icon}</View> : null}
        <Text style={styles.buttonText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bg:{ flex:1 },
  bgOverlay:{...StyleSheet.absoluteFillObject, backgroundColor:'rgba(10,8,18,0.55)'},
  card:{
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    ...Platform.select({ ios:{ shadowColor:'#000', shadowOpacity:0.35, shadowRadius:14, shadowOffset:{ width:0, height:8 }}, android:{ elevation:8 }})
  },
  buttonBase:{
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(5),
    borderRadius: radius.pill,
    ...shadows.glowPrimary,
    borderWidth:1,
    borderColor:'rgba(255,255,255,0.2)'
  },
  buttonText:{
    color: colors.textPrimary,
    fontWeight:'700',
    letterSpacing:0.5,
    fontSize:15
  }
});
