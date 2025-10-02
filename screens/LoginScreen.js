import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { colors, radius, spacing, shadows } from '../theme/mysticTheme';
import FormField from '../components/ui/FormField';
import MysticButton from '../components/ui/MysticButton';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email:'', password:'' });

  const validate = () => {
    const next = { email:'', password:'' };
    if (!email.trim()) next.email = 'E-posta gerekli';
    if (!password) next.password = 'Şifre gerekli';
    setErrors(next);
    return !next.email && !next.password;
  };

  const onLogin = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert('Giriş başarısız', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1887&auto=format&fit=crop' }} style={{ flex:1 }} imageStyle={{ opacity:0.35 }}>
      <View style={styles.overlay} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Hermess Portalına Hoş Geldin</Text>
          <Text style={styles.subtitle}>Ruhsal yolculuğuna devam etmek için giriş yap</Text>

          <View style={styles.fieldGroup}>
            <FormField label="E-posta" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="ornek@mail.com" autoCapitalize="none" keyboardType="email-address" error={errors.email} required />
            <FormField label="Şifre" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry enableVisibilityToggle error={errors.password} required />
          </View>

          <MysticButton title={loading ? 'Giriş yapılıyor...' : 'Giriş Yap'} onPress={onLogin} loading={loading} variant="gold" fullWidth style={{ marginTop: spacing(1) }} />

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.altLinkWrap}>
            <Text style={styles.altText}>Hesabın yok mu? <Text style={styles.altTextAccent}>Kayıt ol</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay:{...StyleSheet.absoluteFillObject, backgroundColor:'rgba(11,10,16,0.85)'},
  container:{flex:1, padding:spacing(6), justifyContent:'center'},
  title:{fontSize:26, fontWeight:'800', color:colors.accent, textAlign:'center', marginBottom:spacing(2), letterSpacing:1},
  subtitle:{fontSize:14, color:colors.textSecondary, textAlign:'center', marginBottom:spacing(6), lineHeight:20},
  fieldGroup:{marginBottom:spacing(4)},
  label:{color:colors.textSecondary, fontSize:12, fontWeight:'600', marginBottom:spacing(1), letterSpacing:0.5},
  input:{borderWidth:1, borderColor:'rgba(255,255,255,0.15)', backgroundColor:'rgba(255,255,255,0.07)', paddingVertical:spacing(3), paddingHorizontal:spacing(3), borderRadius:radius.md, color:colors.textPrimary, fontSize:14},
  button:{marginTop:spacing(2), backgroundColor:colors.accent, paddingVertical:spacing(3.5), borderRadius:radius.lg, alignItems:'center', ...shadows.glowAccent},
  buttonText:{color:'#1F1233', fontWeight:'800', fontSize:16, letterSpacing:0.5},
  altLinkWrap:{marginTop:spacing(6)},
  altText:{color:colors.textMuted, textAlign:'center', fontSize:13},
  altTextAccent:{color:colors.accent},
});
