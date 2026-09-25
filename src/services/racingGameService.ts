import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { RacingGameConfig, RacingQuestion, RacingTeam, VehicleConfig } from '../types';

export const RACING_GAMES_COLLECTION = 'racingGames';

function integer(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

export async function getRacingGameConfig(classId: string): Promise<RacingGameConfig | null> {
  if (!classId) return null;
  const snapshot = await getDoc(doc(db, RACING_GAMES_COLLECTION, classId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const questions = (Array.isArray(data.questions) ? data.questions : []).filter((q: Partial<RacingQuestion>) =>
    typeof q.id === 'string' && typeof q.question === 'string' && typeof q.correctAnswer === 'string' && ['mcq', 'fill', 'bool'].includes(q.type || '')) as RacingQuestion[];
  const teams = (Array.isArray(data.teams) ? data.teams : []).filter((team: Partial<RacingTeam>) =>
    typeof team.id === 'string' && typeof team.name === 'string' && typeof team.color === 'string') as RacingTeam[];
  const vehicles = (Array.isArray(data.vehicles) ? data.vehicles : []).filter((vehicle: Partial<VehicleConfig>) =>
    typeof vehicle.id === 'string' && typeof vehicle.name === 'string' && typeof vehicle.distance === 'number') as VehicleConfig[];
  return {
    id: typeof data.id === 'string' ? data.id : `racing_${classId}`,
    title: typeof data.title === 'string' ? data.title : 'Đường đua học tập', classId,
    category: data.category === 'Thi đua rèn luyện' ? 'Thi đua rèn luyện' : 'Thi đua học tập',
    trackLength: integer(data.trackLength, 1000, 100, 10000), timeMinutes: integer(data.timeMinutes, 5, 1, 60),
    mode: data.mode === 'cá nhân' || data.mode === 'nhóm' ? data.mode : 'tổ',
    playMode: data.playMode === 'turn_based' ? 'turn_based' : 'all_teams', trackCount: integer(data.trackCount, 4, 2, 6),
    teams: teams.map(team => ({ ...team, currentDistance: 0 })), vehicles, questions, isActive: Boolean(data.isActive),
  };
}

export async function saveRacingGameConfig(config: RacingGameConfig): Promise<void> {
  if (!config.classId) throw new Error('Chưa xác định lớp học.');
  if (!config.title.trim()) throw new Error('Tiêu đề không được để trống.');
  if (!Number.isInteger(config.timeMinutes) || config.timeMinutes < 1 || config.timeMinutes > 60) throw new Error('Thời gian phải từ 1 đến 60 phút.');
  if (!Number.isInteger(config.trackLength) || config.trackLength < 100 || config.trackLength > 10000) throw new Error('Quãng đường phải từ 100 đến 10000 mét.');
  if (!Number.isInteger(config.trackCount) || config.trackCount < 2 || config.trackCount > 6) throw new Error('Số đội phải từ 2 đến 6.');
  if (config.teams.length < config.trackCount || config.teams.slice(0, config.trackCount).some(team => !team.name.trim())) throw new Error('Cần nhập đủ tên đội đua.');
  if (!config.vehicles.length || config.vehicles.some(vehicle => !vehicle.id || !vehicle.name.trim() || !Number.isFinite(vehicle.distance) || vehicle.distance <= 0)) throw new Error('Danh sách phương tiện không hợp lệ.');
  if (config.isActive && !config.questions.length) throw new Error('Hãy thêm câu hỏi trước khi kích hoạt đường đua.');
  await setDoc(doc(db, RACING_GAMES_COLLECTION, config.classId), {
    ...JSON.parse(JSON.stringify(config)), id: config.id || `racing_${config.classId}`, classId: config.classId,
    teams: config.teams.map(team => ({ ...team, currentDistance: 0 })), updatedAt: serverTimestamp(),
  }, { merge: true });
}
