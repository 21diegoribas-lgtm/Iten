export type UserRole = 'student' | 'teacher' | 'admin';

export type MainTabType = 
  | 'dashboard'
  | 'training_competition'
  | 'learning_competition'
  | 'activities'
  | 'utilities';

export type StudentPosition = 
  | 'thành viên' 
  | 'lớp trưởng' 
  | 'lớp phó học tập' 
  | 'lớp phó lao động' 
  | 'tổ trưởng' 
  | 'thủ quỹ'
  | string;

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  password?: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  dob: string;
  phone: string;
  address: string;
  school: string;
  classId?: string;
  className?: string;
  academicYear?: string;
  position?: StudentPosition;
  team?: string; // Tổ mấy
  isUnionMember?: boolean; // Đoàn viên
  teacherRole?: 'giáo viên bộ môn' | 'giáo viên chủ nhiệm' | 'vừa chủ nhiệm vừa bộ môn';
  subject?: string;
  notes?: string;
  avatar?: string;
  avatarId?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  school: string;
  academicYear: string;
  homeroomTeacher: string;
  teacherRole?: 'giáo viên chủ nhiệm' | 'giáo viên bộ môn';
  subject?: string;
  studentCount: number;
  maleCount?: number;
  femaleCount?: number;
  unionCount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  username?: string;
  email?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  dob?: string;
  dateOfBirth?: string;
  classId?: string;
  className?: string;
  studentCode?: string;
  avatar?: string;
  avatarId?: string;
  phone?: string;
  address?: string;
  school?: string;
  position?: StudentPosition;
  team?: string;
  isUnionMember?: boolean;
  notes?: string;
  status?: 'active' | 'inactive' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherProfile {
  id: string;
  fullName: string;
  username?: string;
  email?: string;
  phone?: string;
  address?: string;
  school?: string;
  subject?: string;
  teacherRole?: 'giáo viên bộ môn' | 'giáo viên chủ nhiệm' | 'vừa chủ nhiệm vừa bộ môn';
  classId?: string;
  className?: string;
  avatar?: string;
  avatarId?: string;
  notes?: string;
  status?: 'active' | 'inactive' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  senderId?: string;
  senderName: string;
  senderRole: string;
  targetClassId?: string;
  targetClassName?: string;
  targetStudentId?: string;
  targetStudentName?: string;
  targetTeam?: string;
  targetRole?: UserRole | 'all';
  targetType?: 'all' | 'class' | 'team' | 'student';
  createdAt: string;
  isRead?: boolean;
}
export interface TeacherPeriodTask {
  period: number;
  task: string;
  location?: string;
  type?: 'Lên lớp' | 'Họp hội đồng' | 'Chấm bài' | 'Chủ nhiệm' | 'Trực ban' | 'Bồi dưỡng' | 'Khác';
  status?: 'Đã lên lịch' | 'Hoàn thành' | 'Đã hủy';
}

export interface TeacherDaySchedule {
  day: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7' | 'Chủ Nhật';
  date?: string;
  morningPeriods: TeacherPeriodTask[];
  afternoonPeriods: TeacherPeriodTask[];
  notes?: string;
}

export interface TeacherWeeklyTimetable {
  id: string;
  teacherId: string;
  teacherName: string;
  semester: 'Học kỳ 1' | 'Học kỳ 2';
  weekNumber: number;
  startDate: string;
  weeklyNotes?: string;
  days: TeacherDaySchedule[];
}

export interface TeacherWorkSchedule {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  weekNumber: number;
  startDate?: string;
  title: string;
  content: string;
  notes?: string;
  type: 'Lên lớp' | 'Họp hội đồng' | 'Chấm bài' | 'Chủ nhiệm' | 'Khác';
  status: 'Đã lên lịch' | 'Hoàn thành' | 'Đã hủy';
  day?: string;
  period?: number;
  session?: 'morning' | 'afternoon';
}

