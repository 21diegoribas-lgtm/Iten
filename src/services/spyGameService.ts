import { collection, deleteDoc, doc, getDoc, getDocs, runTransaction, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivityPointRecord, SpyGameMission } from '../types';

const root = 'spyGames';

export async function getSpyMission(classId: string): Promise<SpyGameMission | null> {
  if (!classId) return null;
  const missionSnapshot = await getDoc(doc(db, root, classId));
  if (!missionSnapshot.exists()) return null;
  const voteSnapshot = await getDocs(collection(db, root, classId, 'votes'));
  const votes = voteSnapshot.docs.flatMap(item => {
    const data = item.data();
    return Array.isArray(data.suspectIds) ? data.suspectIds.map(suspectId => ({ voterId: item.id, suspectId })) : [];
  });
  return { ...(missionSnapshot.data() as SpyGameMission), classId, votes };
}

export async function saveSpyMission(mission: SpyGameMission): Promise<void> {
  if (!mission.classId || !mission.id || !mission.spyStudentId || !mission.missionDescription.trim()) throw new Error('Cấu hình nhiệm vụ chưa đầy đủ.');
  for (const value of [mission.rewardSpy || 0, mission.penaltySpy || 0, mission.rewardCitizenPerVote || 0]) {
    if (!Number.isInteger(value) || value < 1 || value > 50) throw new Error('Điểm thưởng/phạt phải từ 1 đến 50.');
  }
  const { votes: _votes, ...config } = mission;
  await setDoc(doc(db, root, mission.classId), { ...JSON.parse(JSON.stringify(config)), updatedAt: serverTimestamp() }, { merge: true });
}

export async function castSpyVote(classId: string, voterId: string, suspectId: string): Promise<void> {
  const voteRef = doc(db, root, classId, 'votes', voterId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(voteRef);
    const suspectIds: string[] = snapshot.exists() && Array.isArray(snapshot.data().suspectIds) ? snapshot.data().suspectIds : [];
    if (suspectIds.length >= 3) throw new Error('Bạn đã dùng hết 3 lượt bình chọn.');
    transaction.set(voteRef, { voterId, classId, suspectIds: [...suspectIds, suspectId], updatedAt: serverTimestamp() });
  });
}

export async function resetSpyVotes(classId: string, voterId: string): Promise<void> {
  await deleteDoc(doc(db, root, classId, 'votes', voterId));
}

export async function clearAllSpyVotes(classId: string): Promise<void> {
  const snapshot = await getDocs(collection(db, root, classId, 'votes'));
  const batch = writeBatch(db);
  snapshot.docs.forEach(item => batch.delete(item.ref));
  await batch.commit();
}

export async function finishSpyMissionAndAward(mission: SpyGameMission, points: ActivityPointRecord[]): Promise<void> {
  if (!mission.classId || mission.status === 'Đang diễn ra') throw new Error('Kết quả vòng chơi chưa hợp lệ.');
  const ids = new Set<string>();
  for (const point of points) {
    if (point.source !== 'spy' || point.classId !== mission.classId || point.activityId !== mission.id || ids.has(point.id)) throw new Error('Danh sách điểm tổng kết không hợp lệ.');
    ids.add(point.id);
  }
  const batch = writeBatch(db);
  const { votes: _votes, ...config } = mission;
  batch.set(doc(db, root, mission.classId), { ...JSON.parse(JSON.stringify(config)), updatedAt: serverTimestamp() }, { merge: true });
  points.forEach(point => batch.set(doc(db, 'activityPoints', point.id), {
    ...JSON.parse(JSON.stringify(point)), createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }, { merge: true }));
  await batch.commit();
}
