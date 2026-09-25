import { collection, doc, getDoc, getDocs, limit, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivityPointRecord } from '../types';

export interface GardenPointRange { id: string; minPoints: number; maxPoints: number; spinsAllowed: number; label: string }
export interface GardenRewardConfig { minReward: number; maxReward: number; stepReward: number }
export interface GardenConfig {
  classId: string;
  isSpinActive: boolean;
  spinAwardTarget: 'learning' | 'discipline' | 'auto';
  selectedSpinWeek: number;
  pointRanges: GardenPointRange[];
  scoreTypeBasis: 'overall' | 'learning' | 'discipline';
  rewardConfig: GardenRewardConfig;
}
export interface GardenSpinHistory {
  id: string; classId: string; studentId: string; studentName: string; points: number;
  category: 'learning' | 'discipline'; pointTypeLabel?: string; destinationLabel?: string;
  source?: string; date: string; week?: number; timeframeLabel: string;
}

export async function loadGardenConfig(classId: string): Promise<GardenConfig | null> {
  if (!classId) return null;
  const snapshot = await getDoc(doc(db, 'gardenConfigs', classId));
  return snapshot.exists() ? snapshot.data() as GardenConfig : null;
}

export async function saveGardenConfig(config: GardenConfig): Promise<void> {
  if (!config.classId || config.selectedSpinWeek < 1 || config.selectedSpinWeek > 52) throw new Error('Cấu hình Vườn thành tích không hợp lệ.');
  await setDoc(doc(db, 'gardenConfigs', config.classId), { ...config, updatedAt: serverTimestamp() }, { merge: true });
}

export async function loadGardenSpinHistory(classId: string): Promise<GardenSpinHistory[]> {
  if (!classId) return [];
  const snapshot = await getDocs(query(collection(db, 'gardenSpins'), where('classId', '==', classId), limit(500)));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as GardenSpinHistory)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveGardenSpin(
  history: GardenSpinHistory,
  point: ActivityPointRecord,
  maxSpins: number,
): Promise<number> {
  if (!history.classId || history.id !== point.id || history.studentId !== point.userId || point.source !== 'garden') throw new Error('Dữ liệu lượt quay không hợp lệ.');
  if (history.points !== point.points || maxSpins < 1 || point.points < 0.01 || point.points > 10) throw new Error('Điểm quay thưởng không hợp lệ.');
  const usageId = `${history.classId}_${history.week || 0}_${history.studentId}`;
  return runTransaction(db, async transaction => {
    const usageRef = doc(db, 'gardenSpinUsage', usageId);
    const usageSnapshot = await transaction.get(usageRef);
    const count = Number(usageSnapshot.data()?.count || 0);
    if (count >= maxSpins) throw new Error('Học sinh đã sử dụng hết lượt quay của tuần này.');
    const nextCount = count + 1;
    transaction.set(usageRef, { id: usageId, classId: history.classId, studentId: history.studentId, week: history.week || 0, count: nextCount, updatedAt: serverTimestamp() }, { merge: true });
    transaction.set(doc(db, 'gardenSpins', history.id), { ...history, createdAt: serverTimestamp() });
    transaction.set(doc(db, 'activityPoints', point.id), { ...point, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return nextCount;
  });
}
