import React, { useState, useMemo } from 'react';
import { auth } from '../../lib/firebase';
import {
  User,
  NotificationItem,
  TimetableEntry,
  CleaningSchedule,
  AccountRequest,
  Complaint,
  TeacherWorkSchedule,
  TeacherWeeklyTimetable,
  ClassFundItem,
  ClassFundExpense,
  ClassFundContribution,
  ClassLogbookWeek,
  DisciplineRecord,
  LearningRecord,
  PointUsageTransaction
} from '../../types';
import { soundFx } from '../../utils/sound';
import { getAvatarUrl } from '../../utils/avatarHelper';
import { TeacherWeeklyScheduleView } from '../schedule/TeacherWeeklyScheduleView';
import { ClassFundManager } from '../fund/ClassFundManager';
import { ClassLogbookManager } from '../logbook/ClassLogbookManager';
import { PointUsageManager } from '../point-usage/PointUsageManager';
import {
  Calendar,
  Sparkles,
  KeyRound,
  FileText,
  Users,
  BellRing,
  CheckCircle2,
  Clock,
  Plus,
  Edit3,
  UserPlus,
  Briefcase,
  Trash2,
  FileSpreadsheet,
  X,
  Wallet,
  DollarSign,
  Receipt
} from 'lucide-react';