export interface TimetableEntry {
  id: string;
  classId: string;
  semester: 'Học kỳ 1' | 'Học kỳ 2';
  weekNumber: number;
  startDate: string;
  schedule: {
    day: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7';
    periods: {
      period: number;
      subject: string;
      teacherName: string;
    }[];
  }[];
}

export interface CleaningSchedule {
  id: string;
  classId: string;
  weekNumber: number;
  startDate: string;
  tasks: {
    day: string;
    groupName: string;
    studentNames: string[];
    status: 'Đã hoàn thành' | 'Chưa làm' | 'Đang kiểm tra';
  }[];
}

export interface DisciplineRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  type: 'reward' | 'violation';
  categoryName: string;
  category?: 'Điểm rèn luyện' | 'Điểm học tập' | 'Thi đua rèn luyện' | 'Thi đua học tập' | 'Điểm HĐ học tập' | 'Điểm HĐ rèn luyện';
  points: number; // positive for reward, negative for violation
  reason: string;
  date: string;
  week: number;
  month: number;
  semester: string;
  recordedBy: string;
  activityId?: string;
  activityName?: string;
  pointType?: 'academic_activity' | 'training_activity';
  attemptId?: string;
  isUsed?: boolean; // Đánh dấu GV/Admin đã sử dụng điểm
  usedPoints?: number; // Số điểm đã sử dụng (khấu trừ)
  usedNote?: string; // Ghi chú lý do/mục đích sử dụng điểm
}

export interface LearningRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  categoryType?: 'subject' | 'class'; // 'subject': Môn học, 'class': Lớp học
  categoryName?: string;
  category?: 'Điểm rèn luyện' | 'Điểm học tập' | 'Thi đua rèn luyện' | 'Thi đua học tập' | 'Điểm HĐ học tập' | 'Điểm HĐ rèn luyện';
  subjectName?: string; // e.g. 'Toán', 'Ngữ Văn', 'Tiếng Anh'...
  type?: 'reward' | 'violation'; // 'reward' (+), 'violation' (-)
  activityName: string;
  points: number;
  reason?: string;
  date: string;
  week: number;
  month: number;
  semester: string;
  recordedBy?: string;
  note?: string;
  isApplied?: boolean; // Đánh dấu điểm đã được áp dụng / sử dụng
  isUsed?: boolean; // Đánh dấu GV/Admin đã sử dụng điểm
  usedPoints?: number; // Số điểm đã sử dụng (khấu trừ)
  usedNote?: string; // Ghi chú lý do/mục đích sử dụng điểm
  activityId?: string;
  pointType?: 'academic_activity' | 'training_activity';
  attemptId?: string;
}

export interface PointUsageTransaction {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  team?: string;
  pointType: 'academic' | 'training'; // 'academic': Điểm học tập, 'training': Điểm rèn luyện
  amount: number; // Số điểm đã sử dụng (số dương)
  content: string; // Nội dung/lí do sử dụng điểm
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  performedBy: string; // Tên GV / Admin thực hiện
  performedRole: string; // 'Giáo viên' | 'Quản trị viên'
  status: 'active' | 'cancelled'; // 'active': Đang áp dụng, 'cancelled': Đã hủy
  cancelledAt?: string;
  cancelledBy?: string;
  cancelledReason?: string;
}

export interface LearningPresetItem {
  id: string;
  categoryType: 'subject' | 'class';
  type: 'reward' | 'violation';
  subjectName?: string;
  name: string;
  points: number;
}

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  title: string;
  content: string;
  target: 'cán sự lớp' | 'giáo viên';
  status: 'Đang chờ' | 'Đã giải quyết' | 'Từ chối';
  response?: string;
  createdAt: string;
}

