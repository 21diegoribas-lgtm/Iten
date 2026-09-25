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
import type { TeacherProfile } from '../types';
import { parseFirestoreDateField } from './userService';

export const TEACHERS_COLLECTION = 'teachers';

/**
 * Safely converts a Firestore DocumentSnapshot into a typed TeacherProfile object.
 * Returns null if the document does not exist.
 */
export function docToTeacherProfile(docSnap: DocumentSnapshot): TeacherProfile | null {
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  if (!data) {
    return null;
  }

  return {
    id: docSnap.id,
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    username: typeof data.username === 'string' ? data.username : undefined,
    email: typeof data.email === 'string' ? data.email : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
    school: typeof data.school === 'string' ? data.school : undefined,
    subject: typeof data.subject === 'string' ? data.subject : undefined,
    teacherRole:
      data.teacherRole === 'giáo viên bộ môn' ||
      data.teacherRole === 'giáo viên chủ nhiệm' ||
      data.teacherRole === 'vừa chủ nhiệm vừa bộ môn'
        ? data.teacherRole
        : (typeof data.teacherRole === 'string' ? data.teacherRole : undefined),
    classId: typeof data.classId === 'string' ? data.classId : undefined,
    className: typeof data.className === 'string' ? data.className : undefined,
    avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
    avatarId: typeof data.avatarId === 'string' ? data.avatarId : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    status: typeof data.status === 'string' ? data.status : undefined,
    createdAt: parseFirestoreDateField(data.createdAt),
    updatedAt: parseFirestoreDateField(data.updatedAt),
  };
}

/**
 * Strips password and id fields before writing to Firestore.
 */
function sanitizeTeacherData(teacher: Partial<TeacherProfile>): Record<string, unknown> {
  const { id: _id, ...rest } = teacher;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rest)) {
    if (key === 'password') continue;
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Retrieve a teacher profile by teacher ID.
 * Returns null if not found.
 */
export async function getTeacherById(id: string): Promise<TeacherProfile | null> {
  if (!id || typeof id !== 'string') {
    return null;
  }
  const teacherRef = doc(db, TEACHERS_COLLECTION, id);
  const snap = await getDoc(teacherRef);
  return docToTeacherProfile(snap);
}

/**
 * Retrieve all teacher profiles from the `teachers` collection.
 */
export async function getTeachers(): Promise<TeacherProfile[]> {
  const teachersRef = collection(db, TEACHERS_COLLECTION);
  const querySnapshot = await getDocs(teachersRef);
  const teachers: TeacherProfile[] = [];

  querySnapshot.forEach((docSnap) => {
    const item = docToTeacherProfile(docSnap);
    if (item) {
      teachers.push(item);
    }
  });

  return teachers;
}

/**
 * Set or create a teacher document with teacher ID as document ID.
 * Merges fields and excludes password.
 */
export async function setTeacher(id: string, teacher: Partial<TeacherProfile>): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Teacher ID (id) is required to set teacher document');
  }
  const teacherRef = doc(db, TEACHERS_COLLECTION, id);
  const dataToSave = sanitizeTeacherData(teacher);
  dataToSave.updatedAt = serverTimestamp();

  await setDoc(teacherRef, dataToSave, { merge: true });
}

/**
 * Update specific fields of an existing teacher document.
 */
export async function updateTeacher(id: string, updates: Partial<TeacherProfile>): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Teacher ID (id) is required to update teacher document');
  }
  const teacherRef = doc(db, TEACHERS_COLLECTION, id);
  const dataToUpdate = sanitizeTeacherData(updates);
  dataToUpdate.updatedAt = serverTimestamp();

  await updateDoc(teacherRef, dataToUpdate);
}

/**
 * Delete a teacher document by teacher ID.
 */
export async function deleteTeacher(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Teacher ID (id) is required to delete teacher document');
  }
  const teacherRef = doc(db, TEACHERS_COLLECTION, id);
  await deleteDoc(teacherRef);
}