interface DashboardTabProps {
  currentUser: User;
  notifications: NotificationItem[];
  timetable: TimetableEntry;
  timetables?: TimetableEntry[];
  teacherSchedules?: TeacherWorkSchedule[];
  teacherWeeklyTimetables?: TeacherWeeklyTimetable[];
  onUpdateTeacherWeeklyTimetables?: (tts: TeacherWeeklyTimetable[]) => void;
  classFunds?: ClassFundItem[];
  classExpenses?: ClassFundExpense[];
  onUpdateClassFunds?: (funds: ClassFundItem[]) => void;
  onUpdateClassExpenses?: (expenses: ClassFundExpense[]) => void;
  logbooks?: ClassLogbookWeek[];
  onUpdateLogbooks?: (logbooks: ClassLogbookWeek[]) => void;
  cleaning: CleaningSchedule;
  students: User[];
  teachers?: User[];
  classesList: any[];
  onAddNotification: (n: NotificationItem) => Promise<void>;
  onUpdateTimetable: (tt: TimetableEntry) => void;
  onUpdateTimetables?: (tts: TimetableEntry[]) => void;
  onAddTeacherSchedule?: (s: TeacherWorkSchedule) => void;
  onUpdateTeacherSchedule?: (s: TeacherWorkSchedule) => void;
  onDeleteTeacherSchedule?: (id: string) => void;
  onUpdateCleaning: (cl: CleaningSchedule) => void;
  onAddAccountRequest: (req: AccountRequest) => void;
  accountRequests: AccountRequest[];
  onResolveRequest: (id: string, status: 'Đã duyệt' | 'Từ chối') => void;
  onAddStudent: (st: User) => Promise<void>;
  onUpdateStudent?: (st: User) => void;
  onDeleteStudent?: (id: string) => void;
  onAddStudentsBulk?: (students: User[]) => Promise<User[]>;
  onAddClass: (cl: any) => void;
  onUpdateClass?: (cl: any) => void;
  onDeleteClass?: (id: string) => void;
  onAddTeacher?: (t: User) => void;
  onUpdateTeacher?: (t: User) => void;
  onDeleteTeacher?: (id: string) => void;
  onAddTeachersBulk?: (teachers: User[]) => void;
  onUpdateCurrentUser?: (user: User) => void;
  onOpenAvatarSelection?: () => void;
  learningRecords?: LearningRecord[];
  disciplineRecords?: DisciplineRecord[];
  pointUsageTransactions?: PointUsageTransaction[];
  onAddPointUsageTransaction?: (tx: PointUsageTransaction) => void;
  onCancelPointUsageTransaction?: (txId: string, cancelledBy: string) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  currentUser,
  notifications,
  timetable,
  timetables,
  teacherSchedules,
  teacherWeeklyTimetables,
  onUpdateTeacherWeeklyTimetables,
  classFunds = [],
  classExpenses = [],
  onUpdateClassFunds,
  onUpdateClassExpenses,
  logbooks = [],
  onUpdateLogbooks,
  cleaning,
  students,
  teachers = [],
  onAddNotification,
  onUpdateTimetable,
  onUpdateTimetables,
  onAddTeacherSchedule,
  onUpdateTeacherSchedule,
  onDeleteTeacherSchedule,
  onUpdateCleaning,
  onAddAccountRequest,
  accountRequests,
  onResolveRequest,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddStudentsBulk,
  classesList,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddTeachersBulk,
  onUpdateCurrentUser,
  onOpenAvatarSelection,
  learningRecords = [],
  disciplineRecords = [],
  pointUsageTransactions = [],
  onAddPointUsageTransaction = () => {},
  onCancelPointUsageTransaction = () => {}
}) => {
  // Local state for actions
  const [activeSubView, setActiveSubView] = useState<'overview' | 'timetable' | 'cleaning' | 'classes_and_students' | 'students' | 'classes' | 'notifications' | 'teacher_schedule' | 'teacher_management' | 'class_fund' | 'class_logbook' | 'point_usage'>('overview');
  const [classProfileTab, setClassProfileTab] = useState<'all' | 'classes' | 'students'>('all');
  const [selectedAcademicYearFilter, setSelectedAcademicYearFilter] = useState<string>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');

  // Modals state for Add/Edit Class
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [addClassForm, setAddClassForm] = useState({
    name: '',
    academicYear: '2025 - 2026',
    school: 'THCS Chu Văn An',
    homeroomTeacher: currentUser.fullName || 'Cô Lê Thị Mai',
    teacherRole: 'Giáo viên chủ nhiệm' as 'Giáo viên chủ nhiệm' | 'Giáo viên bộ môn',
    subject: 'Ngữ Văn',
    studentCount: 38,
    maleCount: 20,
    femaleCount: 18,
    unionCount: 25,
    notes: 'Lớp điểm thi đua'
  });

  // Modals state for Add/Edit/Import Student
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [studentImportMode, setStudentImportMode] = useState<'manual' | 'bulk' | 'sheet'>('manual');
  const [studentBulkText, setStudentBulkText] = useState('');
  const [studentSheetUrl, setStudentSheetUrl] = useState('');
  const [customPosition, setCustomPosition] = useState('');

  const [addStudentForm, setAddStudentForm] = useState({
    fullName: '',
    className: '',
    academicYear: '2025 - 2026',
    gender: 'Nam',
    dob: '2012-05-15',
    phone: '',
    email: '',
    address: 'Hà Nội',
    password: '123456',
    position: 'thành viên',
    team: 'Tổ 1',
    isUnionMember: true,
    notes: ''
  });

  // Modals state for Admin Teacher Management
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [teacherImportMode, setTeacherImportMode] = useState<'manual' | 'bulk' | 'sheet'>('manual');
  const [teacherBulkText, setTeacherBulkText] = useState('');
  const [teacherSheetUrl, setTeacherSheetUrl] = useState('');
  const [teacherForm, setTeacherForm] = useState({
    fullName: '',
    school: 'THCS Chu Văn An',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '1988-06-20',
    email: '',
    phone: '',
    address: 'Hà Nội',
    password: '123456',
    teacherRole: 'giáo viên chủ nhiệm' as 'giáo viên bộ môn' | 'giáo viên chủ nhiệm' | 'vừa chủ nhiệm vừa bộ môn',
    subject: 'Toán học',
    notes: ''
  });

  // Teacher Self Profile & Password Update Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser.fullName || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    address: currentUser.address || '',
    subject: currentUser.subject || 'Ngữ Văn',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification Target Search state
  const [notifTargetType, setNotifTargetType] = useState<'all' | 'class' | 'student' | 'teacher'>('all');
  const [notifTargetClass, setNotifTargetClass] = useState('all');
  const [notifTargetStudentId, setNotifTargetStudentId] = useState('');
  const [notifTargetTeam, setNotifTargetTeam] = useState('Tổ 1');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifContent, setNotifContent] = useState('');
  const [targetSearchQuery, setTargetSearchQuery] = useState('');

  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [studentFormErrors, setStudentFormErrors] = useState<Record<string, string>>({});
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 4000);
  };

  const showErrorToast = (msg: string) => {
    setActionErrorMsg(msg);
    setTimeout(() => setActionErrorMsg(null), 5000);
  };

  // List of unique academic years available
  const availableAcademicYears = useMemo(() => {
    const yearsSet = new Set<string>();
    classesList.forEach(cls => {
      if (cls.academicYear) yearsSet.add(cls.academicYear);
    });
    students.forEach(st => {
      if (st.academicYear) yearsSet.add(st.academicYear);
    });
    if (yearsSet.size === 0) yearsSet.add('2025 - 2026');
    return Array.from(yearsSet).sort().reverse();
  }, [classesList, students]);

  // Map class -> academicYear
  const classAcademicYearMap = useMemo(() => {
    const map: Record<string, string> = {};
    classesList.forEach(c => {
      if (c.name) map[c.name] = c.academicYear || '2025 - 2026';
      if (c.id) map[c.id] = c.academicYear || '2025 - 2026';
    });
    return map;
  }, [classesList]);

  // Augmented classes list with dynamically computed student counts
  const augmentedClassesList = useMemo(() => {
    return classesList.map(cls => {
      const matchingStudents = students.filter(st => st.className === cls.name || st.classId === cls.id);
      if (matchingStudents.length > 0) {
        return {
          ...cls,
          studentCount: matchingStudents.length,
          maleCount: matchingStudents.filter(s => s.gender === 'Nam').length,
          femaleCount: matchingStudents.filter(s => s.gender === 'Nữ').length,
          unionCount: matchingStudents.filter(s => s.isUnionMember).length
        };
      }
      return cls;
    });
  }, [classesList, students]);

  // Filtered classes list by Academic Year
  const filteredClassesList = useMemo(() => {
    return augmentedClassesList.filter(cls => {
      return selectedAcademicYearFilter === 'all' || cls.academicYear === selectedAcademicYearFilter;
    });
  }, [augmentedClassesList, selectedAcademicYearFilter]);

  // Filtered students by Academic Year, Class, Team, and Search Query
  const filteredStudentsList = useMemo(() => {
    return students.filter(st => {
      const stClass = st.className || 'Lớp 8A1';
      const stAcademicYear = st.academicYear || classAcademicYearMap[stClass] || classAcademicYearMap[st.classId || ''] || '2025 - 2026';
      
      const matchesYear = selectedAcademicYearFilter === 'all' || stAcademicYear === selectedAcademicYearFilter;
      const matchesClass = selectedClassFilter === 'all' || stClass === selectedClassFilter || st.classId === selectedClassFilter;
      const matchesSearch = !studentSearchQuery || 
                            st.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                            (st.phone && st.phone.includes(studentSearchQuery)) ||
                            (st.email && st.email.toLowerCase().includes(studentSearchQuery.toLowerCase()));
      const matchesTeam = selectedTeamFilter === 'all' || st.team === selectedTeamFilter;
      return matchesYear && matchesClass && matchesSearch && matchesTeam;
    });
  }, [students, selectedAcademicYearFilter, selectedClassFilter, studentSearchQuery, selectedTeamFilter, classAcademicYearMap]);

  // Statistical metrics for selected academic year and class filter
  const classStatsSummary = useMemo(() => {
    const classStudents = students.filter(st => {
      const stClass = st.className || 'Lớp 8A1';
      const stAcademicYear = st.academicYear || classAcademicYearMap[stClass] || classAcademicYearMap[st.classId || ''] || '2025 - 2026';
      const matchesYear = selectedAcademicYearFilter === 'all' || stAcademicYear === selectedAcademicYearFilter;
      const matchesClass = selectedClassFilter === 'all' || stClass === selectedClassFilter || st.classId === selectedClassFilter;
      return matchesYear && matchesClass;
    });
    const total = classStudents.length;
    const male = classStudents.filter(s => s.gender === 'Nam').length;
    const female = classStudents.filter(s => s.gender === 'Nữ').length;
    const union = classStudents.filter(s => s.isUnionMember).length;
    const t1 = classStudents.filter(s => s.team === 'Tổ 1').length;
    const t2 = classStudents.filter(s => s.team === 'Tổ 2').length;
    const t3 = classStudents.filter(s => s.team === 'Tổ 3').length;
    const t4 = classStudents.filter(s => s.team === 'Tổ 4').length;
    return { total, male, female, union, t1, t2, t3, t4 };
  }, [students, selectedAcademicYearFilter, selectedClassFilter, classAcademicYearMap]);
  const [selectedSemester, setSelectedSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>(timetable.semester || 'Học kỳ 1');
  const [selectedTimetableWeek, setSelectedTimetableWeek] = useState<number>(timetable.weekNumber);

  const defaultDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'] as const;
  const activeTimetable = timetables?.find(t => (t.semester || 'Học kỳ 1') === selectedSemester && t.weekNumber === selectedTimetableWeek) || {
    id: `tt_${selectedSemester}_${selectedTimetableWeek}`,
    classId: currentUser.className || '8A1',
    semester: selectedSemester,
    weekNumber: selectedTimetableWeek,
    startDate: '2026-08-03',
    schedule: defaultDays.map(day => ({
      day,
      periods: [1, 2, 3, 4, 5].map(p => ({ period: p, subject: 'Trống', teacherName: 'Chưa phân công' }))
    }))
  };

  // Password / Profile requests form
  const [reqDetails, setReqDetails] = useState('');
  const [reqType, setReqType] = useState<'reset_password' | 'update_profile'>('reset_password');

  // New class form
  const [newClassName, setNewClassName] = useState('');
  const [newClassSchool, setNewClassSchool] = useState('THCS Chu Văn An');
  const [newClassYear, setNewClassYear] = useState('2025 - 2026');

  // New student form
  const [stName, setStName] = useState('');
  const [stGender, setStGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [stDob, setStDob] = useState('2012-01-01');
  const [stTeam, setStTeam] = useState('Tổ 1');
  const [stPosition, setStPosition] = useState('thành viên');

  const isClassOfficer = currentUser.role === 'student' && currentUser.position && currentUser.position !== 'thành viên';
  const canManageTimetable = currentUser.role === 'teacher' || currentUser.role === 'admin' || isClassOfficer;
  const canManageCleaning = currentUser.role === 'teacher' || currentUser.role === 'admin' || isClassOfficer;

  const [isEditingTimetable, setIsEditingTimetable] = useState(false);
  const [editTimetable, setEditTimetable] = useState<TimetableEntry>(timetable);

  const [isEditingCleaning, setIsEditingCleaning] = useState(false);
  const [editCleaning, setEditCleaning] = useState<CleaningSchedule>(cleaning);

  const handleSendNotification = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!notifTitle || !notifContent) return;

  soundFx.playSuccess();

  try {
    await onAddNotification({
      id: 'n_' + Date.now(),
      title: notifTitle,
      content: notifContent,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderRole:
        currentUser.role === 'teacher'
          ? 'Giáo viên'
          : currentUser.role === 'admin'
            ? 'Admin'
            : 'Cán sự lớp',
      targetClassId: currentUser.classId || 'c1',
      targetType: notifTargetType,
      targetTeam:
        notifTargetType === 'team'
          ? notifTargetTeam
          : undefined,
      targetStudentId:
        notifTargetType === 'student'
          ? notifTargetStudentId
          : undefined,
      createdAt: new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 16),
      isRead: false,
    });

    setNotifTitle('');
    setNotifContent('');
    alert('Đã gửi thông báo thành công!');
  } catch (error) {
    console.error('Lỗi đăng thông báo:', error);
    alert(
      error instanceof Error
        ? error.message
        : 'Không thể đăng thông báo.'
    );
  }
};
  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDetails) return;
    soundFx.playSuccess();
    onAddAccountRequest({
      id: 'ar_' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      role: currentUser.role,
      type: reqType,
      details: reqDetails,
      status: 'Chờ duyệt',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });
    setReqDetails('');
    alert('Đã gửi yêu cầu đến giáo viên/quản trị viên thành công!');
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full min-w-0 max-w-full">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-xl relative overflow-hidden w-full">
        <div className="absolute right-2 -bottom-4 sm:right-4 sm:-bottom-6 text-6xl sm:text-7xl lg:text-9xl opacity-15 sm:opacity-20 select-none pointer-events-none">🏫</div>
        <div className="relative z-10 min-w-0">
          <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/25 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md max-w-full truncate">
            ✨ Chào mừng trở lại, {currentUser.fullName}!
          </span>
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-black mt-1.5 sm:mt-2 mb-0.5 sm:mb-1 tracking-tight">
            Trung tâm quản lý ITEN
          </h2>
          <p className="text-xs sm:text-sm font-medium text-white/95 max-w-2xl line-clamp-2 sm:line-clamp-none">
            {currentUser.role === 'student'
              ? 'Theo dõi lịch học, thông báo từ giáo viên và lịch trực vệ sinh lớp học.'
              : currentUser.role === 'teacher'
              ? 'Quản lý hồ sơ học sinh, phân công lớp học, gửi thông báo và theo dõi tiến độ thi đua.'
              : 'Quản trị toàn bộ hệ thống giáo viên, học sinh và thiết lập nhà trường.'}
          </p>
        </div>
      </div>

      {/* Quick Navigation Tabs for Dashboard */}
      <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-amber-100 shadow-xs w-full min-w-0">
        <button
          onClick={() => { soundFx.playClick(); setActiveSubView('overview'); }}
          className={`w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
            activeSubView === 'overview'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <span className="shrink-0">📊</span> <span className="truncate">Tổng quan</span>
        </button>
        <button
          onClick={() => { soundFx.playClick(); setActiveSubView('timetable'); }}
          className={`w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
            activeSubView === 'timetable'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <span className="shrink-0">🗓️</span> <span className="truncate">Thời khóa biểu</span>
        </button>
        <button
          onClick={() => { soundFx.playClick(); setActiveSubView('cleaning'); }}
          className={`w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
            activeSubView === 'cleaning'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <span className="shrink-0">🧹</span> <span className="truncate">Lịch trực vệ sinh</span>
        </button>
        <button
          onClick={() => { soundFx.playClick(); setActiveSubView('class_fund'); }}
          className={`w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
            activeSubView === 'class_fund'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <span className="shrink-0">💰</span> <span className="truncate">Quỹ lớp</span>
        </button>
        <button
          onClick={() => { soundFx.playClick(); setActiveSubView('class_logbook'); }}
          className={`w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
            activeSubView === 'class_logbook'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-amber-50'
          }`}
        >
          <span className="shrink-0">📖</span> <span className="truncate">Sổ đầu bài</span>
        </button>
        <button
          onClick={() => { soundFx.playClick(); setActiveSubView('point_usage'); }}
          className={`w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
            activeSubView === 'point_usage'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
              : 'text-amber-800 bg-amber-50/80 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <span className="shrink-0">🎯</span> <span className="truncate">Sử dụng điểm</span>
        </button>
        {(currentUser.role === 'teacher' || currentUser.role === 'admin' || isClassOfficer) && (
          <button
            onClick={() => { soundFx.playClick(); setActiveSubView('notifications'); }}
            className={`col-span-2 lg:col-auto w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
              activeSubView === 'notifications'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <span className="shrink-0">📢</span> <span className="truncate">Đăng thông báo</span>
          </button>
        )}
        {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
          <button
            onClick={() => { soundFx.playClick(); setActiveSubView('classes_and_students'); }}
            className={`col-span-2 lg:col-auto w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
              activeSubView === 'classes_and_students' || activeSubView === 'students' || activeSubView === 'classes'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <span className="shrink-0">🏫</span> <span className="truncate">Quản lý lớp & Hồ sơ học sinh</span>
          </button>
        )}
        {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
          <button
            onClick={() => { soundFx.playClick(); setActiveSubView('teacher_schedule'); }}
            className={`w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
              activeSubView === 'teacher_schedule'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <span className="shrink-0">💼</span> <span className="truncate">Lịch làm việc</span>
          </button>
        )}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => { soundFx.playClick(); setActiveSubView('teacher_management'); }}
            className={`w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center sm:justify-start gap-1.5 truncate ${
              activeSubView === 'teacher_management'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <span className="shrink-0">👨‍🏫</span> <span className="truncate">Quản lý GV ({teachers.length})</span>
          </button>
        )}
        {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
          <button
            onClick={() => {
              soundFx.playClick();
              setProfileForm({
                fullName: currentUser.fullName || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                address: currentUser.address || '',
                subject: currentUser.subject || 'Ngữ Văn',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              });
              setShowProfileModal(true);
            }}
            className="col-span-2 lg:col-auto lg:ml-auto w-full min-w-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center justify-center sm:justify-start gap-1.5 truncate"
          >
            <span className="shrink-0">⚙️</span> <span className="truncate">Cài đặt cá nhân</span>
          </button>
        )}
      </div>

      {/* OVERVIEW SUB-VIEW */}
      {activeSubView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0 max-w-full">
          {/* Left / Main Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            {/* Announcements Section */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-amber-100 shadow-sm w-full min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>🔔</span> Thông báo mới nhất
                </h3>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shrink-0">
                  {notifications.length} thông báo
                </span>
              </div>

              <div className="space-y-3">
                {notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/40 border border-amber-100 hover:bg-amber-50 transition-colors min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate">{n.title}</h4>
                      <span className="text-[11px] text-slate-400 font-medium shrink-0">{n.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 line-clamp-3">{n.content}</p>
                    <div className="text-[11px] font-bold text-amber-700 truncate">
                      Gửi bởi: {n.senderName} ({n.senderRole})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Student & Class Officer Request Section */}
            {currentUser.role === 'student' && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-amber-100 shadow-sm w-full min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <span>✉️</span> Yêu cầu cá nhân & Hỗ trợ tài khoản
                </h3>
                <form onSubmit={handleSendRequest} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loại yêu cầu</label>
                      <select
                        value={reqType}
                        onChange={e => setReqType(e.target.value as any)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                      >
                        <option value="reset_password">Yêu cầu cấp lại mật khẩu</option>
                        <option value="update_profile">Yêu cầu thay đổi hồ sơ cá nhân</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Người nhận</label>
                      <input
                        type="text"
                        disabled
                        value="Giáo viên chủ nhiệm (Cô Lê Thị Mai)"
                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nội dung chi tiết</label>
                    <textarea
                      rows={3}
                      value={reqDetails}
                      onChange={e => setReqDetails(e.target.value)}
                      placeholder="Nhập nội dung yêu cầu gửi đến giáo viên..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
                  >
                    Gửi yêu cầu
                  </button>
                </form>
              </div>
            )}

            {/* Teacher & Admin Class & Student Management Quick Card */}
            {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
              <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-lg space-y-4 w-full min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl sm:text-3xl shrink-0">🏫</span>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold">Quản lý Lớp học & Hồ sơ Học sinh</h3>
                      <p className="text-xs text-amber-100">Tạo lớp học mới, nhập danh sách học sinh, phân công tổ & theo dõi sĩ số</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setAddClassForm({
                          name: '',
                          academicYear: selectedAcademicYearFilter !== 'all' ? selectedAcademicYearFilter : '2025 - 2026',
                          school: 'THCS Chu Văn An',
                          homeroomTeacher: currentUser.fullName || 'Cô Lê Thị Mai',
                          studentCount: 38,
                          maleCount: 20,
                          femaleCount: 18,
                          unionCount: 25,
                          notes: 'Lớp mới phụ trách'
                        });
                        setShowAddClassModal(true);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-white text-amber-900 font-bold rounded-xl text-xs hover:bg-amber-50 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 shrink-0" /> Tạo lớp mới
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setEditingStudent(null);
                        setStudentImportMode('manual');
                        setAddStudentForm({
                          fullName: '',
                          className: selectedClassFilter !== 'all' ? selectedClassFilter : (classesList[0]?.name || 'Lớp 8A1'),
                          academicYear: selectedAcademicYearFilter !== 'all' ? selectedAcademicYearFilter : '2025 - 2026',
                          gender: 'Nam',
                          dob: '2012-05-15',
                          phone: '',
                          email: '',
                          address: 'Hà Nội',
                          position: 'thành viên',
                          team: 'Tổ 1',
                          isUnionMember: true
                        });
                        setShowAddStudentModal(true);
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-amber-900/40 text-white font-bold rounded-xl text-xs hover:bg-amber-900/60 shadow-md cursor-pointer flex items-center justify-center gap-1.5 border border-white/30"
                    >
                      <UserPlus className="w-4 h-4 shrink-0" /> Thêm học sinh
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setActiveSubView('classes_and_students');
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-black/20 text-white font-bold rounded-xl text-xs hover:bg-black/30 transition-all cursor-pointer text-center"
                    >
                      📋 Quản lý chi tiết ({classesList.length} Lớp • {students.length} HS)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Personal Work Schedule Quick Card */}
            {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
              <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-lg space-y-4 w-full min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl sm:text-3xl shrink-0">💼</span>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold">Lịch làm việc cá nhân của Giáo viên</h3>
                      <p className="text-xs text-teal-100">Nhập và quản lý lịch lên lớp, họp hội đồng, chấm bài, công tác chủ nhiệm</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { soundFx.playClick(); setActiveSubView('teacher_schedule'); }}
                    className="w-full sm:w-auto px-4 py-2 bg-white text-teal-700 font-bold rounded-xl text-xs hover:bg-teal-50 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Briefcase className="w-4 h-4 shrink-0" /> Quản lý lịch làm việc ({teacherSchedules?.filter(s => s.teacherId === currentUser.id || currentUser.role === 'admin').length || 0})
                  </button>
                </div>
              </div>
            )}

            {/* Admin / Teacher Request Management */}
            {(currentUser.role === 'teacher' || currentUser.role === 'admin') && (
              <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-amber-100 shadow-sm w-full min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <span>📥</span> Yêu cầu cấp lại mật khẩu & Hồ sơ ({(accountRequests ?? []).length})
                </h3>
                <div className="space-y-3">
                  {(accountRequests ?? []).length === 0 ?  (
                    <p className="text-xs text-slate-400 text-center py-4">Không có yêu cầu nào đang chờ xử lý.</p>
                  ) : (
                    accountRequests.map(req => (
                      <div key={req.id} className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">{req.userName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                              {req.type === 'reset_password' ? 'Cấp lại mật khẩu' : 'Sửa hồ sơ'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">{req.details}</p>
                          <span className="text-[11px] text-slate-400">{req.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { soundFx.playSuccess(); onResolveRequest(req.id, 'Đã duyệt'); }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 cursor-pointer text-center"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => { soundFx.playError(); onResolveRequest(req.id, 'Từ chối'); }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-500 text-white font-bold rounded-xl text-xs hover:bg-rose-600 cursor-pointer text-center"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Quick Stats & Timetable Preview */}
          <div className="space-y-4 sm:space-y-6 min-w-0">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-amber-100 shadow-sm w-full min-w-0">
              <h3 className="text-sm sm:text-md font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span>⭐</span> Thông tin cá nhân
              </h3>
              <div className="space-y-2.5 sm:space-y-3 text-xs">
                <div className="flex justify-between py-1.5 sm:py-2 border-b border-slate-100 gap-2">
                  <span className="text-slate-500 shrink-0">Họ và tên:</span>
                  <span className="font-bold text-slate-800 truncate text-right">{currentUser.fullName}</span>
                </div>
                <div className="flex justify-between py-1.5 sm:py-2 border-b border-slate-100 gap-2">
                  <span className="text-slate-500 shrink-0">Vai trò:</span>
                  <span className="font-bold text-amber-600 shrink-0">{currentUser.role.toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-1.5 sm:py-2 border-b border-slate-100 gap-2">
                  <span className="text-slate-500 shrink-0">Lớp / Đơn vị:</span>
                  <span className="font-bold text-slate-800 truncate text-right">{currentUser.className || currentUser.school}</span>
                </div>
                {currentUser.position && (
                  <div className="flex justify-between py-1.5 sm:py-2 border-b border-slate-100 gap-2">
                    <span className="text-slate-500 shrink-0">Chức vụ:</span>
                    <span className="font-bold text-purple-600 uppercase truncate text-right">{currentUser.position}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 sm:py-2 gap-2">
                  <span className="text-slate-500 shrink-0">Email:</span>
                  <span className="font-medium text-slate-700 truncate text-right">{currentUser.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Timetable Snippet */}
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-lg w-full min-w-0">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2 truncate">
                  <span>🗓️</span> Thời khóa biểu Tuần {timetable.weekNumber}
                </h3>
                <button
                  onClick={() => { soundFx.playClick(); setActiveSubView('timetable'); }}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0"
                >
                  Xem chi tiết
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {timetable.schedule.slice(0, 3).map((daySch, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between gap-2">
                    <span className="font-bold text-yellow-300 shrink-0">{daySch.day}</span>
                    <span className="text-white/90 truncate text-right">
                      {daySch.periods.length} tiết ({daySch.periods[0]?.subject || 'Học'})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Class Fund Widget */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-lg w-full min-w-0">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-base shrink-0">
                    💰
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm leading-tight truncate">Quỹ lớp {currentUser.className || '8A1'}</h3>
                    <span className="text-[10px] text-amber-100 font-semibold block truncate">Thu chi minh bạch</span>
                  </div>
                </div>
                <button
                  onClick={() => { soundFx.playClick(); setActiveSubView('class_fund'); }}
                  className="text-xs bg-white text-amber-900 hover:bg-amber-50 px-3 py-1 rounded-full font-extrabold shadow-sm transition-all cursor-pointer shrink-0"
                >
                  Sổ quỹ
                </button>
              </div>

              {/* Quick stats inside card */}
              <div className="space-y-2 text-xs">
                <div className="bg-black/20 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-amber-100 font-medium">Số dư quỹ hiện tại:</span>
                  <span className="font-black text-amber-200 text-sm">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      classFunds.reduce((sum, f) => {
                        const contrs = Object.values(f.contributions || {}) as ClassFundContribution[];
                        const paidInFund = contrs.reduce((s, c) => s + (c.isPaid ? (c.paidAmount || f.amountPerStudent) : 0), 0);
                        return sum + paidInFund;
                      }, 0) - classExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
                    )}
                  </span>
                </div>

                {currentUser.role === 'student' ? (
                  <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between">
                    <span className="text-amber-100">Trạng thái của bạn:</span>
                    {classFunds[0]?.contributions?.[currentUser.id]?.isPaid ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 font-bold text-[10px]">
                        ✓ Đã đóng đợt gần nhất
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/80 text-white font-bold text-[10px]">
                        Chưa đóng ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(classFunds[0]?.amountPerStudent || 10000)})
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between text-[11px]">
                    <span className="text-amber-100">Số đợt thu quỹ:</span>
                    <span className="font-bold text-white">{classFunds.length} đợt • {classExpenses.length} khoản chi</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Class Logbook Widget */}
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-base">
                    📖
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">Sổ đầu bài Lớp {currentUser.className || '8A1'}</h3>
                    <span className="text-[10px] text-teal-100 font-semibold">Theo dõi tiết dạy & nề nếp</span>
                  </div>
                </div>
                <button
                  onClick={() => { soundFx.playClick(); setActiveSubView('class_logbook'); }}
                  className="text-xs bg-white text-teal-900 hover:bg-teal-50 px-3 py-1 rounded-full font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  Mở sổ
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-black/20 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-teal-100 font-medium">Tiết học tuần gần nhất:</span>
                  <span className="font-black text-teal-200 text-sm">
                    {logbooks[0]?.entries?.length || 0} tiết ghi nhận
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between text-[11px]">
                  <span className="text-teal-100">Điểm TB tuần:</span>
                  <span className="font-bold text-white">
                    {logbooks[0]?.entries?.length ? (
                      (logbooks[0].entries.reduce((s, e) => s + (e.score || 0), 0) / logbooks[0].entries.length).toFixed(1) + ' / 10'
                    ) : '10 / 10'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 font-bold text-[10px]">
                    {logbooks[0]?.homeroomTeacherApproval?.approved ? '✓ Đã ký duyệt' : 'Chờ GVCN duyệt'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Point Usage Widget (Tách độc lập 2 loại điểm: Học tập & Rèn luyện) */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-base">
                    🎯
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">Sử dụng điểm ITEN</h3>
                    <span className="text-[10px] text-amber-100 font-semibold">2 quỹ điểm độc lập</span>
                  </div>
                </div>
                <button
                  onClick={() => { soundFx.playClick(); setActiveSubView('point_usage'); }}
                  className="text-xs bg-white text-orange-950 hover:bg-amber-50 px-3 py-1 rounded-full font-extrabold shadow-sm transition-all cursor-pointer"
                >
                  Quản lý điểm
                </button>
              </div>

              {currentUser.role === 'student' ? (
                (() => {
                  const myLearnings = learningRecords.filter(
                    (r) => (r.studentId === currentUser.id || r.studentName === currentUser.fullName) && r.points > 0
                  );
                  const totalAcad = myLearnings.reduce((s, r) => s + r.points, 0);
                  const usedAcad = pointUsageTransactions
                    .filter(
                      (tx) =>
                        (tx.studentId === currentUser.id || tx.studentName === currentUser.fullName) &&
                        tx.pointType === 'academic' &&
                        tx.status === 'active'
                    )
                    .reduce((s, tx) => s + tx.amount, 0);
                  const remAcad = Math.max(0, totalAcad - usedAcad);

                  const myDiscipline = disciplineRecords.filter(
                    (r) => (r.studentId === currentUser.id || r.studentName === currentUser.fullName) && r.points > 0
                  );
                  const totalTrain = 100 + myDiscipline.reduce((s, r) => s + r.points, 0);
                  const usedTrain = pointUsageTransactions
                    .filter(
                      (tx) =>
                        (tx.studentId === currentUser.id || tx.studentName === currentUser.fullName) &&
                        tx.pointType === 'training' &&
                        tx.status === 'active'
                    )
                    .reduce((s, tx) => s + tx.amount, 0);
                  const remTrain = Math.max(0, totalTrain - usedTrain);

                  return (
                    <div className="space-y-2 text-xs">
                      <div className="bg-black/20 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between">
                        <span className="text-amber-100 font-bold flex items-center gap-1">⭐ Điểm Học Tập:</span>
                        <span className="font-black text-amber-200">
                          +{remAcad}đ <span className="text-[10px] text-white/80 font-normal">(Đã dùng -{usedAcad}đ)</span>
                        </span>
                      </div>
                      <div className="bg-black/20 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between">
                        <span className="text-emerald-100 font-bold flex items-center gap-1">🌱 Điểm Rèn Luyện:</span>
                        <span className="font-black text-emerald-200">
                          +{remTrain}đ <span className="text-[10px] text-white/80 font-normal">(Đã dùng -{usedTrain}đ)</span>
                        </span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const activeTxs = pointUsageTransactions.filter((t) => t.status === 'active');
                  const totalAcadUsed = activeTxs
                    .filter((t) => t.pointType === 'academic')
                    .reduce((s, t) => s + t.amount, 0);
                  const totalTrainUsed = activeTxs
                    .filter((t) => t.pointType === 'training')
                    .reduce((s, t) => s + t.amount, 0);

                  return (
                    <div className="space-y-2 text-xs">
                      <div className="bg-black/20 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between">
                        <span className="text-amber-100 font-medium">Học tập đã dùng:</span>
                        <span className="font-black text-amber-200">-{totalAcadUsed} điểm</span>
                      </div>
                      <div className="bg-black/20 backdrop-blur-md p-2.5 rounded-2xl flex items-center justify-between">
                        <span className="text-emerald-100 font-medium">Rèn luyện đã dùng:</span>
                        <span className="font-black text-emerald-200">-{totalTrainUsed} điểm</span>
                      </div>
                      <div className="text-[10px] text-amber-100 font-medium text-center pt-1">
                        Tổng {activeTxs.length} giao dịch đã duyệt
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* TIMETABLE SUB-VIEW */}
      {activeSubView === 'timetable' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>🗓️</span> Thời khóa biểu lớp {currentUser.className || '8A1'} - {selectedSemester} - Tuần {activeTimetable.weekNumber} (Thứ 2 - Thứ 7, 5 tiết/ngày)
              </h3>
              <p className="text-xs text-slate-500">Áp dụng từ ngày: {activeTimetable.startDate} (Quyền nhập: Giáo viên, Ban cán sự, Quản trị viên)</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Học kỳ:</span>
                <select
                  value={selectedSemester}
                  onChange={e => {
                    const sem = e.target.value as any;
                    setSelectedSemester(sem);
                    if (sem === 'Học kỳ 2' && selectedTimetableWeek > 17) {
                      setSelectedTimetableWeek(17);
                    }
                  }}
                  className="bg-transparent text-xs font-bold text-amber-700 focus:outline-none cursor-pointer"
                >
                  <option value="Học kỳ 1">Học kỳ 1 (18 tuần)</option>
                  <option value="Học kỳ 2">Học kỳ 2 (17 tuần)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600">Chọn tuần:</span>
                <select
                  value={selectedTimetableWeek}
                  onChange={e => setSelectedTimetableWeek(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-amber-700 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: selectedSemester === 'Học kỳ 2' ? 17 : 18 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Tuần {w}</option>
                  ))}
                </select>
              </div>

              {canManageTimetable && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    // Ensure full 6 days and 5 periods
                    const copied = JSON.parse(JSON.stringify(activeTimetable));
                    copied.semester = selectedSemester;
                    copied.weekNumber = selectedTimetableWeek;
                    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    copied.schedule = days.map(d => {
                      const found = copied.schedule?.find((s: any) => s.day === d);
                      const periods = [1, 2, 3, 4, 5].map(pNum => {
                        const pFound = found?.periods?.find((p: any) => p.period === pNum);
                        return pFound || { period: pNum, subject: '', teacherName: '' };
                      });
                      return { day: d, periods };
                    });
                    setEditTimetable(copied);
                    setIsEditingTimetable(true);
                  }}
                  className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Edit3 className="w-4 h-4" /> Nhập / Sửa TKB {selectedSemester} - Tuần {selectedTimetableWeek}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTimetable.schedule.map((daySch, idx) => (
              <div key={idx} className="bg-amber-50/40 rounded-2xl p-4 border border-amber-100">
                <h4 className="font-bold text-amber-800 text-sm mb-3 pb-2 border-b border-amber-200/60 flex items-center justify-between">
                  <span>📅 {daySch.day}</span>
                  <span className="text-xs text-slate-500 font-normal">{daySch.periods.length} tiết</span>
                </h4>
                <div className="space-y-2">
                  {daySch.periods.map(p => (
                    <div key={p.period} className="bg-white p-2.5 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Tiết {p.period}: {p.subject}</span>
                      <span className="text-slate-400 font-medium">{p.teacherName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Timetable Edit Modal */}
          {isEditingTimetable && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span>✏️</span> Nhập & Cập nhật thời khóa biểu
                  </h3>
                  <button
                    onClick={() => setIsEditingTimetable(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Học kỳ</label>
                    <select
                      value={editTimetable.semester || 'Học kỳ 1'}
                      onChange={e => {
                        const sem = e.target.value as any;
                        const maxW = sem === 'Học kỳ 2' ? 17 : 18;
                        setEditTimetable({
                          ...editTimetable,
                          semester: sem,
                          weekNumber: editTimetable.weekNumber > maxW ? maxW : editTimetable.weekNumber
                        });
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                    >
                      <option value="Học kỳ 1">Học kỳ 1 (18 tuần)</option>
                      <option value="Học kỳ 2">Học kỳ 2 (17 tuần)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Số tuần (1 - {editTimetable.semester === 'Học kỳ 2' ? 17 : 18})
                    </label>
                    <select
                      value={editTimetable.weekNumber}
                      onChange={e => setEditTimetable({ ...editTimetable, weekNumber: Number(e.target.value) })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                    >
                      {Array.from({ length: editTimetable.semester === 'Học kỳ 2' ? 17 : 18 }, (_, i) => i + 1).map(w => (
                        <option key={w} value={w}>Tuần {w}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày áp dụng</label>
                    <input
                      type="text"
                      value={editTimetable.startDate}
                      onChange={e => setEditTimetable({ ...editTimetable, startDate: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {editTimetable.schedule.map((daySch, dIdx) => (
                    <div key={dIdx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="font-bold text-amber-800 text-sm">{daySch.day}</h4>
                      <div className="space-y-2">
                        {daySch.periods.map((p, pIdx) => (
                          <div key={p.period} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-white p-2 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-600">Tiết {p.period}</span>
                            <input
                              type="text"
                              value={p.subject}
                              placeholder="Tên môn học"
                              onChange={e => {
                                const updated = { ...editTimetable };
                                updated.schedule[dIdx].periods[pIdx].subject = e.target.value;
                                setEditTimetable(updated);
                              }}
                              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                            />
                            <input
                              type="text"
                              value={p.teacherName}
                              placeholder="Tên giáo viên"
                              onChange={e => {
                                const updated = { ...editTimetable };
                                updated.schedule[dIdx].periods[pIdx].teacherName = e.target.value;
                                setEditTimetable(updated);
                              }}
                              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsEditingTimetable(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playSuccess();
                      onUpdateTimetable(editTimetable);
                      setIsEditingTimetable(false);
                      alert('Cập nhật thời khóa biểu thành công!');
                    }}
                    className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 shadow-md cursor-pointer"
                  >
                    Lưu thời khóa biểu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLEANING SCHEDULE SUB-VIEW */}
      {activeSubView === 'cleaning' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>🧹</span> Lịch vệ sinh tuần {cleaning.weekNumber}
              </h3>
              <p className="text-xs text-slate-500">Phân công trực nhật lớp học và sân trường (Quyền nhập: Giáo viên, Ban cán sự, Quản trị viên)</p>
            </div>
            <div className="flex items-center gap-3">
              {canManageCleaning && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    const copied = JSON.parse(JSON.stringify(cleaning));
                    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    const fullTasks = days.map((d, dIdx) => {
                      const found = copied.tasks?.find((t: any) => t.day === d);
                      if (found) return found;
                      const teamNum = (dIdx % 4) + 1;
                      return {
                        day: d,
                        groupName: `Tổ ${teamNum}`,
                        studentNames: students.filter(s => s.team === `Tổ ${teamNum}`).slice(0, 3).map(s => s.fullName),
                        status: 'Chưa làm'
                      };
                    });
                    copied.tasks = fullTasks;
                    setEditCleaning(copied);
                    setIsEditingCleaning(true);
                  }}
                  className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Edit3 className="w-4 h-4" /> Nhập / Sửa lịch trực vệ sinh
                </button>
              )}
              {(isClassOfficer || currentUser.role === 'teacher' || currentUser.role === 'admin') && (
                <button
                  onClick={() => {
                    soundFx.playSuccess();
                    const updated = { ...cleaning };
                    updated.tasks[0].status = 'Đã hoàn thành';
                    onUpdateCleaning(updated);
                    alert('Đã cập nhật trạng thái trực vệ sinh!');
                  }}
                  className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận hoàn thành
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cleaning.tasks.map((task, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                <div className="font-black text-slate-800 text-sm mb-1">{task.day}</div>
                <div className="text-xs font-bold text-amber-600 mb-2">{task.groupName}</div>
                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  {task.studentNames.map((name, i) => (
                    <div key={i} className="font-semibold">{name}</div>
                  ))}
                </div>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  task.status === 'Đã hoàn thành' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>

          {/* Edit Cleaning Modal */}
          {isEditingCleaning && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span>🧹</span> Nhập / Chỉnh sửa lịch trực vệ sinh lớp học
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tuần số (1-18)</label>
                    <input
                      type="number"
                      value={editCleaning.weekNumber}
                      onChange={e => setEditCleaning({ ...editCleaning, weekNumber: Number(e.target.value) })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày áp dụng</label>
                    <input
                      type="text"
                      value={editCleaning.startDate}
                      onChange={e => setEditCleaning({ ...editCleaning, startDate: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {editCleaning.tasks.map((task, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">{task.day}</span>
                        <select
                          value={task.status}
                          onChange={e => {
                            const updated = { ...editCleaning };
                            updated.tasks[idx].status = e.target.value as any;
                            setEditCleaning(updated);
                          }}
                          className="p-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          <option value="Chưa làm">Chưa làm</option>
                          <option value="Đang kiểm tra">Đang kiểm tra</option>
                          <option value="Đã hoàn thành">Đã hoàn thành</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên tổ trực</label>
                          <input
                            type="text"
                            value={task.groupName}
                            onChange={e => {
                              const updated = { ...editCleaning };
                              updated.tasks[idx].groupName = e.target.value;
                              setEditCleaning(updated);
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Học sinh trực (cách nhau bởi dấu phẩy)</label>
                          <input
                            type="text"
                            value={task.studentNames.join(', ')}
                            onChange={e => {
                              const updated = { ...editCleaning };
                              updated.tasks[idx].studentNames = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              setEditCleaning(updated);
                            }}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsEditingCleaning(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playSuccess();
                      onUpdateCleaning(editCleaning);
                      setIsEditingCleaning(false);
                      alert('Cập nhật lịch trực vệ sinh thành công!');
                    }}
                    className="px-5 py-2.5 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 shadow-md cursor-pointer"
                  >
                    Lưu lịch vệ sinh
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATIONS SUB-VIEW (FOR TEACHERS / ADMIN / OFFICERS) */}
      {activeSubView === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>📢</span> Đăng & Phát thông báo
              </h3>
              <p className="text-xs text-slate-500">
                Tùy chọn gửi thông báo tới lớp cụ thể, học sinh cụ thể, theo tổ thi đua hoặc cho giáo viên. Nhập tên để tìm nhanh.
              </p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Đối tượng nhận thông báo *</label>
              <select
                value={notifTargetType}
                onChange={e => {
                  soundFx.playClick();
                  setNotifTargetType(e.target.value as any);
                  setTargetSearchQuery('');
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-amber-900 focus:outline-none focus:border-amber-400"
              >
                <option value="all">🌐 Tất cả các lớp & học sinh</option>
                <option value="class">🏫 Lớp học cụ thể</option>
                <option value="student">👤 Học sinh cụ thể của từng lớp</option>
                <option value="team">👥 Gửi theo Tổ thi đua (Tổ 1 - 4)</option>
                {currentUser.role === 'admin' && <option value="teacher">👨‍🏫 Gửi cho Giáo viên</option>}
              </select>
            </div>

            {/* Target Class with Fast Search */}
            {notifTargetType === 'class' && (
              <div className="space-y-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 uppercase">Tìm & Chọn Lớp học *</label>
                <input
                  type="text"
                  placeholder="🔍 Nhập tên lớp để tìm nhanh (VD: Lớp 8A1, 9A2)..."
                  value={targetSearchQuery}
                  onChange={e => setTargetSearchQuery(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                />
                <select
                  value={notifTargetClass}
                  onChange={e => setNotifTargetClass(e.target.value)}
                  className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="all">-- Chọn lớp nhận thông báo --</option>
                  {classesList
                    .filter(c => !targetSearchQuery || c.name.toLowerCase().includes(targetSearchQuery.toLowerCase()))
                    .map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.academicYear}) - GVCN: {c.homeroomTeacher}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Target Student with Fast Search */}
            {notifTargetType === 'student' && (
              <div className="space-y-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 uppercase">Tìm & Chọn Học sinh cụ thể *</label>
                <input
                  type="text"
                  placeholder="🔍 Nhập tên học sinh hoặc lớp để tìm nhanh..."
                  value={targetSearchQuery}
                  onChange={e => setTargetSearchQuery(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                />
                <select
                  value={notifTargetStudentId}
                  onChange={e => setNotifTargetStudentId(e.target.value)}
                  className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">-- Chọn học sinh nhận thông báo --</option>
                  {students
                    .filter(st => {
                      if (!targetSearchQuery) return true;
                      const q = targetSearchQuery.toLowerCase();
                      return st.fullName.toLowerCase().includes(q) || (st.className && st.className.toLowerCase().includes(q));
                    })
                    .map(st => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.className || 'Lớp 8A1'} - {st.team})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {notifTargetType === 'team' && (
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 uppercase mb-1">Chọn Tổ thi đua</label>
                <select
                  value={notifTargetTeam}
                  onChange={e => setNotifTargetTeam(e.target.value)}
                  className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Tổ 1">Tổ 1</option>
                  <option value="Tổ 2">Tổ 2</option>
                  <option value="Tổ 3">Tổ 3</option>
                  <option value="Tổ 4">Tổ 4</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề thông báo *</label>
              <input
                type="text"
                value={notifTitle}
                onChange={e => setNotifTitle(e.target.value)}
                placeholder="Ví dụ: Kế hoạch kiểm tra giữa kì môn Ngữ Văn..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nội dung chi tiết *</label>
              <textarea
                rows={4}
                value={notifContent}
                onChange={e => setNotifContent(e.target.value)}
                placeholder="Nhập chi tiết thông báo..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer flex items-center gap-2"
            >
              <BellRing className="w-4 h-4" /> Gửi thông báo ngay
            </button>
          </form>
        </div>
      )}

      {/* MERGED CLASSES & STUDENTS PROFILE SUB-VIEW */}
      {(activeSubView === 'classes_and_students' || activeSubView === 'students' || activeSubView === 'classes') && (currentUser.role === 'teacher' || currentUser.role === 'admin') && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
          {/* Header Banner */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-amber-100">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>🏫</span> Quản lý lớp & Hồ sơ học sinh
              </h3>
              <p className="text-xs text-slate-500">
                Tập trung quản lý danh sách lớp học phụ trách ({classesList.length} lớp) và theo dõi hồ sơ chi tiết học sinh ({students.length} học sinh)
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setAddClassForm({
                    name: '',
                    academicYear: selectedAcademicYearFilter !== 'all' ? selectedAcademicYearFilter : '2025 - 2026',
                    school: 'THCS Chu Văn An',
                    homeroomTeacher: currentUser.fullName || 'Cô Lê Thị Mai',
                    studentCount: 38,
                    maleCount: 20,
                    femaleCount: 18,
                    unionCount: 25,
                    notes: 'Lớp mới phụ trách'
                  });
                  setShowAddClassModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> Tạo lớp mới
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setEditingStudent(null);
                  setStudentImportMode('manual');
                  setAddStudentForm({
                    fullName: '',
                    className: selectedClassFilter !== 'all' ? selectedClassFilter : (classesList[0]?.name || 'Lớp 8A1'),
                    academicYear: selectedAcademicYearFilter !== 'all' ? selectedAcademicYearFilter : '2025 - 2026',
                    gender: 'Nam',
                    dob: '2012-05-15',
                    phone: '',
                    email: '',
                    address: 'Hà Nội',
                    position: 'thành viên',
                    team: 'Tổ 1',
                    isUnionMember: true
                  });
                  setShowAddStudentModal(true);
                }}
                className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <UserPlus className="w-4 h-4" /> Thêm học sinh
              </button>
            </div>
          </div>

          {/* Action Success Toast Banner */}
          {actionSuccessMsg && (
            <div className="fixed top-4 right-4 z-[60] max-w-sm bg-emerald-50 text-emerald-800 border border-emerald-300 p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {actionSuccessMsg}
              </span>
              <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {actionErrorMsg && (
            <div className="fixed top-4 right-4 z-[60] max-w-sm bg-rose-50 text-rose-800 border border-rose-300 p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in" role="alert">
              <span className="flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600" />
                {actionErrorMsg}
              </span>
              <button onClick={() => setActionErrorMsg(null)} className="text-rose-700 hover:text-rose-900 cursor-pointer" aria-label="Đóng thông báo lỗi">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sub-tab Pill Selector */}
          <div className="flex items-center gap-2 bg-amber-50/60 p-1.5 rounded-2xl border border-amber-200/60 max-w-md">
            <button
              type="button"
              onClick={() => { soundFx.playClick(); setClassProfileTab('all'); }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                classProfileTab === 'all'
                  ? 'bg-white text-amber-900 shadow-xs border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Tất cả ({classesList.length} Lớp • {students.length} HS)
            </button>
            <button
              type="button"
              onClick={() => { soundFx.playClick(); setClassProfileTab('classes'); }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                classProfileTab === 'classes'
                  ? 'bg-white text-amber-900 shadow-xs border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏫 Quản lý Lớp ({classesList.length})
            </button>
            <button
              type="button"
              onClick={() => { soundFx.playClick(); setClassProfileTab('students'); }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                classProfileTab === 'students'
                  ? 'bg-white text-amber-900 shadow-xs border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👥 Hồ sơ Học sinh ({students.length})
            </button>
          </div>

          {/* REALTIME STATISTICS SUMMARY CARDS BY CLASS & ACADEMIC YEAR */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-4 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                📊 Thống kê Hồ sơ {selectedClassFilter === 'all' ? 'Toàn bộ các Lớp' : selectedClassFilter}
                {selectedAcademicYearFilter !== 'all' && <span className="text-amber-700 font-bold">({selectedAcademicYearFilter})</span>}
              </span>
              <div className="flex items-center gap-2">
                {(selectedClassFilter !== 'all' || selectedAcademicYearFilter !== 'all' || selectedTeamFilter !== 'all' || studentSearchQuery !== '') && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedClassFilter('all');
                      setSelectedAcademicYearFilter('all');
                      setSelectedTeamFilter('all');
                      setStudentSearchQuery('');
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                  >
                    Clear tất cả bộ lọc
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/90 p-3 rounded-xl border border-amber-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-500">Sĩ số học sinh</span>
                <span className="text-lg font-black text-amber-800">{classStatsSummary.total} học sinh</span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-amber-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-500">Tỷ lệ Nam / Nữ</span>
                <span className="text-sm font-black text-slate-800">
                  {classStatsSummary.male} Nam <span className="text-slate-300">|</span> {classStatsSummary.female} Nữ
                </span>
                <span className="block text-[10px] text-slate-500">
                  ({classStatsSummary.total > 0 ? Math.round((classStatsSummary.male / classStatsSummary.total) * 100) : 0}% Nam)
                </span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-amber-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-500">Đoàn viên / Đội viên</span>
                <span className="text-sm font-black text-purple-800">
                  {classStatsSummary.union} Đoàn viên
                </span>
                <span className="block text-[10px] text-slate-500">
                  ({classStatsSummary.total > 0 ? Math.round((classStatsSummary.union / classStatsSummary.total) * 100) : 0}% tỉ lệ)
                </span>
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-amber-100 shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-500">Phân bổ Tổ thi đua</span>
                <span className="text-[11px] font-extrabold text-slate-700">
                  T1: {classStatsSummary.t1} • T2: {classStatsSummary.t2} • T3: {classStatsSummary.t3} • T4: {classStatsSummary.t4}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 1: QUẢN LÝ LỚP HỌC */}
          {(classProfileTab === 'all' || classProfileTab === 'classes') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <span>🏫</span> Danh sách Lớp học phụ trách ({filteredClassesList.length} / {classesList.length} lớp)
                </h4>
                {selectedAcademicYearFilter !== 'all' && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                    Năm học: {selectedAcademicYearFilter}
                  </span>
                )}
              </div>
              {filteredClassesList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClassesList.map((cls) => {
		
console.log('[CLASS DEBUG]', {
  classId: cls.id,
  className: cls.name,
  studentsCount: students.length,
  students: students.map(st => ({
    id: st.id,
    classId: st.classId,
    className: st.className,
    fullName: st.fullName,
  })),
});


                    const isSelected = selectedClassFilter === cls.name;
                    return (
                      <div
                        key={cls.id}
                        className={`rounded-2xl p-5 border transition-all ${
                          isSelected
                            ? 'bg-amber-100/60 border-amber-400 shadow-md ring-2 ring-amber-300'
                            : 'bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-200/60 shadow-xs hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-black text-slate-800 text-lg">{cls.name}</h4>
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            {cls.academicYear}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mb-3">{cls.school} - GVCN: <strong>{cls.homeroomTeacher}</strong></p>


                       {(() => {
  const classStudents = students.filter(
    st =>
      st.classId === cls.id ||
      st.className === cls.name
  );

  const studentCount = classStudents.length;
  const maleCount = classStudents.filter(st => st.gender === 'Nam').length;
  const femaleCount = classStudents.filter(st => st.gender === 'Nữ').length;
  const unionCount = classStudents.filter(st => st.isUnionMember === true).length;

  return (
    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white/80 p-3 rounded-xl border border-amber-100 mb-3">
      <div>
        <span className="block text-slate-400 text-[10px]">Sĩ số</span>
        <span className="font-bold text-slate-800">{studentCount}</span>
      </div>

      <div>
        <span className="block text-slate-400 text-[10px]">Nam/Nữ</span>
        <span className="font-bold text-slate-800">
          {maleCount}/{femaleCount}
        </span>
      </div>

      <div>
        <span className="block text-slate-400 text-[10px]">Đoàn viên</span>
        <span className="font-bold text-amber-600">{unionCount}</span>
      </div>
    </div>
  );
})()}


                        <div className="flex items-center justify-between pt-2 border-t border-amber-100 gap-2">
                          <p className="text-[11px] text-slate-500 italic truncate flex-1">{cls.notes || 'Không có ghi chú'}</p>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                soundFx.playClick();
                                setEditingClass(cls);
                                setAddClassForm({
                                  name: cls.name,
                                  academicYear: cls.academicYear,
                                  school: cls.school,
                                  homeroomTeacher: cls.homeroomTeacher || currentUser.fullName,
                                  teacherRole: cls.teacherRole || 'Giáo viên chủ nhiệm',
                                  subject: cls.subject || 'Ngữ Văn',
                                  studentCount: cls.studentCount,
                                  maleCount: cls.maleCount,
                                  femaleCount: cls.femaleCount,
                                  unionCount: cls.unionCount,
                                  notes: cls.notes || ''
                                });
                                setShowAddClassModal(true);
                              }}
                              className="px-2.5 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                soundFx.playClick();
                                setSelectedClassFilter(cls.name);
                                setClassProfileTab('students');
                              }}
                              className="px-3 py-1 bg-amber-500 text-white font-bold rounded-lg text-[11px] hover:bg-amber-600 transition-all cursor-pointer shadow-2xs"
                            >
                              🔍 Xem hồ sơ
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 bg-amber-50/40 rounded-2xl border border-dashed border-amber-200 text-center text-slate-500 text-xs">
                  Không tìm thấy lớp học nào trong năm học <strong className="text-amber-900">{selectedAcademicYearFilter}</strong>.
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: HỒ SƠ HỌC SINH */}
          {(classProfileTab === 'all' || classProfileTab === 'students') && (
            <div className={`space-y-4 ${classProfileTab === 'all' ? 'pt-6 border-t border-slate-100' : ''}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    <span>👥</span> Danh sách Hồ sơ Học sinh ({filteredStudentsList.length} / {students.length} học sinh)
                  </h4>
                  <p className="text-xs text-slate-500">Tra cứu, lọc theo năm học, theo lớp, tìm kiếm từ từ khóa và phân loại theo tổ</p>
                </div>
                {/* Search & Filters Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filter by Academic Year */}
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-amber-800">📅 Năm học:</span>
                    <select
                      value={selectedAcademicYearFilter}
                      onChange={e => {
                        soundFx.playClick();
                        setSelectedAcademicYearFilter(e.target.value);
                      }}
                      className="bg-transparent text-xs font-bold text-amber-900 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả năm học ({availableAcademicYears.length})</option>
                      {availableAcademicYears.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Class */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-slate-500">🏫 Lớp:</span>
                    <select
                      value={selectedClassFilter}
                      onChange={e => {
                        soundFx.playClick();
                        setSelectedClassFilter(e.target.value);
                      }}
                      className="bg-transparent text-xs font-bold text-amber-900 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả các lớp ({classesList.length})</option>
                      {classesList.map(c => (
                        <option key={c.id} value={c.name}>{c.name} ({c.academicYear})</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Team */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                    <span className="text-xs font-bold text-slate-500">👥 Tổ:</span>
                    <select
                      value={selectedTeamFilter}
                      onChange={e => {
                        soundFx.playClick();
                        setSelectedTeamFilter(e.target.value);
                      }}
                      className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tất cả các tổ</option>
                      <option value="Tổ 1">Tổ 1</option>
                      <option value="Tổ 2">Tổ 2</option>
                      <option value="Tổ 3">Tổ 3</option>
                      <option value="Tổ 4">Tổ 4</option>
                    </select>
                  </div>

                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder="🔍 Tìm tên, SĐT, Email..."
                    value={studentSearchQuery}
                    onChange={e => setStudentSearchQuery(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-400 w-44"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-amber-100 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-amber-50/80 text-amber-900 border-b border-amber-200">
                      <th className="p-3 text-center">STT</th>
                      <th className="p-3">Họ và Tên</th>
                      <th className="p-3 text-center">Giới tính</th>
                      <th className="p-3">Ngày sinh</th>
                      <th className="p-3">Địa chỉ</th>
                      <th className="p-3">Số điện thoại</th>
                      <th className="p-3">Chức vụ</th>
                      <th className="p-3">Tổ</th>
                      <th className="p-3 text-center">Đoàn viên</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredStudentsList.length > 0 ? (
                      filteredStudentsList.map((st, i) => (
                        <tr key={st.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-500">{i + 1}</td>
                          <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                            <img src={st.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} alt="" className="w-7 h-7 rounded-full object-cover border border-amber-200" />
                            <div>
                              <span className="block font-black text-slate-800">{st.fullName}</span>
                              <span className="text-[10px] text-amber-700 font-bold">{st.className || 'Lớp 8A1'}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center text-slate-600 font-semibold">{st.gender || 'Nam'}</td>
                          <td className="p-3 text-slate-600 font-medium">{st.dob || '2012-05-15'}</td>
                          <td className="p-3 text-slate-600 font-medium truncate max-w-[120px]">{st.address || 'Hà Nội'}</td>
                          <td className="p-3 text-slate-600 font-medium">{st.phone || '0912345678'}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                              {st.position || 'thành viên'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 font-semibold">{st.team || 'Tổ 1'}</td>
                          <td className="p-3 text-center font-black text-emerald-600 text-sm">{st.isUnionMember ? '✓' : 'x'}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  soundFx.playClick();
                                  setEditingStudent(st);
                                  setStudentImportMode('manual');
                                  setAddStudentForm({
                                    fullName: st.fullName,
                                    className: st.className || 'Lớp 8A1',
                                    academicYear: st.academicYear || '2025 - 2026',
                                    gender: st.gender || 'Nam',
                                    dob: st.dob || '2012-05-15',
                                    phone: st.phone || '',
                                    email: st.email || '',
                                    address: st.address || 'Hà Nội',
                                    password: st.password || '123456',
                                    position: ['thành viên', 'lớp trưởng', 'lớp phó học tập', 'lớp phó lao động', 'tổ trưởng'].includes(st.position || '') ? (st.position || 'thành viên') : 'khác',
                                    team: st.team || 'Tổ 1',
                                    isUnionMember: !!st.isUnionMember,
                                    notes: st.notes || ''
                                  });
                                  if (!['thành viên', 'lớp trưởng', 'lớp phó học tập', 'lớp phó lao động', 'tổ trưởng'].includes(st.position || '')) {
                                    setCustomPosition(st.position || '');
                                  } else {
                                    setCustomPosition('');
                                  }
                                  setShowAddStudentModal(true);
                                }}
                                className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors"
                                title="Chỉnh sửa hồ sơ học sinh"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteStudent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc chắn muốn xóa hồ sơ học sinh ${st.fullName}?`)) {
                                      soundFx.playSuccess();
                                      onDeleteStudent(st.id);
                                      showToast(`Đã xóa học sinh ${st.fullName}`);
                                    }
                                  }}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                                  title="Xóa học sinh"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">
                          <span className="text-2xl block mb-2">🔍</span>
                          Không tìm thấy học sinh nào phù hợp với bộ lọc ({selectedClassFilter !== 'all' ? selectedClassFilter : 'Tất cả lớp'})
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEACHER / ADMIN WORK SCHEDULE SUB-VIEW */}
      {activeSubView === 'teacher_schedule' && (currentUser.role === 'teacher' || currentUser.role === 'admin') && (
        <TeacherWeeklyScheduleView
          currentUser={currentUser}
          teachers={teachers}
          teacherWeeklyTimetables={teacherWeeklyTimetables}
          onUpdateTeacherWeeklyTimetables={onUpdateTeacherWeeklyTimetables}
          teacherSchedules={teacherSchedules}
          onAddTeacherSchedule={onAddTeacherSchedule}
          onUpdateTeacherSchedule={onUpdateTeacherSchedule}
          onDeleteTeacherSchedule={onDeleteTeacherSchedule}
        />
      )}

      {/* ADMIN TEACHER MANAGEMENT SUB-VIEW */}
      {activeSubView === 'teacher_management' && currentUser.role === 'admin' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>👨‍🏫</span> Quản lý & Cấp tài khoản Giáo viên ({teachers.length} Giáo viên)
              </h3>
              <p className="text-xs text-slate-500">
                Quản trị viên cấp tài khoản giáo viên thủ công, nhập hàng loạt hoặc từ link Google Sheet. Phân quyền chủ nhiệm/bộ môn.
              </p>
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                setEditingTeacher(null);
                setTeacherImportMode('manual');
                setTeacherForm({
                  fullName: '',
                  school: 'THCS Chu Văn An',
                  gender: 'Nam',
                  dob: '1988-06-20',
                  email: '',
                  phone: '',
                  address: 'Hà Nội',
                  password: '123456',
                  teacherRole: 'giáo viên chủ nhiệm',
                  subject: 'Toán học',
                  notes: ''
                });
                setShowTeacherModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" /> Tạo / Cấp tài khoản Giáo viên
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-amber-100 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-amber-50/80 text-amber-900 border-b border-amber-200">
                  <th className="p-3 text-center">STT</th>
                  <th className="p-3">Họ và Tên</th>
                  <th className="p-3">Môn dạy</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3">Số điện thoại</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Địa chỉ</th>
                  <th className="p-3">Ghi chú</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {teachers.length > 0 ? (
                  teachers.map((t, i) => (
                    <tr key={t.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-500">{i + 1}</td>
                      <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                        <img src={t.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'} alt="" className="w-7 h-7 rounded-full object-cover border border-amber-200" />
                        <div>
                          <span className="block font-black text-slate-800">{t.fullName}</span>
                          <span className="text-[10px] text-slate-400">{t.school || 'THCS Chu Văn An'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-200">
                          {t.subject || 'Ngữ Văn'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 capitalize font-medium">{t.teacherRole || 'Giáo viên bộ môn'}</td>
                      <td className="p-3 text-slate-600">{t.phone || '0987654321'}</td>
                      <td className="p-3 text-slate-600">{t.email}</td>
                      <td className="p-3 text-slate-600 truncate max-w-[120px]">{t.address || 'Hà Nội'}</td>
                      <td className="p-3 text-slate-500 italic max-w-[150px] truncate">{t.notes || '---'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setEditingTeacher(t);
                              setTeacherImportMode('manual');
                              setTeacherForm({
                                fullName: t.fullName,
                                school: t.school || 'THCS Chu Văn An',
                                gender: t.gender || 'Nam',
                                dob: t.dob || '1988-06-20',
                                email: t.email || '',
                                phone: t.phone || '',
                                address: t.address || 'Hà Nội',
                                password: t.password || '123456',
                                teacherRole: (t.teacherRole as any) || 'giáo viên chủ nhiệm',
                                subject: t.subject || 'Toán học',
                                notes: t.notes || ''
                              });
                              setShowTeacherModal(true);
                            }}
                            className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors"
                            title="Chỉnh sửa tài khoản giáo viên"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteTeacher && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa tài khoản giáo viên ${t.fullName}?`)) {
                                  soundFx.playSuccess();
                                  onDeleteTeacher(t.id);
                                  showToast(`Đã xóa tài khoản giáo viên ${t.fullName}`);
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors"
                              title="Xóa giáo viên"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Chưa có dữ liệu giáo viên.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLASS FUND SUB-VIEW */}
      {activeSubView === 'class_fund' && (
        <ClassFundManager
          currentUser={currentUser}
          students={students}
          classesList={classesList}
          funds={classFunds}
          expenses={classExpenses}
          onUpdateFunds={onUpdateClassFunds || (() => {})}
          onUpdateExpenses={onUpdateClassExpenses || (() => {})}
        />
      )}

      {/* CLASS LOGBOOK (SỔ ĐẦU BÀI) SUB-VIEW */}
      {activeSubView === 'class_logbook' && (
        <ClassLogbookManager
          currentUser={currentUser}
          students={students}
          classesList={classesList}
          timetables={timetables}
          logbooks={logbooks}
          onUpdateLogbooks={onUpdateLogbooks || (() => {})}
        />
      )}

      {/* POINT USAGE (SỬ DỤNG ĐIỂM) SUB-VIEW */}
      {activeSubView === 'point_usage' && (
        <PointUsageManager
          currentUser={currentUser}
          students={students}
          classesList={classesList}
          learningRecords={learningRecords}
          disciplineRecords={disciplineRecords}
          pointUsageTransactions={pointUsageTransactions}
          onAddPointUsageTransaction={onAddPointUsageTransaction}
          onCancelPointUsageTransaction={onCancelPointUsageTransaction}
        />
      )}

      {/* MODAL TẠO & CHỈNH SỬA LỚP HỌC */}
      {showAddClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-amber-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <span className="p-2 bg-amber-100 rounded-xl text-amber-800 text-sm">🏫</span>
                {editingClass ? `Chỉnh sửa Lớp ${editingClass.name}` : 'Tạo Lớp Học Mới'}
              </h3>
              <button
                onClick={() => { setShowAddClassModal(false); setEditingClass(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!addClassForm.name.trim()) {
                  alert('Vui lòng nhập tên lớp học!');
                  return;
                }
                soundFx.playSuccess();
                const classData = {
                  id: editingClass ? editingClass.id : ('c_' + Date.now()),
                  name: addClassForm.name.trim(),
                  school: addClassForm.school || 'THCS Chu Văn An',
                  academicYear: addClassForm.academicYear || '2025 - 2026',
                  homeroomTeacher: addClassForm.homeroomTeacher || currentUser.fullName,
                  teacherRole: addClassForm.teacherRole,
                  subject: addClassForm.subject,
                  studentCount: Number(addClassForm.studentCount) || 0,
                  maleCount: Number(addClassForm.maleCount) || 0,
                  femaleCount: Number(addClassForm.femaleCount) || 0,
                  unionCount: Number(addClassForm.unionCount) || 0,
                  notes: addClassForm.notes || ''
                };

                if (editingClass && onUpdateClass) {
                  onUpdateClass(classData);
                  showToast(`Đã cập nhật thông tin lớp ${classData.name}!`);
                } else {
                  onAddClass(classData);
                  showToast(`Tạo thành công lớp ${classData.name} cho năm học ${classData.academicYear}!`);
                }

                setShowAddClassModal(false);
                setEditingClass(null);
                setSelectedAcademicYearFilter(classData.academicYear);
                setSelectedClassFilter(classData.name);
                setActiveSubView('classes_and_students');
                setClassProfileTab('all');
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Lớp học *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lớp 8A3"
                    value={addClassForm.name}
                    onChange={e => setAddClassForm({ ...addClassForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Năm học *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 2025 - 2026"
                    value={addClassForm.academicYear}
                    onChange={e => setAddClassForm({ ...addClassForm, academicYear: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trường học</label>
                  <input
                    type="text"
                    value={addClassForm.school}
                    onChange={e => setAddClassForm({ ...addClassForm, school: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giáo viên phụ trách</label>
                  <select
  value={addClassForm.homeroomTeacher}
  onChange={e =>
    setAddClassForm({
      ...addClassForm,
      homeroomTeacher: e.target.value,
    })
  }
  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
>
  <option value="">-- Chọn giáo viên --</option>
  {teachers
    .filter(t => t.role === 'teacher')
    .map(t => (
      <option key={t.id} value={t.fullName}>
        {t.fullName}
      </option>
    ))}
</select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vai trò giáo viên</label>
                  <select
                    value={addClassForm.teacherRole}
                    onChange={e => setAddClassForm({ ...addClassForm, teacherRole: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Giáo viên chủ nhiệm">Giáo viên chủ nhiệm</option>
                    <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Môn giảng dạy</label>
                  <input
                    type="text"
                    value={addClassForm.subject}
                    onChange={e => setAddClassForm({ ...addClassForm, subject: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Sĩ số</label>
                  <input
                    type="number"
                    min={0}
                    value={addClassForm.studentCount}
                    onChange={e => setAddClassForm({ ...addClassForm, studentCount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Số Nam</label>
                  <input
                    type="number"
                    min={0}
                    value={addClassForm.maleCount}
                    onChange={e => setAddClassForm({ ...addClassForm, maleCount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Số Nữ</label>
                  <input
                    type="number"
                    min={0}
                    value={addClassForm.femaleCount}
                    onChange={e => setAddClassForm({ ...addClassForm, femaleCount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Đoàn viên</label>
                  <input
                    type="number"
                    min={0}
                    value={addClassForm.unionCount}
                    onChange={e => setAddClassForm({ ...addClassForm, unionCount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú riêng (chỉ giáo viên thấy)</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú cá nhân về lớp học..."
                  value={addClassForm.notes}
                  onChange={e => setAddClassForm({ ...addClassForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddClassModal(false); setEditingClass(null); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl text-xs hover:from-amber-600 hover:to-orange-600 shadow-md cursor-pointer"
                >
                  {editingClass ? 'Lưu cập nhật Lớp' : 'Tạo Lớp Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA / NHẬP HÀNG LOẠT HỒ SƠ HỌC SINH */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-amber-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <span className="p-2 bg-amber-100 rounded-xl text-amber-800 text-sm">👤</span>
                {editingStudent ? `Chỉnh sửa Hồ sơ Học sinh: ${editingStudent.fullName}` : 'Thêm Hồ Sơ Học Sinh'}
              </h3>
              <button
                onClick={() => { setShowAddStudentModal(false); setEditingStudent(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode selection tabs (only when adding new) */}
            {!editingStudent && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lớp nhận học sinh *</label>
                    <select
                      value={addStudentForm.className}
                      onChange={e => {
                        const selected = classesList.find(c => c.name === e.target.value);
                        setAddStudentForm({ ...addStudentForm, className: e.target.value, academicYear: selected?.academicYear || addStudentForm.academicYear });
                      }}
                      className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-900"
                    >
                      <option value="">-- Chọn lớp --</option>
                      {classesList.map(c => <option key={c.id} value={c.name}>{c.name} ({c.academicYear})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Năm học</label>
                    <input
                      type="text"
                      value={addStudentForm.academicYear}
                      onChange={e => setAddStudentForm({ ...addStudentForm, academicYear: e.target.value })}
                      className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-amber-50 p-1 rounded-xl border border-amber-200">
                  <button type="button" onClick={() => setStudentImportMode('manual')} className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${studentImportMode === 'manual' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'}`}>
                    📝 Nhập thủ công
                  </button>
                  <button type="button" onClick={() => setStudentImportMode('bulk')} className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${studentImportMode === 'bulk' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'}`}>
                    📋 Nhập hàng loạt
                  </button>
                  <button type="button" onClick={() => setStudentImportMode('sheet')} className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${studentImportMode === 'sheet' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'}`}>
                    📊 Google Sheet
                  </button>
                </div>
              </div>
            )}

            {studentImportMode === 'manual' && (
              <form
                onSubmit={async e =>  {
                  e.preventDefault();
                  const errors: Record<string, string> = {};
                  const normalizedEmail = addStudentForm.email.trim();
                  if (!addStudentForm.fullName.trim()) {
                    errors.fullName = 'Vui lòng nhập họ và tên học sinh.';
                  }
                  if (normalizedEmail && !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
                    errors.email = 'Email không hợp lệ.';
                  }
                  if ((addStudentForm.password || '').length < 6) {
                    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
                  }
                  setStudentFormErrors(errors);
                  if (Object.keys(errors).length > 0) {
                    showErrorToast('Vui lòng kiểm tra các trường được đánh dấu đỏ.');
                    return;
                  }
                  const assignedClass = addStudentForm.className || (classesList[0]?.name || 'Lớp 8A1');
                  const matchedClassObj = classesList.find(c => c.name === assignedClass);
                  const classId = matchedClassObj?.id || ('c_' + Date.now());

                  const finalPos = addStudentForm.position === 'khác' ? (customPosition.trim() || 'Thành viên') : addStudentForm.position;

                  const studentData: User = {
                    id: editingStudent ? editingStudent.id : ('s_' + Date.now()),
                    username: editingStudent ? editingStudent.username : ('hs_' + Date.now().toString().slice(-4)),
                    fullName: addStudentForm.fullName.trim(),
                    role: 'student',
                    password: addStudentForm.password || '123456',
                    email: addStudentForm.email.trim() || (addStudentForm.fullName.toLowerCase().replace(/\s+/g, '') + '@iten.edu.vn'),
                    gender: addStudentForm.gender as 'Nam' | 'Nữ',
                    dob: addStudentForm.dob || '2012-05-15',
                    phone: addStudentForm.phone || '0912345678',
                    address: addStudentForm.address || 'Hà Nội',
                    school: matchedClassObj?.school || 'THCS Chu Văn An',
                    classId: classId,
                    className: assignedClass,
                    academicYear: addStudentForm.academicYear || matchedClassObj?.academicYear || '2025 - 2026',
                    position: finalPos as any,
                    team: addStudentForm.team || 'Tổ 1',
                    isUnionMember: addStudentForm.isUnionMember,
                    notes: addStudentForm.notes,
                    avatar: editingStudent?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
                  };

                  if (editingStudent && onUpdateStudent) {
                    onUpdateStudent(studentData);
                    soundFx.playSuccess();
                    showToast(`Cập nhật thành công hồ sơ ${studentData.fullName}!`);
                  } else {
                    setIsSavingStudent(true);
                    try {
                      await onAddStudent(studentData);
                      soundFx.playSuccess();
                      showToast(`Tạo tài khoản học sinh thành công: ${studentData.fullName}.`);
                    } catch (error: unknown) {
                      const apiError = error as { message?: string; field?: string };
                      if (apiError.field) {
                        setStudentFormErrors({ [apiError.field]: apiError.message || 'Dữ liệu chưa hợp lệ.' });
                      }
                      showErrorToast(apiError.message || 'Không thể tạo tài khoản học sinh. Vui lòng thử lại.');
                      return;
                    } finally {
                      setIsSavingStudent(false);
                    }
                  }

                  setShowAddStudentModal(false);
                  setEditingStudent(null);
                  setSelectedAcademicYearFilter(studentData.academicYear || 'all');
                  setSelectedClassFilter(assignedClass);
                  setActiveSubView('classes_and_students');
                  setClassProfileTab('all');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và Tên học sinh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={addStudentForm.fullName}
                    onChange={e => { setAddStudentForm({ ...addStudentForm, fullName: e.target.value }); setStudentFormErrors(prev => ({ ...prev, fullName: '' })); }}
                    aria-invalid={Boolean(studentFormErrors.fullName)}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400 ${studentFormErrors.fullName ? 'border-rose-500 ring-1 ring-rose-200' : 'border-slate-200'}`}
                  />
                  {studentFormErrors.fullName && <p className="mt-1 text-xs font-semibold text-rose-600">{studentFormErrors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giới tính</label>
                    <select
                      value={addStudentForm.gender}
                      onChange={e => setAddStudentForm({ ...addStudentForm, gender: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={addStudentForm.dob}
                      onChange={e => setAddStudentForm({ ...addStudentForm, dob: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tổ thi đua</label>
                    <select
                      value={addStudentForm.team}
                      onChange={e => setAddStudentForm({ ...addStudentForm, team: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="Tổ 1">Tổ 1</option>
                      <option value="Tổ 2">Tổ 2</option>
                      <option value="Tổ 3">Tổ 3</option>
                      <option value="Tổ 4">Tổ 4</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chức vụ trong lớp</label>
                    <select
                      value={addStudentForm.position}
                      onChange={e => setAddStudentForm({ ...addStudentForm, position: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="thành viên">Học sinh thành viên</option>
                      <option value="lớp trưởng">Lớp trưởng (Cán bộ lớp)</option>
                      <option value="lớp phó học tập">Lớp phó học tập (Cán bộ lớp)</option>
                      <option value="lớp phó lao động">Lớp phó lao động (Cán bộ lớp)</option>
                      <option value="tổ trưởng">Tổ trưởng</option>
                      <option value="khác">✏️ Vai trò/Chức vụ khác (Tự nhập)</option>
                    </select>
                  </div>
                  {addStudentForm.position === 'khác' ? (
                    <div>
                      <label className="block text-xs font-bold text-amber-800 uppercase mb-1">Nhập tên chức vụ khác *</label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Trưởng ban Văn nghệ, Thủ quỹ..."
                        value={customPosition}
                        onChange={e => setCustomPosition(e.target.value)}
                        className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mật khẩu đăng nhập</label>
                      <input
                        type="text"
                        value={addStudentForm.password}
                        onChange={e => { setAddStudentForm({ ...addStudentForm, password: e.target.value }); setStudentFormErrors(prev => ({ ...prev, password: '' })); }}
                        aria-invalid={Boolean(studentFormErrors.password)}
                        className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 ${studentFormErrors.password ? 'border-rose-500 ring-1 ring-rose-200' : 'border-slate-200'}`}
                      />
                      {studentFormErrors.password && <p className="mt-1 text-xs font-semibold text-rose-600">{studentFormErrors.password}</p>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="0912345678"
                      value={addStudentForm.phone}
                      onChange={e => setAddStudentForm({ ...addStudentForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="hocsinh@iten.edu.vn"
                    value={addStudentForm.email}
                    onChange={e => { setAddStudentForm({ ...addStudentForm, email: e.target.value }); setStudentFormErrors(prev => ({ ...prev, email: '' })); }}
                    aria-invalid={Boolean(studentFormErrors.email)}
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 ${studentFormErrors.email ? 'border-rose-500 ring-1 ring-rose-200' : 'border-slate-200'}`}
                  />
                  {studentFormErrors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{studentFormErrors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    placeholder="Quận Ba Đình, Hà Nội"
                    value={addStudentForm.address}
                    onChange={e => setAddStudentForm({ ...addStudentForm, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isUnion"
                    checked={addStudentForm.isUnionMember}
                    onChange={e => setAddStudentForm({ ...addStudentForm, isUnionMember: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-400 cursor-pointer"
                  />
                  <label htmlFor="isUnion" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Đã kết nạp Đoàn / Đội viên (Hiện dấu ✓ trên bảng)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowAddStudentModal(false); setEditingStudent(null); }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingStudent}
                    className="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 shadow-md cursor-pointer"
                  >
                    {isSavingStudent ? 'Đang tạo tài khoản...' : editingStudent ? 'Lưu cập nhật' : 'Thêm Học Sinh'}
                  </button>
                </div>
              </form>
            )}

            {studentImportMode === 'bulk' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Dán danh sách (tối đa 100 dòng). Định dạng: <strong>Họ tên, Email, Mật khẩu, Giới tính, Ngày sinh, SĐT, Tổ, Chức vụ</strong>. Có thể bỏ cột mật khẩu để dùng mặc định <strong>123456</strong>.
                </p>
                <textarea
                  rows={6}
                  placeholder={`Nguyễn Văn An, an@iten.edu.vn, 123456, Nam, 2012-05-15, 0912345678, Tổ 1, lớp trưởng\nTrần Thị Bình, binh@iten.edu.vn, 123456, Nữ, 2012-08-20, 0987654321, Tổ 2, thành viên`}
                  value={studentBulkText}
                  onChange={e => setStudentBulkText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono"
                />
                <button
                  disabled={isSavingStudent}
                  onClick={async () => {
                    if (!studentBulkText.trim()) return;
                    const lines = studentBulkText.split('\n').filter(l => l.trim());
                    if (lines.length > 100) {
                      showErrorToast('Mỗi lần chỉ được nhập tối đa 100 học sinh.');
                      return;
                    }
                    const assignedClass = addStudentForm.className || (classesList[0]?.name || 'Lớp 8A1');
                    const matchedClass = classesList.find(c => c.name === assignedClass);
                    if (!matchedClass) {
                      showErrorToast('Vui lòng chọn một lớp hợp lệ.');
                      return;
                    }
                    const newStudentsList: User[] = lines.map((line, idx) => {
                      const parts = line.split(',').map(p => p.trim());
                      const passwordColumnOmitted = ['nam', 'nữ', 'khác'].includes((parts[2] || '').toLocaleLowerCase('vi'));
                      const dataOffset = passwordColumnOmitted ? -1 : 0;
                      const gender = (parts[3 + dataOffset] || '').toLocaleLowerCase('vi');
                      return {
                        id: 's_bulk_' + Date.now() + '_' + idx,
                        username: parts[1]?.split('@')[0] || '',
                        fullName: parts[0] || '',
                        role: 'student',
                        email: parts[1] || '',
                        password: passwordColumnOmitted ? '123456' : (parts[2] || '123456'),
                        gender: (gender === 'nữ' ? 'Nữ' : gender === 'khác' ? 'Khác' : 'Nam') as any,
                        dob: parts[4 + dataOffset] || '',
                        phone: parts[5 + dataOffset] || '',
                        team: parts[6 + dataOffset] || 'Tổ 1',
                        position: (parts[7 + dataOffset] || 'thành viên') as any,
                        classId: matchedClass.id,
                        className: assignedClass,
                        academicYear: addStudentForm.academicYear || matchedClass.academicYear || '',
                        school: matchedClass.school || '',
                        address: '',
                        isUnionMember: false
                      };
                    });
                    const invalidIndex = newStudentsList.findIndex(st => !st.fullName || !/^\S+@\S+\.\S+$/.test(st.email) || (st.password || '').length < 6);
                    if (invalidIndex >= 0) {
                      showErrorToast(`Dòng ${invalidIndex + 1} chưa đủ họ tên, email hợp lệ hoặc mật khẩu ít nhất 6 ký tự.`);
                      return;
                    }
                    if (new Set(newStudentsList.map(st => st.email.toLowerCase())).size !== newStudentsList.length) {
                      showErrorToast('Danh sách có email bị trùng.');
                      return;
                    }
                    setIsSavingStudent(true);
                    try {
                      const created = await onAddStudentsBulk?.(newStudentsList);
                      if (!created) throw new Error('Chức năng nhập hàng loạt chưa sẵn sàng.');
                      soundFx.playSuccess();
                      setStudentBulkText('');
                      setShowAddStudentModal(false);
                      showToast(`Đã tạo tài khoản cho ${created.length} học sinh trong ${assignedClass}.`);
                    } catch (error: unknown) {
                      showErrorToast((error as { message?: string })?.message || 'Không thể nhập danh sách học sinh.');
                    } finally {
                      setIsSavingStudent(false);
                    }
                  }}
                  className="w-full py-2.5 bg-amber-500 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs hover:bg-amber-600"
                >
                  {isSavingStudent ? 'Đang tạo tài khoản...' : `Tải nạp & Nhập hàng loạt (${studentBulkText.split('\n').filter(l => l.trim()).length} dòng)`}
                </button>
              </div>
            )}

            {studentImportMode === 'sheet' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Sheet cần được chia sẻ ở chế độ “Bất kỳ ai có đường liên kết đều có thể xem”. Hàng đầu tiên là tiêu đề; các cột theo thứ tự: <strong>Họ tên, Email, Mật khẩu, Giới tính, Ngày sinh, SĐT, Tổ, Chức vụ</strong>. Cột mật khẩu có thể bỏ; hệ thống sẽ dùng <strong>123456</strong>.
                </p>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={studentSheetUrl}
                  onChange={e => setStudentSheetUrl(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800"
                />
                <button
                  disabled={isSavingStudent}
                  onClick={async () => {
                    if (!studentSheetUrl.trim()) {
                      showErrorToast('Vui lòng nhập link Google Sheet.');
                      return;
                    }
                    const assignedClass = addStudentForm.className || (classesList[0]?.name || 'Lớp 8A1');
                    const matchedClass = classesList.find(c => c.name === assignedClass);
                    if (!matchedClass || !onAddStudentsBulk) {
                      showErrorToast('Vui lòng chọn một lớp hợp lệ.');
                      return;
                    }
                    setIsSavingStudent(true);
                    try {
                      if (!auth.currentUser) throw new Error('Phiên đăng nhập đã hết hạn.');
                      const idToken = await auth.currentUser.getIdToken();
                      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/students/read-google-sheet`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                        body: JSON.stringify({ url: studentSheetUrl.trim() }),
                      });
                      const result = await response.json().catch(() => ({}));
                      if (!response.ok) throw new Error(result?.error || 'Không thể đọc Google Sheet.');
                      const rows = (result.rows as string[][]).slice(1).filter(row => row.some(cell => cell.trim()));
                      if (!rows.length) throw new Error('Sheet chưa có dòng học sinh nào.');
                      const sheetStudents: User[] = rows.map((parts, idx) => {
                        const passwordColumnOmitted = ['nam', 'nữ', 'khác'].includes((parts[2] || '').toLocaleLowerCase('vi'));
                        const dataOffset = passwordColumnOmitted ? -1 : 0;
                        const gender = (parts[3 + dataOffset] || '').toLocaleLowerCase('vi');
                        return {
                          id: `s_sheet_${Date.now()}_${idx}`,
                          username: (parts[1] || '').split('@')[0],
                          fullName: (parts[0] || '').trim(),
                          role: 'student',
                          email: (parts[1] || '').trim(),
                          password: passwordColumnOmitted ? '123456' : (parts[2] || '123456'),
                          gender: gender === 'nữ' ? 'Nữ' : gender === 'khác' ? 'Khác' : 'Nam',
                          dob: parts[4 + dataOffset] || '',
                          phone: parts[5 + dataOffset] || '',
                          team: parts[6 + dataOffset] || 'Tổ 1',
                          position: parts[7 + dataOffset] || 'thành viên',
                          classId: matchedClass.id,
                          className: assignedClass,
                          academicYear: addStudentForm.academicYear || matchedClass.academicYear || '',
                          school: matchedClass.school || '',
                          address: '',
                          isUnionMember: false,
                        };
                      });
                      const invalidIndex = sheetStudents.findIndex(st => !st.fullName || !/^\S+@\S+\.\S+$/.test(st.email) || (st.password || '').length < 6);
                      if (invalidIndex >= 0) throw new Error(`Dòng ${invalidIndex + 2} trong Sheet chưa đủ họ tên, email hợp lệ hoặc mật khẩu ít nhất 6 ký tự.`);
                      if (new Set(sheetStudents.map(st => st.email.toLowerCase())).size !== sheetStudents.length) throw new Error('Google Sheet có email bị trùng.');
                      const created = await onAddStudentsBulk(sheetStudents);
                      soundFx.playSuccess();
                      setStudentSheetUrl('');
                      setShowAddStudentModal(false);
                      showToast(`Đã tạo tài khoản cho ${created.length} học sinh từ Google Sheet.`);
                    } catch (error: unknown) {
                      showErrorToast((error as { message?: string })?.message || 'Không thể nhập học sinh từ Google Sheet.');
                    } finally {
                      setIsSavingStudent(false);
                    }
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl text-xs hover:from-emerald-700 hover:to-teal-700 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> {isSavingStudent ? 'Đang đọc và tạo tài khoản...' : 'Đồng bộ & Nhập từ Google Sheet'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL THÊM / CHỈNH SỬA TÀI KHOẢN GIÁO VIÊN (ADMIN ONLY) */}
      {showTeacherModal && currentUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-amber-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <span className="p-2 bg-amber-100 rounded-xl text-amber-800 text-sm">👨‍🏫</span>
                {editingTeacher ? `Chỉnh sửa Giáo viên: ${editingTeacher.fullName}` : 'Cấp Tài Khoản Giáo Viên Mới'}
              </h3>
              <button
                onClick={() => { setShowTeacherModal(false); setEditingTeacher(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingTeacher && (
              <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-xl border border-amber-200">
                <button
                  type="button"
                  onClick={() => setTeacherImportMode('manual')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    teacherImportMode === 'manual' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  📝 Thủ công
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherImportMode('bulk')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    teacherImportMode === 'bulk' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  📋 Hàng loạt
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherImportMode('sheet')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    teacherImportMode === 'sheet' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  📊 Google Sheet Link
                </button>
              </div>
            )}

            {teacherImportMode === 'manual' && (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!teacherForm.fullName.trim()) {
                    alert('Vui lòng nhập tên giáo viên!');
                    return;
                  }
                  soundFx.playSuccess();
                  const teacherData: User = {
                    id: editingTeacher ? editingTeacher.id : ('t_' + Date.now()),
                    username: editingTeacher ? editingTeacher.username : ('gv_' + Date.now().toString().slice(-4)),
                    fullName: teacherForm.fullName.trim(),
                    role: 'teacher',
                    password: teacherForm.password || '123456',
                    school: teacherForm.school || 'THCS Chu Văn An',
                    gender: teacherForm.gender,
                    dob: teacherForm.dob,
                    email: teacherForm.email.trim() || (teacherForm.fullName.toLowerCase().replace(/\s+/g, '') + '@iten.edu.vn'),
                    phone: teacherForm.phone || '0987654321',
                    address: teacherForm.address || 'Hà Nội',
                    teacherRole: teacherForm.teacherRole,
                    subject: teacherForm.subject,
                    notes: teacherForm.notes,
                    avatar: editingTeacher?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
                  };

                  if (editingTeacher && onUpdateTeacher) {
                    onUpdateTeacher(teacherData);
                    showToast(`Cập nhật thành công tài khoản giáo viên ${teacherData.fullName}!`);
                  } else if (onAddTeacher) {
                    onAddTeacher(teacherData);
                    showToast(`Cấp thành công tài khoản cho giáo viên ${teacherData.fullName}!`);
                  }

                  setShowTeacherModal(false);
                  setEditingTeacher(null);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và Tên giáo viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thầy Trần Đức Anh"
                    value={teacherForm.fullName}
                    onChange={e => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vai trò phân công *</label>
                    <select
                      value={teacherForm.teacherRole}
                      onChange={e => setTeacherForm({ ...teacherForm, teacherRole: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="giáo viên bộ môn">Giáo viên bộ môn</option>
                      <option value="giáo viên chủ nhiệm">Giáo viên chủ nhiệm</option>
                      <option value="vừa chủ nhiệm vừa bộ môn">Vừa chủ nhiệm vừa bộ môn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Môn giảng dạy chính</label>
                    <input
                      type="text"
                      placeholder="Toán học, Ngữ Văn, Tiếng Anh..."
                      value={teacherForm.subject}
                      onChange={e => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giới tính</label>
                    <select
                      value={teacherForm.gender}
                      onChange={e => setTeacherForm({ ...teacherForm, gender: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={teacherForm.dob}
                      onChange={e => setTeacherForm({ ...teacherForm, dob: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trường làm việc</label>
                    <input
                      type="text"
                      value={teacherForm.school}
                      onChange={e => setTeacherForm({ ...teacherForm, school: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={teacherForm.phone}
                      onChange={e => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email liên hệ</label>
                    <input
                      type="email"
                      value={teacherForm.email}
                      onChange={e => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mật khẩu khởi tạo</label>
                    <input
                      type="text"
                      value={teacherForm.password}
                      onChange={e => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ghi chú chuyên môn</label>
                  <textarea
                    rows={2}
                    value={teacherForm.notes}
                    onChange={e => setTeacherForm({ ...teacherForm, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowTeacherModal(false); setEditingTeacher(null); }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 shadow-md cursor-pointer"
                  >
                    {editingTeacher ? 'Lưu Giáo Viên' : 'Cấp Tài Khoản'}
                  </button>
                </div>
              </form>
            )}

            {teacherImportMode === 'bulk' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Dán danh sách giáo viên (mỗi dòng một giáo viên). Định dạng: <strong>Họ tên, Môn dạy, Vai trò, SĐT, Email</strong>
                </p>
                <textarea
                  rows={5}
                  placeholder={`Vũ Hoàng Nam, Toán học, giáo viên chủ nhiệm, 0987654321, nam.vu@iten.edu.vn\nPhạm Thanh Hằng, Tiếng Anh, giáo viên bộ môn, 0912345678, hang.pham@iten.edu.vn`}
                  value={teacherBulkText}
                  onChange={e => setTeacherBulkText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono"
                />
                <button
                  onClick={() => {
                    if (!teacherBulkText.trim()) return;
                    const lines = teacherBulkText.split('\n').filter(l => l.trim());
                    const newTeachers: User[] = lines.map((line, idx) => {
                      const parts = line.split(',').map(p => p.trim());
                      return {
                        id: 't_b_' + Date.now() + '_' + idx,
                        username: 'gv_b' + idx,
                        fullName: parts[0] || `Giáo viên ${idx + 1}`,
                        role: 'teacher',
                        password: '123456',
                        subject: parts[1] || 'Ngữ Văn',
                        teacherRole: (parts[2] || 'giáo viên bộ môn') as any,
                        phone: parts[3] || '0987654321',
                        email: parts[4] || `gv${idx}@iten.edu.vn`,
                        school: 'THCS Chu Văn An'
                      };
                    });
                    if (onAddTeachersBulk) onAddTeachersBulk(newTeachers);
                    soundFx.playSuccess();
                    setShowTeacherModal(false);
                    showToast(`Đã cấp tài khoản hàng loạt cho ${newTeachers.length} giáo viên!`);
                  }}
                  className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 cursor-pointer"
                >
                  Tải nạp & Cấp tài khoản hàng loạt
                </button>
              </div>
            )}

            {teacherImportMode === 'sheet' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">Nhập link Google Sheet chứa danh sách giáo viên để cấp tài khoản đồng bộ tự động.</p>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={teacherSheetUrl}
                  onChange={e => setTeacherSheetUrl(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold"
                />
                <button
                  onClick={() => {
                    soundFx.playSuccess();
                    const sampleTeachers: User[] = [
                      { id: 't_sh_1_' + Date.now(), username: 'gv_sh1', fullName: 'Đỗ Tiến Dũng', role: 'teacher', password: '123456', gender: 'Nam', dob: '1985-03-12', phone: '0988112233', email: 'dung.do@iten.edu.vn', address: 'Hà Nội', subject: 'Vật lý', teacherRole: 'giáo viên chủ nhiệm' as any, school: 'THCS Chu Văn An' },
                      { id: 't_sh_2_' + Date.now(), username: 'gv_sh2', fullName: 'Lê Minh Tú', role: 'teacher', password: '123456', gender: 'Nam', dob: '1990-11-25', phone: '0977223344', email: 'tu.le@iten.edu.vn', address: 'Hà Nội', subject: 'Hóa học', teacherRole: 'giáo viên bộ môn' as any, school: 'THCS Chu Văn An' }
                    ];
                    if (onAddTeachersBulk) onAddTeachersBulk(sampleTeachers);
                    setShowTeacherModal(false);
                    showToast(`Đồng bộ dữ liệu giáo viên thành công từ Google Sheet!`);
                  }}
                  className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Đồng bộ & Cấp tài khoản từ Sheet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT HỒ SƠ & ĐỔI MẬT KHẨU CÁ NHÂN GIÁO VIÊN / ADMIN */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-amber-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <span className="p-2 bg-amber-100 rounded-xl text-amber-800 text-sm">⚙️</span> Cài đặt Thông tin & Mật khẩu Cá nhân
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
                  alert('Mật khẩu mới và mật khẩu xác nhận không trùng khớp!');
                  return;
                }
                soundFx.playSuccess();
                const updatedUser: User = {
                  ...currentUser,
                  fullName: profileForm.fullName.trim() || currentUser.fullName,
                  email: profileForm.email.trim() || currentUser.email,
                  phone: profileForm.phone.trim() || currentUser.phone,
                  address: profileForm.address.trim() || currentUser.address,
                  subject: profileForm.subject || currentUser.subject,
                  password: profileForm.newPassword ? profileForm.newPassword : currentUser.password
                };
                if (onUpdateCurrentUser) onUpdateCurrentUser(updatedUser);
                setShowProfileModal(false);
                showToast('Đã cập nhật thông tin cá nhân và mật khẩu thành công!');
              }}
              className="space-y-3"
            >
              {/* Chibi Avatar Selection Card */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={getAvatarUrl(currentUser)}
                      alt={currentUser.fullName}
                      className="w-14 h-14 rounded-2xl object-contain border-2 border-amber-400 bg-white p-0.5 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">
                      {currentUser.avatarId || 'Chibi'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{currentUser.fullName}</h4>
                    <p className="text-xs text-amber-800 font-medium">Nhân vật Avatar Chibi ITEN</p>
                  </div>
                </div>
                {onOpenAvatarSelection && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false);
                      onOpenAvatarSelection();
                    }}
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black rounded-xl shadow-md border border-amber-300 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Đổi Avatar
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và Tên</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="text-xs font-extrabold text-amber-900 uppercase">🔒 Thay đổi mật khẩu mới</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu mới..."
                      value={profileForm.newPassword}
                      onChange={e => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      placeholder="Xác nhận lại..."
                      value={profileForm.confirmPassword}
                      onChange={e => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 shadow-md cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
