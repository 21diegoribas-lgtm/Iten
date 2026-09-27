import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const KEEP_UID = 'QsRyKxvzILbwsrWHaS1YBKwXpNz2';

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  '../final-1ef53-firebase-adminsdk-fbsvc-a3ad18a517.json';

if (!existsSync(serviceAccountPath)) {
  throw new Error(`Không tìm thấy Firebase Admin JSON: ${serviceAccountPath}`);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccountPath),
  });
}

const auth = getAuth();
const db = getFirestore();

const confirmDelete = process.argv.includes('--confirm');

const authUsersToDelete: string[] = [];

let pageToken: string | undefined;

do {
  const result = await auth.listUsers(1000, pageToken);

  for (const user of result.users) {
    if (user.uid === KEEP_UID) {
      console.log(`GIỮ AUTH: ${user.email || user.uid}`);
      continue;
    }

    console.log(`SẼ XÓA AUTH: ${user.email || user.uid}`);
    authUsersToDelete.push(user.uid);
  }

  pageToken = result.pageToken;
} while (pageToken);

const usersSnapshot = await db.collection('users').get();

const firestoreDocsToDelete = usersSnapshot.docs.filter(
  doc => doc.id !== KEEP_UID
);

for (const doc of usersSnapshot.docs) {
  if (doc.id === KEEP_UID) {
    console.log(`GIỮ FIRESTORE: users/${doc.id}`);
  } else {
    console.log(`SẼ XÓA FIRESTORE: users/${doc.id}`);
  }
}

console.log(`\nAuth sẽ xóa: ${authUsersToDelete.length}`);
console.log(`Firestore users sẽ xóa: ${firestoreDocsToDelete.length}`);

if (!confirmDelete) {
  console.log('\nDRY RUN: chưa có dữ liệu nào bị xóa.');
  process.exit(0);
}

if (authUsersToDelete.length > 0) {
  const result = await auth.deleteUsers(authUsersToDelete);
  console.log(`Đã xóa Auth: ${result.successCount}`);
  console.log(`Auth lỗi: ${result.failureCount}`);
}

for (const doc of firestoreDocsToDelete) {
  await db.recursiveDelete(doc.ref);
}

console.log(`Đã xóa Firestore users: ${firestoreDocsToDelete.length}`);
console.log(`Đã giữ lại admin: ${KEEP_UID}`);