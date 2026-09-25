import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RaceAnswerHistoryRecord } from '../types';

function answersCollection(classId: string, userId: string) {
  if (!classId || !userId) throw new Error('Chưa xác định tài khoản hoặc lớp học.');
  return collection(db, 'racingGames', classId, 'players', userId, 'answers');
}

export async function loadRaceHistory(classId: string, userId: string): Promise<RaceAnswerHistoryRecord[]> {
  const snapshot = await getDocs(query(answersCollection(classId, userId), orderBy('createdAt', 'desc'), limit(300)));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as RaceAnswerHistoryRecord);
}

export async function saveRaceAnswers(classId: string, userId: string, entries: RaceAnswerHistoryRecord[]): Promise<void> {
  const parent = answersCollection(classId, userId);
  const batch = writeBatch(db);
  entries.forEach(entry => batch.set(doc(parent, entry.id), {
    ...Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined)),
    classId, userId, createdAt: serverTimestamp(),
  }));
  await batch.commit();
}

export async function deleteRaceHistory(classId: string, userId: string, entries: RaceAnswerHistoryRecord[]): Promise<void> {
  const parent = answersCollection(classId, userId);
  const batch = writeBatch(db);
  entries.forEach(entry => batch.delete(doc(parent, entry.id)));
  await batch.commit();
}
