// Tüm taş görsellerini Firebase Storage'a yükleyip Firestore'da imageUrl olarak güncelleyen script
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(require('C:\\Users\\beyza\\HermessApp\\hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json')),
  storageBucket: 'hermessapp-5b6ec.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const imagesDir = path.join(__dirname, '../components/stoneImages');

async function uploadImagesAndUpdateFirestore() {
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png'));
  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const stoneName = path.basename(file, '.png');
    const dest = `stones/${file}`;
    // Storage'a yükle
    await bucket.upload(filePath, { destination: dest, public: true });
    const fileRef = bucket.file(dest);
    const [url] = await fileRef.getSignedUrl({ action: 'read', expires: '03-01-2030' });
    // Firestore'da taş adını bul ve imageUrl ekle
    const snapshot = await db.collection('naturalStones').where('name', '==', stoneName).get();
    snapshot.forEach(async doc => {
      await db.collection('naturalStones').doc(doc.id).update({ imageUrl: url });
      console.log(`Görsel yüklendi ve güncellendi: ${stoneName}`);
    });
  }
  console.log('Tüm taş görselleri Firebase Storage ve Firestore imageUrl olarak güncellendi!');
}

uploadImagesAndUpdateFirestore().catch(console.error);
