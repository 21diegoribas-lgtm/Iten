export const formatRecordedBy = (recordedBy?: string): string => {
  const value = recordedBy?.trim() || '';

  if (!value) return 'Không rõ người ghi';
  if (/^\(?GV\)?$/i.test(value)) return 'Giáo viên (GV)';
  if (/^\(?(QTV|ADMIN)\)?$/i.test(value) || /^Quản trị viên$/i.test(value)) {
    return 'Quản trị viên';
  }

  return value;
};
