export const STUDENT_TEAMS = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'] as const;

export function normalizeStudentTeam(value: unknown): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';

  const normalized = String(value)
    .trim()
    .toLocaleLowerCase('vi')
    .replace(/\s+/g, ' ');
  const match = normalized.match(/^(?:tổ|to)?\s*0?([1-4])$/);

  return match ? `Tổ ${match[1]}` : '';
}
