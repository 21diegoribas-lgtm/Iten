import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CleaningSchedule } from '../types';

const COLLECTION = 'cleaningSchedules';

export function createEmptyCleaningSchedule(classId: string): CleaningSchedule {
  return {
    id: classId ? `cleaning_${classId}` : '',
    classId,
    weekNumber: 1,
    startDate: new Date().toISOString().slice(0, 10),
    tasks: [],
  };
}

export async function getCleaningSchedule(classId: string): Promise<CleaningSchedule | null> {
  if (!classId) return null;
  const snapshot = await getDoc(doc(db, COLLECTION, classId));
  return snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.data().id || `cleaning_${classId}`, classId } as CleaningSchedule) : null;
}

export async function saveCleaningSchedule(schedule: CleaningSchedule): Promise<void> {
  if (!schedule.classId) throw new Error('Không xác định được lớp của lịch vệ sinh.');
  if (!Number.isInteger(schedule.weekNumber) || schedule.weekNumber < 1 || schedule.weekNumber > 18) {
    throw new Error('Tuần phải là một số từ 1 đến 18.');
  }

  const tasks = schedule.tasks.map(task => ({
    day: task.day.trim(),
    groupName: task.groupName.trim(),
    studentNames: task.studentNames.map(name => name.trim()).filter(Boolean),
    status: task.status,
  }));

  await setDoc(doc(db, COLLECTION, schedule.classId), {
    ...schedule,
    id: schedule.id || `cleaning_${schedule.classId}`,
    tasks,
    updatedAt: serverTimestamp(),
  });
}
