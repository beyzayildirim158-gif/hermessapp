import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { colors } from '../theme/mysticTheme';

const { width, height } = Dimensions.get('window');

export default function IntroSplash({ onDone, minimumMs = 1600 }) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    pulseLoop.start();

    const t = setTimeout(() => { onDone && onDone(); }, minimumMs);
    return () => { pulseLoop.stop(); clearTimeout(t); };
  }, []);

  const glowOpacity = pulse.interpolate({ inputRange: [0,1], outputRange: [0.15, 0.45] });
  const glowScale = pulse.interpolate({ inputRange: [0,1], outputRange: [1, 1.25] });

  return (
    <View style={styles.root}>
      <View style={styles.bgGradient} />
      <Animated.View style={[styles.glowCircle,{ opacity: glowOpacity, transform:[{ scale: glowScale }] }]} />
      <Animated.View style={{ alignItems:'center', transform:[{ scale }], opacity: fade }}>
        <Text style={styles.logoText}>Hermess</Text>
        <Text style={styles.subLogo}>Mistik Rehberlik Portalı</Text>
        <View style={styles.separator} />
        <Text style={styles.loading}>Titreşimler hizalanıyor...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#08060D', alignItems:'center', justifyContent:'center' },
  bgGradient:{ ...StyleSheet.absoluteFillObject, backgroundColor:'linear-gradient(145deg, #08060D 0%, #1A1030 65%, #2B1747 100%)' },
  glowCircle:{ position:'absolute', width: width*0.9, height: width*0.9, borderRadius: width*0.45, backgroundColor: colors.primary, filter:'blur(90px)', opacity:0.3 },
  logoText:{ fontSize:42, fontWeight:'800', color: colors.accent, letterSpacing:2 },
  subLogo:{ marginTop:8, color: colors.textSecondary, fontSize:14, letterSpacing:1 },
  separator:{ marginTop:18, width:80, height:2, backgroundColor: colors.accent, borderRadius:2 },
  loading:{ marginTop:18, color: colors.textMuted, fontSize:12, letterSpacing:1 }
});
