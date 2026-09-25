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
import type { StudentProfile } from '../types';
import { parseFirestoreDateField } from './userService';

export const STUDENTS_COLLECTION = 'students';

/**
 * Safely converts a Firestore DocumentSnapshot into a typed StudentProfile object.
 * Returns null if the document does not exist.
 */
export function docToStudentProfile(docSnap: DocumentSnapshot): StudentProfile | null {
  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  if (!data) {
    return null;
  }

  const dob = parseFirestoreDateField(data.dob || data.dateOfBirth);

  return {
    id: docSnap.id,
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    username: typeof data.username === 'string' ? data.username : undefined,
    email: typeof data.email === 'string' ? data.email : undefined,
    gender: data.gender === 'Nam' || data.gender === 'Nữ' || data.gender === 'Khác' ? data.gender : undefined,
    dob,
    dateOfBirth: dob,
    classId: typeof data.classId === 'string' ? data.classId : undefined,
    className: typeof data.className === 'string' ? data.className : undefined,
    studentCode: typeof data.studentCode === 'string' ? data.studentCode : undefined,
    avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
    avatarId: typeof data.avatarId === 'string' ? data.avatarId : undefined,
    phone: typeof data.phone === 'string' ? data.phone : undefined,
    address: typeof data.address === 'string' ? data.address : undefined,
    school: typeof data.school === 'string' ? data.school : undefined,
    position: typeof data.position === 'string' ? data.position : undefined,
    team: typeof data.team === 'string' ? data.team : undefined,
    isUnionMember: typeof data.isUnionMember === 'boolean' ? data.isUnionMember : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    status: typeof data.status === 'string' ? data.status : undefined,
    createdAt: parseFirestoreDateField(data.createdAt),
    updatedAt: parseFirestoreDateField(data.updatedAt),
  };
}

/**
 * Strips password and id fields before writing to Firestore.
 */
function sanitizeStudentData(student: Partial<StudentProfile>): Record<string, unknown> {
  const { id: _id, ...rest } = student;
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
 * Retrieve a student profile by student ID.
 * Returns null if not found.
 */
export async function getStudentById(id: string): Promise<StudentProfile | null> {
  if (!id || typeof id !== 'string') {
    return null;
  }
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  const snap = await getDoc(studentRef);
  return docToStudentProfile(snap);
}

/**
 * Retrieve all student profiles from the `students` collection.
 */
export async function getStudents(): Promise<StudentProfile[]> {
  const studentsRef = collection(db, STUDENTS_COLLECTION);
  const querySnapshot = await getDocs(studentsRef);
  const students: StudentProfile[] = [];

  querySnapshot.forEach((docSnap) => {
    const item = docToStudentProfile(docSnap);
    if (item) {
      students.push(item);
    }
  });

  return students;
}

/**
 * Set or create a student document with student ID as document ID.
 * Merges fields and excludes password.
 */
export async function setStudent(id: string, student: Partial<StudentProfile>): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Student ID (id) is required to set student document');
  }
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  const dataToSave = sanitizeStudentData(student);
  dataToSave.updatedAt = serverTimestamp();

  await setDoc(studentRef, dataToSave, { merge: true });
}

/**
 * Update specific fields of an existing student document.
 */
export async function updateStudent(id: string, updates: Partial<StudentProfile>): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Student ID (id) is required to update student document');
  }
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  const dataToUpdate = sanitizeStudentData(updates);
  dataToUpdate.updatedAt = serverTimestamp();

  await updateDoc(studentRef, dataToUpdate);
}

/**
 * Delete a student document by student ID.
 */
export async function deleteStudent(id: string): Promise<void> {
  if (!id || typeof id !== 'string') {
    throw new Error('Student ID (id) is required to delete student document');
  }
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  await deleteDoc(studentRef);
}
