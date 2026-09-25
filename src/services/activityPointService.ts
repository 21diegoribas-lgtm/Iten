import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivityPointRecord, DisciplineRecord, FlowerAnswerHistoryRecord, LearningRecord, MemoryGameResultRecord, RaceAnswerHistoryRecord } from '../types';

export const ACTIVITY_POINTS_COLLECTION = 'activityPoints';

function stripUndefined<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

/** Writes the answer and its official point entry in one atomic, idempotent batch. */
export async function saveFlowerAnswerAndPoint(
  classId: string,
  userId: string,
  answer: FlowerAnswerHistoryRecord,
  point: ActivityPointRecord,
): Promise<void> {
  if (!classId || !userId || answer.id !== point.id || answer.id !== point.attemptId) {
    throw new Error('Dữ liệu lượt chơi không hợp lệ.');
  }
  if (answer.pointsChange !== point.points || answer.isCorrect !== point.isCorrect) {
    throw new Error('Điểm và lịch sử trả lời không khớp.');
  }

  const batch = writeBatch(db);
  const answerRef = doc(db, 'flowerGames', classId, 'players', userId, 'answers', answer.id);
  const pointRef = doc(db, ACTIVITY_POINTS_COLLECTION, point.id);
  batch.set(answerRef, {
    ...stripUndefined(answer), classId, userId, createdAt: serverTimestamp(),
  });
  batch.set(pointRef, {
    ...stripUndefined(point), id: point.id, attemptId: point.id, classId, userId,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function saveRaceAnswerAndPoint(
  classId: string,
  userId: string,
  answer: RaceAnswerHistoryRecord,
  point: ActivityPointRecord,
): Promise<void> {
  if (!classId || !userId || answer.id !== point.id || answer.id !== point.attemptId) {
    throw new Error('Dữ liệu lượt đua không hợp lệ.');
  }
  if (answer.pointsChange !== point.points || answer.isCorrect !== point.isCorrect || point.source !== 'racing') {
    throw new Error('Điểm và lịch sử lượt đua không khớp.');
  }
  const batch = writeBatch(db);
  batch.set(doc(db, 'racingGames', classId, 'players', userId, 'answers', answer.id), {
    ...stripUndefined(answer), classId, userId, createdAt: serverTimestamp(),
  });
  batch.set(doc(db, ACTIVITY_POINTS_COLLECTION, point.id), {
    ...stripUndefined(point), id: point.id, attemptId: point.id, classId, userId,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function saveMemoryResultAndPoint(
  classId: string,
  userId: string,
  result: MemoryGameResultRecord,
  point: ActivityPointRecord,
): Promise<void> {
  if (!classId || !userId || result.id !== point.id || result.id !== point.attemptId || point.source !== 'memory') {
    throw new Error('Dữ liệu lượt chơi Thẻ nhớ không hợp lệ.');
  }
  if (result.score !== point.points || result.score !== result.matchedPairs * 2) throw new Error('Điểm Thẻ nhớ không khớp kết quả.');
  const batch = writeBatch(db);
  batch.set(doc(db, 'memoryGames', classId, 'players', userId, 'results', result.id), {
    ...stripUndefined(result), classId, userId, createdAt: serverTimestamp(),
  });
  batch.set(doc(db, ACTIVITY_POINTS_COLLECTION, point.id), {
    ...stripUndefined(point), id: point.id, attemptId: point.id, classId, userId,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function loadActivityPointsForUser(userId: string): Promise<ActivityPointRecord[]> {
  if (!userId) return [];
  const snapshot = await getDocs(query(
    collection(db, ACTIVITY_POINTS_COLLECTION),
    where('userId', '==', userId),
    limit(500),
  ));
  return snapshot.docs
    .map(item => ({ ...item.data(), id: item.id }) as ActivityPointRecord)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function describeActivityPoint(point: ActivityPointRecord): string {
  if (point.source === 'memory') return `Hoàn thành ${point.participantName}`;
  if (point.source === 'keyboard') return `Được chấm bài ${point.activityName}: ${point.points >= 0 ? '+' : ''}${point.points} điểm`;
  if (point.source === 'spy') return `${point.participantName}: ${point.points >= 0 ? '+' : ''}${point.points} điểm`;
  if (point.source === 'attendance') return point.participantName;
  if (point.source === 'garden') return `Quay Vườn thành tích: ${point.points >= 0 ? '+' : ''}${point.points} điểm`;
  return `${point.participantName} ${point.isCorrect ? 'trả lời đúng' : 'trả lời chưa đúng'} câu hỏi ${point.source === 'flower' ? 'Hái hoa' : 'Đường đua'}`;
}

export function activityPointToLearningRecord(point: ActivityPointRecord): LearningRecord {
  return {
    id: point.id,
    attemptId: point.attemptId,
    studentId: point.userId,
    studentName: point.studentName,
    classId: point.classId,
    categoryType: 'class',
    category: point.category,
    type: point.points >= 0 ? 'reward' : 'violation',
    activityName: point.activityName,
    activityId: point.activityId,
    pointType: 'academic_activity',
    points: point.points,
    reason: describeActivityPoint(point),
    date: point.date,
    week: getWeekOfYear(point.date),
    month: Number(point.date.slice(5, 7)),
    semester: getSemester(point.date),
    recordedBy: 'Hệ thống ITEN',
  };
}

export function activityPointToDisciplineRecord(point: ActivityPointRecord): DisciplineRecord {
  return {
    id: point.id,
    attemptId: point.attemptId,
    studentId: point.userId,
    studentName: point.studentName,
    classId: point.classId,
    type: point.points >= 0 ? 'reward' : 'violation',
    categoryName: point.activityName,
    category: point.category,
    activityName: point.activityName,
    activityId: point.activityId,
    pointType: 'training_activity',
    points: point.points,
    reason: describeActivityPoint(point),
    date: point.date,
    week: getWeekOfYear(point.date),
    month: Number(point.date.slice(5, 7)),
    semester: getSemester(point.date),
    recordedBy: 'Hệ thống ITEN',
  };
}

function getWeekOfYear(dateText: string): number {
  const date = new Date(`${dateText}T00:00:00`);
  const first = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((((date.getTime() - first.getTime()) / 86400000) + first.getDay() + 1) / 7);
}

function getSemester(dateText: string): string {
  const month = Number(dateText.slice(5, 7));
  return month >= 8 || month === 1 ? 'Học kỳ 1' : 'Học kỳ 2';
}
