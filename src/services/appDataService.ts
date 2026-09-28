import { collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type AppCollectionName =
  | 'timetables' | 'teacherSchedules' | 'teacherWeeklyTimetables'
  | 'complaints' | 'accountRequests' | 'personalStorageItems'
  | 'classFunds' | 'classExpenses' | 'classLogbooks' | 'pointUsageTransactions'
  | 'learningRecords' | 'disciplineRecords';

export async function loadAppCollection<T>(name: AppCollectionName, field?: string, value?: string): Promise<T[]> {
  const ref = collection(db, name);
  const snapshot = field && value ? await getDocs(query(ref, where(field, '==', value))) : await getDocs(ref);
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as T);
}

export function subscribeAppCollection<T>(
  name: AppCollectionName,
  onData: (items: T[]) => void,
  onError: (error: Error) => void,
  field?: string,
  value?: string,
): () => void {
  const ref = collection(db, name);
  const source = field && value ? query(ref, where(field, '==', value)) : ref;
  return onSnapshot(
    source,
    snapshot => onData(snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as T)),
    error => onError(error),
  );
}

export async function saveAppDocument<T extends { id: string }>(name: AppCollectionName, value: T): Promise<void> {
  if (!value.id) throw new Error('Dữ liệu thiếu mã định danh.');
  const clean = JSON.parse(JSON.stringify(value));
  await setDoc(doc(db, name, value.id), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteAppDocument(name: AppCollectionName, id: string): Promise<void> {
  if (!id) return;
  await deleteDoc(doc(db, name, id));
}
