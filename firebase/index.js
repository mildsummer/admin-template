const admin = require('firebase-admin');
const serviceAccount = require('./key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://project-id.firebaseio.com',
});

const db = admin.firestore();
const batch = db.batch();

//データ生成
for (let i = 1; i <= 100; i++) {
  const docId = db.collection('members').doc().id;
  const memberId = ('000000000' + i).slice(-10);
  const name = "user" + i;
  const email = "user" + i + "@test.com";
  const age = Math.floor(Math.random() * 60) + 15;

  const areas = ['東京', '大阪', '福岡', '仙台', '札幌'];
  const address = areas[Math.floor(Math.random() * areas.length)];

  batch.set(db.collection('members').doc(docId), {
    docId: docId,
    memberId: memberId,
    name: name,
    email: email,
    age: age,
    address: address,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    keywords: [docId, memberId, name, email, age.toString(), address],
    id: i
  });

  console.log("create data no" + i);
}

batch.commit().then(() => {
  console.log('success');
}).catch((error) => {
  console.error(error);
});
