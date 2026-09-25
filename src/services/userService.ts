import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types';

export const USERS_COLLECTION = 'users';

/**
 * Helper to safely format any date or Firestore Timestamp into an ISO string.
 */
export const parseFirestoreDateField = (val: unknown): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return String(val);
};

/**
 * Safely converts a Firestore DocumentSnapshot into a typed User object.
 * Returns null if the document does not exist or has invalid content.
 * Gracefully handles Firestore Timestamps without throwing.
 */
export function docToUser(docSnap: DocumentSnapshot): User | null {
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  if (!data) {
    return null;
  }

  return {
    id: docSnap.id,
    username: typeof data.username === 'string' ? data.username : '',
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    role: data.role === 'admin' || data.role === 'teacher' ? data.role : 'student',
    email: typeof data.email === 'string' ? data.email : '',
    gender: data.gender === 'Nam' || data.gender === 'Nữ' ? data.gender : 'Khác',
    dob: parseFirestoreDateField(data.dob),
    phone: typeof data.phone === 'string' ? data.phone : '',
    address: typeof data.address === 'string' ? data.address : '',
    school: typeof data.school === 'string' ? data.school : '',
    classId: typeof data.classId === 'string' ? data.classId : undefined,
    className: typeof data.className === 'string' ? data.className : undefined,
    academicYear: typeof data.academicYear === 'string' ? data.academicYear : undefined,
    position: typeof data.position === 'string' ? data.position : undefined,
    team: typeof data.team === 'string' ? data.team : undefined,
    isUnionMember: typeof data.isUnionMember === 'boolean' ? data.isUnionMember : undefined,
    teacherRole:
      data.teacherRole === 'giáo viên bộ môn' ||
      data.teacherRole === 'giáo viên chủ nhiệm' ||
      data.teacherRole === 'vừa chủ nhiệm vừa bộ môn'
        ? data.teacherRole
        : undefined,
    subject: typeof data.subject === 'string' ? data.subject : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
    avatarId: typeof data.avatarId === 'string' ? data.avatarId : undefined,
  };
}

/**
 * Strips sensitive fields (like password) and internal id before persisting to Firestore.
 */
function sanitizeUserData(user: Partial<User>): Record<string, unknown> {
  const { id: _id, password: _password, ...rest } = user;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Retrieve a user by their Firebase Auth UID.
 * Returns null if not found.
 */
export async function getUserById(uid: string): Promise<User | null> {
  if (!uid || typeof uid !== 'string') {
    return null;
  }
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  return docToUser(snap);
}

/**
 * Retrieve all users from the `users` collection.
 */
export async function getUsers(): Promise<User[]> {
  const usersRef = collection(db, USERS_COLLECTION);
  const querySnapshot = await getDocs(usersRef);
  const users: User[] = [];

  querySnapshot.forEach((docSnap) => {
    const user = docToUser(docSnap);
    if (user) {
      users.push(user);
    }
  });

  return users;
}

/**
 * Set or create a user document with Auth UID as document ID.
 * Merges fields and excludes password.
 */
export async function setUser(uid: string, user: Partial<User>): Promise<void> {
  if (!uid || typeof uid !== 'string') {
    throw new Error('User ID (uid) is required to set user document');
  }
  const userRef = doc(db, USERS_COLLECTION, uid);
  const dataToSave = sanitizeUserData(user);
  dataToSave.updatedAt = serverTimestamp();

  await setDoc(userRef, dataToSave, { merge: true });
}

/**
 * Update specific profile fields of an existing user document.
 * Excludes password from updates.
 */
export async function updateUser(uid: string, updates: Partial<User>): Promise<void> {
  if (!uid || typeof uid !== 'string') {
    throw new Error('User ID (uid) is required to update user document');
  }
  const userRef = doc(db, USERS_COLLECTION, uid);
  const dataToUpdate = sanitizeUserData(updates);
  dataToUpdate.updatedAt = serverTimestamp();

  await updateDoc(userRef, dataToUpdate);
}

/**
 * Delete a user document from the `users` collection by UID.
 */
export async function deleteUser(uid: string): Promise<void> {
  if (!uid || typeof uid !== 'string') {
    throw new Error('User ID (uid) is required to delete user document');
  }
  const userRef = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(userRef);
}
