// App.js
import 'react-native-gesture-handler';
import * as React from 'react';
import { Text, View, ActivityIndicator, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';

import { auth, onAuthStateChanged, db, serverTimestamp } from './lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// -------- Sekmeli ekranlar --------
function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems:'center', justifyContent:'center' }}>
      <Text style={{ fontSize: 20 }}>🏠 Ana</Text>
    </View>
  );
}

function ExploreScreen() {
  const [text, setText] = React.useState('');
  const [items, setItems] = React.useState([]);

  // Firestore'dan canlı oku
  React.useEffect(() => {
    const q = query(collection(db, 'items'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(list);
    }, (e) => {
      console.log('SNAPSHOT_ERROR', e);
      Alert.alert('Okuma hatası', String(e?.message || e));
    });
    return unsub;
  }, []);

  // Firestore'a ekle
  const addItem = async () => {
    const t = text.trim();
    if (!t) {
      Alert.alert('Uyarı', 'Lütfen bir başlık yaz.');
      return;
    }
    try {
      await addDoc(collection(db, 'items'), {
        title: t,
        uid: auth.currentUser ? auth.currentUser.uid : null,
        createdAt: serverTimestamp(),
      });
      setText('');
    } catch (e) {
      console.log('ADD_ERROR', e);
      Alert.alert('Kaydetme hatası', String(e?.message || e));
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600', marginBottom: 12 }}>✨ Keşfet</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TextInput
          placeholder="Yeni öğe (örn: İlk postum)"
          value={text}
          onChangeText={setText}
          style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
        />
        <TouchableOpacity onPress={addItem} style={{ backgroundColor: '#6C47FF', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Ekle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={{ padding: 14, borderWidth: 1, borderColor: '#eee', borderRadius: 12 }}>
            <Text style={{ fontSize: 16 }}>{item.title || '—'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>Henüz öğe yok. Yukarıdan ekle ✨</Text>}
      />
    </View>
  );
}

function ProfileScreen() {
  const onLogout = () => auth.signOut();
  return (
    <View style={{ flex: 1, alignItems:'center', justifyContent:'center', gap: 12 }}>
      <Text style={{ fontSize: 20 }}>👤 Profil</Text>
      <Text style={{ color:'#666' }}>{auth.currentUser?.email || 'Giriş yok'}</Text>
      <TouchableOpacity onPress={onLogout} style={{ backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C47FF',
        tabBarInactiveTintColor: '#777',
        tabBarIcon: ({ color, size }) => {
          // Ionicons'ta garantili ikon isimleri
          const iconMap = {
            'Ana': 'home',
            'Keşfet': 'compass-outline',
            'Profil': 'person-circle-outline',
          };
          const name = iconMap[route.name] || 'ellipse-outline';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ana" component={HomeScreen} />
      <Tab.Screen name="Keşfet" component={ExploreScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş' }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = React.useState(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <Tabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
