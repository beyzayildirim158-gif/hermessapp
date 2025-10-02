// Firebase Admin SDK'yı içe aktarın.
const admin = require('firebase-admin');
// Dosya sistemini içe aktarın.
const fs = require('fs');

// Örnek products.json dosyasını yükleyin.
const products = require('./products.json');

// --- BAŞLANGIÇ: Firebase Yönetici Ayarları ---
// Lütfen Firebase projenizin "Hizmet Hesapları" bölümünden indirdiğiniz JSON dosyasının adını buraya girin.
const serviceAccount = require("./hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
// --- SON: Firebase Yönetici Ayarları ---

const db = admin.firestore();

// Veritabanına veri yükleme fonksiyonu.
const uploadData = async () => {
  try {
    console.log("Ürünler Firebase'e yükleniyor...");

    for (const product of products) {
      // products koleksiyonuna her bir ürünü ekle.
      const docRef = await db.collection('products').add(product);
      console.log(`Ürün başarıyla eklendi: ID: ${docRef.id}`);
    }

    console.log("Tüm ürünler başarıyla yüklendi!");
  } catch (error) {
    console.error("Veri yüklenirken bir hata oluştu:", error);
  }
};

// Fonksiyonu çalıştırın.
uploadData();
