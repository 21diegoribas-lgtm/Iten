import type { TeacherDaySchedule, TeacherWeeklyTimetable } from '../types';

const DAYS: TeacherDaySchedule['day'][] = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export function createEmptyTeacherWeeklyTimetable(
  teacherId: string,
  teacherName: string,
  weekNumber: number,
  semester: 'Học kỳ 1' | 'Học kỳ 2',
): TeacherWeeklyTimetable {
  return {
    id: `twt_${teacherId}_w${weekNumber}_${semester === 'Học kỳ 1' ? 's1' : 's2'}`,
    teacherId,
    teacherName,
    semester,
    weekNumber,
    startDate: '',
    weeklyNotes: '',
    days: DAYS.map(day => ({ day, morningPeriods: [], afternoonPeriods: [], notes: '' })),
  };
}
