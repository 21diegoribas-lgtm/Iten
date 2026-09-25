/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Read Firebase configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

console.log('[Firebase] projectId:', firebaseConfig.projectId);


// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
console.log('[Firebase] REAL app projectId:', app.options.projectId);
export const db = getFirestore(app);
export const auth = getAuth(app);

export interface FirebaseConnectionResult {
  initialized: boolean;
  connected: boolean;
  projectId: string;
  code: string;
  message: string;
}

/**
 * Utility function to test Firebase configuration & Firestore connectivity.
 * Note: Not called automatically in App.
 * Can be run manually in browser console via window.checkFirestoreConnection()
 */
export async function checkFirestoreConnection(): Promise<FirebaseConnectionResult> {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';

  if (!projectId || !apiKey) {
    const res: FirebaseConnectionResult = {
      initialized: false,
      connected: false,
      projectId,
      code: 'missing-config',
      message: 'Thiếu biến môi trường VITE_FIREBASE_PROJECT_ID hoặc VITE_FIREBASE_API_KEY.',
    };
    console.warn('[Firebase Test]', res);
    return res;
  }

  try {
    // Attempt a lightweight test read to verify Firestore connection without modifying any data
    const testDoc = doc(db, '_connection_test', 'ping');
    await getDoc(testDoc);

    const res: FirebaseConnectionResult = {
      initialized: true,
      connected: true,
      projectId,
      code: 'ok',
      message: `Kết nối thành công đến Firestore project "${projectId}".`,
    };
    console.log('[Firebase Test] SUCCESS:', res);
    return res;
  } catch (error: unknown) {
    const firestoreError = error as { code?: string; message?: string };
    const code = firestoreError?.code || 'unknown-error';
    const message = firestoreError?.message || String(error);

    // If error is 'permission-denied', the network request reached Firestore and security rules evaluated it.
    // This confirms Firestore connection and project configuration are active and reachable.
    if (code === 'permission-denied') {
      const res: FirebaseConnectionResult = {
        initialized: true,
        connected: true,
        projectId,
        code,
        message: `Kết nối thành công tới Firestore project "${projectId}". (Quy tắc bảo mật Firestore phản hồi: permission-denied do chưa đăng nhập).`,
      };
      console.log('[Firebase Test] REACHED FIRESTORE (Secured):', res);
      return res;
    }

    const res: FirebaseConnectionResult = {
      initialized: true,
      connected: false,
      projectId,
      code,
      message: `Lỗi kết nối Firestore: [${code}] ${message}`,
    };
    console.error('[Firebase Test] FAILED:', res);
    return res;
  }
}

// Expose on window for manual development testing in browser DevTools console
if (typeof window !== 'undefined') {
  (window as unknown as { checkFirestoreConnection?: typeof checkFirestoreConnection }).checkFirestoreConnection = checkFirestoreConnection;
}

