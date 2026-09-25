import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivityPointRecord, KeyboardHeroSubmission, KeyboardHeroTask } from '../types';

const root = 'keyboardTasks';

function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function getKeyboardTask(classId: string): Promise<KeyboardHeroTask | null> {
  if (!classId) return null;
  const taskSnapshot = await getDoc(doc(db, root, classId));
  if (!taskSnapshot.exists()) return null;
  const submissionsSnapshot = await getDocs(collection(db, root, classId, 'submissions'));
  return {
    ...(taskSnapshot.data() as Omit<KeyboardHeroTask, 'submissions'>),
    classId,
    submissions: submissionsSnapshot.docs.map(item => ({ ...item.data(), id: item.id }) as KeyboardHeroSubmission),
  };
}

export async function saveKeyboardTaskConfig(task: KeyboardHeroTask): Promise<void> {
  if (!task.classId || !task.title.trim() || !task.prompt.trim()) throw new Error('Thiếu lớp học, tiêu đề hoặc đề bài.');
  const min = task.minWords || 0, max = task.maxWords || 0, time = task.timeLimitMinutes || 0, reward = task.rewardPoints || 0;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 5000) throw new Error('Giới hạn số từ không hợp lệ.');
  if (!Number.isInteger(time) || time < 1 || time > 180) throw new Error('Thời gian phải từ 1 đến 180 phút.');
  if (!Number.isInteger(reward) || reward < 1 || reward > 50) throw new Error('Điểm thưởng phải từ 1 đến 50.');
  const { submissions: _submissions, ...config } = task;
  await setDoc(doc(db, root, task.classId), { ...clean(config), updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveKeyboardSubmission(classId: string, submission: KeyboardHeroSubmission): Promise<void> {
  if (!classId || !submission.id || !submission.studentId || !submission.content.trim()) throw new Error('Bài nộp không hợp lệ.');
  await setDoc(doc(db, root, classId, 'submissions', submission.id), {
    ...clean(submission), classId, updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function setKeyboardSubmissionLike(classId: string, submissionId: string, userId: string, liked: boolean): Promise<void> {
  await updateDoc(doc(db, root, classId, 'submissions', submissionId), {
    likes: liked ? arrayUnion(userId) : arrayRemove(userId), updatedAt: serverTimestamp(),
  });
}

export async function appendKeyboardComment(classId: string, submissionId: string, comment: KeyboardHeroSubmission['comments'][number]): Promise<void> {
  await updateDoc(doc(db, root, classId, 'submissions', submissionId), {
    comments: arrayUnion(clean(comment)), updatedAt: serverTimestamp(),
  });
}

export async function gradeKeyboardSubmissionAndAward(
  classId: string,
  submission: KeyboardHeroSubmission,
  point: ActivityPointRecord,
): Promise<void> {
  if (!classId || point.source !== 'keyboard' || point.userId !== submission.studentId || point.points !== submission.rewardPointsAwarded) {
    throw new Error('Dữ liệu chấm bài hoặc điểm thưởng không hợp lệ.');
  }
  const batch = writeBatch(db);
  batch.set(doc(db, root, classId, 'submissions', submission.id), {
    ...clean(submission), classId, updatedAt: serverTimestamp(), gradedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(doc(db, 'activityPoints', point.id), {
    ...clean(point), id: point.id, attemptId: point.id, classId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}
