import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ImageBackground } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { colors, radius, spacing } from '../theme/mysticTheme';
import FormField from '../components/ui/FormField';
import MysticButton from '../components/ui/MysticButton';
import { isValidTCKN, isEmail } from '../utils/validation';

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [tcIdentity, setTcIdentity] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email:'', password:'', firstName:'', lastName:'', tc:'' });

	const validate = () => {
		const next = { email:'', password:'', firstName:'', lastName:'', tc:'' };
		if (!firstName.trim()) next.firstName = 'Ad gerekli';
		if (!lastName.trim()) next.lastName = 'Soyad gerekli';
		if (!email.trim()) next.email = 'E-posta gerekli'; else if(!isEmail(email.trim())) next.email = 'Geçersiz e-posta';
		if (!password || password.length < 6) next.password = 'Min 6 karakter';
		if (tcIdentity && !isValidTCKN(tcIdentity)) next.tc = 'Geçersiz T.C. Kimlik';
		setErrors(next);
		return Object.values(next).every(v => !v);
	};

  const onRegister = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert('Başarılı','Kayıt tamamlandı.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Kayıt Başarısız', e.message);
    } finally {
      setLoading(false);
    }
  };

  const bg = 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1887&auto=format&fit=crop';

  return (
    <ImageBackground source={{ uri: bg }} style={{ flex:1 }} imageStyle={{ opacity:0.32 }}>
      <View style={styles.overlay} />
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mistik Yolculuğa Katıl</Text>
        <Text style={styles.subtitle}>Enerji alanını seninle genişletelim</Text>

        <View style={styles.grid}> 
          <View style={styles.col}> 
            <FormField label="Ad" icon="person-outline" value={firstName} onChangeText={setFirstName} placeholder="Ad" autoCapitalize="words" error={errors.firstName} required />
          </View>
          <View style={styles.col}> 
            <FormField label="Soyad" icon="person-outline" value={lastName} onChangeText={setLastName} placeholder="Soyad" autoCapitalize="words" error={errors.lastName} required />
          </View>
        </View>
        <FormField label="T.C. Kimlik No" icon="id-card-outline" value={tcIdentity} onChangeText={setTcIdentity} placeholder="###########" keyboardType="numeric" error={errors.tc} helperText={!errors.tc && tcIdentity.length>0 ? 'İsteğe bağlı alan' : undefined} />
        <FormField label="Cinsiyet" icon="male-female-outline" value={gender} onChangeText={setGender} placeholder="Cinsiyet" />
        <FormField label="İl" icon="location-outline" value={city} onChangeText={setCity} placeholder="İl" />
        <FormField label="İlçe" icon="navigate-outline" value={district} onChangeText={setDistrict} placeholder="İlçe" />
        <FormField label="E-posta" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="ornek@mail.com" autoCapitalize="none" keyboardType="email-address" error={errors.email} required />
        <FormField label="Şifre" icon="lock-closed-outline" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry enableVisibilityToggle error={errors.password} required />
        <FormField label="Telefon" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="05XXXXXXXXX" keyboardType="phone-pad" />

        <MysticButton
          title={loading ? 'Kayıt oluşturuluyor...' : 'Kayıt Ol'}
          onPress={onRegister}
          loading={loading}
          variant="gold"
          fullWidth
          style={{ marginTop: spacing(2) }}
        />

        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing(5) }}>
          <Text style={styles.altText}>Zaten hesabın var mı? <Text style={styles.altTextAccent}>Giriş yap</Text></Text>
        </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay:{...StyleSheet.absoluteFillObject, backgroundColor:'rgba(11,10,16,0.88)'},
  scroll:{flexGrow:1, padding:spacing(6), paddingBottom:spacing(12)},
  title:{fontSize:26, fontWeight:'800', color:colors.accent, textAlign:'center', marginTop:spacing(6), letterSpacing:1},
  subtitle:{fontSize:13, color:colors.textSecondary, textAlign:'center', marginBottom:spacing(6), marginTop:spacing(1), letterSpacing:0.5},
  label:{color:colors.textSecondary, fontSize:12, fontWeight:'600', marginBottom:spacing(1), marginTop:spacing(2)},
  input:{borderWidth:1, borderColor:'rgba(255,255,255,0.14)', backgroundColor:'rgba(255,255,255,0.07)', paddingVertical:spacing(3), paddingHorizontal:spacing(3), borderRadius:radius.md, color:colors.textPrimary, fontSize:14},
  button:{marginTop:spacing(4), backgroundColor:colors.accent, paddingVertical:spacing(3.5), borderRadius:radius.lg, alignItems:'center'},
  buttonText:{color:'#1F1233', fontWeight:'800', fontSize:16, letterSpacing:0.5},
  altText:{color:colors.textMuted, textAlign:'center', fontSize:13},
  altTextAccent:{color:colors.accent},
  grid:{flexDirection:'row', gap:spacing(3)},
  col:{flex:1},
});
