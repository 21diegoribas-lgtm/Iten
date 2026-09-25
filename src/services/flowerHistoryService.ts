import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FlowerAnswerHistoryRecord } from '../types';

function historyCollection(classId: string, userId: string) {
  if (!classId || !userId) throw new Error('Chưa xác định tài khoản hoặc lớp học.');
  return collection(db, 'flowerGames', classId, 'players', userId, 'answers');
}

export async function loadFlowerHistory(classId: string, userId: string): Promise<FlowerAnswerHistoryRecord[]> {
  const snapshot = await getDocs(query(historyCollection(classId, userId), orderBy('createdAt', 'desc'), limit(300)));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as FlowerAnswerHistoryRecord);
}

// These are gameplay results, not authoritative school competition points.
export async function saveFlowerAnswer(classId: string, userId: string, entry: FlowerAnswerHistoryRecord): Promise<void> {
  const data = Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined));
  await setDoc(doc(historyCollection(classId, userId), entry.id), {
    ...data, classId, userId, createdAt: serverTimestamp(),
  });
}

export async function deleteFlowerHistoryEntries(classId: string, userId: string, entries: FlowerAnswerHistoryRecord[]): Promise<void> {
  const parent = historyCollection(classId, userId);
  const batch = writeBatch(db);
  entries.forEach(entry => batch.delete(doc(parent, entry.id)));
  await batch.commit();
}
