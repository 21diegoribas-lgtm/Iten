import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, terminate } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

async function testConnection() {
  console.log('--- TEST FIREBASE CONFIGURATION & FIRESTORE CONNECTION ---');
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('API Key:', firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 8)}...` : 'MISSING');
  console.log('Auth Domain:', firebaseConfig.authDomain || 'MISSING');
  console.log('App ID:', firebaseConfig.appId ? `${firebaseConfig.appId.slice(0, 12)}...` : 'MISSING');

  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error('FAIL: Missing required Firebase config environment variables.');
    process.exit(1);
  }

  try {
    const app = initializeApp(firebaseConfig);
    console.log('Firebase App Initialization: PASS');

    const db = getFirestore(app);
    console.log('Connecting to Firestore...');

    try {
      const snap = await getDoc(doc(db, '_connection_test', 'ping'));
      console.log('Firestore Connection: PASS (Document exists:', snap.exists(), ')');
      await terminate(db);
      process.exit(0);
    } catch (err: any) {
      console.log('Firestore response received:');
      console.log('Error Code:', err?.code);
      console.log('Error Message:', err?.message);

      if (err?.code === 'permission-denied') {
        console.log('Firestore Connection: PASS (Reached Firestore backend; security rules enforced permission-denied)');
        await terminate(db);
        process.exit(0);
      } else {
        console.log('Firestore Connection: FAIL');
        await terminate(db);
        process.exit(1);
      }
    }
  } catch (err: any) {
    console.error('Firebase Initialization: FAIL', err?.message);
    process.exit(1);
  }
}

testConnection();
