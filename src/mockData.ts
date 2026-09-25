import {
  User,
  NotificationItem,
  TimetableEntry,
  CleaningSchedule,
  DisciplineRecord,
  LearningRecord,
  PointUsageTransaction,
  LearningPresetItem,
  Complaint,
  AccountRequest,
  AttendanceRecord,
  SpyGameMission,
  FlowerGameConfig,
  RacingGameConfig,
  KeyboardHeroTask,
  MemoryCardGameConfig,
  PersonalStorageItem,
  TeacherWorkSchedule,
  TeacherWeeklyTimetable,
  TeacherDaySchedule,
  TeacherPeriodTask,
  ClassFundItem,
  ClassFundExpense,
  ClassLogbookPeriod,
  ClassLogbookWeek
} from './types';
import { getChibiAvatarUrl } from './utils/avatarHelper';

export const DEMO_USERS: User[] = [
  // Students
  {
    id: 's1',
    username: 'nguyenvanan',
    fullName: 'Nguyễn Văn An',
    role: 'student',
    password: '123456',
    email: 'an.nguyen@iten.edu.vn',
    gender: 'Nam',
    dob: '2012-05-14',
    phone: '0912345678',
    address: '123 Đường Láng, Đống Đa, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c1',
    className: 'Lớp 8A1',
    position: 'lớp trưởng',
    team: 'Tổ 1',
    isUnionMember: true,
    avatarId: 'avatar-01',
    avatar: getChibiAvatarUrl('Nguyễn Văn An', 'student', 'Nam')
  },
  {
    id: 's2',
    username: 'tranthibich',
    fullName: 'Trần Thị Bích',
    role: 'student',
    password: '123456',
    email: 'bich.tran@iten.edu.vn',
    gender: 'Nữ',
    dob: '2012-08-20',
    phone: '0987654321',
    address: '45 Chùa Bộc, Đống Đa, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c1',
    className: 'Lớp 8A1',
    position: 'lớp phó học tập',
    team: 'Tổ 2',
    isUnionMember: true,
    avatarId: 'avatar-11',
    avatar: getChibiAvatarUrl('Trần Thị Bích', 'student', 'Nữ')
  },
  {
    id: 's3',
    username: 'levuhoang',
    fullName: 'Lê Vũ Hoàng',
    role: 'student',
    password: '123456',
    email: 'hoang.le@iten.edu.vn',
    gender: 'Nam',
    dob: '2012-11-02',
    phone: '0901122334',
    address: '88 Tây Sơn, Đống Đa, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c1',
    className: 'Lớp 8A1',
    position: 'lớp phó lao động',
    team: 'Tổ 3',
    isUnionMember: false,
    avatarId: 'avatar-02',
    avatar: getChibiAvatarUrl('Lê Vũ Hoàng', 'student', 'Nam')
  },
  {
    id: 's4',
    username: 'phamthimai',
    fullName: 'Phạm Thị Mai',
    role: 'student',
    password: '123456',
    email: 'mai.pham@iten.edu.vn',
    gender: 'Nữ',
    dob: '2012-02-19',
    phone: '0933445566',
    address: '12 Tôn Đức Thắng, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c1',
    className: 'Lớp 8A1',
    position: 'tổ trưởng',
    team: 'Tổ 1',
    isUnionMember: true,
    avatarId: 'avatar-12',
    avatar: getChibiAvatarUrl('Phạm Thị Mai', 'student', 'Nữ')
  },
  {
    id: 's5',
    username: 'hoangminhdung',
    fullName: 'Hoàng Minh Dũng',
    role: 'student',
    password: '123456',
    email: 'dung.hoang@iten.edu.vn',
    gender: 'Nam',
    dob: '2012-10-10',
    phone: '0944556677',
    address: '99 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c1',
    className: 'Lớp 8A1',
    position: 'thành viên',
    team: 'Tổ 2',
    isUnionMember: false,
    avatarId: 'avatar-03',
    avatar: getChibiAvatarUrl('Hoàng Minh Dũng', 'student', 'Nam')
  },
  {
    id: 's6',
    username: 'vuthikimngan',
    fullName: 'Vũ Thị Kim Ngân',
    role: 'student',
    password: '123456',
    email: 'ngan.vu@iten.edu.vn',
    gender: 'Nữ',
    dob: '2012-03-15',
    phone: '0966778899',
    address: '22 Nguyễn Chí Thanh, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c1',
    className: 'Lớp 8A1',
    position: 'tổ trưởng',
    team: 'Tổ 3',
    isUnionMember: true,
    avatarId: 'avatar-13',
    avatar: getChibiAvatarUrl('Vũ Thị Kim Ngân', 'student', 'Nữ')
  },
  {
    id: 's7',
    username: 'dangquanghuy',
    fullName: 'Đặng Quang Huy',
    role: 'student',
    password: '123456',
    email: 'huy.dang@iten.edu.vn',
    gender: 'Nam',
    dob: '2012-07-28',
    phone: '0977889900',
    address: '56 Giảng Võ, Ba Đình, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c1',
    className: 'Lớp 8A1',
    position: 'tổ trưởng',
    team: 'Tổ 4',
    isUnionMember: true,
    avatarId: 'avatar-04',
    avatar: getChibiAvatarUrl('Đặng Quang Huy', 'student', 'Nam')
  },
  {
    id: 's8',
    username: 'buihoanglinh',
    fullName: 'Bùi Hoàng Linh',
    role: 'student',
    password: '123456',
    email: 'linh.bui@iten.edu.vn',
    gender: 'Nữ',
    dob: '2012-09-09',
    phone: '0988990011',
    address: '102 Xã Đàn, Đống Đa, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c1',
    className: 'Lớp 8A1',
    position: 'thủ quỹ',
    team: 'Tổ 4',
    isUnionMember: true,
    avatarId: 'avatar-14',
    avatar: getChibiAvatarUrl('Bùi Hoàng Linh', 'student', 'Nữ')
  },
  {
    id: 's9',
    username: 'doquocbao',
    fullName: 'Đỗ Quốc Bảo',
    role: 'student',
    password: '123456',
    email: 'bao.do@iten.edu.vn',
    gender: 'Nam',
    dob: '2012-12-18',
    phone: '0911223388',
    address: '34 Kim Mã, Ba Đình, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c2',
    className: 'Lớp 8A2',
    position: 'lớp trưởng',
    team: 'Tổ 1',
    isUnionMember: true,
    avatarId: 'avatar-05',
    avatar: getChibiAvatarUrl('Đỗ Quốc Bảo', 'student', 'Nam')
  },
  {
    id: 's10',
    username: 'nguyenthaoanh',
    fullName: 'Nguyễn Thảo Anh',
    role: 'student',
    password: '123456',
    email: 'anh.thao@iten.edu.vn',
    gender: 'Nữ',
    dob: '2012-04-22',
    phone: '0922334499',
    address: '68 Thái Hà, Đống Đa, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c2',
    className: 'Lớp 8A2',
    position: 'lớp phó',
    team: 'Tổ 2',
    isUnionMember: true,
    avatarId: 'avatar-15',
    avatar: getChibiAvatarUrl('Nguyễn Thảo Anh', 'student', 'Nữ')
  },
  {
    id: 's11',
    username: 'tranminhkha',
    fullName: 'Trần Minh Kha',
    role: 'student',
    password: '123456',
    email: 'kha.tran@iten.edu.vn',
    gender: 'Nam',
    dob: '2012-06-30',
    phone: '0933557711',
    address: '14 Liễu Giai, Ba Đình, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c2',
    className: 'Lớp 8A2',
    position: 'thành viên',
    team: 'Tổ 3',
    isUnionMember: false,
    avatarId: 'avatar-06',
    avatar: getChibiAvatarUrl('Trần Minh Kha', 'student', 'Nam')
  },
  {
    id: 's12',
    username: 'hoangyenchi',
    fullName: 'Hoàng Yến Chi',
    role: 'student',
    password: '123456',
    email: 'chi.hoang@iten.edu.vn',
    gender: 'Nữ',
    dob: '2012-01-05',
    phone: '0944668822',
    address: '89 Huỳnh Thúc Kháng, Hà Nội',
    school: 'THCS Chu Văn An',
    classId: 'c2',
    className: 'Lớp 8A2',
    position: 'thành viên',
    team: 'Tổ 4',
    isUnionMember: true,
    avatarId: 'avatar-16',
    avatar: getChibiAvatarUrl('Hoàng Yến Chi', 'student', 'Nữ')
  },

  // Teachers
  {
    id: 't1',
    username: 'comaihanoi',
    fullName: 'Cô Lê Thị Mai',
    role: 'teacher',
    password: '123456',
    email: 'mai.le@iten.edu.vn',
    gender: 'Nữ',
    dob: '1985-04-12',
    phone: '0988112233',
    address: '15 Hoàng Cầu, Đống Đa, Hà Nội',
    school: 'THCS Chu Văn An',
    teacherRole: 'giáo viên chủ nhiệm',
    subject: 'Ngữ Văn',
    avatar: getChibiAvatarUrl('Cô Lê Thị Mai', 'teacher', 'Nữ')
  },
  {
    id: 't2',
    username: 'thayhungtoan',
    fullName: 'Thầy Nguyễn Hữu Hùng',
    role: 'teacher',
    password: '123456',
    email: 'hung.nguyen@iten.edu.vn',
    gender: 'Nam',
    dob: '1982-09-25',
    phone: '0977223344',
    address: '77 Láng Hạ, Đống Đa, Hà Nội',
    school: 'THCS Chu Văn An',
    teacherRole: 'giáo viên bộ môn',
    subject: 'Toán học',
    avatar: getChibiAvatarUrl('Thầy Nguyễn Hữu Hùng', 'teacher', 'Nam')
  },

  // Admin
  {
    id: 'a1',
    username: 'ADMINITEN',
    fullName: 'Quản trị viên ITEN',
    role: 'admin',
    password: '@24041701#',
    email: 'admin@iten.edu.vn',
    gender: 'Nam',
    dob: '1980-01-01',
    phone: '0900000000',
    address: 'Trụ sở ITEN Education, Hà Nội',
    school: 'Hệ thống ITEN',
    avatar: getChibiAvatarUrl('Quản trị viên ITEN', 'admin', 'Nam')
  }
];

export const DEMO_CLASSES = [
  {
    id: 'c1',
    name: 'Lớp 8A1',
    school: 'THCS Chu Văn An',
    academicYear: '2025 - 2026',
    homeroomTeacher: 'Cô Lê Thị Mai',
    studentCount: 38,
    maleCount: 20,
    femaleCount: 18,
    unionCount: 25,
    notes: 'Lớp điểm phong trào thi đua của trường.'
  },
  {
    id: 'c2',
    name: 'Lớp 8A2',
    school: 'THCS Chu Văn An',
    academicYear: '2025 - 2026',
    homeroomTeacher: 'Thầy Nguyễn Hữu Hùng',
    studentCount: 40,
    maleCount: 22,
    femaleCount: 18,
    unionCount: 28,
    notes: 'Lớp chuyên Toán - Tin.'
  },
  {
    id: 'c3',
    name: 'Lớp 7A1',
    school: 'THCS Chu Văn An',
    academicYear: '2024 - 2025',
    homeroomTeacher: 'Cô Lê Thị Mai',
    studentCount: 36,
    maleCount: 18,
    femaleCount: 18,
    unionCount: 20,
    notes: 'Lớp tiên tiến khóa trước.'
  },
  {
    id: 'c4',
    name: 'Lớp 6A1',
    school: 'THCS Chu Văn An',
    academicYear: '2023 - 2024',
    homeroomTeacher: 'Thầy Trần Quốc Bảo',
    studentCount: 35,
    maleCount: 17,
    femaleCount: 18,
    unionCount: 15,
    notes: 'Lớp đầu cấp khóa 2023-2027.'
  }
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Thông báo kế hoạch tổ chức Hái hoa học tập tuần 4',
    content: 'Các em học sinh lớp 8A1 chuẩn bị ôn tập kiến thức môn Ngữ Văn và Toán để tham gia trò chơi Hái hoa học tập vào thứ 5 tuần này.',
    senderName: 'Cô Lê Thị Mai',
    senderRole: 'Giáo viên chủ nhiệm',
    targetClassId: 'c1',
    createdAt: '2026-08-20 08:30',
    isRead: false
  },
  {
    id: 'n2',
    title: 'Lịch trực vệ sinh tuần mới',
    content: 'Tổ 1 chịu trách nhiệm trực vệ sinh khu vực sân trường và lớp học trong tuần này. Đề nghị các bạn hoàn thành nhiệm vụ đúng giờ.',
    senderName: 'Nguyễn Văn An',
    senderRole: 'Lớp trưởng',
    targetClassId: 'c1',
    createdAt: '2026-08-21 07:00',
    isRead: true
  },
  {
    id: 'n3',
    title: 'Cập nhật hệ thống thi đua tháng 8',
    content: 'Ban Giám hiệu nhà trường đã cập nhật bộ tiêu chí thi đua rèn luyện và học tập mới năm học 2025-2026. Mời các thầy cô và học sinh theo dõi.',
    senderName: 'Quản trị viên ITEN',
    senderRole: 'Admin',
    targetRole: 'all',
    createdAt: '2026-08-19 14:00',
    isRead: false
  }
];

