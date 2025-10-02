const admin = require('firebase-admin');
const products = require('../products.json');

admin.initializeApp({
  credential: admin.credential.cert(require('C:\\Users\\beyza\\HermessApp\\hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json'))
});

const db = admin.firestore();

async function uploadProducts() {
  for (const product of products) {
    await db.collection('products').add(product);
    console.log(`Yüklendi: ${product.name}`);
  }
  console.log('Tüm ürünler Firestore\'a yüklendi!');
}

uploadProducts().catch(console.error);
