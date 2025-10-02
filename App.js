import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Dimensions, StyleSheet, TextInput, Alert, Image, ImageBackground } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { WebView } from 'react-native-webview';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app, auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { colors as MColors } from './theme/mysticTheme';
import { MysticBackground, GlassCard } from './theme/MysticUI';
// Mağaza bileşen kalıntıları temizlendi.
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
// Lazy loaded heavy screens
const TarotScreen = React.lazy(() => import('./screens/TarotScreen'));
import IntroSplash from './components/IntroSplash';
import FormField from './components/ui/FormField';
import MysticButton from './components/ui/MysticButton';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
const NaturalStoneGuide = React.lazy(() => import('./components/NaturalStoneGuide'));
const AnalyticsScreen = React.lazy(() => import('./screens/AnalyticsScreen'));
// Notifications & Device zaten dosya başında import edildi; yinelenen import kaldırıldı.

// --- ÜST BÖLÜM YARDIMCI İŞLEVLER (Importlardan sonra taşındı) ---
const openNotificationSettings = () => {
    Alert.alert('Bildirim Ayarları', 'Bildirim izni durumu: ' + (Device.isDevice ? 'Aktif' : 'Pasif'));
};

const openPrivacySettings = () => {
    Alert.alert('Gizlilik', 'Kişisel verileriniz uygulama dışında paylaşılmaz. Detaylı ayarlar yakında eklenecek.');
};

const openHelpSupport = () => {
    Alert.alert('Yardım & Destek', 'Destek için: info@hermesshealing.com\nSıkça Sorulan Sorular için web sitemizi ziyaret edin.');
};

const openPrivacyPolicy = () => {
    Alert.alert('Gizlilik Politikası', 'https://hermesshealing.com/gizlilik-politikasi adresinden detaylara ulaşabilirsiniz.');
};

const { width } = Dimensions.get('window');
// Global navigation ref for programmatic navigations (e.g., from notifications)
export const navigationRef = createNavigationContainerRef();

const ADMIN_UID = "5wKd7TU3ltgoWVBNXan6MojNzz92";
const AI_ENDPOINT = 'https://europe-central2-hermessapp-5b6ec.cloudfunctions.net/tarotreading';
const MYSTICAL_PURPLE_TEXTURE = 'https://gemini.google.com/app/f6d76fdafc0dd141';
const storage = getStorage(app);
const MyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: MColors.primary || '#6C47FF',
        background: MColors.bgDark || '#0B0A10',
        text: MColors.textPrimary || '#F5F3FF',
        card: MColors.surface || 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.12)',
        notification: MColors.accent || '#FFD700',
    },
};

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Seçilen görseli Firebase Storage'a yükler ve indirme URL'sini döndürür
const uploadImageAndGetUrl = async (uri) => {
    if (!uri) return null;

    try {
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function (e) {
                console.error("Blob hatası:", e);
                reject(new TypeError("Network request failed"));
            };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });

        // Dosya adını ve yolunu oluştur
        const filename = uri.substring(uri.lastIndexOf('/') + 1);
        const storageRef = ref(storage, `notifications/${Date.now()}_${filename}`);

        // Görseli yükle
        const uploadTask = uploadBytesResumable(storageRef, blob);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Yükleme %' + progress.toFixed(0));
                },
                (error) => {
                    console.error('Firebase Storage yükleme hatası:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('Görsel URL:', downloadURL);
                        resolve(downloadURL);
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Görsel yükleme sürecinde hata:', error);
        throw new Error('Görsel yüklenemedi: ' + error.message);
    }
};

// Push bildirim izni ve token alma yardımcı fonksiyonu
async function registerForPushNotificationsAsync() {
    try {
        if (!Device.isDevice) {
            console.log('Bildirimler yalnızca gerçek cihazlarda desteklenir.');
            return null;
        }

        // İzin kontrolü
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Push bildirimi izni verilmedi.');
            return null;
        }

        // Expo push token al (sdk 48+ projectId gerekli olabilir)
        let tokenData;
        try {
            tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: '373a40d7-3654-4794-9dbf-14e97bfc7c8e'
            });
        } catch (e) {
            console.log('Token alınırken hata (projectId opsiyonu olmadan tekrar dene):', e?.message);
            tokenData = await Notifications.getExpoPushTokenAsync();
        }
        const token = tokenData?.data;
        if (token) {
            await saveUserToken(token);
            console.log('Expo Push Token:', token);
        }

        // Android kanal ayarı
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FFD700',
                lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            });
        }
        return token;
    } catch (err) {
        console.warn('registerForPushNotificationsAsync hata:', err?.message || err);
        return null;
    }
}

