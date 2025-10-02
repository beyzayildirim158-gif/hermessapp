// Tüm kullanıcılara Expo push bildirimi göndermek için script
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp({
  credential: admin.credential.cert(require('C:\\Users\\beyza\\HermessApp\\hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json'))
});

const db = admin.firestore();

async function getAllTokens() {
  const snapshot = await db.collection('userTokens').get();
  return snapshot.docs.map(doc => doc.data().token).filter(Boolean);
}

async function sendExpoNotification(tokens, title, body) {
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
  }));

  const chunks = [];
  const chunkSize = 100;
  for (let i = 0; i < messages.length; i += chunkSize) {
    chunks.push(messages.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunk),
    });
  }
  console.log('Bildirimler gönderildi!');
}

(async () => {
  const tokens = await getAllTokens();
  if (!tokens.length) {
    console.log('Hiç token yok!');
    return;
  }
  await sendExpoNotification(tokens, 'HermessApp Duyuru', 'Tüm kullanıcılara test bildirimi!');
})();
