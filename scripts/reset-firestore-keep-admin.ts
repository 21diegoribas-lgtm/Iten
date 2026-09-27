import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const PROJECT_ID = 'final-1ef53';
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
    projectId: PROJECT_ID,
  });
}

const auth = getAuth();
const db = getFirestore();

const confirmDelete = process.argv.includes('--confirm');

console.log(`PROJECT: ${PROJECT_ID}`);
console.log(`ADMIN GIỮ LẠI: ${KEEP_UID}\n`);

// Bắt buộc admin phải tồn tại trong Auth
const adminAuth = await auth.getUser(KEEP_UID).catch(() => null);

if (!adminAuth) {
  throw new Error('Không tìm thấy admin cần giữ trong Firebase Authentication. DỪNG.');
}

// Bắt buộc admin phải tồn tại trong Firestore
const adminRef = db.collection('users').doc(KEEP_UID);
const adminSnap = await adminRef.get();

if (!adminSnap.exists) {
  throw new Error('Không tìm thấy document admin trong users. DỪNG.');
}

if (adminSnap.data()?.role !== 'admin') {
  throw new Error('Document cần giữ không có role=admin. DỪNG.');
}

console.log(`GIỮ AUTH: ${adminAuth.email || KEEP_UID}`);
console.log(`GIỮ FIRESTORE: users/${KEEP_UID}\n`);

// ============================
// AUTH
// ============================

const authUsersToDelete: string[] = [];
let pageToken: string | undefined;

do {
  const result = await auth.listUsers(1000, pageToken);

  for (const user of result.users) {
    if (user.uid === KEEP_UID) continue;

    authUsersToDelete.push(user.uid);
    console.log(`AUTH SẼ XÓA: ${user.email || user.uid}`);
  }

  pageToken = result.pageToken;
} while (pageToken);

// ============================
// FIRESTORE
// ============================

const rootDocumentsToDelete: FirebaseFirestore.DocumentReference[] = [];

const collections = await db.listCollections();

for (const collection of collections) {
  const snapshot = await collection.get();

  console.log(`\nCOLLECTION: ${collection.id} (${snapshot.size} document)`);

  for (const document of snapshot.docs) {
    const isAdmin =
      collection.id === 'users' &&
      document.id === KEEP_UID;

    if (isAdmin) {
      console.log(`  GIỮ: ${document.ref.path}`);

      // Chỉ giữ document admin, xóa subcollections nếu có
      const adminSubcollections = await document.ref.listCollections();

      for (const subcollection of adminSubcollections) {
        const subDocs = await subcollection.get();

        for (const subDoc of subDocs.docs) {
          console.log(`  SUBCOLLECTION SẼ XÓA: ${subDoc.ref.path}`);

          if (confirmDelete) {
            await db.recursiveDelete(subDoc.ref);
          }
        }
      }

      continue;
    }

    console.log(`  SẼ XÓA: ${document.ref.path}`);
    rootDocumentsToDelete.push(document.ref);
  }
}

console.log('\n============================');
console.log(`Auth sẽ xóa: ${authUsersToDelete.length}`);
console.log(`Firestore root documents sẽ xóa: ${rootDocumentsToDelete.length}`);
console.log(`GIỮ LẠI DUY NHẤT: users/${KEEP_UID}`);
console.log('============================');

if (!confirmDelete) {
  console.log('\nDRY RUN: CHƯA XÓA BẤT KỲ DỮ LIỆU NÀO.');
  process.exit(0);
}

// ============================
// XÓA THẬT
// ============================

if (authUsersToDelete.length > 0) {
  const authResult = await auth.deleteUsers(authUsersToDelete);

  console.log(`\nAuth đã xóa: ${authResult.successCount}`);
  console.log(`Auth lỗi: ${authResult.failureCount}`);

  if (authResult.failureCount > 0) {
    for (const error of authResult.errors) {
      console.error('AUTH DELETE ERROR:', error);
    }
  }
}

for (const ref of rootDocumentsToDelete) {
  console.log(`ĐANG XÓA: ${ref.path}`);
  await db.recursiveDelete(ref);
}

// Kiểm tra admin lần cuối
const finalAdmin = await adminRef.get();

if (!finalAdmin.exists || finalAdmin.data()?.role !== 'admin') {
  throw new Error('CẢNH BÁO: admin không còn hợp lệ sau cleanup.');
}

console.log('\n=================================');
console.log('RESET HOÀN TẤT');
console.log(`Đã giữ lại: users/${KEEP_UID}`);
console.log('=================================');