export const DEMO_POINT_USAGE_TRANSACTIONS: PointUsageTransaction[] = [
  {
    id: 'put_101',
    studentId: 'st1',
    studentName: 'Nguyễn Văn An',
    className: '8A1',
    team: 'Tổ 1',
    pointType: 'academic',
    amount: 15,
    content: 'Đổi phần thưởng Học sinh giỏi Tuần 3 (Voucher xem phim)',
    date: '2026-08-28',
    time: '10:15',
    performedBy: 'Cô Lê Thị Mai',
    performedRole: 'Giáo viên chủ nhiệm',
    status: 'active'
  },
  {
    id: 'put_102',
    studentId: 'st1',
    studentName: 'Nguyễn Văn An',
    className: '8A1',
    team: 'Tổ 1',
    pointType: 'training',
    amount: 10,
    content: 'Đổi huy hiệu Chăm ngoan Rèn luyện THCS Chu Văn An',
    date: '2026-08-29',
    time: '14:30',
    performedBy: 'Cô Lê Thị Mai',
    performedRole: 'Giáo viên chủ nhiệm',
    status: 'active'
  },
  {
    id: 'put_103',
    studentId: 'st2',
    studentName: 'Trần Thị Bình',
    className: '8A1',
    team: 'Tổ 1',
    pointType: 'academic',
    amount: 10,
    content: 'Đổi dụng cụ học tập (Bộ thước kẻ & bút dạ quang)',
    date: '2026-08-30',
    time: '09:00',
    performedBy: 'Cô Lê Thị Mai',
    performedRole: 'Giáo viên chủ nhiệm',
    status: 'active'
  },
  {
    id: 'put_104',
    studentId: 'st3',
    studentName: 'Lê Hoàng Cường',
    className: '8A1',
    team: 'Tổ 2',
    pointType: 'training',
    amount: 5,
    content: 'Đổi sticker khen thưởng kỷ luật nếp sống',
    date: '2026-08-31',
    time: '16:00',
    performedBy: 'Quản trị viên ITEN',
    performedRole: 'Admin',
    status: 'active'
  }
];

