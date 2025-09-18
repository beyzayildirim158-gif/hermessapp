import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert('Başarılı', 'Kayıt tamamlandı, giriş yapıldı.');
    } catch (e) {
      Alert.alert('Kayıt başarısız', e.message);
    }
  };

  return (
    <View style={{ flex:1, padding:24, justifyContent:'center' }}>
      <Text style={{ fontSize:22, fontWeight:'600', marginBottom:16 }}>Kayıt Ol</Text>

      <TextInput placeholder="E-posta" autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail}
        style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, marginBottom:12 }} />
      <TextInput placeholder="Şifre (min 6 karakter)" secureTextEntry value={password} onChangeText={setPassword}
        style={{ borderWidth:1, borderColor:'#ddd', borderRadius:10, padding:12, marginBottom:16 }} />

      <TouchableOpacity onPress={onRegister} style={{ backgroundColor:'#6C47FF', padding:14, borderRadius:12 }}>
        <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>Kayıt Ol</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop:16 }}>
        <Text style={{ textAlign:'center' }}>Zaten hesabın var mı? <Text style={{ color:'#6C47FF' }}>Giriş yap</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