export interface AccountRequest {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  type: 'reset_password' | 'update_profile';
  details: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Từ chối';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  status: 'Có mặt' | 'Vắng có phép' | 'Vắng không phép' | 'Đi muộn';
  note?: string;
  weekNumber?: number;
  monthNumber?: number;
  semester?: 'Học kỳ 1' | 'Học kỳ 2';
  dayOfWeek?: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7';
  recordedBy?: string;
}

export interface SpyGameSummary {
  winner: 'spy' | 'citizens' | 'spy_failed';
  spyName: string;
  spyAvatar?: string;
  spyTeam?: string;
  spyPointsChanged: number;
  citizenRewardPointsPerVote: number;
  totalVotes: number;
  correctVotesCount: number;
  correctVoters: {
    studentId: string;
    studentName: string;
    avatar?: string;
    team?: string;
    votesCast: number;
    pointsEarned: number;
  }[];
  conclusionNote: string;
  endedAt: string;
}

export type ActivityCategoryType = 'Điểm HĐ học tập' | 'Điểm HĐ rèn luyện' | 'Điểm rèn luyện' | 'Điểm học tập' | 'Thi đua rèn luyện' | 'Thi đua học tập';

export interface SpyGameMission {
  id: string;
  classId: string;
  weekNumber: number;
  category?: ActivityCategoryType;
  spyStudentId: string;
  missionDescription: string;
  status: 'Chưa kích hoạt' | 'Đang diễn ra' | 'Hoàn thành (+5đ)' | 'Bị phát hiện (-5đ)' | 'Không hoàn thành (-5đ)';
  votes: {
    voterId: string;
    suspectId: string;
  }[];
  rewardSpy?: number;
  penaltySpy?: number;
  rewardCitizenPerVote?: number;
  startedAt?: string;
  endedAt?: string;
  summaryResult?: SpyGameSummary;
}

export interface FlowerGameQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'fill' | 'bool';
  options?: string[];
  correctAnswer: string;
  isLuckyFlower?: boolean;
  multiplier?: number; // 2 or 3
}

export interface FlowerParticipant {
  id: string;
  name: string;
  color: string;
  score: number;
  harvestedCount: number;
  avatar?: string;
}

export type FlowerPlayMode = 'all_together' | 'turn_based';
export type FlowerParticipantType = 'team' | 'group' | 'student';

export interface FlowerGameConfig {
  id: string;
  title: string;
  classId: string;
  category: ActivityCategoryType;
  language?: 'vi' | 'en';
  timeMinutes: number;
  treesCount: number;
  flowersPerTree: number;
  fruitsPerTree: number;
  questions: FlowerGameQuestion[];
  audioUrl?: string;
  isActive: boolean;
  playMode?: FlowerPlayMode;
  participantType?: FlowerParticipantType;
  participantsCount?: number;
  participants?: FlowerParticipant[];
}

export interface VehicleConfig {
  id: string;
  name: string;
  icon: string;
  distance: number; // quãng đường chạy mỗi lần quay trúng (m)
  color: string;
}

export interface RacingTeam {
  id: string;
  name: string;
  color: string;
  vehicleId?: string;
  currentDistance: number;
}

export interface RacingQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'fill' | 'bool';
  options?: string[];
  correctAnswer: string;
}

export interface FlowerAnswerHistoryRecord {
  id: string;
  itemNumber: number; // 1-12
  itemType: 'flower' | 'fruit';
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionType?: 'mcq' | 'fill' | 'bool';
  options?: string[];
  participantName: string;
  participantColor: string;
  submittedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsChange: number;
  timestamp: string;
}

export interface ActivityPointRecord {
  id: string;
  attemptId: string;
  userId: string;
  studentName: string;
  classId: string;
  activityId: string;
  activityName: string;
  source: 'flower' | 'racing' | 'memory' | 'keyboard' | 'spy' | 'attendance' | 'garden';
  category: FlowerGameConfig['category'];
  pointType: 'academic_activity' | 'training_activity';
  points: number;
  isCorrect: boolean;
  participantName: string;
  questionId: string;
  date: string;
  timestamp: string;
}