export const DEMO_TIMETABLE: TimetableEntry = {
  id: 'tt4',
  classId: 'c1',
  semester: 'Học kỳ 1',
  weekNumber: 4,
  startDate: '2026-08-24',
  schedule: [
    {
      day: 'Thứ 2',
      periods: [
        { period: 1, subject: 'Chào cờ', teacherName: 'Toàn trường' },
        { period: 2, subject: 'Toán', teacherName: 'Thầy Hùng' },
        { period: 3, subject: 'Ngữ Văn', teacherName: 'Cô Mai' },
        { period: 4, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' },
        { period: 5, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' }
      ]
    },
    {
      day: 'Thứ 3',
      periods: [
        { period: 1, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' },
        { period: 2, subject: 'Hóa Học', teacherName: 'Cô Lan' },
        { period: 3, subject: 'Lịch Sử', teacherName: 'Thầy Nam' },
        { period: 4, subject: 'Địa Lý', teacherName: 'Cô Hương' },
        { period: 5, subject: 'Toán', teacherName: 'Thầy Hùng' }
      ]
    },
    {
      day: 'Thứ 4',
      periods: [
        { period: 1, subject: 'Toán', teacherName: 'Thầy Hùng' },
        { period: 2, subject: 'Ngữ Văn', teacherName: 'Cô Mai' },
        { period: 3, subject: 'Sinh Học', teacherName: 'Cô Thảo' },
        { period: 4, subject: 'Tin Học', teacherName: 'Thầy Bình' },
        { period: 5, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' }
      ]
    },
    {
      day: 'Thứ 5',
      periods: [
        { period: 1, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' },
        { period: 2, subject: 'GDCD', teacherName: 'Thầy Đức' },
        { period: 3, subject: 'Công Nghệ', teacherName: 'Cô Quỳnh' },
        { period: 4, subject: 'Thể Dục', teacherName: 'Thầy Long' },
        { period: 5, subject: 'Ngữ Văn', teacherName: 'Cô Mai' }
      ]
    },
    {
      day: 'Thứ 6',
      periods: [
        { period: 1, subject: 'Toán', teacherName: 'Thầy Hùng' },
        { period: 2, subject: 'Ngữ Văn', teacherName: 'Cô Mai' },
        { period: 3, subject: 'Mỹ Thuật', teacherName: 'Cô Vân' },
        { period: 4, subject: 'Âm Nhạc', teacherName: 'Thầy Khoa' },
        { period: 5, subject: 'Sinh Học', teacherName: 'Cô Thảo' }
      ]
    },
    {
      day: 'Thứ 7',
      periods: [
        { period: 1, subject: 'Hoạt động trải nghiệm', teacherName: 'Cô Mai' },
        { period: 2, subject: 'GDĐP', teacherName: 'Thầy Nam' },
        { period: 3, subject: 'Tin Học', teacherName: 'Thầy Bình' },
        { period: 4, subject: 'Công Nghệ', teacherName: 'Cô Quỳnh' },
        { period: 5, subject: 'Sinh hoạt lớp', teacherName: 'Cô Mai' }
      ]
    }
  ]
};

export const DEMO_TIMETABLES: TimetableEntry[] = [
  {
    id: 'tt1',
    classId: 'c1',
    semester: 'Học kỳ 1',
    weekNumber: 1,
    startDate: '2026-08-03',
    schedule: [
      { day: 'Thứ 2', periods: [{ period: 1, subject: 'Chào cờ', teacherName: 'Toàn trường' }, { period: 2, subject: 'Toán', teacherName: 'Thầy Hùng' }, { period: 3, subject: 'Ngữ Văn', teacherName: 'Cô Mai' }, { period: 4, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' }, { period: 5, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' }] },
      { day: 'Thứ 3', periods: [{ period: 1, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' }, { period: 2, subject: 'Ngữ Văn', teacherName: 'Cô Mai' }, { period: 3, subject: 'Toán', teacherName: 'Thầy Hùng' }, { period: 4, subject: 'Hóa Học', teacherName: 'Cô Lan' }, { period: 5, subject: 'Lịch Sử', teacherName: 'Thầy Nam' }] },
      { day: 'Thứ 4', periods: [{ period: 1, subject: 'Toán', teacherName: 'Thầy Hùng' }, { period: 2, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' }, { period: 3, subject: 'Sinh Học', teacherName: 'Cô Thảo' }, { period: 4, subject: 'Địa Lý', teacherName: 'Cô Hương' }, { period: 5, subject: 'Tin Học', teacherName: 'Thầy Bình' }] },
      { day: 'Thứ 5', periods: [{ period: 1, subject: 'Sinh Học', teacherName: 'Cô Thảo' }, { period: 2, subject: 'Lịch Sử', teacherName: 'Thầy Nam' }, { period: 3, subject: 'GDCD', teacherName: 'Thầy Đức' }, { period: 4, subject: 'Công Nghệ', teacherName: 'Cô Quỳnh' }, { period: 5, subject: 'Thể Dục', teacherName: 'Thầy Long' }] },
      { day: 'Thứ 6', periods: [{ period: 1, subject: 'Địa Lý', teacherName: 'Cô Hương' }, { period: 2, subject: 'Tin Học', teacherName: 'Thầy Bình' }, { period: 3, subject: 'Mỹ Thuật', teacherName: 'Cô Vân' }, { period: 4, subject: 'Âm Nhạc', teacherName: 'Thầy Khoa' }, { period: 5, subject: 'Toán', teacherName: 'Thầy Hùng' }] },
      { day: 'Thứ 7', periods: [{ period: 1, subject: 'Hoạt động trải nghiệm', teacherName: 'Cô Mai' }, { period: 2, subject: 'GDĐP', teacherName: 'Thầy Nam' }, { period: 3, subject: 'Tin Học', teacherName: 'Thầy Bình' }, { period: 4, subject: 'Công Nghệ', teacherName: 'Cô Quỳnh' }, { period: 5, subject: 'Sinh hoạt lớp', teacherName: 'Cô Mai' }] }
    ]
  },
  {
    id: 'tt2',
    classId: 'c1',
    semester: 'Học kỳ 1',
    weekNumber: 2,
    startDate: '2026-08-10',
    schedule: [
      { day: 'Thứ 2', periods: [{ period: 1, subject: 'Chào cờ', teacherName: 'Toàn trường' }, { period: 2, subject: 'Ngữ Văn', teacherName: 'Cô Mai' }, { period: 3, subject: 'Toán', teacherName: 'Thầy Hùng' }, { period: 4, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' }, { period: 5, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' }] },
      { day: 'Thứ 3', periods: [{ period: 1, subject: 'Toán', teacherName: 'Thầy Hùng' }, { period: 2, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' }, { period: 3, subject: 'Hóa Học', teacherName: 'Cô Lan' }, { period: 4, subject: 'Sinh Học', teacherName: 'Cô Thảo' }, { period: 5, subject: 'Lịch Sử', teacherName: 'Thầy Nam' }] },
      { day: 'Thứ 4', periods: [{ period: 1, subject: 'Hóa Học', teacherName: 'Cô Lan' }, { period: 2, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' }, { period: 3, subject: 'Địa Lý', teacherName: 'Cô Hương' }, { period: 4, subject: 'Tin Học', teacherName: 'Thầy Bình' }, { period: 5, subject: 'Ngữ Văn', teacherName: 'Cô Mai' }] },
      { day: 'Thứ 5', periods: [{ period: 1, subject: 'GDCD', teacherName: 'Thầy Đức' }, { period: 2, subject: 'Công Nghệ', teacherName: 'Cô Quỳnh' }, { period: 3, subject: 'Thể Dục', teacherName: 'Thầy Long' }, { period: 4, subject: 'Mỹ Thuật', teacherName: 'Cô Vân' }, { period: 5, subject: 'Âm Nhạc', teacherName: 'Thầy Khoa' }] },
      { day: 'Thứ 6', periods: [{ period: 1, subject: 'Thể Dục', teacherName: 'Thầy Long' }, { period: 2, subject: 'Mỹ Thuật', teacherName: 'Cô Vân' }, { period: 3, subject: 'Toán', teacherName: 'Thầy Hùng' }, { period: 4, subject: 'Ngữ Văn', teacherName: 'Cô Mai' }, { period: 5, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' }] },
      { day: 'Thứ 7', periods: [{ period: 1, subject: 'Hoạt động trải nghiệm', teacherName: 'Cô Mai' }, { period: 2, subject: 'GDĐP', teacherName: 'Thầy Nam' }, { period: 3, subject: 'Tin Học', teacherName: 'Thầy Bình' }, { period: 4, subject: 'Công Nghệ', teacherName: 'Cô Quỳnh' }, { period: 5, subject: 'Sinh hoạt lớp', teacherName: 'Cô Mai' }] }
    ]
  },
  {
    id: 'tt3',
    classId: 'c1',
    semester: 'Học kỳ 1',
    weekNumber: 3,
    startDate: '2026-08-17',
    schedule: [
      { day: 'Thứ 2', periods: [{ period: 1, subject: 'Chào cờ', teacherName: 'Toàn trường' }, { period: 2, subject: 'Toán', teacherName: 'Thầy Hùng' }, { period: 3, subject: 'Ngữ Văn', teacherName: 'Cô Mai' }, { period: 4, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' }, { period: 5, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' }] },
      { day: 'Thứ 3', periods: [{ period: 1, subject: 'Ngữ Văn', teacherName: 'Cô Mai' }, { period: 2, subject: 'Tiếng Anh', teacherName: 'Cô Sarah' }, { period: 3, subject: 'Toán', teacherName: 'Thầy Hùng' }, { period: 4, subject: 'Hóa Học', teacherName: 'Cô Lan' }, { period: 5, subject: 'Sinh Học', teacherName: 'Cô Thảo' }] },
      { day: 'Thứ 4', periods: [{ period: 1, subject: 'Vật Lý', teacherName: 'Thầy Tuấn' }, { period: 2, subject: 'Hóa Học', teacherName: 'Cô Lan' }, { period: 3, subject: 'Lịch Sử', teacherName: 'Thầy Nam' }, { period: 4, subject: 'Địa Lý', teacherName: 'Cô Hương' }, { period: 5, subject: 'Tin Học', teacherName: 'Thầy Bình' }] },
      { day: 'Thứ 5', periods: [{ period: 1, subject: 'Lịch Sử', teacherName: 'Thầy Nam' }, { period: 2, subject: 'Địa Lý', teacherName: 'Cô Hương' }, { period: 3, subject: 'GDCD', teacherName: 'Thầy Đức' }, { period: 4, subject: 'Công Nghệ', teacherName: 'Cô Quỳnh' }, { period: 5, subject: 'Thể Dục', teacherName: 'Thầy Long' }] },
      { day: 'Thứ 6', periods: [{ period: 1, subject: 'Sinh Học', teacherName: 'Cô Thảo' }, { period: 2, subject: 'Tin Học', teacherName: 'Thầy Bình' }, { period: 3, subject: 'Mỹ Thuật', teacherName: 'Cô Vân' }, { period: 4, subject: 'Âm Nhạc', teacherName: 'Thầy Khoa' }, { period: 5, subject: 'Toán', teacherName: 'Thầy Hùng' }] },
      { day: 'Thứ 7', periods: [{ period: 1, subject: 'Hoạt động trải nghiệm', teacherName: 'Cô Mai' }, { period: 2, subject: 'GDĐP', teacherName: 'Thầy Nam' }, { period: 3, subject: 'Tin Học', teacherName: 'Thầy Bình' }, { period: 4, subject: 'Công Nghệ', teacherName: 'Cô Quỳnh' }, { period: 5, subject: 'Sinh hoạt lớp', teacherName: 'Cô Mai' }] }
    ]
  },
  DEMO_TIMETABLE
];

export const createDefaultTeacherWeeklyTimetable = (
  teacherId: string = 't1',
  teacherName: string = 'Cô Lê Thị Mai',
  weekNumber: number = 4,
  semester: 'Học kỳ 1' | 'Học kỳ 2' = 'Học kỳ 1'
): TeacherWeeklyTimetable => {
  return {
    id: `twt_${teacherId}_w${weekNumber}_${semester === 'Học kỳ 1' ? 's1' : 's2'}`,
    teacherId,
    teacherName,
    semester,
    weekNumber,
    startDate: '2026-08-24',
    weeklyNotes: 'Trọng tâm tuần 4: Kiểm tra 15 phút đầu giờ môn Ngữ Văn các lớp 8A1, 8A2. Hoàn thiện sổ chủ nhiệm và báo cáo công tác tháng.',
    days: [
      {
        day: 'Thứ 2',
        date: '2026-08-24',
        morningPeriods: [
          { period: 1, task: 'Chào cờ đầu tuần', location: 'Sân trường', type: 'Chủ nhiệm', status: 'Hoàn thành' },
          { period: 2, task: 'Ngữ Văn (Lớp 8A1)', location: 'Phòng 201', type: 'Lên lớp', status: 'Hoàn thành' },
          { period: 3, task: 'Ngữ Văn (Lớp 8A2)', location: 'Phòng 202', type: 'Lên lớp', status: 'Hoàn thành' },
          { period: 4, task: 'Trống tiết / Soạn giáo án', location: 'Văn phòng tổ Văn', type: 'Khác', status: 'Hoàn thành' },
          { period: 5, task: 'Ngữ Văn (Lớp 9A1)', location: 'Phòng 301', type: 'Lên lớp', status: 'Hoàn thành' }
        ],
        afternoonPeriods: [
          { period: 1, task: 'Họp giao ban BGH & GVCN', location: 'Phòng họp Hội đồng', type: 'Họp hội đồng', status: 'Hoàn thành' },
          { period: 2, task: 'Bồi dưỡng học sinh giỏi Văn', location: 'Phòng học 204', type: 'Bồi dưỡng', status: 'Hoàn thành' },
          { period: 3, task: 'Bồi dưỡng học sinh giỏi Văn', location: 'Phòng học 204', type: 'Bồi dưỡng', status: 'Hoàn thành' },
          { period: 4, task: 'Nghỉ / Nghiên cứu tài liệu', location: 'Văn phòng', type: 'Khác', status: 'Hoàn thành' },
          { period: 5, task: 'Trực ban kiểm tra nền nếp HS', location: 'Cổng trường', type: 'Trực ban', status: 'Hoàn thành' }
        ],
        notes: 'Nhắc nhở học sinh 8A1 mặc đồng phục đúng quy định, mang đủ tập bài soạn.'
      },
      {
        day: 'Thứ 3',
        date: '2026-08-25',
        morningPeriods: [
          { period: 1, task: 'Ngữ Văn (Lớp 8A1)', location: 'Phòng 201', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 2, task: 'Ngữ Văn (Lớp 8A1) - Bài đọc', location: 'Phòng 201', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 3, task: 'Sinh hoạt tổ chuyên môn Văn', location: 'Phòng chuyên môn', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 4, task: 'Dự giờ đồng nghiệp (Cô Lan)', location: 'Phòng 203', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ / Chuẩn bị bài giảng', location: '', type: 'Khác', status: 'Đã lên lịch' }
        ],
        afternoonPeriods: [
          { period: 1, task: 'Phụ đạo học sinh yếu môn Văn', location: 'Phòng 102', type: 'Bồi dưỡng', status: 'Đã lên lịch' },
          { period: 2, task: 'Phụ đạo học sinh yếu môn Văn', location: 'Phòng 102', type: 'Bồi dưỡng', status: 'Đã lên lịch' },
          { period: 3, task: 'Chấm bài kiểm tra 15 phút 8A1', location: 'Văn phòng', type: 'Chấm bài', status: 'Đã lên lịch' },
          { period: 4, task: 'Vào sổ điểm điện tử', location: 'Phòng máy tính', type: 'Chấm bài', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' }
        ],
        notes: 'Chuẩn bị giáo án bài "Từ tượng hình, từ tượng thanh" và máy chiếu phòng 201.'
      },
      {
        day: 'Thứ 4',
        date: '2026-08-26',
        morningPeriods: [
          { period: 1, task: 'Trống tiết / Trao đổi phụ huynh', location: 'Phòng tiếp dân', type: 'Chủ nhiệm', status: 'Đã lên lịch' },
          { period: 2, task: 'Ngữ Văn (Lớp 8A2)', location: 'Phòng 202', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 3, task: 'Ngữ Văn (Lớp 8A2)', location: 'Phòng 202', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 4, task: 'Ngữ Văn (Lớp 9A2)', location: 'Phòng 302', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 5, task: 'Ngữ Văn (Lớp 9A1)', location: 'Phòng 301', type: 'Lên lớp', status: 'Đã lên lịch' }
        ],
        afternoonPeriods: [
          { period: 1, task: 'Họp Ban thi đua khen thưởng', location: 'Phòng họp số 2', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 2, task: 'Sinh hoạt CLB Sách & Văn học', location: 'Thư viện trường', type: 'Chủ nhiệm', status: 'Đã lên lịch' },
          { period: 3, task: 'Sinh hoạt CLB Sách & Văn học', location: 'Thư viện trường', type: 'Chủ nhiệm', status: 'Đã lên lịch' },
          { period: 4, task: 'Nghỉ / Nghiên cứu chuyên đề', location: 'Thư viện', type: 'Khác', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' }
        ],
        notes: 'Liên hệ phụ huynh em Nguyễn Văn An để trao đổi về tình hình học tập và chuyên cần.'
      },
      {
        day: 'Thứ 5',
        date: '2026-08-27',
        morningPeriods: [
          { period: 1, task: 'Ngữ Văn (Lớp 9A2)', location: 'Phòng 302', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 2, task: 'Trống tiết / Soạn đề kiểm tra', location: 'Văn phòng', type: 'Chấm bài', status: 'Đã lên lịch' },
          { period: 3, task: 'Ngữ Văn (Lớp 8A1)', location: 'Phòng 201', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 4, task: 'Ngữ Văn (Lớp 8A1)', location: 'Phòng 201', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 5, task: 'Ngữ Văn (Lớp 8A2)', location: 'Phòng 202', type: 'Lên lớp', status: 'Đã lên lịch' }
        ],
        afternoonPeriods: [
          { period: 1, task: 'Chấm bài viết tập làm văn số 1 (8A2)', location: 'Văn phòng tổ', type: 'Chấm bài', status: 'Đã lên lịch' },
          { period: 2, task: 'Chấm bài viết tập làm văn số 1 (8A2)', location: 'Văn phòng tổ', type: 'Chấm bài', status: 'Đã lên lịch' },
          { period: 3, task: 'Tập huấn đổi mới PPDH trực tuyến', location: 'Hội trường', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 4, task: 'Tập huấn đổi mới PPDH trực tuyến', location: 'Hội trường', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' }
        ],
        notes: 'Nộp ma trận và đề kiểm tra định kỳ cho Tổ trưởng chuyên môn trước 17h00.'
      },
      {
        day: 'Thứ 6',
        date: '2026-08-28',
        morningPeriods: [
          { period: 1, task: 'Ngữ Văn (Lớp 8A2)', location: 'Phòng 202', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 2, task: 'Ngữ Văn (Lớp 9A1)', location: 'Phòng 301', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 3, task: 'Ngữ Văn (Lớp 9A2)', location: 'Phòng 302', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 4, task: 'Kiểm tra vệ sinh & nền nếp lớp 8A1', location: 'Phòng 201', type: 'Chủ nhiệm', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ / Tổng hợp thi đua tuần', location: 'Văn phòng', type: 'Chủ nhiệm', status: 'Đã lên lịch' }
        ],
        afternoonPeriods: [
          { period: 1, task: 'Họp Hội đồng Sư phạm tháng 8', location: 'Hội trường A', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 2, task: 'Họp Hội đồng Sư phạm tháng 8', location: 'Hội trường A', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 3, task: 'Sinh hoạt Công đoàn trường', location: 'Hội trường A', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 4, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' }
        ],
        notes: 'Tổng hợp danh sách khen thưởng học sinh tiến bộ trong tuần để trao hoa điểm tốt.'
      },
      {
        day: 'Thứ 7',
        date: '2026-08-29',
        morningPeriods: [
          { period: 1, task: 'Hoạt động trải nghiệm hướng nghiệp (8A1)', location: 'Sân đa năng', type: 'Chủ nhiệm', status: 'Đã lên lịch' },
          { period: 2, task: 'Giáo dục địa phương (8A1)', location: 'Phòng 201', type: 'Lên lớp', status: 'Đã lên lịch' },
          { period: 3, task: 'Trống tiết / Kiểm tra sổ đầu bài', location: 'Phòng 201', type: 'Chủ nhiệm', status: 'Đã lên lịch' },
          { period: 4, task: 'Dự giờ thao giảng cấp trường', location: 'Phòng 303', type: 'Họp hội đồng', status: 'Đã lên lịch' },
          { period: 5, task: 'Sinh hoạt lớp 8A1 & Tổng kết tuần', location: 'Phòng 201', type: 'Chủ nhiệm', status: 'Đã lên lịch' }
        ],
        afternoonPeriods: [
          { period: 1, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' },
          { period: 2, task: 'Nghỉ / Chuẩn bị bài tuần sau', location: 'Tại nhà', type: 'Khác', status: 'Đã lên lịch' },
          { period: 3, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' },
          { period: 4, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' }
        ],
        notes: 'Đánh giá xếp loại thi đua tổ và lớp 8A1. Công bố bảng xếp hạng thi đua tuần 4.'
      },
      {
        day: 'Chủ Nhật',
        date: '2026-08-30',
        morningPeriods: [
          { period: 1, task: 'Nghỉ ngơi cuối tuần', location: 'Tại nhà', type: 'Khác', status: 'Đã lên lịch' },
          { period: 2, task: 'Nghỉ ngơi cuối tuần', location: 'Tại nhà', type: 'Khác', status: 'Đã lên lịch' },
          { period: 3, task: 'Xem trước bài giảng E-Learning tuần 5', location: 'Tại nhà', type: 'Khác', status: 'Đã lên lịch' },
          { period: 4, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' }
        ],
        afternoonPeriods: [
          { period: 1, task: 'Nghỉ ngơi cuối tuần', location: 'Tại nhà', type: 'Khác', status: 'Đã lên lịch' },
          { period: 2, task: 'Nghỉ ngơi cuối tuần', location: 'Tại nhà', type: 'Khác', status: 'Đã lên lịch' },
          { period: 3, task: 'Rà soát kế hoạch giảng dạy tuần mới', location: 'Tại nhà', type: 'Khác', status: 'Đã lên lịch' },
          { period: 4, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' },
          { period: 5, task: 'Nghỉ', location: '', type: 'Khác', status: 'Đã lên lịch' }
        ],
        notes: 'Nghỉ ngơi, chuẩn bị tinh thần và giáo án điện tử chu đáo cho tuần công tác mới.'
      }
    ]
  };
};

export const DEMO_TEACHER_WEEKLY_TIMETABLES: TeacherWeeklyTimetable[] = [
  createDefaultTeacherWeeklyTimetable('t1', 'Cô Lê Thị Mai', 4, 'Học kỳ 1'),
  createDefaultTeacherWeeklyTimetable('t1', 'Cô Lê Thị Mai', 1, 'Học kỳ 1'),
  createDefaultTeacherWeeklyTimetable('t1', 'Cô Lê Thị Mai', 2, 'Học kỳ 1'),
  createDefaultTeacherWeeklyTimetable('t1', 'Cô Lê Thị Mai', 3, 'Học kỳ 1'),
  createDefaultTeacherWeeklyTimetable('admin1', 'Thầy Nguyễn Văn Hiệu (BGH)', 4, 'Học kỳ 1')
];

export const DEMO_TEACHER_SCHEDULES: TeacherWorkSchedule[] = [
  {
    id: 'tws1',
    teacherId: 't1',
    teacherName: 'Cô Lê Thị Mai',
    date: '2026-08-24',
    weekNumber: 4,
    title: 'Lên lớp môn Ngữ Văn lớp 8A1',
    content: 'Giảng dạy bài Sông núi nước Nam và Phò giá về kinh.',
    type: 'Lên lớp',
    status: 'Đã lên lịch'
  },
  {
    id: 'tws2',
    teacherId: 't1',
    teacherName: 'Cô Lê Thị Mai',
    date: '2026-08-25',
    weekNumber: 4,
    title: 'Họp hội đồng giáo viên trường',
    content: 'Triển khai nhiệm vụ trọng tâm tháng 8/2026 và kế hoạch thi đua năm học mới.',
    type: 'Họp hội đồng',
    status: 'Đã lên lịch'
  },
  {
    id: 'tws3',
    teacherId: 't1',
    teacherName: 'Cô Lê Thị Mai',
    date: '2026-08-26',
    weekNumber: 4,
    title: 'Chấm bài kiểm tra 15 phút Ngữ Văn 8A1',
    content: 'Chấm và vào điểm bài kiểm tra thường xuyên số 1.',
    type: 'Chấm bài',
    status: 'Đã lên lịch'
  }
];

export const DEMO_CLEANING: CleaningSchedule = {
  id: 'cl1',
  classId: 'c1',
  weekNumber: 4,
  startDate: '2026-08-24',
  tasks: [
    { day: 'Thứ 2', groupName: 'Tổ 1', studentNames: ['Nguyễn Văn An', 'Phạm Thị Mai'], status: 'Đã hoàn thành' },
    { day: 'Thứ 3', groupName: 'Tổ 2', studentNames: ['Trần Thị Bích', 'Hoàng Minh Dũng'], status: 'Chưa làm' },
    { day: 'Thứ 4', groupName: 'Tổ 3', studentNames: ['Lê Vũ Hoàng'], status: 'Chưa làm' },
    { day: 'Thứ 5', groupName: 'Tổ 1', studentNames: ['Nguyễn Văn An', 'Phạm Thị Mai'], status: 'Chưa làm' },
    { day: 'Thứ 6', groupName: 'Tổ 2', studentNames: ['Trần Thị Bích', 'Hoàng Minh Dũng'], status: 'Chưa làm' },
    { day: 'Thứ 7', groupName: 'Tổ 3', studentNames: ['Lê Vũ Hoàng'], status: 'Chưa làm' }
  ]
};

export const REWARD_CATEGORIES = [
  '10 điểm tốt học tập',
  'Phát biểu xây dựng bài',
  'Trực nhật lớp học sạch sẽ',
  'Giúp đỡ bạn học vượt khó',
  'Tham gia phong trào thi đua trường',
  'Khác'
];

export const VIOLATION_CATEGORIES = [
  'Đi học muộn',
  'Không làm bài tập về nhà',
  'Nói chuyện / mất trật tự trong giờ học',
  'Không mặc đồng phục / đeo khăn quàng',
  'Trực nhật không sạch / trễ hạn',
  'Khác'
];

export const DEMO_DISCIPLINE_RECORDS: DisciplineRecord[] = [
  // Tuần 4
  { id: 'dr1', studentId: 's1', studentName: 'Nguyễn Văn An', classId: 'c1', type: 'reward', categoryName: '10 điểm tốt học tập', points: 10, reason: 'Đạt điểm 10 môn Toán trong bài kiểm tra 15 phút', date: '2026-08-20', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Thầy Nguyễn Hữu Hùng' },
  { id: 'dr2', studentId: 's3', studentName: 'Lê Vũ Hoàng', classId: 'c1', type: 'violation', categoryName: 'Đi muộn', points: -2, reason: 'Đi học muộn 10 phút không có lý do chính đáng', date: '2026-08-19', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Nguyễn Văn An (Cán sự)' },
  { id: 'dr3', studentId: 's2', studentName: 'Trần Thị Bích', classId: 'c1', type: 'reward', categoryName: 'Giúp đỡ bạn bè', points: 5, reason: 'Giúp bạn ôn tập bài trước giờ kiểm tra', date: '2026-08-21', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Cô Lê Thị Mai' },
  { id: 'dr4', studentId: 's4', studentName: 'Phạm Thị Mai', classId: 'c1', type: 'reward', categoryName: 'Tham gia phong trào', points: 8, reason: 'Tích cực tham gia dọn dẹp thư viện trường', date: '2026-08-21', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' },
  { id: 'dr5', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', classId: 'c1', type: 'reward', categoryName: 'Xây dựng bài', points: 6, reason: 'Đóng góp nhiều ý kiến hay cho buổi sinh hoạt lớp', date: '2026-08-20', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Trần Thị Bích (Lớp phó)' },
  { id: 'dr6', studentId: 's7', studentName: 'Đặng Quang Huy', classId: 'c1', type: 'reward', categoryName: 'Trực nhật xuất sắc', points: 5, reason: 'Chỉ đạo Tổ 4 làm vệ sinh lớp sạch sẽ', date: '2026-08-21', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' },

  // Tuần 3
  { id: 'dr7', studentId: 's1', studentName: 'Nguyễn Văn An', classId: 'c1', type: 'reward', categoryName: 'Gương mẫu', points: 5, reason: 'Đạt tuần học nề nếp xuất sắc', date: '2026-08-14', week: 3, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' },
  { id: 'dr8', studentId: 's5', studentName: 'Hoàng Minh Dũng', classId: 'c1', type: 'violation', categoryName: 'Không mang đồng phục', points: -2, reason: 'Không mặc áo cờ đỏ sao vàng thứ 2', date: '2026-08-11', week: 3, month: 8, semester: 'Học kỳ 1', recordedBy: 'Nguyễn Văn An (Cán sự)' },
  { id: 'dr9', studentId: 's7', studentName: 'Đặng Quang Huy', classId: 'c1', type: 'reward', categoryName: '10 điểm tốt học tập', points: 10, reason: 'Điểm 10 môn Tiếng Anh', date: '2026-08-13', week: 3, month: 8, semester: 'Học kỳ 1', recordedBy: 'Cô Đào Thu Hà' },

  // Tuần 2
  { id: 'dr10', studentId: 's4', studentName: 'Phạm Thị Mai', classId: 'c1', type: 'reward', categoryName: 'Giúp đỡ bạn bè', points: 5, reason: 'Hướng dẫn bạn học Tiếng Anh', date: '2026-08-07', week: 2, month: 8, semester: 'Học kỳ 1', recordedBy: 'Trần Thị Bích (Lớp phó)' },
  { id: 'dr11', studentId: 's3', studentName: 'Lê Vũ Hoàng', classId: 'c1', type: 'reward', categoryName: 'Nề nếp', points: 4, reason: 'Kê bàn ghế gọn gàng ngăn nắp', date: '2026-08-06', week: 2, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' },

  // Tuần 1
  { id: 'dr12', studentId: 's2', studentName: 'Trần Thị Bích', classId: 'c1', type: 'reward', categoryName: 'Khen thưởng đầu năm', points: 10, reason: 'Thành tích dẫn đầu phong trào thi đua tuần 1', date: '2026-08-01', week: 1, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' },
  { id: 'dr13', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', classId: 'c1', type: 'reward', categoryName: 'Khen thưởng đầu năm', points: 8, reason: 'Ban cán sự năng nổ nhiệt tình', date: '2026-08-01', week: 1, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' }
];

export const DEMO_LEARNING_RESETS: LearningPresetItem[] = [
  // Môn học - Khen thưởng (+)
  { id: 'lp1', categoryType: 'subject', type: 'reward', subjectName: 'Toán', name: 'Phát biểu xuất sắc môn Toán', points: 2 },
  { id: 'lp2', categoryType: 'subject', type: 'reward', subjectName: 'Toán', name: 'Đạt điểm 10 bài kiểm tra Toán', points: 5 },
  { id: 'lp3', categoryType: 'subject', type: 'reward', subjectName: 'Ngữ Văn', name: 'Đọc diễn cảm & Phân tích tác phẩm xuất sắc', points: 3 },
  { id: 'lp4', categoryType: 'subject', type: 'reward', subjectName: 'Tiếng Anh', name: 'Nói Tiếng Anh trôi chảy & Phát âm chuẩn', points: 3 },
  { id: 'lp5', categoryType: 'subject', type: 'reward', subjectName: 'Vật Lý', name: 'Thực hành thí nghiệm xuất sắc môn Vật Lý', points: 3 },
  { id: 'lp6', categoryType: 'subject', type: 'reward', subjectName: 'Tin Học', name: 'Lập trình / Đánh máy nhanh xuất sắc', points: 4 },
  
  // Môn học - Vi phạm (-)
  { id: 'lp7', categoryType: 'subject', type: 'violation', subjectName: 'Toán', name: 'Chưa làm bài tập về nhà môn Toán', points: -2 },
  { id: 'lp8', categoryType: 'subject', type: 'violation', subjectName: 'Ngữ Văn', name: 'Không thuộc bài cũ môn Ngữ Văn', points: -2 },
  { id: 'lp9', categoryType: 'subject', type: 'violation', subjectName: 'Tiếng Anh', name: 'Quên sách vở môn Tiếng Anh', points: -1 },
  { id: 'lp10', categoryType: 'subject', type: 'violation', subjectName: 'Lịch Sử', name: 'Không học bài cũ môn Lịch Sử', points: -2 },

  // Lớp học - Khen thưởng (+)
  { id: 'lp11', categoryType: 'class', type: 'reward', name: 'Ban cán sự học tập hoàn thành xuất sắc nhiệm vụ', points: 5 },
  { id: 'lp12', categoryType: 'class', type: 'reward', name: 'Hoàn thành 100% BTVN tuần học', points: 5 },
  { id: 'lp13', categoryType: 'class', type: 'reward', name: 'Hăng hái phát biểu xây dựng bài trong tuần', points: 3 },
  { id: 'lp14', categoryType: 'class', type: 'reward', name: 'Nhóm học tập thi đua đạt điểm cao nhất', points: 4 },

  // Lớp học - Vi phạm (-)
  { id: 'lp15', categoryType: 'class', type: 'violation', name: 'Quên mang đồ dùng / Sách vở học tập', points: -2 },
  { id: 'lp16', categoryType: 'class', type: 'violation', name: 'Mất trật tự trong giờ học', points: -2 },
  { id: 'lp17', categoryType: 'class', type: 'violation', name: 'Không làm bài tập về nhà', points: -2 },
  { id: 'lp18', categoryType: 'class', type: 'violation', name: 'Không chuẩn bị bài mới trước khi đến lớp', points: -1 }
];

export const DEMO_LEARNING_RECORDS: LearningRecord[] = [
  // Môn học Records
  { id: 'lr1', studentId: 's1', studentName: 'Nguyễn Văn An', classId: 'c1', categoryType: 'subject', subjectName: 'Ngữ Văn', type: 'reward', activityName: 'Hái hoa học tập - Môn Ngữ Văn', points: 8, date: '2026-08-21', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Trần Thị Bích (Lớp phó)' },
  { id: 'lr2', studentId: 's2', studentName: 'Trần Thị Bích', classId: 'c1', categoryType: 'subject', subjectName: 'Toán', type: 'reward', activityName: 'Đường đua học tập - Môn Toán', points: 10, date: '2026-08-20', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' },
  { id: 'lr3', studentId: 's3', studentName: 'Lê Vũ Hoàng', classId: 'c1', categoryType: 'subject', subjectName: 'Tiếng Anh', type: 'reward', activityName: 'Thách thức thẻ nhớ môn Tiếng Anh', points: 6, date: '2026-08-19', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Trần Thị Bích (Lớp phó)' },
  { id: 'lr4', studentId: 's4', studentName: 'Phạm Thị Mai', classId: 'c1', categoryType: 'subject', subjectName: 'Toán', type: 'reward', activityName: 'Phát biểu xuất sắc môn Toán', points: 3, date: '2026-08-21', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Nguyễn Văn An (Lớp trưởng)' },
  { id: 'lr5', studentId: 's5', studentName: 'Hoàng Minh Dũng', classId: 'c1', categoryType: 'subject', subjectName: 'Vật Lý', type: 'violation', activityName: 'Chưa làm bài tập về nhà môn Vật Lý', points: -2, date: '2026-08-18', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Nguyễn Văn An (Lớp trưởng)' },
  
  // Lớp học Records
  { id: 'lr6', studentId: 's1', studentName: 'Nguyễn Văn An', classId: 'c1', categoryType: 'class', type: 'reward', activityName: 'Ban cán sự học tập hoàn thành xuất sắc nhiệm vụ', points: 5, date: '2026-08-21', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' },
  { id: 'lr7', studentId: 's2', studentName: 'Trần Thị Bích', classId: 'c1', categoryType: 'class', type: 'reward', activityName: 'Hoàn thành 100% BTVN tuần học', points: 5, date: '2026-08-21', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'GVCN Cô Nguyễn Thị Hoa' },
  { id: 'lr8', studentId: 's3', studentName: 'Lê Vũ Hoàng', classId: 'c1', categoryType: 'class', type: 'violation', activityName: 'Quên mang đồ dùng / Sách vở học tập', points: -2, date: '2026-08-18', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Nguyễn Văn An (Lớp trưởng)' },
  { id: 'lr9', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', classId: 'c1', categoryType: 'class', type: 'reward', activityName: 'Hăng hái phát biểu xây dựng bài trong tuần', points: 3, date: '2026-08-20', week: 4, month: 8, semester: 'Học kỳ 1', recordedBy: 'Trần Thị Bích (Lớp phó)' }
];

export const DEMO_COMPLAINTS: Complaint[] = [
  {
    id: 'cp1',
    studentId: 's3',
    studentName: 'Lê Vũ Hoàng',
    className: 'Lớp 8A1',
    title: 'Khiếu nại về lỗi đi muộn ngày 19/8',
    content: 'Hôm đó em bị tắc đường do tai nạn ở ngã tư chứ không phải cố ý đi muộn, xin lớp trưởng xem xét bỏ lỗi cho em ạ.',
    target: 'cán sự lớp',
    status: 'Đã giải quyết',
    response: 'Đã được lớp trưởng xác nhận và xóa lỗi trừ điểm.',
    createdAt: '2026-08-19 15:20'
  }
];

export const DEMO_ACCOUNT_REQUESTS: AccountRequest[] = [
  {
    id: 'ar1',
    userId: 's3',
    userName: 'Lê Vũ Hoàng',
    role: 'student',
    type: 'reset_password',
    details: 'Xin cấp lại mật khẩu do quên mật khẩu cũ.',
    status: 'Chờ duyệt',
    createdAt: '2026-08-21 10:15'
  }
];

export const DEMO_ATTENDANCE: AttendanceRecord[] = [
  // Tuần 4 - Thứ 2 (2026-08-17)
  { id: 'at_w4_t2_s1', classId: 'c1', date: '2026-08-17', studentId: 's1', studentName: 'Nguyễn Văn An', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w4_t2_s2', classId: 'c1', date: '2026-08-17', studentId: 's2', studentName: 'Trần Thị Bích', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w4_t2_s3', classId: 'c1', date: '2026-08-17', studentId: 's3', studentName: 'Lê Vũ Hoàng', status: 'Đi muộn', note: 'Đi muộn 5 phút do hỏng xe', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w4_t2_s4', classId: 'c1', date: '2026-08-17', studentId: 's4', studentName: 'Phạm Thị Mai', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w4_t2_s5', classId: 'c1', date: '2026-08-17', studentId: 's5', studentName: 'Hoàng Minh Dũng', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w4_t2_s6', classId: 'c1', date: '2026-08-17', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', status: 'Vắng có phép', note: 'Khám sức khỏe định kỳ', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },

  // Tuần 4 - Thứ 3 (2026-08-18)
  { id: 'at_w4_t3_s1', classId: 'c1', date: '2026-08-18', studentId: 's1', studentName: 'Nguyễn Văn An', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 3' },
  { id: 'at_w4_t3_s2', classId: 'c1', date: '2026-08-18', studentId: 's2', studentName: 'Trần Thị Bích', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 3' },
  { id: 'at_w4_t3_s3', classId: 'c1', date: '2026-08-18', studentId: 's3', studentName: 'Lê Vũ Hoàng', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 3' },
  { id: 'at_w4_t3_s4', classId: 'c1', date: '2026-08-18', studentId: 's4', studentName: 'Phạm Thị Mai', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 3' },
  { id: 'at_w4_t3_s5', classId: 'c1', date: '2026-08-18', studentId: 's5', studentName: 'Hoàng Minh Dũng', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 3' },
  { id: 'at_w4_t3_s6', classId: 'c1', date: '2026-08-18', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 3' },

  // Tuần 4 - Thứ 4 (2026-08-19)
  { id: 'at_w4_t4_s1', classId: 'c1', date: '2026-08-19', studentId: 's1', studentName: 'Nguyễn Văn An', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 4' },
  { id: 'at_w4_t4_s2', classId: 'c1', date: '2026-08-19', studentId: 's2', studentName: 'Trần Thị Bích', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 4' },
  { id: 'at_w4_t4_s3', classId: 'c1', date: '2026-08-19', studentId: 's3', studentName: 'Lê Vũ Hoàng', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 4' },
  { id: 'at_w4_t4_s4', classId: 'c1', date: '2026-08-19', studentId: 's4', studentName: 'Phạm Thị Mai', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 4' },
  { id: 'at_w4_t4_s5', classId: 'c1', date: '2026-08-19', studentId: 's5', studentName: 'Hoàng Minh Dũng', status: 'Vắng không phép', note: 'Không thấy có mặt trong giờ', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 4' },
  { id: 'at_w4_t4_s6', classId: 'c1', date: '2026-08-19', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 4' },

  // Tuần 4 - Thứ 5 (2026-08-20)
  { id: 'at_w4_t5_s1', classId: 'c1', date: '2026-08-20', studentId: 's1', studentName: 'Nguyễn Văn An', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 5' },
  { id: 'at_w4_t5_s2', classId: 'c1', date: '2026-08-20', studentId: 's2', studentName: 'Trần Thị Bích', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 5' },
  { id: 'at_w4_t5_s3', classId: 'c1', date: '2026-08-20', studentId: 's3', studentName: 'Lê Vũ Hoàng', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 5' },
  { id: 'at_w4_t5_s4', classId: 'c1', date: '2026-08-20', studentId: 's4', studentName: 'Phạm Thị Mai', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 5' },
  { id: 'at_w4_t5_s5', classId: 'c1', date: '2026-08-20', studentId: 's5', studentName: 'Hoàng Minh Dũng', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 5' },
  { id: 'at_w4_t5_s6', classId: 'c1', date: '2026-08-20', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 5' },

  // Tuần 4 - Thứ 6 (2026-08-21)
  { id: 'at_w4_t6_s1', classId: 'c1', date: '2026-08-21', studentId: 's1', studentName: 'Nguyễn Văn An', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 6' },
  { id: 'at_w4_t6_s2', classId: 'c1', date: '2026-08-21', studentId: 's2', studentName: 'Trần Thị Bích', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 6' },
  { id: 'at_w4_t6_s3', classId: 'c1', date: '2026-08-21', studentId: 's3', studentName: 'Lê Vũ Hoàng', status: 'Đi muộn', note: 'Đến muộn 10 phút', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 6' },
  { id: 'at_w4_t6_s4', classId: 'c1', date: '2026-08-21', studentId: 's4', studentName: 'Phạm Thị Mai', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 6' },
  { id: 'at_w4_t6_s5', classId: 'c1', date: '2026-08-21', studentId: 's5', studentName: 'Hoàng Minh Dũng', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 6' },
  { id: 'at_w4_t6_s6', classId: 'c1', date: '2026-08-21', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', status: 'Có mặt', weekNumber: 4, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 6' },

  // Tuần 3 (Cũ) - Thứ 2 -> Thứ 6 (dữ liệu tuần cũ)
  { id: 'at_w3_t2_s1', classId: 'c1', date: '2026-08-10', studentId: 's1', studentName: 'Nguyễn Văn An', status: 'Có mặt', weekNumber: 3, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w3_t2_s2', classId: 'c1', date: '2026-08-10', studentId: 's2', studentName: 'Trần Thị Bích', status: 'Có mặt', weekNumber: 3, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w3_t2_s3', classId: 'c1', date: '2026-08-10', studentId: 's3', studentName: 'Lê Vũ Hoàng', status: 'Có mặt', weekNumber: 3, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w3_t2_s4', classId: 'c1', date: '2026-08-10', studentId: 's4', studentName: 'Phạm Thị Mai', status: 'Có mặt', weekNumber: 3, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w3_t2_s5', classId: 'c1', date: '2026-08-10', studentId: 's5', studentName: 'Hoàng Minh Dũng', status: 'Vắng có phép', note: 'Sốt nhẹ', weekNumber: 3, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' },
  { id: 'at_w3_t2_s6', classId: 'c1', date: '2026-08-10', studentId: 's6', studentName: 'Vũ Thị Kim Ngân', status: 'Có mặt', weekNumber: 3, monthNumber: 8, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 2' }
];

export const DEMO_SPY_MISSION: SpyGameMission = {
  id: 'sp1',
  classId: 'c1',
  weekNumber: 4,
  category: 'Thi đua rèn luyện',
  spyStudentId: 's3',
  missionDescription: 'Gián điệp có nhiệm vụ nhắc một câu sai trong giờ thảo luận nhóm mà không để ai phát hiện.',
  status: 'Đang diễn ra',
  votes: [
    { voterId: 's1', suspectId: 's3' },
    { voterId: 's2', suspectId: 's5' }
  ]
};

export const DEMO_FLOWER_CONFIG: FlowerGameConfig = {
  id: 'flw1',
  title: 'Hái hoa dân chủ ôn tập Ngữ Văn tuần 4',
  classId: 'c1',
  category: 'Thi đua học tập',
  language: 'vi',
  timeMinutes: 10,
  treesCount: 3,
  flowersPerTree: 4,
  fruitsPerTree: 3,
  isActive: true,
  playMode: 'turn_based',
  participantType: 'team',
  participantsCount: 4,
  participants: [
    { id: 'p1', name: 'Tổ 1 (Rồng Đỏ)', color: '#ef4444', score: 0, harvestedCount: 0 },
    { id: 'p2', name: 'Tổ 2 (Bão Xanh)', color: '#3b82f6', score: 0, harvestedCount: 0 },
    { id: 'p3', name: 'Tổ 3 (Chiến Binh)', color: '#10b981', score: 0, harvestedCount: 0 },
    { id: 'p4', name: 'Tổ 4 (Tia Chớp)', color: '#f59e0b', score: 0, harvestedCount: 0 }
  ],
  questions: [
    { id: 'q1', question: 'Tác phẩm "Lão Hạc" của nhà văn nào?', type: 'mcq', options: ['Nam Cao', 'Ngô Tất Tố', 'Thạch Lam', 'Vũ Trọng Phụng'], correctAnswer: 'Nam Cao', isLuckyFlower: true, multiplier: 2 },
    { id: 'q2', question: 'Từ "chân" trong "chân bàn" được dùng theo nghĩa chuyển đúng hay sai?', type: 'bool', options: ['Đúng', 'Sai'], correctAnswer: 'Đúng' },
    { id: 'q3', question: 'Điền từ còn thiếu vào câu thơ: "Quê hương là chùm khế ngọt, cho con trèo hái mỗi ..."', type: 'fill', correctAnswer: 'ngày' },
    { id: 'q4', question: 'Ai là tác giả bài thơ "Quê hương"?', type: 'mcq', options: ['Tế Hanh', 'Huy Cận', 'Xuân Diệu', 'Hồ Chí Minh'], correctAnswer: 'Tế Hanh', isLuckyFlower: true, multiplier: 3 },
    { id: 'q5', question: 'Fill in the blank: "Actions speak louder than ..."', type: 'fill', correctAnswer: 'words', isLuckyFlower: true, multiplier: 2 },
    { id: 'q6', question: 'The capital city of Vietnam is ...', type: 'fill', correctAnswer: 'Hanoi' },
    { id: 'q7', question: 'Water boils at 100 degrees Celsius under standard atmospheric pressure (True/False)?', type: 'bool', options: ['True', 'False'], correctAnswer: 'True' }
  ]
};

export const DEMO_RACING_CONFIG: RacingGameConfig = {
  id: 'rc1',
  title: 'Đường đua Toán học & Tri thức tốc độ cao',
  classId: 'c1',
  category: 'Thi đua học tập',
  trackLength: 1000, // 1000m
  timeMinutes: 15,
  mode: 'tổ',
  playMode: 'all_teams', // Mặc định hỗ trợ tất cả các đội cùng chơi hoặc chuyển đổi sang chơi lần lượt
  trackCount: 4, // 4 đường đua
  teams: [
    { id: 't1', name: 'Tổ 1 (Rồng Lửa)', color: '#ef4444', vehicleId: 'v3', currentDistance: 0 },
    { id: 't2', name: 'Tổ 2 (Bão Xanh)', color: '#3b82f6', vehicleId: 'v3', currentDistance: 0 },
    { id: 't3', name: 'Tổ 3 (Chiến Binh Xanh Lá)', color: '#10b981', vehicleId: 'v3', currentDistance: 0 },
    { id: 't4', name: 'Tổ 4 (Tia Chớp Vàng)', color: '#f59e0b', vehicleId: 'v3', currentDistance: 0 }
  ],
  vehicles: [
    { id: 'v1', name: 'Đi bộ', icon: '🚶', distance: 60, color: '#94a3b8' },
    { id: 'v2', name: 'Xe bò siêu tốc', icon: '🐂', distance: 100, color: '#b45309' },
    { id: 'v3', name: 'Xe đạp thể thao', icon: '🚲', distance: 150, color: '#0ea5e9' },
    { id: 'v5', name: 'Mô tô phân khối lớn', icon: '🏍️', distance: 300, color: '#8b5cf6' },
    { id: 'v6', name: 'Siêu xe F1 Formula', icon: '🏎️', distance: 400, color: '#ef4444' },
    { id: 'v7', name: 'Tên lửa siêu thanh', icon: '🚀', distance: 550, color: '#e11d48' }
  ],
  isActive: true,
  questions: [
    { id: 'rq1', question: 'Kết quả của biểu thức (x + 2)² khi x = 3 là bao nhiêu?', type: 'mcq', options: ['25', '16', '9', '49'], correctAnswer: '25' },
    { id: 'rq2', question: 'Tổng các góc trong một tam giác bằng bao nhiêu độ?', type: 'mcq', options: ['180°', '360°', '90°', '270°'], correctAnswer: '180°' },
    { id: 'rq3', question: 'Căn bậc hai số học của 144 là bao nhiêu?', type: 'fill', correctAnswer: '12' },
    { id: 'rq4', question: 'Số nguyên tố nhỏ nhất là số 1, đúng hay sai?', type: 'bool', options: ['Đúng', 'Sai'], correctAnswer: 'Sai' },
    { id: 'rq5', question: 'Phương trình bậc nhất 2x - 6 = 0 có nghiệm x bằng mấy?', type: 'fill', correctAnswer: '3' },
    { id: 'rq6', question: 'Hình vuông có 4 trục đối xứng, đúng hay sai?', type: 'bool', options: ['Đúng', 'Sai'], correctAnswer: 'Đúng' },
    { id: 'rq7', question: 'Nếu một tam giác vuông có hai cạnh góc vuông là 3cm và 4cm thì cạnh huyền dài bao nhiêu cm?', type: 'mcq', options: ['5cm', '6cm', '7cm', '8cm'], correctAnswer: '5cm' }
  ]
};

export const DEMO_KEYBOARD_TASK: KeyboardHeroTask = {
  id: 'kh1',
  title: 'Bài viết cảm nhận: Mái trường & Thầy cô kính yêu',
  prompt: 'Cảm nhận về mái trường THCS Chu Văn An và người thầy cô em yêu quý',
  instruction: 'Em hãy viết một đoạn văn ngắn chia sẻ những kỷ niệm hoặc tình cảm chân thành của mình về thầy cô, bạn bè và mái trường THCS Chu Văn An. Hãy chú ý mạch cảm xúc và cấu trúc câu rõ ràng.',
  minWords: 80,
  maxWords: 150,
  timeLimitMinutes: 20,
  classId: 'c1',
  category: 'Thi đua rèn luyện',
  deadline: '2026-08-30 23:59',
  rewardPoints: 5,
  status: 'Đang diễn ra',
  submissions: [
    {
      id: 'sub1',
      studentId: 's1',
      studentName: 'Nguyễn Văn An',
      studentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      team: 'Tổ 1',
      content: 'Mái trường THCS Chu Văn An với những hàng cây phượng vĩ xanh mát đã gắn bó với tuổi học trò của chúng em suốt những năm tháng qua. Nơi đây, thầy cô luôn tận tâm dạy dỗ, truyền cho chúng em tri thức và những bài học làm người sâu sắc. Bạn bè luôn đoàn kết, yêu thương và giúp đỡ lẫn nhau cùng tiến bộ trong học tập. Em luôn cảm thấy tự hào và hạnh phúc khi được là một học sinh dưới mái trường mến yêu này.',
      wordCount: 88,
      timeSpentSeconds: 420,
      submittedAt: '2026-08-21 14:10',
      isLate: false,
      likes: ['s2', 's4'],
      score: 9.5,
      feedback: 'Bài viết dạt dào cảm xúc, diễn đạt mượt mà và đáp ứng rất tốt yêu cầu bài làm!',
      rewardPointsAwarded: 5,
      isGraded: true,
      comments: [
        { id: 'cm1', authorName: 'Cô Lê Thị Mai', content: 'Em viết rất hay và có cảm xúc tốt!', createdAt: '2026-08-21 15:00' }
      ]
    },
    {
      id: 'sub2',
      studentId: 's2',
      studentName: 'Trần Thị Bích',
      studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      team: 'Tổ 2',
      content: 'Mái trường Chu Văn An là nơi lưu giữ biết bao kỷ niệm đẹp đẽ của tuổi học trò. Mỗi ngày đến trường là một ngày vui khi được lắng nghe những lời giảng ấm áp của thầy cô và cùng các bạn hăng hái phát biểu xây dựng bài.',
      wordCount: 48,
      timeSpentSeconds: 320,
      submittedAt: '2026-08-22 09:30',
      isLate: false,
      likes: ['s1'],
      score: 9.0,
      feedback: 'Bài viết tình cảm, diễn đạt tròn câu. Lần sau em có thể viết dài hơn một chút nhé!',
      rewardPointsAwarded: 5,
      isGraded: true,
      comments: []
    }
  ]
};

export const DEMO_MEMORY_CONFIG: MemoryCardGameConfig = {
  id: 'mc1',
  title: 'Thách thức thẻ nhớ Tiếng Anh - Từ vựng tuần 4',
  classId: 'c1',
  category: 'Thi đua học tập',
  timeMinutes: 5,
  isActive: true,
  pairs: [
    { id: 'p1', cardA: 'Education', cardB: 'Giáo dục' },
    { id: 'p2', cardA: 'Teacher', cardB: 'Giáo viên' },
    { id: 'p3', cardA: 'Student', cardB: 'Học sinh' },
    { id: 'p4', cardA: 'School', cardB: 'Trường học' }
  ]
};

export const DEMO_STORAGE_ITEMS: PersonalStorageItem[] = [
  {
    id: 'st1',
    userId: 't1',
    title: 'Danh sách ôn tập HS giỏi Văn tháng 8',
    type: 'table',
    tableData: {
      rows: 3,
      cols: 3,
      headers: ['STT', 'Họ và tên', 'Điểm dự kiến'],
      data: [
        ['1', 'Nguyễn Văn An', '9.5'],
        ['2', 'Trần Thị Bích', '9.0'],
        ['3', 'Phạm Thị Mai', '8.75']
      ]
    },
    updatedAt: '2026-08-20 12:00'
  },
  {
    id: 'st2',
    userId: 's1',
    title: 'Ghi chú công việc lớp trưởng',
    type: 'blank',
    blankContent: '1. Nhắc nhở tổ 1 trực vệ sinh.\n2. Thu bài tập môn Toán nộp cho thầy Hùng trước thứ 4.\n3. Chuẩn bị tiết sinh hoạt lớp ngày thứ 7.',
    updatedAt: '2026-08-21 08:00'
  }
];

export const DEMO_CLASS_FUNDS: ClassFundItem[] = [
  {
    id: 'fund_hk1_annual',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    periodType: 'semester',
    title: 'Quỹ lớp Học kỳ 1 (Nước uống, rèm cửa, photo & điều hòa)',
    amountPerStudent: 100000,
    dueDate: '2026-09-15',
    createdAt: '2026-08-15',
    createdBy: 'Bùi Hoàng Linh (Thủ quỹ)',
    createdById: 's8',
    notes: 'Thu đầu năm học phục vụ công tác vệ sinh, bảo trì và photo tài liệu học tập.',
    status: 'active',
    contributions: {
      s1: { studentId: 's1', studentName: 'Nguyễn Văn An', team: 'Tổ 1', isPaid: true, paidAmount: 100000, paidAt: '2026-08-16', paymentMethod: 'Chuyển khoản', notes: 'Chuyển khoản' },
      s2: { studentId: 's2', studentName: 'Trần Thị Bích', team: 'Tổ 2', isPaid: true, paidAmount: 100000, paidAt: '2026-08-16', paymentMethod: 'Tiền mặt' },
      s3: { studentId: 's3', studentName: 'Lê Vũ Hoàng', team: 'Tổ 3', isPaid: true, paidAmount: 100000, paidAt: '2026-08-17', paymentMethod: 'Tiền mặt' },
      s4: { studentId: 's4', studentName: 'Phạm Thị Mai', team: 'Tổ 1', isPaid: true, paidAmount: 100000, paidAt: '2026-08-18', paymentMethod: 'Chuyển khoản' },
      s5: { studentId: 's5', studentName: 'Hoàng Minh Dũng', team: 'Tổ 2', isPaid: false, paidAmount: 0, notes: 'Hẹn thứ 2 tuần sau nộp' },
      s6: { studentId: 's6', studentName: 'Vũ Thị Kim Ngân', team: 'Tổ 3', isPaid: true, paidAmount: 100000, paidAt: '2026-08-19', paymentMethod: 'Tiền mặt' },
      s7: { studentId: 's7', studentName: 'Đặng Quang Huy', team: 'Tổ 4', isPaid: true, paidAmount: 100000, paidAt: '2026-08-17', paymentMethod: 'Tiền mặt' },
      s8: { studentId: 's8', studentName: 'Bùi Hoàng Linh', team: 'Tổ 4', isPaid: true, paidAmount: 100000, paidAt: '2026-08-15', paymentMethod: 'Tiền mặt' },
      s9: { studentId: 's9', studentName: 'Đỗ Quốc Bảo', team: 'Tổ 1', isPaid: true, paidAmount: 100000, paidAt: '2026-08-20', paymentMethod: 'Chuyển khoản' },
      s10: { studentId: 's10', studentName: 'Ngô Thanh Hương', team: 'Tổ 2', isPaid: false, paidAmount: 0 }
    }
  },
  {
    id: 'fund_w1',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 1,
    periodType: 'week',
    title: 'Quỹ hoạt động tuần 1 (Khăn lau bảng & nước rửa tay)',
    amountPerStudent: 10000,
    dueDate: '2026-08-22',
    createdAt: '2026-08-17',
    createdBy: 'Bùi Hoàng Linh (Thủ quỹ)',
    createdById: 's8',
    notes: 'Quỹ nhỏ theo tuần bổ sung vật tư lớp.',
    status: 'closed',
    contributions: {
      s1: { studentId: 's1', studentName: 'Nguyễn Văn An', team: 'Tổ 1', isPaid: true, paidAmount: 10000, paidAt: '2026-08-18', paymentMethod: 'Tiền mặt' },
      s2: { studentId: 's2', studentName: 'Trần Thị Bích', team: 'Tổ 2', isPaid: true, paidAmount: 10000, paidAt: '2026-08-18', paymentMethod: 'Tiền mặt' },
      s3: { studentId: 's3', studentName: 'Lê Vũ Hoàng', team: 'Tổ 3', isPaid: true, paidAmount: 10000, paidAt: '2026-08-19', paymentMethod: 'Tiền mặt' },
      s4: { studentId: 's4', studentName: 'Phạm Thị Mai', team: 'Tổ 1', isPaid: true, paidAmount: 10000, paidAt: '2026-08-19', paymentMethod: 'Tiền mặt' },
      s5: { studentId: 's5', studentName: 'Hoàng Minh Dũng', team: 'Tổ 2', isPaid: true, paidAmount: 10000, paidAt: '2026-08-20', paymentMethod: 'Tiền mặt' },
      s6: { studentId: 's6', studentName: 'Vũ Thị Kim Ngân', team: 'Tổ 3', isPaid: true, paidAmount: 10000, paidAt: '2026-08-20', paymentMethod: 'Tiền mặt' },
      s7: { studentId: 's7', studentName: 'Đặng Quang Huy', team: 'Tổ 4', isPaid: true, paidAmount: 10000, paidAt: '2026-08-18', paymentMethod: 'Tiền mặt' },
      s8: { studentId: 's8', studentName: 'Bùi Hoàng Linh', team: 'Tổ 4', isPaid: true, paidAmount: 10000, paidAt: '2026-08-17', paymentMethod: 'Tiền mặt' },
      s9: { studentId: 's9', studentName: 'Đỗ Quốc Bảo', team: 'Tổ 1', isPaid: true, paidAmount: 10000, paidAt: '2026-08-20', paymentMethod: 'Tiền mặt' },
      s10: { studentId: 's10', studentName: 'Ngô Thanh Hương', team: 'Tổ 2', isPaid: true, paidAmount: 10000, paidAt: '2026-08-21', paymentMethod: 'Tiền mặt' }
    }
  },
  {
    id: 'fund_w2',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 2,
    periodType: 'week',
    title: 'Quỹ hoạt động tuần 2 (Photo đề cương ôn tập môn Toán & Văn)',
    amountPerStudent: 15000,
    dueDate: '2026-08-29',
    createdAt: '2026-08-24',
    createdBy: 'Cô Lê Thị Mai (GVCN)',
    createdById: 't1',
    notes: 'Photo tài liệu chuyên đề đầu năm.',
    status: 'active',
    contributions: {
      s1: { studentId: 's1', studentName: 'Nguyễn Văn An', team: 'Tổ 1', isPaid: true, paidAmount: 15000, paidAt: '2026-08-25', paymentMethod: 'Tiền mặt' },
      s2: { studentId: 's2', studentName: 'Trần Thị Bích', team: 'Tổ 2', isPaid: true, paidAmount: 15000, paidAt: '2026-08-25', paymentMethod: 'Tiền mặt' },
      s3: { studentId: 's3', studentName: 'Lê Vũ Hoàng', team: 'Tổ 3', isPaid: false, paidAmount: 0 },
      s4: { studentId: 's4', studentName: 'Phạm Thị Mai', team: 'Tổ 1', isPaid: true, paidAmount: 15000, paidAt: '2026-08-26', paymentMethod: 'Tiền mặt' },
      s5: { studentId: 's5', studentName: 'Hoàng Minh Dũng', team: 'Tổ 2', isPaid: false, paidAmount: 0 },
      s6: { studentId: 's6', studentName: 'Vũ Thị Kim Ngân', team: 'Tổ 3', isPaid: true, paidAmount: 15000, paidAt: '2026-08-26', paymentMethod: 'Tiền mặt' },
      s7: { studentId: 's7', studentName: 'Đặng Quang Huy', team: 'Tổ 4', isPaid: true, paidAmount: 15000, paidAt: '2026-08-25', paymentMethod: 'Tiền mặt' },
      s8: { studentId: 's8', studentName: 'Bùi Hoàng Linh', team: 'Tổ 4', isPaid: true, paidAmount: 15000, paidAt: '2026-08-24', paymentMethod: 'Tiền mặt' },
      s9: { studentId: 's9', studentName: 'Đỗ Quốc Bảo', team: 'Tổ 1', isPaid: true, paidAmount: 15000, paidAt: '2026-08-27', paymentMethod: 'Chuyển khoản' },
      s10: { studentId: 's10', studentName: 'Ngô Thanh Hương', team: 'Tổ 2', isPaid: true, paidAmount: 15000, paidAt: '2026-08-28', paymentMethod: 'Tiền mặt' }
    }
  },
  {
    id: 'fund_w3',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 3,
    periodType: 'week',
    title: 'Quỹ hoạt động tuần 3 (Mua cây xanh trang trí lớp & hoa tuần)',
    amountPerStudent: 10000,
    dueDate: '2026-09-05',
    createdAt: '2026-08-30',
    createdBy: 'Bùi Hoàng Linh (Thủ quỹ)',
    createdById: 's8',
    notes: 'Hưởng ứng phong trào xây dựng lớp học xanh - sạch - đẹp.',
    status: 'active',
    contributions: {
      s1: { studentId: 's1', studentName: 'Nguyễn Văn An', team: 'Tổ 1', isPaid: true, paidAmount: 10000, paidAt: '2026-08-30', paymentMethod: 'Tiền mặt' },
      s2: { studentId: 's2', studentName: 'Trần Thị Bích', team: 'Tổ 2', isPaid: true, paidAmount: 10000, paidAt: '2026-08-30', paymentMethod: 'Tiền mặt' },
      s3: { studentId: 's3', studentName: 'Lê Vũ Hoàng', team: 'Tổ 3', isPaid: false, paidAmount: 0 },
      s4: { studentId: 's4', studentName: 'Phạm Thị Mai', team: 'Tổ 1', isPaid: true, paidAmount: 10000, paidAt: '2026-08-30', paymentMethod: 'Tiền mặt' },
      s5: { studentId: 's5', studentName: 'Hoàng Minh Dũng', team: 'Tổ 2', isPaid: false, paidAmount: 0 },
      s6: { studentId: 's6', studentName: 'Vũ Thị Kim Ngân', team: 'Tổ 3', isPaid: false, paidAmount: 0 },
      s7: { studentId: 's7', studentName: 'Đặng Quang Huy', team: 'Tổ 4', isPaid: true, paidAmount: 10000, paidAt: '2026-08-30', paymentMethod: 'Tiền mặt' },
      s8: { studentId: 's8', studentName: 'Bùi Hoàng Linh', team: 'Tổ 4', isPaid: true, paidAmount: 10000, paidAt: '2026-08-30', paymentMethod: 'Tiền mặt' },
      s9: { studentId: 's9', studentName: 'Đỗ Quốc Bảo', team: 'Tổ 1', isPaid: false, paidAmount: 0 },
      s10: { studentId: 's10', studentName: 'Ngô Thanh Hương', team: 'Tổ 2', isPaid: false, paidAmount: 0 }
    }
  },
  {
    id: 'fund_w4',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 4,
    periodType: 'week',
    title: 'Quỹ hoạt động tuần 4 (Định kỳ tuần 4)',
    amountPerStudent: 10000,
    dueDate: '2026-09-12',
    createdAt: '2026-08-30',
    createdBy: 'Bùi Hoàng Linh (Thủ quỹ)',
    createdById: 's8',
    notes: 'Quỹ tuần hiện tại',
    status: 'active',
    contributions: {
      s1: { studentId: 's1', studentName: 'Nguyễn Văn An', team: 'Tổ 1', isPaid: false, paidAmount: 0 },
      s2: { studentId: 's2', studentName: 'Trần Thị Bích', team: 'Tổ 2', isPaid: false, paidAmount: 0 },
      s3: { studentId: 's3', studentName: 'Lê Vũ Hoàng', team: 'Tổ 3', isPaid: false, paidAmount: 0 },
      s4: { studentId: 's4', studentName: 'Phạm Thị Mai', team: 'Tổ 1', isPaid: false, paidAmount: 0 },
      s5: { studentId: 's5', studentName: 'Hoàng Minh Dũng', team: 'Tổ 2', isPaid: false, paidAmount: 0 },
      s6: { studentId: 's6', studentName: 'Vũ Thị Kim Ngân', team: 'Tổ 3', isPaid: false, paidAmount: 0 },
      s7: { studentId: 's7', studentName: 'Đặng Quang Huy', team: 'Tổ 4', isPaid: false, paidAmount: 0 },
      s8: { studentId: 's8', studentName: 'Bùi Hoàng Linh', team: 'Tổ 4', isPaid: true, paidAmount: 10000, paidAt: '2026-08-30', paymentMethod: 'Tiền mặt' },
      s9: { studentId: 's9', studentName: 'Đỗ Quốc Bảo', team: 'Tổ 1', isPaid: false, paidAmount: 0 },
      s10: { studentId: 's10', studentName: 'Ngô Thanh Hương', team: 'Tổ 2', isPaid: false, paidAmount: 0 }
    }
  }
];

export const DEMO_CLASS_EXPENSES: ClassFundExpense[] = [
  {
    id: 'exp_1',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 1,
    title: 'Mua dụng cụ trực nhật (2 chổi quét, 1 xô nước, 3 khăn lau)',
    amount: 145000,
    date: '2026-08-19',
    spentBy: 'Lê Vũ Hoàng (Lớp phó Lao động)',
    category: 'Vệ sinh lớp',
    receiptNote: 'Hóa đơn cửa hàng Tạp hóa Minh Hương'
  },
  {
    id: 'exp_2',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 2,
    title: 'Photo tài liệu học tập & đề kiểm tra khảo sát đầu năm',
    amount: 180000,
    date: '2026-08-25',
    spentBy: 'Trần Thị Bích (Lớp phó Học tập)',
    category: 'Vật phẩm học tập',
    receiptNote: 'Hiệu photo cổng trường'
  },
  {
    id: 'exp_3',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 3,
    title: 'Mua 2 chậu cây kim ngân trang trí góc học tập lớp',
    amount: 120000,
    date: '2026-08-28',
    spentBy: 'Bùi Hoàng Linh (Thủ quỹ)',
    category: 'Văn nghệ & Phong trào',
    receiptNote: 'Cửa hàng Cây cảnh mini'
  },
  {
    id: 'exp_4',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 3,
    title: 'Phần thưởng Tổ 1 đạt giải nhất thi đua tuần 2',
    amount: 100000,
    date: '2026-08-29',
    spentBy: 'Cô Lê Thị Mai (GVCN)',
    category: 'Khen thưởng & Quà tặng',
    receiptNote: 'Bánh kẹo & vở viết khen thưởng'
  }
];

export const DEMO_CLASS_LOGBOOKS: ClassLogbookWeek[] = [
  {
    id: 'lb_w4_8a1',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 4,
    startDate: '2026-08-24',
    endDate: '2026-08-29',
    homeroomTeacherName: 'Cô Lê Thị Mai',
    homeroomTeacherComment: 'Tuần học nề nếp tốt, các tiết học sôi nổi, chuẩn bị bài chu đáo. Đề nghị lớp tiếp tục phát huy tinh thần học tập.',
    homeroomTeacherSignature: true,
    classOfficerName: 'Trần Thị Bích (Lớp phó học tập)',
    status: 'approved',
    totalPeriods: 25,
    averageScore: 9.8,
    goodPeriodsCount: 24,
    updatedAt: '2026-08-29 17:30',
    entries: [
      // Thứ 2
      {
        id: 'p_w4_t2_1',
        day: 'Thứ 2',
        date: '2026-08-24',
        period: 1,
        session: 'Sáng',
        subject: 'Chào cờ',
        ppctLessonNumber: 4,
        lessonContent: 'Sinh hoạt dưới cờ: Tuyên truyền An toàn giao thông đầu năm học',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Tổng phụ trách & BGH',
        teacherSignature: true,
        teacherComment: 'Lớp tập trung đúng giờ, trang phục chỉnh tề, hát Quốc ca to rõ ràng.',
        absentStudents: 'Đủ',
        updatedBy: 'Nguyễn Văn An (Lớp trưởng)',
        updatedAt: '2026-08-24 07:45'
      },
      {
        id: 'p_w4_t2_2',
        day: 'Thứ 2',
        date: '2026-08-24',
        period: 2,
        session: 'Sáng',
        subject: 'Toán học',
        ppctLessonNumber: 7,
        lessonContent: 'Đại số: Hằng đẳng thức đáng nhớ (Bình phương của một tổng và một hiệu)',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Nguyễn Hữu Hùng',
        teacherSignature: true,
        teacherComment: 'Lớp học hăng hái phát biểu, nhiều bạn giải nhanh bài tập nâng cao.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-24 08:45'
      },
      {
        id: 'p_w4_t2_3',
        day: 'Thứ 2',
        date: '2026-08-24',
        period: 3,
        session: 'Sáng',
        subject: 'Ngữ Văn',
        ppctLessonNumber: 7,
        lessonContent: 'Văn bản: Lão Hạc (Tiết 1) - Tác giả Nam Cao',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Cô Lê Thị Mai',
        teacherSignature: true,
        teacherComment: 'Học sinh chuẩn bị bài đọc trước ở nhà tốt, hiểu tâm lý nhân vật.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-24 09:40'
      },
      {
        id: 'p_w4_t2_4',
        day: 'Thứ 2',
        date: '2026-08-24',
        period: 4,
        session: 'Sáng',
        subject: 'Tiếng Anh',
        ppctLessonNumber: 7,
        lessonContent: 'Unit 1: Leisure Activities - A closer look 1 (Vocabulary & Pronunciation)',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Cô Sarah Miller',
        teacherSignature: true,
        teacherComment: 'Great pronunciation and enthusiastic participation from all students.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-24 10:35'
      },
      {
        id: 'p_w4_t2_5',
        day: 'Thứ 2',
        date: '2026-08-24',
        period: 5,
        session: 'Sáng',
        subject: 'Vật Lý',
        ppctLessonNumber: 4,
        lessonContent: 'Chuyển động cơ học - Vận tốc và đơn vị đo vận tốc',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Thầy Trần Văn Tuấn',
        teacherSignature: true,
        teacherComment: 'Học sinh làm tốt bài tập tính toán vận tốc, tương tác tốt.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-24 11:25'
      },

      // Thứ 3
      {
        id: 'p_w4_t3_1',
        day: 'Thứ 3',
        date: '2026-08-25',
        period: 1,
        session: 'Sáng',
        subject: 'Vật Lý',
        ppctLessonNumber: 5,
        lessonContent: 'Chuyển động đều - Chuyển động không đều',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Trần Văn Tuấn',
        teacherSignature: true,
        teacherComment: 'Lớp chuẩn bị đồ dùng thí nghiệm chu đáo, thảo luận nhóm sôi nổi.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-25 07:45'
      },
      {
        id: 'p_w4_t3_2',
        day: 'Thứ 3',
        date: '2026-08-25',
        period: 2,
        session: 'Sáng',
        subject: 'Hóa Học',
        ppctLessonNumber: 4,
        lessonContent: 'Chất tinh khiết và Hỗn hợp - Tách chất ra khỏi hỗn hợp',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Cô Hoàng Lan',
        teacherSignature: true,
        teacherComment: 'Học sinh chú ý lắng nghe giảng, thực hiện các bước an toàn.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-25 08:45'
      },
      {
        id: 'p_w4_t3_3',
        day: 'Thứ 3',
        date: '2026-08-25',
        period: 3,
        session: 'Sáng',
        subject: 'Lịch Sử',
        ppctLessonNumber: 4,
        lessonContent: 'Cách mạng tư sản Anh thế kỷ XVII',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Vũ Hải Nam',
        teacherSignature: true,
        teacherComment: 'Lớp trả lời câu hỏi bài cũ rất xuất sắc, hiểu bản chất lịch sử.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-25 09:40'
      },
      {
        id: 'p_w4_t3_4',
        day: 'Thứ 3',
        date: '2026-08-25',
        period: 4,
        session: 'Sáng',
        subject: 'Địa Lý',
        ppctLessonNumber: 4,
        lessonContent: 'Đặc điểm địa hình châu Á',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Cô Nguyễn Thu Hương',
        teacherSignature: true,
        teacherComment: 'Kỹ năng đọc bản đồ và Atlat của học sinh rất chuẩn.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-25 10:35'
      },
      {
        id: 'p_w4_t3_5',
        day: 'Thứ 3',
        date: '2026-08-25',
        period: 5,
        session: 'Sáng',
        subject: 'Toán học',
        ppctLessonNumber: 8,
        lessonContent: 'Hình học: Tứ giác - Định lý tổng các góc của một tứ giác',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Nguyễn Hữu Hùng',
        teacherSignature: true,
        teacherComment: 'Lớp vẽ hình chính xác, chứng minh logic và mạch lạc.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-25 11:25'
      },

      // Thứ 4
      {
        id: 'p_w4_t4_1',
        day: 'Thứ 4',
        date: '2026-08-26',
        period: 1,
        session: 'Sáng',
        subject: 'Toán học',
        ppctLessonNumber: 9,
        lessonContent: 'Luyện tập: Hằng đẳng thức hiệu hai bình phương',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Nguyễn Hữu Hùng',
        teacherSignature: true,
        teacherComment: 'Tiết học đạt kết quả cao, 100% học sinh làm xong bài tại lớp.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-26 07:45'
      },
      {
        id: 'p_w4_t4_2',
        day: 'Thứ 4',
        date: '2026-08-26',
        period: 2,
        session: 'Sáng',
        subject: 'Ngữ Văn',
        ppctLessonNumber: 8,
        lessonContent: 'Văn bản: Lão Hạc (Tiết 2) - Giá trị nhân đạo và hiện thực',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Cô Lê Thị Mai',
        teacherSignature: true,
        teacherComment: 'Học sinh cảm thụ tác phẩm sâu sắc, nhiều bài phát biểu xúc động.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-26 08:45'
      },
      {
        id: 'p_w4_t4_3',
        day: 'Thứ 4',
        date: '2026-08-26',
        period: 3,
        session: 'Sáng',
        subject: 'Sinh Học',
        ppctLessonNumber: 4,
        lessonContent: 'Cấu tạo và chức năng của Tế bào',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Cô Phạm Phương Thảo',
        teacherSignature: true,
        teacherComment: 'Lớp nắm chắc sơ đồ tế bào động vật và thực vật.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-26 09:40'
      },
      {
        id: 'p_w4_t4_4',
        day: 'Thứ 4',
        date: '2026-08-26',
        period: 4,
        session: 'Sáng',
        subject: 'Tin Học',
        ppctLessonNumber: 4,
        lessonContent: 'Thực hành: Làm quen với phần mềm bảng tính điện tử Excel',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Trịnh Văn Bình',
        teacherSignature: true,
        teacherComment: 'Phòng máy sạch sẽ, các em nhập dữ liệu và định dạng rất chuẩn xác.',
        absentStudents: 'Đủ',
        updatedBy: 'Nguyễn Văn An (Lớp trưởng)',
        updatedAt: '2026-08-26 10:35'
      },
      {
        id: 'p_w4_t4_5',
        day: 'Thứ 4',
        date: '2026-08-26',
        period: 5,
        session: 'Sáng',
        subject: 'Tiếng Anh',
        ppctLessonNumber: 8,
        lessonContent: 'Unit 1: A closer look 2 (Grammar: Verbs of liking + gerund/to V)',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Cô Sarah Miller',
        teacherSignature: true,
        teacherComment: 'Good understanding of grammar rules and fast exercises completion.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-26 11:25'
      },

      // Thứ 5
      {
        id: 'p_w4_t5_1',
        day: 'Thứ 5',
        date: '2026-08-27',
        period: 1,
        session: 'Sáng',
        subject: 'Tiếng Anh',
        ppctLessonNumber: 9,
        lessonContent: 'Unit 1: Communication (Cultural leisure activities)',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Cô Sarah Miller',
        teacherSignature: true,
        teacherComment: 'Active group discussions and role-play presentations.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-27 07:45'
      },
      {
        id: 'p_w4_t5_2',
        day: 'Thứ 5',
        date: '2026-08-27',
        period: 2,
        session: 'Sáng',
        subject: 'GDCD',
        ppctLessonNumber: 4,
        lessonContent: 'Tôn trọng sự đa dạng của các dân tộc',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Đỗ Minh Đức',
        teacherSignature: true,
        teacherComment: 'Lớp chuẩn bị tư liệu tranh ảnh phong phú, thái độ học tập nghiêm túc.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-27 08:45'
      },
      {
        id: 'p_w4_t5_3',
        day: 'Thứ 5',
        date: '2026-08-27',
        period: 3,
        session: 'Sáng',
        subject: 'Công Nghệ',
        ppctLessonNumber: 4,
        lessonContent: 'Bản vẽ chi tiết và hình biểu diễn của vật thể',
        score: 9.0,
        classification: 'Khá',
        teacherName: 'Cô Đinh Như Quỳnh',
        teacherSignature: true,
        teacherComment: 'Lớp trật tự, vài bạn cần mang đầy đủ thước kẻ kỹ thuật hơn.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-27 09:40'
      },
      {
        id: 'p_w4_t5_4',
        day: 'Thứ 5',
        date: '2026-08-27',
        period: 4,
        session: 'Sáng',
        subject: 'Thể Dục',
        ppctLessonNumber: 4,
        lessonContent: 'Chạy ngắn: Kỹ thuật xuất phát thấp và chạy lao sau xuất phát',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Bùi Phi Long',
        teacherSignature: true,
        teacherComment: 'Đội hình tập hợp nhanh gọn, khởi động kỹ, tinh thần rèn luyện thể thao tốt.',
        absentStudents: 'Đủ',
        updatedBy: 'Lê Vũ Hoàng (Lớp phó lao động)',
        updatedAt: '2026-08-27 10:35'
      },
      {
        id: 'p_w4_t5_5',
        day: 'Thứ 5',
        date: '2026-08-27',
        period: 5,
        session: 'Sáng',
        subject: 'Ngữ Văn',
        ppctLessonNumber: 9,
        lessonContent: 'Từ tượng hình, từ tượng thanh trong văn chương',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Cô Lê Thị Mai',
        teacherSignature: true,
        teacherComment: 'Học sinh đặt câu giàu hình ảnh, tương tác hào hứng.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-27 11:25'
      },

      // Thứ 6
      {
        id: 'p_w4_t6_1',
        day: 'Thứ 6',
        date: '2026-08-28',
        period: 1,
        session: 'Sáng',
        subject: 'Toán học',
        ppctLessonNumber: 10,
        lessonContent: 'Lập phương của một tổng - Lập phương của một hiệu',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Nguyễn Hữu Hùng',
        teacherSignature: true,
        teacherComment: 'Lớp học nghiêm túc, tiếp thu kiến thức mới nhanh.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-28 07:45'
      },
      {
        id: 'p_w4_t6_2',
        day: 'Thứ 6',
        date: '2026-08-28',
        period: 2,
        session: 'Sáng',
        subject: 'Ngữ Văn',
        ppctLessonNumber: 10,
        lessonContent: 'Tập làm văn: Viết bài văn tự sự kết hợp miêu tả và biểu cảm',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Cô Lê Thị Mai',
        teacherSignature: true,
        teacherComment: 'Lớp tập trung làm bài nghiêm túc, không có hiện tượng trao đổi.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-28 08:45'
      },
      {
        id: 'p_w4_t6_3',
        day: 'Thứ 6',
        date: '2026-08-28',
        period: 3,
        session: 'Sáng',
        subject: 'Mỹ Thuật',
        ppctLessonNumber: 4,
        lessonContent: 'Vẽ tranh đề tài: Mùa thu quê hương em',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Cô Phan Bích Vân',
        teacherSignature: true,
        teacherComment: 'Các bức vẽ sáng tạo, phối màu tươi sáng, giàu cảm xúc.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-28 09:40'
      },
      {
        id: 'p_w4_t6_4',
        day: 'Thứ 6',
        date: '2026-08-28',
        period: 4,
        session: 'Sáng',
        subject: 'Âm Nhạc',
        ppctLessonNumber: 4,
        lessonContent: 'Học hát: Bài ca Người giáo viên nhân dân',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Hoàng Đăng Khoa',
        teacherSignature: true,
        teacherComment: 'Lớp hát hòa giọng vang đều, đúng cao độ và tiết tấu.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-28 10:35'
      },
      {
        id: 'p_w4_t6_5',
        day: 'Thứ 6',
        date: '2026-08-28',
        period: 5,
        session: 'Sáng',
        subject: 'Sinh Học',
        ppctLessonNumber: 5,
        lessonContent: 'Mô - Các loại mô trong cơ thể người',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Cô Phạm Phương Thảo',
        teacherSignature: true,
        teacherComment: 'Quan sát kính hiển vi cẩn thận, vẽ lại hình ảnh mô chuẩn xác.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-28 11:25'
      },

      // Thứ 7
      {
        id: 'p_w4_t7_1',
        day: 'Thứ 7',
        date: '2026-08-29',
        period: 1,
        session: 'Sáng',
        subject: 'KHTN',
        ppctLessonNumber: 7,
        lessonContent: 'Ôn tập chương: Chuyển động và Lực',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Trần Văn Tuấn',
        teacherSignature: true,
        teacherComment: 'Học sinh tự tin giải bài tập tổng hợp trên bảng.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-29 07:45'
      },
      {
        id: 'p_w4_t7_2',
        day: 'Thứ 7',
        date: '2026-08-29',
        period: 2,
        session: 'Sáng',
        subject: 'Lịch Sử',
        ppctLessonNumber: 5,
        lessonContent: 'Chiến tranh giành độc lập của 13 thuộc địa Anh ở Bắc Mỹ',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Thầy Vũ Hải Nam',
        teacherSignature: true,
        teacherComment: 'Lớp chuẩn bị bài chu đáo, xây dựng sơ đồ tư duy dòng sự kiện.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-29 08:45'
      },
      {
        id: 'p_w4_t7_3',
        day: 'Thứ 7',
        date: '2026-08-29',
        period: 3,
        session: 'Sáng',
        subject: 'Địa Lý',
        ppctLessonNumber: 5,
        lessonContent: 'Khí hậu châu Á - Các đới và kiểu khí hậu',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Cô Nguyễn Thu Hương',
        teacherSignature: true,
        teacherComment: 'Phân tích biểu đồ nhiệt độ và lượng mưa thành thạo.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích (Lớp phó học tập)',
        updatedAt: '2026-08-29 09:40'
      },
      {
        id: 'p_w4_t7_4',
        day: 'Thứ 7',
        date: '2026-08-29',
        period: 4,
        session: 'Sáng',
        subject: 'Hoạt động trải nghiệm',
        ppctLessonNumber: 4,
        lessonContent: 'Chủ đề: Xây dựng tình bạn đẹp và phòng chống bạo lực học đường',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Cô Lê Thị Mai',
        teacherSignature: true,
        teacherComment: 'Các tổ thuyết trình tiểu phẩm xuất sắc, bài học ý nghĩa sâu sắc.',
        absentStudents: 'Đủ',
        updatedBy: 'Nguyễn Văn An (Lớp trưởng)',
        updatedAt: '2026-08-29 10:35'
      },
      {
        id: 'p_w4_t7_5',
        day: 'Thứ 7',
        date: '2026-08-29',
        period: 5,
        session: 'Sáng',
        subject: 'Sinh hoạt lớp',
        ppctLessonNumber: 4,
        lessonContent: 'Tổng kết nề nếp tuần 4 và phương hướng thi đua tuần 5',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Cô Lê Thị Mai',
        teacherSignature: true,
        teacherComment: 'Ban cán sự tổng kết rõ ràng, biểu dương Tổ 1 và Tổ 2, phê bình nhẹ bạn đến muộn.',
        absentStudents: 'Đủ',
        updatedBy: 'Nguyễn Văn An (Lớp trưởng)',
        updatedAt: '2026-08-29 11:25'
      }
    ]
  },
  {
    id: 'lb_w3_8a1',
    classId: 'c1',
    className: 'Lớp 8A1',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 3,
    startDate: '2026-08-17',
    endDate: '2026-08-22',
    homeroomTeacherName: 'Cô Lê Thị Mai',
    homeroomTeacherComment: 'Tuần học ổn định, vệ sinh lớp sạch sẽ. Các bạn cần chú ý chuẩn bị đầy đủ sách vở môn Công nghệ.',
    homeroomTeacherSignature: true,
    classOfficerName: 'Trần Thị Bích (Lớp phó học tập)',
    status: 'approved',
    totalPeriods: 25,
    averageScore: 9.6,
    goodPeriodsCount: 23,
    updatedAt: '2026-08-22 17:00',
    entries: [
      {
        id: 'p_w3_t2_1',
        day: 'Thứ 2',
        date: '2026-08-17',
        period: 1,
        session: 'Sáng',
        subject: 'Chào cờ',
        ppctLessonNumber: 3,
        lessonContent: 'Phát động tuần lễ Học tập suốt đời',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Toàn trường',
        teacherSignature: true,
        teacherComment: 'Nghiêm túc, đúng giờ.',
        absentStudents: 'Đủ',
        updatedBy: 'Nguyễn Văn An'
      },
      {
        id: 'p_w3_t2_2',
        day: 'Thứ 2',
        date: '2026-08-17',
        period: 2,
        session: 'Sáng',
        subject: 'Toán học',
        ppctLessonNumber: 5,
        lessonContent: 'Đại số: Phép nhân đa thức với đa thức',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Thầy Nguyễn Hữu Hùng',
        teacherSignature: true,
        teacherComment: 'Lớp hiểu bài, giải bài tập tốt.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích'
      },
      {
        id: 'p_w3_t2_3',
        day: 'Thứ 2',
        date: '2026-08-17',
        period: 3,
        session: 'Sáng',
        subject: 'Ngữ Văn',
        ppctLessonNumber: 5,
        lessonContent: 'Văn bản: Tức nước vỡ bờ (Trích Tắt đèn - Ngô Tất Tố)',
        score: 9.5,
        classification: 'Tốt',
        teacherName: 'Cô Lê Thị Mai',
        teacherSignature: true,
        teacherComment: 'Phát biểu hăng hái, phân tích tốt nhân vật chị Dậu.',
        absentStudents: 'Đủ',
        updatedBy: 'Trần Thị Bích'
      }
    ]
  },
  {
    id: 'lb_w4_8a2',
    classId: 'c2',
    className: 'Lớp 8A2',
    academicYear: '2025 - 2026',
    semester: 'Học kỳ 1',
    weekNumber: 4,
    startDate: '2026-08-24',
    endDate: '2026-08-29',
    homeroomTeacherName: 'Thầy Nguyễn Hữu Hùng',
    homeroomTeacherComment: 'Lớp 8A2 duy trì học tập tốt môn Toán và Tin học. Đạt giải nhì thi đua tuần của trường.',
    homeroomTeacherSignature: true,
    classOfficerName: 'Đỗ Quốc Bảo (Lớp trưởng)',
    status: 'approved',
    totalPeriods: 25,
    averageScore: 9.7,
    goodPeriodsCount: 24,
    updatedAt: '2026-08-29 17:00',
    entries: [
      {
        id: 'p_8a2_w4_t2_1',
        day: 'Thứ 2',
        date: '2026-08-24',
        period: 1,
        session: 'Sáng',
        subject: 'Chào cờ',
        ppctLessonNumber: 4,
        lessonContent: 'Chào cờ đầu tuần',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Tổng phụ trách',
        teacherSignature: true,
        teacherComment: 'Nề nếp rất tốt.',
        absentStudents: 'Đủ',
        updatedBy: 'Đỗ Quốc Bảo'
      },
      {
        id: 'p_8a2_w4_t2_2',
        day: 'Thứ 2',
        date: '2026-08-24',
        period: 2,
        session: 'Sáng',
        subject: 'Toán học',
        ppctLessonNumber: 7,
        lessonContent: 'Hằng đẳng thức đáng nhớ',
        score: 10,
        classification: 'Tốt',
        teacherName: 'Thầy Nguyễn Hữu Hùng',
        teacherSignature: true,
        teacherComment: 'Học sinh tư duy nhạy bén.',
        absentStudents: 'Đủ',
        updatedBy: 'Đỗ Quốc Bảo'
      }
    ]
  }
];

