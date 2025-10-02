// Firebase Admin SDK'yı ve Functions modülünü içe aktar
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin SDK'yı başlat (eğer başlatılmamışsa)
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// ----------------------------------------------------------------------
// YÖNETİCİ BİLDİRİMİ GÖNDERME FONKSİYONU
// React Native uygulamasından httpsCallable ile çağrılacak.
// ----------------------------------------------------------------------

exports.sendAdminNotification = functions.https.onCall(async (data, context) => {
    // BURAYI KENDİ YÖNETİCİ UID'NİZ İLE DEĞİŞTİRİN
    const ADMIN_UID = "5wKd7TU3ltgoWVBNXan6MojNzz92"; 
    
    // 1. Yetkilendirme Kontrolü
    // Çağrıyı yapan kullanıcının yönetici UID'si ile eşleştiğinden emin olun.
    if (!context.auth || context.auth.uid !== ADMIN_UID) {
        // Yetkisiz erişimi engelle
        throw new functions.https.HttpsError('permission-denied', 'Yönetici yetkisi gerekli. Bu işlemi yapmaya izniniz yok.');
    }

    // 2. Giriş Verisi Kontrolü
    const message = data.message;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Geçerli bir bildirim mesajı sağlanmalıdır.');
    }
    
    // 3. Bildirim İçeriği (FCM Payload)
    // Bu, tüm aktif cihazlara gönderilecek olan mesajdır.
    const payload = {
        notification: {
            title: 'Hermess Healing Duyuru',
            body: message,
            sound: 'default' // Cihazın varsayılan bildirim sesi
        },
        data: {
            type: 'admin_announcement',
            timestamp: new Date().toISOString()
        }
    };
    
    // 4. Hedef Belirleme
    // Tüm kullanıcılara gönderim için ortak bir FCM konusunu ('all_users' gibi) hedefleyin. 
    // Not: Tüm cihazların bu konuya abone olması gerekir.
    const topic = 'all_users'; 

    try {
        // Belirtilen konuya mesaj gönder
        const response = await admin.messaging().sendToTopic(topic, payload);
        
        console.log('Bildirim başarıyla gönderildi:', response);
        
        return { 
            message: `${response.successCount} cihaza bildirim başarıyla gönderildi. Hata: ${response.failureCount}`,
            success: true
        };
        
    } catch (error) {
        console.error("Bildirim gönderme hatası:", error);
        // Hata durumunda istemciye uygun bir yanıt döndür
        throw new functions.https.HttpsError('internal', 'Bildirim gönderme servisi sırasında beklenmeyen bir hata oluştu.', error);
    }
});
