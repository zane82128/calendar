const admin = require('firebase-admin');

function chunkDocs(docs, size) {
  const chunks = [];
  for (let i = 0; i < docs.length; i += size) {
    chunks.push(docs.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const userId = process.argv[2];
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });

  const db = admin.firestore();
  let query = db.collection('events').where('completed', '==', true);
  if (userId) {
    query = query.where('userId', '==', userId);
  }

  const snapshot = await query.get();
  if (snapshot.empty) {
    console.log('No completed events found.');
    return;
  }

  const chunks = chunkDocs(snapshot.docs, 450);
  for (const docs of chunks) {
    const batch = db.batch();
    docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  console.log(`Deleted ${snapshot.size} completed events${userId ? ` for ${userId}` : ''}.`);
}

main().catch((error) => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});