export interface RaceAnswerHistoryRecord {
  id: string;
  obstacleNumber: number;
  obstacleName: string;
  questionId: string;
  questionNumber: number;
  questionText: string;
  questionType?: 'mcq' | 'fill' | 'bool';
  options?: string[];
  teamName: string;
  teamColor: string;
  submittedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsChange: number;
  vehicleAwarded?: string;
  distanceGained?: number;
  timestamp: string;
}

export interface RacingGameConfig {
  id: string;
  title: string;
  classId: string;
  category: ActivityCategoryType;
  trackLength: number; // meters e.g 1000m
  timeMinutes: number;
  mode: 'cá nhân' | 'nhóm' | 'tổ';
  playMode?: 'turn_based' | 'all_teams'; // 'turn_based': Chơi lần lượt từng đội | 'all_teams': Tất cả các đội cùng chơi
  trackCount: number; // số lượng đường đua (2-6)
  teams: RacingTeam[];
  vehicles: VehicleConfig[];
  questions: RacingQuestion[];
  isActive: boolean;
}

export type VehicleType = 'đi bộ' | 'xe bò' | 'xe đạp' | 'xe máy' | 'xe moto' | 'xe hơi' | 'siêu xe' | 'tên lửa';

export interface KeyboardHeroSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  team?: string;
  content: string;
  wordCount: number;
  wpm?: number;
  accuracy?: number;
  timeSpentSeconds?: number;
  submittedAt: string;
  isLate?: boolean;
  likes: string[];
  score?: number;
  feedback?: string;
  rewardPointsAwarded?: number;
  isGraded?: boolean;
  comments: {
    id: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    createdAt: string;
  }[];
}

export interface KeyboardHeroTask {
  id: string;
  title: string;
  prompt: string;
  instruction?: string;
  sampleText?: string;
  minWords?: number;
  maxWords?: number;
  timeLimitMinutes?: number;
  classId: string;
  category: ActivityCategoryType;
  deadline: string;
  rewardPoints?: number;
  audioUrl?: string;
  status?: 'Đang diễn ra' | 'Đã hết hạn' | 'Đã đóng';
  submissions: KeyboardHeroSubmission[];
}

export interface MemoryCardPair {
  id: string;
  cardA: string;
  cardB: string;
}

export interface MemoryCardGameConfig {
  id: string;
  title: string;
  classId: string;
  category?: ActivityCategoryType;
  timeMinutes: number;
  pairs: MemoryCardPair[];
  isActive: boolean;
}

export interface MemoryGameResultRecord {
  id: string;
  score: number;
  matchedPairs: number;
  totalPairs: number;
  completed: boolean;
  timeSpentSeconds: number;
  timestamp: string;
}

export interface PersonalStorageItem {
  id: string;
  userId: string;
  title: string;
  type: 'table' | 'blank';
  tableData?: {
    rows: number;
    cols: number;
    data: string[][];
    headers: string[];
  };
  blankContent?: string;
  updatedAt: string;
}

export interface ClassFundContribution {
  studentId: string;
  studentName: string;
  className?: string;
  team?: string;
  isPaid: boolean;
  paidAmount: number;
  paidAt?: string;
  paymentMethod?: 'Tiền mặt' | 'Chuyển khoản';
  notes?: string;
}

export interface ClassFundItem {
  id: string;
  classId: string;
  className: string;
  academicYear: string;
  semester: 'Học kỳ 1' | 'Học kỳ 2';
  weekNumber?: number;
  periodType: 'week' | 'semester' | 'year' | 'custom';
  title: string;
  amountPerStudent: number;
  dueDate?: string;
  createdAt: string;
  createdBy: string;
  createdById?: string;
  notes?: string;
  status: 'active' | 'closed';
  contributions: Record<string, ClassFundContribution>;
}

