const admin = require('firebase-admin');
const stoneDataModule = require('../data/NaturalStoneData.js');
const stoneData = stoneDataModule.default ? stoneDataModule.default : stoneDataModule;

admin.initializeApp({
  credential: admin.credential.cert(require('C:\\Users\\beyza\\HermessApp\\hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json'))
});

const db = admin.firestore();

async function uploadStones() {
  // stoneData bir obje, her hastalık için bir dizi taş içeriyor
  let allStones = [];
  if (Array.isArray(stoneData)) {
    allStones = stoneData;
  } else {
    Object.values(stoneData).forEach(arr => {
      if (Array.isArray(arr)) {
        allStones = allStones.concat(arr);
      }
    });
  }
  for (const stone of allStones) {
    if (typeof stone === 'object' && stone !== null) {
      await db.collection('naturalStones').add(stone);
      console.log(`Yüklendi: ${stone.name || stone.id}`);
    } else {
      console.log('Geçersiz veri atlandı:', stone);
    }
  }
  console.log('Tüm taşlar Firestore\'a yüklendi!');
}

uploadStones().catch(console.error);