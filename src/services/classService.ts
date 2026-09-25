import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ClassItem } from '../types';
import { parseFirestoreDateField } from './userService';

export const CLASSES_COLLECTION = 'classes';

/**
 * Safely converts a Firestore DocumentSnapshot into a typed ClassItem object.
 * Returns null if the document does not exist.
 */
export function docToClassItem(docSnap: DocumentSnapshot): ClassItem | null {
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  if (!data) {
    return null;
  }

  return {
    id: docSnap.id,
    name: typeof data.name === 'string' ? data.name : '',
    school: typeof data.school === 'string' ? data.school : '',
    academicYear: typeof data.academicYear === 'string' ? data.academicYear : '',
    homeroomTeacher: typeof data.homeroomTeacher === 'string' ? data.homeroomTeacher : '',
    teacherRole:
      data.teacherRole === 'giáo viên chủ nhiệm' || data.teacherRole === 'giáo viên bộ môn'
        ? data.teacherRole
        : undefined,
    subject: typeof data.subject === 'string' ? data.subject : undefined,
    studentCount: typeof data.studentCount === 'number' ? data.studentCount : 0,
    maleCount: typeof data.maleCount === 'number' ? data.maleCount : undefined,
    femaleCount: typeof data.femaleCount === 'number' ? data.femaleCount : undefined,
    unionCount: typeof data.unionCount === 'number' ? data.unionCount : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    createdAt: parseFirestoreDateField(data.createdAt),
    updatedAt: parseFirestoreDateField(data.updatedAt),
  };
}

/**
 * Strips sensitive fields (like password) and id before writing to Firestore.
 */
function sanitizeClassData(classData: Partial<ClassItem>): Record<string, unknown> {
  const { id: _id, ...rest } = classData;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rest)) {
    // Explicitly exclude any password property if inadvertently passed
    if (key === 'password') continue;
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Retrieve a class by its class ID.
 * Returns null if not found.
 */
export async function getClassById(id: string): Promise<ClassItem | null> {
  if (!id || typeof id !== 'string') {
    return null;
  }
  const classRef = doc(db, CLASSES_COLLECTION, id);
  const snap = await getDoc(classRef);
  return docToClassItem(snap);
}

/**
 * Retrieve all classes from the `classes` collection.
 */
export async function getClasses(): Promise<ClassItem[]> {
  const classesRef = collection(db, CLASSES_COLLECTION);
  const querySnapshot = await getDocs(classesRef);
  const classes: ClassItem[] = [];

  querySnapshot.forEach((docSnap) => {
    const item = docToClassItem(docSnap);
    if (item) {
      classes.push(item);
    }
  });

  return classes;
}

/**
 * Set or create a class document with class ID as document ID.
 * Merges fields and excludes password.
 */
export async function setClass(id: string, classData: Partial<ClassItem>): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Class ID (id) is required to set class document');
  }
  const classRef = doc(db, CLASSES_COLLECTION, id);
  const dataToSave = sanitizeClassData(classData);
  dataToSave.updatedAt = serverTimestamp();

  await setDoc(classRef, dataToSave, { merge: true });
}

/**
 * Update specific fields of an existing class document.
 */
export async function updateClass(id: string, updates: Partial<ClassItem>): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Class ID (id) is required to update class document');
  }
  const classRef = doc(db, CLASSES_COLLECTION, id);
  const dataToUpdate = sanitizeClassData(updates);
  dataToUpdate.updatedAt = serverTimestamp();

  await updateDoc(classRef, dataToUpdate);
}

/**
 * Delete a class document by class ID.
 */
export async function deleteClass(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Class ID (id) is required to delete class document');
  }
  const classRef = doc(db, CLASSES_COLLECTION, id);
  await deleteDoc(classRef);
}
