import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { MemoryCardGameConfig, MemoryGameResultRecord } from '../types';

export async function getMemoryGameConfig(classId: string): Promise<MemoryCardGameConfig | null> {
  if (!classId) return null;
  const snapshot = await getDoc(doc(db, 'memoryGames', classId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const pairs = (Array.isArray(data.pairs) ? data.pairs : []).filter(pair =>
    pair && typeof pair.id === 'string' && typeof pair.cardA === 'string' && typeof pair.cardB === 'string');
  return {
    id: typeof data.id === 'string' ? data.id : `memory_${classId}`,
    title: typeof data.title === 'string' ? data.title : 'Thách thức thẻ nhớ',
    classId,
    category: data.category === 'Thi đua rèn luyện' ? 'Thi đua rèn luyện' : 'Thi đua học tập',
    timeMinutes: typeof data.timeMinutes === 'number' && Number.isInteger(data.timeMinutes) && data.timeMinutes >= 1 && data.timeMinutes <= 60 ? data.timeMinutes : 5,
    pairs,
    isActive: Boolean(data.isActive),
  };
}

export async function saveMemoryGameConfig(config: MemoryCardGameConfig): Promise<void> {
  if (!config.classId || !config.title.trim()) throw new Error('Thiếu lớp học hoặc tiêu đề trò chơi.');
  if (!Number.isInteger(config.timeMinutes) || config.timeMinutes < 1 || config.timeMinutes > 60) throw new Error('Thời gian phải từ 1 đến 60 phút.');
  if (config.pairs.length < 2) throw new Error('Trò chơi cần ít nhất 2 cặp thẻ.');
  const ids = new Set<string>();
  for (const pair of config.pairs) {
    if (!pair.id || ids.has(pair.id) || !pair.cardA.trim() || !pair.cardB.trim()) throw new Error('Cặp thẻ không hợp lệ hoặc bị trùng mã.');
    ids.add(pair.id);
  }
  await setDoc(doc(db, 'memoryGames', config.classId), {
    ...JSON.parse(JSON.stringify(config)), id: config.id || `memory_${config.classId}`, classId: config.classId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function saveMemoryResult(classId: string, userId: string, result: MemoryGameResultRecord): Promise<void> {
  if (!classId || !userId || !result.id) throw new Error('Dữ liệu lượt chơi không hợp lệ.');
  await setDoc(doc(db, 'memoryGames', classId, 'players', userId, 'results', result.id), {
    ...result, classId, userId, createdAt: serverTimestamp(),
  });
}
