import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { FlowerGameConfig, FlowerGameQuestion, FlowerParticipant } from '../types';
import { db } from '../lib/firebase';

export const FLOWER_GAMES_COLLECTION = 'flowerGames';

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function isActivityCategory(value: unknown): value is FlowerGameConfig['category'] {
  return [
    'Điểm HĐ học tập',
    'Điểm HĐ rèn luyện',
    'Điểm rèn luyện',
    'Điểm học tập',
    'Thi đua rèn luyện',
    'Thi đua học tập',
  ].includes(value as FlowerGameConfig['category']);
}

export function createEmptyFlowerGameConfig(classId: string): FlowerGameConfig {
  return {
    id: `flower_${classId || 'unassigned'}`,
    title: 'Hái hoa học tập',
    classId,
    category: 'Điểm HĐ học tập',
    language: 'vi',
    timeMinutes: 10,
    treesCount: 1,
    flowersPerTree: 12,
    fruitsPerTree: 0,
    questions: [],
    isActive: false,
    playMode: 'turn_based',
    participantType: 'team',
    participantsCount: 4,
    participants: [],
  };
}

function readQuestion(value: unknown): FlowerGameQuestion | null {
  if (!value || typeof value !== 'object') return null;
  const question = value as Partial<FlowerGameQuestion>;
  if (typeof question.id !== 'string' || typeof question.question !== 'string' || typeof question.correctAnswer !== 'string') return null;
  if (question.type !== 'mcq' && question.type !== 'fill' && question.type !== 'bool') return null;
  return {
    id: question.id,
    question: question.question,
    type: question.type,
    options: Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === 'string') : undefined,
    correctAnswer: question.correctAnswer,
    isLuckyFlower: Boolean(question.isLuckyFlower),
    multiplier: question.isLuckyFlower ? boundedInteger(question.multiplier, 2, 2, 3) : 1,
  };
}

function readParticipant(value: unknown): FlowerParticipant | null {
  if (!value || typeof value !== 'object') return null;
  const participant = value as Partial<FlowerParticipant>;
  if (typeof participant.id !== 'string' || typeof participant.name !== 'string' || typeof participant.color !== 'string') return null;
  return {
    id: participant.id,
    name: participant.name,
    color: participant.color,
    score: 0,
    harvestedCount: 0,
    avatar: typeof participant.avatar === 'string' ? participant.avatar : undefined,
  };
}

export async function getFlowerGameConfig(classId: string): Promise<FlowerGameConfig | null> {
  if (!classId) return null;
  const snapshot = await getDoc(doc(db, FLOWER_GAMES_COLLECTION, classId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  const questions = Array.isArray(data.questions)
    ? data.questions.map(readQuestion).filter((question): question is FlowerGameQuestion => question !== null)
    : [];
  const participants = Array.isArray(data.participants)
    ? data.participants.map(readParticipant).filter((participant): participant is FlowerParticipant => participant !== null)
    : [];

  return {
    ...createEmptyFlowerGameConfig(classId),
    id: typeof data.id === 'string' ? data.id : `flower_${classId}`,
    title: typeof data.title === 'string' ? data.title : 'Hái hoa học tập',
    classId,
    category: isActivityCategory(data.category) ? data.category : 'Điểm HĐ học tập',
    language: data.language === 'en' ? 'en' : 'vi',
    timeMinutes: boundedInteger(data.timeMinutes, 10, 1, 120),
    treesCount: typeof data.treesCount === 'number' ? data.treesCount : 1,
    flowersPerTree: typeof data.flowersPerTree === 'number' ? data.flowersPerTree : 12,
    fruitsPerTree: typeof data.fruitsPerTree === 'number' ? data.fruitsPerTree : 0,
    questions,
    isActive: Boolean(data.isActive),
    playMode: data.playMode === 'all_together' ? 'all_together' : 'turn_based',
    participantType: data.participantType === 'group' || data.participantType === 'student' ? data.participantType : 'team',
    participantsCount: participants.length || boundedInteger(data.participantsCount, 4, 1, 40),
    participants,
  };
}

export async function saveFlowerGameConfig(config: FlowerGameConfig): Promise<void> {
  if (!config.classId) throw new Error('Chưa xác định lớp cho trò chơi Hái hoa học tập.');
  if (!Number.isInteger(config.timeMinutes) || config.timeMinutes < 1 || config.timeMinutes > 120) {
    throw new Error('Thời gian chơi phải là số nguyên từ 1 đến 120 phút.');
  }
  if (config.isActive && !config.questions.length) throw new Error('Hãy thêm câu hỏi trước khi kích hoạt trò chơi.');
  const ids = new Set<string>();
  for (const question of config.questions) {
    if (!question.id || ids.has(question.id) || !question.question.trim() || !question.correctAnswer.trim()) {
      throw new Error('Câu hỏi phải có ID riêng, nội dung và đáp án đúng.');
    }
    ids.add(question.id);
    if (question.type === 'mcq') {
      const options = question.options?.map(option => option.trim()) || [];
      if (options.length < 2 || options.some(option => !option) ||
          new Set(options.map(option => option.toLowerCase())).size !== options.length ||
          !options.includes(question.correctAnswer.trim())) throw new Error('Phương án trắc nghiệm không hợp lệ.');
    } else if (question.type === 'bool') {
      if (!['đúng', 'sai', 'true', 'false'].includes(question.correctAnswer.trim().toLowerCase())) {
        throw new Error('Đáp án đúng/sai không hợp lệ.');
      }
    } else if (question.type !== 'fill') throw new Error('Loại câu hỏi không hợp lệ.');
    if (question.isLuckyFlower && question.multiplier !== 2 && question.multiplier !== 3) {
      throw new Error('Hoa may mắn chỉ hỗ trợ nhân 2 hoặc 3 điểm.');
    }
  }
  await setDoc(
    doc(db, FLOWER_GAMES_COLLECTION, config.classId),
    { ...JSON.parse(JSON.stringify(config)), id: config.id || `flower_${config.classId}`, classId: config.classId, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