// Kullanıcı token kaydetme fonksiyonu (geliştirilebilir, şu an loglama yapıyor)
const saveUserToken = async (token) => {
    try {
        if (auth.currentUser) {
            // Token kaydetme işlemi burada yapılabilir
        }
    } catch (error) {
        console.error('Token kaydetme hatası:', error);
    }
};

const sendExpoPushNotification = async (token, message, imageUrl = null) => {
    try {
        const payload = {
            to: token,
            sound: 'default',
            title: 'Hermess Healing',
            body: message,
            data: { imageUrl: imageUrl || undefined },
        };
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return await response.json();
    } catch (error) {
        throw error;
    }
};

// --- BİLEŞENLER ---

function WebsiteHomeScreen() {
    const insets = useSafeAreaInsets();
    return (
        <View style={[appStyles.screenContainer, { paddingTop: insets.top }]}>
            <WebView 
                source={{ uri: 'https://www.hermesshealing.com' }}
                style={appStyles.webViewStyle}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={appStyles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6C47FF" />
                        <Text style={{ marginTop: 10, color: '#666' }}>Hermesshealing'e Hoş Geldiniz...</Text>
                    </View>
                )}
            />
        </View>
    );
}

function AdminNotificationScreen() {
    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userTokens, setUserTokens] = useState(['ExponentPushToken[SDeoIwKEznGJhZKGABWi42]']); 
    const [mode, setMode] = useState('push'); // 'push' | 'analytics'
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadUserTokens();
    }, []);

    const loadUserTokens = async () => {
        try {
            const tokens = [
                'ExponentPushToken[SDeoIwKEznGJhZKGABWi42]',
            ];
            setUserTokens(tokens.filter(t => t && t.length > 20)); 
        } catch (error) {
            console.error('Tokenlar yüklenirken hata:', error);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Reddedildi', 'Bildirim görseli yüklemek için medya erişim iznine ihtiyacımız var.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
            setImageUrl(''); 
        }
    };

    const sendNotificationToAllUsers = async () => {
        if (!message.trim()) {
            Alert.alert("Hata", "Lütfen bir bildirim mesajı girin.");
            return;
        }

        if (userTokens.length === 0) {
            Alert.alert("Bilgi", "Henüz bildirim gönderebileceğiniz geçerli kullanıcı token'ı bulunmuyor.");
            return;
        }

        setLoading(true);
        let finalImageUrl = null;

        try {
            if (imageUri) {
                Alert.alert("Görsel Yükleniyor", "Seçilen görsel sunucuya yükleniyor, lütfen bekleyin..."); 
                const uploadedUrl = await uploadImageAndGetUrl(imageUri);
                finalImageUrl = uploadedUrl;
            } else if (imageUrl.trim()) {
                finalImageUrl = imageUrl.trim();
            }
            
            const promises = userTokens.map(token => 
                sendExpoPushNotification(token, message, finalImageUrl)
            );

            const results = await Promise.allSettled(promises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            
            Alert.alert("Başarılı", `Bildirim ${userTokens.length} kullanıcıya gönderildi. Başarılı gönderim: ${successful}`);
            
            setMessage('');
            setImageUrl(''); 
            setImageUri(null);
            
        } catch (error) {
            console.error("Bildirim veya yükleme hatası:", error);
            Alert.alert("Hata", `İşlem başarısız oldu: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[adminStyles.screenContainer, { paddingTop: insets.top }]}> 
            <ScrollView contentContainerStyle={adminStyles.scrollContainer}>
                <Text style={adminStyles.headerText}>Yönetim Paneli</Text>
                <View style={adminStyles.modeSwitchRow}>
                    <TouchableOpacity onPress={() => setMode('push')} style={[adminStyles.modeButton, mode==='push' && adminStyles.modeButtonActive]}>
                        <Text style={[adminStyles.modeButtonText, mode==='push' && adminStyles.modeButtonTextActive]}>Bildirim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMode('analytics')} style={[adminStyles.modeButton, mode==='analytics' && adminStyles.modeButtonActive]}>
                        <Text style={[adminStyles.modeButtonText, mode==='analytics' && adminStyles.modeButtonTextActive]}>Analitik</Text>
                    </TouchableOpacity>
                </View>
                {mode === 'analytics' && (
                    <React.Suspense fallback={<ActivityIndicator size="large" color={MColors.accent} style={{ marginTop:40 }} /> }>
                        <AnalyticsScreen />
                    </React.Suspense>
                )}
                {mode === 'push' && (
                <View style={{ marginTop: 8 }}>
                    <Text style={adminStyles.subText}>Mesajı ve isteğe bağlı olarak görseli tüm kullanıcılara gönderin.</Text>
                    <View style={adminStyles.statsContainer}>
                        <Text style={adminStyles.statsText}>Aktif kullanıcı (Token) sayısı: {userTokens.length}</Text>
                    </View>
                    <TextInput style={adminStyles.input} placeholder="Bildirim Mesajı..." placeholderTextColor="#9ca3af" value={message} onChangeText={setMessage} multiline numberOfLines={3} />
                    <Text style={adminStyles.label}>Görsel Ekle (Opsiyonel)</Text>
                    <TouchableOpacity style={adminStyles.imagePickButton} onPress={pickImage} disabled={loading}>
                        <Ionicons name="image-outline" size={24} color="#fff" />
                        <Text style={adminStyles.imagePickButtonText}>{imageUri ? 'Görseli Değiştir' : 'Cihazdan Görsel Seç'}</Text>
                    </TouchableOpacity>
                    {imageUri && (
                        <View style={adminStyles.imagePreviewContainer}>
                            <Image source={{ uri: imageUri }} style={adminStyles.imagePreview} />
                            <Text style={adminStyles.imagePreviewText}>Yerel Görsel Seçildi</Text>
                        </View>
                    )}
                    <Text style={adminStyles.orText}>VEYA Harici URL Girin</Text>
                    <TextInput style={[adminStyles.input, {minHeight: 50, marginBottom: 30}]} placeholder="Görsel URL'si (Örn: https://example.com/image.jpg)" placeholderTextColor="#9ca3af" value={imageUrl} onChangeText={setImageUrl} keyboardType="url" multiline={false} editable={!imageUri} />
                    <TouchableOpacity style={[adminStyles.button, loading && adminStyles.buttonDisabled]} onPress={sendNotificationToAllUsers} disabled={loading || message.trim().length === 0 || userTokens.length === 0}>
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={adminStyles.buttonText}>{userTokens.length > 0 ? `${userTokens.length} Kullanıcıya Gönder` : 'Kullanıcı Yok'}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={[adminStyles.secondaryButton, loading && adminStyles.buttonDisabled]} onPress={loadUserTokens} disabled={loading}>
                        <Text style={adminStyles.secondaryButtonText}>Token'ları Yenile</Text>
                    </TouchableOpacity>
                </View>
                )}
            </ScrollView>
        </View>
    );
}

function ExploreScreen() {
    const insets = useSafeAreaInsets();
    return (
        <MysticBackground>
            <KeyboardAvoidingView style={{ flex:1, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={[exploreStyles.scrollContainer, { padding:16, paddingBottom:140 }]}> 
                    <GlassCard padding={5} style={{ marginBottom:16 }}>
                        <Text style={{ fontSize:20, fontWeight:'800', color:MColors.accent, marginBottom:6 }}>Doğal Taşlar Rehberi</Text>
                        <Text style={{ fontSize:12, color:MColors.textSecondary, lineHeight:18 }}>Titreşimsel frekansları keşfet ve enerjini dengele.</Text>
                    </GlassCard>
                    <React.Suspense fallback={<View style={{ padding:32, alignItems:'center' }}><ActivityIndicator size="large" color={MColors.accent} /><Text style={{ marginTop:12, color:MColors.textSecondary }}>Taş Rehberi Yükleniyor...</Text></View>}>
                        <NaturalStoneGuide />
                    </React.Suspense>
                </ScrollView>
            </KeyboardAvoidingView>
        </MysticBackground>
    );
}

function ProfileScreen() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        birthDate: '',
        bio: ''
    });

    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (auth.currentUser) {
            setUser(auth.currentUser);
            setFormData({
                displayName: auth.currentUser.displayName || '',
                email: auth.currentUser.email || '',
                phone: '',
                birthDate: '',
                bio: ''
            });
            registerForPushNotificationsAsync();
        }
    }, [auth.currentUser]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('İzin Reddedildi', 'Profil fotoğrafı yüklemek için medya erişim iznine ihtiyacımız var.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const updateProfileHandler = async () => {
        if (!user) return;

        setLoading(true);
        try {
            let photoURL = user.photoURL;
            
            // Profil fotoğrafını yükle
            if (profileImage) {
                const uploadedUrl = await uploadImageAndGetUrl(profileImage);
                photoURL = uploadedUrl;
            }

            // Firebase Authentication profilini güncelle
            await updateProfile(auth.currentUser, {
                displayName: formData.displayName,
                photoURL: photoURL,
            });

            // Kullanıcı bilgilerini güncelle
            setUser({
                ...auth.currentUser,
                displayName: formData.displayName,
                photoURL: photoURL
            });

            Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
            setEditing(false);
        } catch (error) {
            console.error('Profil güncelleme hatası:', error);
            Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async () => {
        Alert.prompt(
            'Şifre Değiştir',
            'Yeni şifrenizi girin:',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Değiştir',
                    onPress: async (password) => {
                        if (password && password.length >= 6) {
                            try {
                                await updatePassword(auth.currentUser, password);
                                Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.');
                            } catch (error) {
                                console.error('Şifre değiştirme hatası:', error);
                                Alert.alert('Hata', 'Şifre değiştirilirken bir hata oluştu: ' + error.message);
                            }
                        } else {
                            Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
                        }
                    }
                }
            ],
            'secure-text'
        );
    };

    const deleteAccount = () => {
        Alert.alert(
            'Hesabı Sil',
            'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet, Sil',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteUser(auth.currentUser);
                            Alert.alert('Başarılı', 'Hesabınız başarıyla silindi.');
                        } catch (error) {
                            console.error('Hesap silme hatası:', error);
                            Alert.alert('Hata', 'Hesap silinirken bir hata oluştu: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    const onLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Çıkış yapmak istediğinizden emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet, Çıkış Yap',
                    style: 'destructive',
                    onPress: () => auth.signOut()
                }
            ]
        );
    };

    if (!user) {
        return (
            <View style={[profileStyles.screenContainer, { paddingTop: insets.top }]}>
                <View style={profileStyles.container}>
                    <Text style={profileStyles.errorText}>Kullanıcı bilgileri yüklenemedi.</Text>
                </View>
            </View>
        );
    }

    return (
        <MysticBackground>
            <ScrollView style={[profileStyles.scrollContainer, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom:140 }}>
                {/* Profil Header */}
                <GlassCard padding={6} style={{ margin:16, marginTop:0 }}>
                    <View style={{ alignItems:'center' }}>
                        <Ionicons name="person-circle" size={100} color={MColors.accent} />
                        <Text style={{ fontSize:24, fontWeight:'800', color:MColors.accent, marginTop:4 }}>{formData.displayName || 'Kullanıcı'}</Text>
                        <Text style={{ fontSize:14, color:MColors.textSecondary, marginBottom:16 }}>{user.email}</Text>
                        <TouchableOpacity onPress={() => setEditing(!editing)} style={{ flexDirection:'row', alignItems:'center', backgroundColor:MColors.accent, paddingHorizontal:18, paddingVertical:10, borderRadius:30 }}>
                            <Ionicons name={editing ? 'close' : 'create-outline'} size={18} color="#1F1233" />
                            <Text style={{ color:'#1F1233', fontWeight:'700', marginLeft:6 }}>{editing ? 'İptal' : 'Profili Düzenle'}</Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>

                {/* Kişisel Bilgiler */}
                <GlassCard padding={5} style={{ marginHorizontal:16, marginBottom:12 }}>
                    <Text style={{ fontSize:18, fontWeight:'800', color:MColors.accent, marginBottom:16 }}>Kişisel Bilgiler</Text>
                    <View style={{ gap:16 }}>
                        <View style={profileStyles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#6C47FF" />
                            <TextInput
                                style={profileStyles.input}
                                placeholder="Ad Soyad"
                                value={formData.displayName}
                                onChangeText={(text) => setFormData(prev => ({...prev, displayName: text}))}
                                editable={editing}
                            />
                        </View>

                        <View style={profileStyles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#6C47FF" />
                            <TextInput
                                style={profileStyles.input}
                                placeholder="E-posta"
                                value={formData.email}
                                keyboardType="email-address"
                                editable={false}
                            />
                        </View>

                        <View style={profileStyles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="#6C47FF" />
                            <TextInput
                                style={profileStyles.input}
                                placeholder="Telefon"
                                value={formData.phone}
                                onChangeText={(text) => setFormData(prev => ({...prev, phone: text}))}
                                keyboardType="phone-pad"
                                editable={editing}
                            />
                        </View>

                        <View style={profileStyles.inputContainer}>
                            <Ionicons name="calendar-outline" size={20} color="#6C47FF" />
                            <TextInput
                                style={profileStyles.input}
                                placeholder="Doğum Tarihi (GG.AA.YYYY)"
                                value={formData.birthDate}
                                onChangeText={(text) => setFormData(prev => ({...prev, birthDate: text}))}
                                editable={editing}
                            />
                        </View>

                        <View style={profileStyles.inputContainer}>
                            {/* Hakkımda alanı kaldırıldı */}
                        </View>

                        {editing && (
                            <TouchableOpacity
                                style={{ backgroundColor:MColors.accent, padding:16, borderRadius:18, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:8 }}
                                onPress={updateProfileHandler}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#1F1233" />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={20} color="#1F1233" />
                                        <Text style={{ color:'#1F1233', fontWeight:'800', fontSize:16 }}>Değişiklikleri Kaydet</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </GlassCard>

                {/* Hesap Ayarları */}
                <GlassCard padding={5} style={{ marginHorizontal:16, marginBottom:12 }}>
                    <Text style={{ fontSize:18, fontWeight:'800', color:MColors.accent, marginBottom:8 }}>Hesap Ayarları</Text>
                    <TouchableOpacity style={profileStyles.menuItem} onPress={changePassword}>
                        <Ionicons name="key-outline" size={24} color="#6C47FF" />
                        <Text style={profileStyles.menuText}>Şifre Değiştir</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={profileStyles.menuItem} onPress={openNotificationSettings}> 
                        <Ionicons name="notifications-outline" size={24} color="#6C47FF" />
                        <Text style={profileStyles.menuText}>Bildirim Ayarları</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={profileStyles.menuItem} onPress={openPrivacySettings}> 
                        <Ionicons name="shield-checkmark-outline" size={24} color="#6C47FF" />
                        <Text style={profileStyles.menuText}>Gizlilik</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </GlassCard>

                {/* Uygulama Bilgileri */}
                <GlassCard padding={5} style={{ marginHorizontal:16, marginBottom:12 }}>
                    <Text style={{ fontSize:18, fontWeight:'800', color:MColors.accent, marginBottom:8 }}>Uygulama</Text>
                    
                    <View style={profileStyles.infoContainer}>
                        <Text style={profileStyles.infoTitle}>Sürüm</Text>
                        <Text style={profileStyles.infoText}>1.0.0</Text>
                    </View>

                    <View style={profileStyles.infoContainer}>
                        <Text style={profileStyles.infoTitle}>Son Güncelleme</Text>
                        <Text style={profileStyles.infoText}>15 Kasım 2024</Text>
                    </View>

                <TouchableOpacity style={profileStyles.menuItem} onPress={openHelpSupport}> 
                    <Ionicons name="help-circle-outline" size={24} color="#6C47FF" />
                    <Text style={profileStyles.menuText}>Yardım & Destek</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity style={profileStyles.menuItem} onPress={openPrivacyPolicy}> 
                    <Ionicons name="document-text-outline" size={24} color="#6C47FF" />
                    <Text style={profileStyles.menuText}>Gizlilik Politikası</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
                </GlassCard>

                {/* Tehlikeli İşlemler */}
                <GlassCard padding={5} style={{ margin:16 }}>
                    <Text style={{ fontSize:18, fontWeight:'800', color:MColors.accent, marginBottom:8 }}>Tehlikeli İşlemler</Text>
                    
                    <TouchableOpacity style={profileStyles.dangerMenuItem} onPress={deleteAccount}>
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        <Text style={profileStyles.dangerMenuText}>Hesabı Sil</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={profileStyles.dangerMenuItem} onPress={onLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                        <Text style={profileStyles.dangerMenuText}>Çıkış Yap</Text>
                    </TouchableOpacity>
                </GlassCard>
            </ScrollView>
        </MysticBackground>
    );
}

function NumerologyScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [numerologyReading, setNumerologyReading] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [touched, setTouched] = useState({ first:false, last:false, date:false });
    const insets = useSafeAreaInsets();

    const handleBirthDateChange = (text) => {
        let digits = text.replace(/[^0-9]/g, '');

        if (digits.length > 8) {
            digits = digits.substring(0, 8);
        }

        let formatted = '';

        for (let i = 0; i < digits.length; i++) {
            formatted += digits[i];
            
            if (i === 1 && digits.length > 2) {
                formatted += '.';
            } else if (i === 3 && digits.length > 4) {
                formatted += '.';
            }
        }

        setBirthDate(formatted);
    };

    const performNumerologyReading = async () => {
        if (!firstName || !lastName || birthDate.length !== 10) {
            setError('Lütfen tüm alanları doldurun ve tarihi GG.AA.YYYY formatında girin.');
            return;
        }

        const [day, month, year] = birthDate.split('.');
        const dayNum = parseInt(day, 10);
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        if (
            isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum) ||
            dayNum < 1 || dayNum > 31 ||
            monthNum < 1 || monthNum > 12 ||
            yearNum < 1900 || yearNum > 2099
        ) {
            setError('Geçersiz doğum tarihi! Gün: 1-31, Ay: 1-12, Yıl: 1900-2099 aralığında olmalı.');
            return;
        }

    setLoading(true);
        // Analytics: request started (fire and forget)
        (async () => { try { (await import('./lib/analytics')).analytics.numerologyRequested(firstName, lastName); } catch(e) {} })();
        setError(null);
        setNumerologyReading('');

        try {
            const apiBirthDate = `${year}-${month}-${day}`;
            const payload = {
                mode: 'numerology',
                firstName,
                lastName,
                birthDate: apiBirthDate,
            };

            const res = await fetch(AI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json?.error || `AI HTTP ${res.status}`);
            }

            const json = await res.json();
            const text = json?.reading;
            if (text && typeof text === 'string') {
                setNumerologyReading(text);
            } else {
                setError('Yorum alınamadı. Lütfen tekrar deneyin.');
            }
        } catch (e) {
            console.error('Numerology AI error:', e);
            setError(String(e?.message || e) || 'Bir hata oluştu.');
        } finally {
            const hadError = !!error;
            setLoading(false);
            // If we have a reading and no error, log result delivery (defer to next tick)
            if (!hadError) {
                                import('./lib/analytics')
                                    .then(mod => mod.analytics?.numerologyResultDelivered(firstName, lastName))
                                    .catch(()=>{});
            }
        }
    };

    const firstError = touched.first && !firstName ? 'Gerekli' : '';
    const lastError = touched.last && !lastName ? 'Gerekli' : '';
    const dateError = touched.date && birthDate.length !== 10 ? 'Format GG.AA.YYYY' : (error ? error : '');

    return (
        <MysticBackground>
            <KeyboardAvoidingView style={{ flex:1, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={[numerologyStyles.scrollContainer, { padding:20, paddingBottom:140 }]}> 
                    <GlassCard padding={5} style={{ marginBottom:16 }}>
                        <Text style={{ fontSize:26, fontWeight:'800', color:MColors.accent, marginBottom:8 }}>Hermess Numeroloji</Text>
                        <Text style={{ fontSize:13, color:MColors.textSecondary, lineHeight:20 }}>İsmin ve doğum tarihinin kadim sayı dilinde ne söylediğini keşfet.</Text>
                    </GlassCard>

                    <FormField label="İsim" value={firstName} onChangeText={setFirstName} placeholder="İsim" error={firstError} required onBlur={()=>setTouched(t=>({...t,first:true}))} />
                    <FormField label="Soyisim" value={lastName} onChangeText={setLastName} placeholder="Soyisim" error={lastError} required onBlur={()=>setTouched(t=>({...t,last:true}))} />
                    <FormField label="Doğum Tarihi" value={birthDate} onChangeText={handleBirthDateChange} placeholder="GG.AA.YYYY" keyboardType="numeric" error={dateError} required onBlur={()=>setTouched(t=>({...t,date:true}))} helperText={!dateError ? 'Gün.Ay.Yıl' : undefined} />

                    <MysticButton
                        title={loading ? 'Yorumlanıyor...' : 'Analizi Başlat'}
                        onPress={performNumerologyReading}
                        loading={loading}
                        variant="gold"
                        fullWidth
                        disabled={loading || !firstName || !lastName || birthDate.length !== 10}
                        style={{ marginTop: 8 }}
                    />

                    {loading && (
                        <View style={numerologyStyles.loadingContainer}>
                            <ActivityIndicator size="large" color="#ffffff" />
                        </View>
                    )}

                    {numerologyReading ? (
                        <GlassCard padding={5} style={{ marginTop:20 }}>
                            <Text style={{ fontSize:18, fontWeight:'800', color:MColors.accent, marginBottom:12 }}>Numeroloji Yorumunuz</Text>
                            <Text style={{ fontSize:14, color:MColors.textPrimary, lineHeight:22 }}>{numerologyReading}</Text>
                        </GlassCard>
                    ) : null}
                </ScrollView>
            </KeyboardAvoidingView>
        </MysticBackground>
    );
}

// Navigation yapıları
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs({ isAdmin }) {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false, 
                tabBarActiveTintColor: MColors.accent,
                tabBarInactiveTintColor: MColors.textMuted,
                tabBarShowLabel: true,
                sceneContainerStyle: { paddingBottom: 90 },
                tabBarBackground: () => (
                    <BlurView
                        intensity={50}
                        tint="dark"
                        style={{ flex:1, borderTopLeftRadius:28, borderTopRightRadius:28, overflow:'hidden' }}
                    />
                ),
                tabBarStyle: {
                    position: 'absolute',
                    left: 16,
                    right: 16,
                    bottom: 10 + insets.bottom,
                    height: 62,
                    paddingBottom: 8,
                    paddingTop: 6,
                    borderRadius: 32,
                    backgroundColor: 'rgba(20,15,30,0.55)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    overflow: 'hidden'
                },
                tabBarLabelStyle: { 
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                },
                tabBarIcon: ({ color, size, focused }) => {
                    const iconMap = {
                        AnaSayfa: 'home',
                        'Taşların Sırları': 'compass-outline', 
                        Tarot: 'moon-outline',
                        Numeroloji: 'cube-outline',
                        Profil: 'person-circle-outline',
                        Yönetim: 'settings-outline', 
                    };
                    const name = iconMap[route.name] || 'ellipse-outline';
                    return (
                        <View style={{ alignItems:'center', justifyContent:'center' }}>
                            <Ionicons name={name} size={focused ? size + 2 : size} color={color} />
                            {focused && (
                                <View style={{ width:4, height:4, borderRadius:2, backgroundColor: MColors.accent, marginTop:2 }} />
                            )}
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen name="AnaSayfa" component={WebsiteHomeScreen} options={{ tabBarLabel: 'Ana' }} />
            {/* Mağaza sekmesi tamamen kaldırıldı */}
            <Tab.Screen name="Tarot" options={{ tabBarLabel: 'Tarot' }}>
                {() => (
                    <React.Suspense fallback={<View style={appStyles.loadingContainer}><ActivityIndicator size="large" color={MColors.accent} /><Text style={appStyles.loadingText}>Tarot Yükleniyor...</Text></View>}>
                        <TarotScreen />
                    </React.Suspense>
                )}
            </Tab.Screen>
            <Tab.Screen name="Taşların Sırları" component={ExploreScreen} options={{ tabBarLabel: 'Taşlar' }} /> 
            <Tab.Screen name="Numeroloji" component={NumerologyScreen} options={{ tabBarLabel: 'Numeroloji' }} />
            <Tab.Screen name="Profil" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
            {isAdmin && (
                <Tab.Screen 
                    name="Yönetim" 
                    component={AdminNotificationScreen} 
                    options={{ tabBarLabel: 'Yönetim' }} 
                />
            )}
        </Tab.Navigator>
    );
}

function Main({ isAdmin }) {
    useEffect(() => {
        const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('Bildirim alındı:', notification);
            const imageUrl = notification.request.content.data.imageUrl; 
            if (imageUrl) {
                console.log('Görsel URL:', imageUrl);
            }
        });

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Bildirime tıklandı:', response);
        });

        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }, []);

    return (
        <MainStack.Navigator screenOptions={{ headerShown: false }}>
            <MainStack.Screen name="Tabs">
                {(props) => <Tabs {...props} isAdmin={isAdmin} />}
            </MainStack.Screen>
        </MainStack.Navigator>
    );
}

export default function App() {
    // Bildirimden gelen data ile sayfa yönlendirme
    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const screen = response?.notification?.request?.content?.data?.screen;
            if (screen && navigationRef.current) {
                navigationRef.current.navigate(screen);
            }
        });
        return () => subscription.remove();
    }, []);
    const [user, setUser] = useState(null);
    const [showSplash, setShowSplash] = useState(true);
    const [checking, setChecking] = useState(true);
    const isAdmin = user && user.uid === ADMIN_UID;

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u ?? null);
            setChecking(false);
            if (u) {
                // Session ID oluştur
                const sid = `${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
                import('./lib/analytics').then(mod => {
                    mod.analytics.setSession(sid);
                    mod.analytics.flushQueue();
                }).catch(()=>{});
                // Push register biraz gecikmeli
                setTimeout(() => registerForPushNotificationsAsync(), 600);
            } else {
                import('./lib/analytics').then(mod => mod.analytics.setSession(null)).catch(()=>{});
            }
        });
        return unsub;
    }, []);

    if (checking) {
        return (
            <View style={appStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C47FF" />
                <Text style={appStyles.loadingText}>Hermess Healing Yükleniyor...</Text>
            </View>
    );
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer theme={MyTheme} ref={navigationRef}>
                {user ? (
                    <Main isAdmin={isAdmin} />
                ) : (
                    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                        <AuthStack.Screen name="Login" component={LoginScreen} />
                        <AuthStack.Screen name="Register" component={RegisterScreen} />
                    </AuthStack.Navigator>
                )}
                {showSplash && (
                    <IntroSplash onDone={() => setShowSplash(false)} />
                )}
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

// --- STİL TANIMLARI ---

const appStyles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16
    },
    screenContainer: {
        flex: 1,
        backgroundColor: MyTheme.colors.background
    },
    fullFlex: {
        flex: 1
    },
    webViewStyle: {
        flex: 1
    }
});

