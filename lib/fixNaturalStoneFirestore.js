// Eksik disease alanlarını Firestore'da tamamlamak için script
const admin = require('firebase-admin');
const stoneData = require('../data/NaturalStoneData.js').default;

admin.initializeApp({
  credential: admin.credential.cert(require('C:\\Users\\beyza\\HermessApp\\hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json'))
});

const db = admin.firestore();

async function fixStones() {
  for (const disease in stoneData) {
    for (const stone of stoneData[disease]) {
      // Firestore'da aynı isimde taş varsa güncelle
      const snapshot = await db.collection('naturalStones').where('name', '==', stone.name).get();
      snapshot.forEach(async doc => {
        await db.collection('naturalStones').doc(doc.id).update({
          disease: disease
        });
        console.log(`Güncellendi: ${stone.name} -> ${disease}`);
      });
    }
  }
  console.log('Eksik disease alanları tamamlandı!');
}

fixStones().catch(console.error);
