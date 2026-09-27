import { collection, deleteField, doc, getDocs, limit, query, serverTimestamp, where, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivityPointRecord, AttendanceRecord } from '../types';

function withoutUndefined<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

export function attendanceRecordId(classId: string, studentId: string, date: string): string {
  return `${classId}_${studentId}_${date}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function loadAttendanceRecords(classId: string): Promise<AttendanceRecord[]> {
  if (!classId) return [];
  const snapshot = await getDocs(query(collection(db, 'attendanceRecords'), where('classId', '==', classId), limit(2000)));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as AttendanceRecord)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
  if (!records.length) return;
  if (records.length > 450) throw new Error('Mỗi lần chỉ được lưu tối đa 450 bản ghi.');
  const batch = writeBatch(db);
  records.forEach(record => {
    if (!record.classId || !record.studentId || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) throw new Error('Bản ghi điểm danh không hợp lệ.');
    const id = attendanceRecordId(record.classId, record.studentId, record.date);
    const data = withoutUndefined(record);
    if (record.note === undefined) data.note = deleteField();
    batch.set(doc(db, 'attendanceRecords', id), { ...data, id, updatedAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
}

export async function awardAttendancePoints(points: ActivityPointRecord[]): Promise<void> {
  if (!points.length) return;
  const batch = writeBatch(db);
  points.forEach(point => {
    if (point.source !== 'attendance' || point.points !== 5) throw new Error('Điểm chuyên cần không hợp lệ.');
    batch.set(doc(db, 'activityPoints', point.id), { ...withoutUndefined(point), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
  });
  await batch.commit();
}
