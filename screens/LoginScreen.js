import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert('Giriş başarısız', e.message);
    }
  };

  return (
    <View style={{ flex:1, padding:24, justifyContent:'center' }}>
      <Text style={{ fontSize:22, fontWeight:'600', marginBottom:16 }}>Giriş</Text>

      <TextInput placeholder="E-posta" autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail}
        style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, marginBottom:12 }} />
      <TextInput placeholder="Şifre" secureTextEntry value={password} onChangeText={setPassword}
        style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, marginBottom:16 }} />

      <TouchableOpacity onPress={onLogin} style={{ backgroundColor:'#6C47FF', padding:14, borderRadius:12 }}>
        <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>Giriş Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop:16 }}>
        <Text style={{ textAlign:'center' }}>Hesabın yok mu? <Text style={{ color:'#6C47FF' }}>Kayıt ol</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
