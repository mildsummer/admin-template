const admin = require('firebase-admin');
const serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://project-id.firebaseio.com',
});

const db = admin.firestore();
const batch = db.batch();
const length = 100;
const prefectures = ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'];
const collectionPath = 'members';

(async () => {
  try {
    // データをクリア
    const snapshot = await db.collection('members')
      .get();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // データを作成
    for (let i = 1; i <= length; i++) {
      const docId = db.collection(collectionPath).doc().id;
      const memberId = (`000000000${i}`).slice(-10);
      const name = `user${i}`;
      const email = `user${i}@test.com`;
      const age = Math.floor(Math.random() * 60) + 15;
      const address = prefectures[Math.floor(Math.random() * prefectures.length)];
      batch.set(db.collection(collectionPath).doc(docId), {
        docId: docId,
        memberId: memberId,
        name: name,
        email: email,
        age: age,
        address: address,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        id: i
      });
    }

    // バッチをコミット
    await batch.commit();

    console.log('success');
  } catch (error) {
    console.error(error);
  }
})();