const exploreStyles = StyleSheet.create({
    scrollContainer: { 
        flexGrow: 1, 
        padding: 16, 
        paddingBottom: 28 
    },
});

const profileStyles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorText: {
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
    headerContainer: {
        backgroundColor: '#F8FAFC',
        padding: 30,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#6C47FF',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6C47FF',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 20,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#6C47FF',
        gap: 8,
    },
    editButtonText: {
        color: '#6C47FF',
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    textArea: {
        textAlignVertical: 'top',
        minHeight: 80,
    },
    saveButton: {
        backgroundColor: '#6C47FF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    dangerMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 12,
    },
    dangerMenuText: {
        flex: 1,
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '500',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoTitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
});

const adminStyles = StyleSheet.create({
    screenContainer: { 
        flex: 1, 
        backgroundColor: '#f9fafb',
    },
    container: { 
        flex: 1, 
        paddingHorizontal: 20,
    },
    scrollContainer: { 
        flexGrow: 1, 
        paddingVertical: 30,
    },
    input: {
        width: '100%',
        padding: 14,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        color: '#1f2937',
    },
    headerText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: MyTheme.colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subText: {
        fontSize: 15,
        color: '#4b5563',
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    statsContainer: {
        backgroundColor: '#eef2ff',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
    },
    statsText: {
        fontSize: 14,
        fontWeight: '600',
        color: MyTheme.colors.primary,
    },
    button: {
        backgroundColor: MyTheme.colors.primary,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: MyTheme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    secondaryButton: {
        marginTop: 15,
        padding: 10,
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    secondaryButtonText: {
        color: '#4b5563',
        fontWeight: '600',
    },
    imagePickButton: {
        backgroundColor: '#10b981',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        gap: 10,
    },
    imagePickButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    imagePreviewContainer: {
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        resizeMode: 'cover',
        marginBottom: 8,
    },
    imagePreviewText: {
        fontSize: 12,
        color: '#4b5563',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    orText: {
        textAlign: 'center',
        color: '#9ca3af',
        marginVertical: 10,
        fontWeight: '500',
    },
    modeSwitchRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap'
    },
    modeButton: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 22,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    modeButtonActive: {
        backgroundColor: MColors.accent,
        borderColor: MColors.accent
    },
    modeButtonText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 14
    },
    modeButtonTextActive: {
        color: '#1f1330'
    },
});

const numerologyStyles = StyleSheet.create({
    screenContainer: {
        flex: 1,
    },
    imageBackground: {
        flex: 1,
        resizeMode: 'cover',
    },
    imageStyle: {
        opacity: 0.5,
    },
    container: {
        flex: 1,
        backgroundColor: 'rgba(108, 71, 255, 0.4)',
        paddingHorizontal: 20,
    },
    scrollContainer: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingBottom: 16,
    },
    headerContainer: {
    backgroundColor: 'rgba(108, 71, 255, 0.9)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
        borderWidth: 2,
        borderColor: '#FFD700',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFD700',
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 8,
    },
    subText: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    },
    formContainer: {
    backgroundColor: '#f2ececff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
        borderWidth: 2,
        borderColor: '#FFD700',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#6C47FF',
        marginBottom: 24,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#6C47FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    },
    input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#6C47FF',
    backgroundColor: '#FFFFFF',
    height: 28,
    paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
        marginBottom: 10,
        minHeight: 32,
        maxHeight: 32,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ff6b6b',
    },
    errorText: {
        color: '#ff6b6b',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    button: {
        backgroundColor: '#FFD700',
        padding: 18,
        borderRadius: 16, // Daha yuvarlak köşeler
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 12,
        borderWidth: 2,
        borderColor: '#FFD700',
        marginTop: 8, // Butona da biraz aralık
    },
    buttonText: {
        color: '#6C47FF',
        fontWeight: '800',
        fontSize: 18,
    },
    buttonDisabled: {
        opacity: 0.6,
        backgroundColor: '#cccccc',
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(108, 71, 255, 0.8)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FFD700',
        marginBottom: 24,
    },
    loadingText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    resultContainer: {
        backgroundColor: 'rgba(108, 71, 255, 0.9)',
        padding: 24,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#FFD700',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 10,
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFD700',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    resultText: {
        fontSize: 16,
        color: '#FFFFFF',
        lineHeight: 24,
        textAlign: 'justify',
        marginBottom: 20,
        fontWeight: '500',
    },
    shareButton: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    shareButtonText: {
        color: '#FFD700',
        fontWeight: '700',
        fontSize: 16,
    },
    infoBox: {
        backgroundColor: 'rgba(108, 71, 255, 0.8)',
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFD700',
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    infoText: {
        fontSize: 14,
        color: '#FFFFFF',
        lineHeight: 20,
        textAlign: 'center',
        fontWeight: '500',
    },
})