export interface ClassFundExpense {
  id: string;
  classId: string;
  className: string;
  academicYear: string;
  semester: 'Học kỳ 1' | 'Học kỳ 2';
  weekNumber?: number;
  title: string;
  amount: number;
  date: string;
  spentBy: string;
  spentById?: string;
  category: 'Vật phẩm học tập' | 'Vệ sinh lớp' | 'Văn nghệ & Phong trào' | 'Khen thưởng & Quà tặng' | 'Hoạt động trải nghiệm' | 'Khác';
  receiptNote?: string;
}

export type DayOfWeek = 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7';

export interface ClassLogbookPeriod {
  id: string;
  day: DayOfWeek;
  date: string; // YYYY-MM-DD
  period: number; // 1 to 5
  session: 'Sáng' | 'Chiều';
  subject: string; // Toán, Ngữ văn, Tiếng Anh, KHTN, Lịch sử & Địa lý, Tin học...
  ppctLessonNumber?: number | string; // Tiết theo PPCT
  lessonContent: string; // Tên bài học / Nội dung giảng dạy
  score: number; // Điểm tiết học (ví dụ: 10, 9.5, 9, 8.5...)
  classification?: 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu';
  teacherName: string; // Tên Giáo viên giảng dạy
  teacherSignature?: boolean; // Giáo viên đã ký xác nhận
  teacherComment?: string; // Nhận xét của giáo viên về tiết học, tinh thần học sinh
  absentStudents?: string; // Học sinh vắng tiết (nếu có)
  updatedBy?: string; // Người cập nhật (Cán sự lớp / GV)
  updatedAt?: string;
}

export interface ClassLogbookWeek {
  id: string;
  classId: string;
  className: string;
  academicYear: string;
  semester: 'Học kỳ 1' | 'Học kỳ 2';
  weekNumber: number;
  startDate: string;
  endDate: string;
  entries: ClassLogbookPeriod[];
  homeroomTeacherName?: string;
  homeroomTeacherComment?: string;
  homeroomTeacherSignature?: boolean;
  classOfficerName?: string; // Tên cán sự ghi sổ
  status?: 'draft' | 'submitted' | 'approved';
  totalPeriods?: number;
  averageScore?: number;
  goodPeriodsCount?: number;
  updatedAt?: string;
}

export type PresentationFormat = 'pptx' | 'pdf';
export type PresentationStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export type ResourceType = 'presentation' | 'document' | 'website' | 'video' | 'learning_material' | 'other';
export type ResourceAccessPermission = 'private' | 'class' | 'students' | 'all_class';

export interface ResourceItem {
  id: string;
  title: string;
  url?: string;
  type: ResourceType;
  description: string;
  thumbnailUrl?: string;
  topic: string; // Nhóm / Chủ đề (ví dụ: Tiếng Anh, Toán học, Kỹ năng sống, v.v.)
  creatorName: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  permission: ResourceAccessPermission;
  targetClassId?: string; // Tên lớp được chọn (ví dụ "8A1")
  targetStudentIds?: string[]; // Danh sách ID học sinh được chọn
  fileSize?: string;
  fileName?: string;
  embeddable?: boolean; // Mặc định true
  presentationId?: string; // ID liên kết với Kho bài trình chiếu nếu là file slide
}

export interface PresentationSlide {
  pageNumber: number;
  imageUrl: string;
  title?: string;
  notes?: string;
}

export interface PresentationItem {
  id: string;
  fileName: string;
  title: string;
  teacherOwner: string;
  teacherId?: string;
  uploadTime: string;
  updatedTime: string;
  format: PresentationFormat;
  fileSize: string;
  fileSizeBytes?: number;
  slideCount: number;
  thumbnail: string;
  slideImages: string[];
  originalFileBlob?: Blob | ArrayBuffer | string;
  status: PresentationStatus;
  errorMessage?: string;
  lastViewedSlide: number;
  category?: string;
  subject?: string;
  description?: string;
}
