






import { auth } from './lib/firebase';
import { getClassById, getClasses } from './services/classService';
import { updateClass, setClass, deleteClass } from './services/classService';
import { getNotificationsForUser, markNotificationRead, setNotification } from './services/notificationService';
import React, { useEffect, useMemo, useState } from 'react';
import { getStudents, getStudentsByClass, updateStudent } from './services/studentService';
import { User, MainTabType, NotificationItem, TimetableEntry, CleaningSchedule, DisciplineRecord, LearningRecord, Complaint, AccountRequest, AttendanceRecord, SpyGameMission, FlowerGameConfig, RacingGameConfig, KeyboardHeroTask, MemoryCardGameConfig, PersonalStorageItem, TeacherWorkSchedule, TeacherWeeklyTimetable, ClassFundItem, ClassFundExpense, ClassLogbookWeek, PointUsageTransaction, ActivityPointRecord, ClassItem } from './types';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { FirstLoginPasswordModal } from './components/FirstLoginPasswordModal';
import { DashboardTab } from './components/tabs/DashboardTab';
import { TrainingCompetitionTab } from './components/tabs/TrainingCompetitionTab';
import { LearningCompetitionTab } from './components/tabs/LearningCompetitionTab';
import { ActivitiesTab } from './components/tabs/ActivitiesTab';
import { UtilitiesTab } from './components/tabs/UtilitiesTab';
import { OnlineTestsTab } from './components/tabs/OnlineTestsTab';
import { RequestsTab } from './components/tabs/RequestsTab';
import { AvatarSelectionModal } from './components/game-ui/AvatarSelectionModal';
import { getAvatarById } from './utils/avatarHelper';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserById, getUsers, updateUser } from './services/userService';
import { createEmptyFlowerGameConfig, getFlowerGameConfig, saveFlowerGameConfig } from './services/flowerGameService';
import { getRacingGameConfig, saveRacingGameConfig } from './services/racingGameService';
import { getMemoryGameConfig, saveMemoryGameConfig } from './services/memoryGameService';
import { appendKeyboardComment, getKeyboardTask, gradeKeyboardSubmissionAndAward, saveKeyboardSubmission, saveKeyboardTaskConfig, setKeyboardSubmissionLike } from './services/keyboardTaskService';
import { castSpyVote, clearAllSpyVotes, finishSpyMissionAndAward, getSpyMission, resetSpyVotes, saveSpyMission } from './services/spyGameService';
import { awardAttendancePoints, loadAttendanceRecords, saveAttendanceRecords } from './services/attendanceService';
import { activityPointToDisciplineRecord, activityPointToLearningRecord, loadActivityPointsForClass, loadActivityPointsForUser } from './services/activityPointService';
import { createEmptyCleaningSchedule, getCleaningSchedule, saveCleaningSchedule } from './services/cleaningScheduleService';
import { deleteAppDocument, loadAppCollection, saveAppDocument, subscribeAppCollection, type AppCollectionName } from './services/appDataService';

const emptyTimetable = (classId = ''): TimetableEntry => ({
  id: classId ? `timetable_${classId}` : '', classId, semester: 'Học kỳ 1', weekNumber: 1, startDate: '', schedule: [],
});
const emptySpyMission = (classId = ''): SpyGameMission => ({
  id: classId ? `spy_${classId}` : '', classId, weekNumber: 1, spyStudentId: '', missionDescription: '',
  status: 'Chưa kích hoạt', votes: [], rewardSpy: 5, penaltySpy: 5, rewardCitizenPerVote: 1,
});
const emptyRacingConfig = (classId = ''): RacingGameConfig => ({
  id: classId ? `racing_${classId}` : '', title: 'Đường đua học tập', classId, category: 'Điểm HĐ học tập',
  trackLength: 1000, timeMinutes: 5, mode: 'tổ', playMode: 'all_teams', trackCount: 4,
  teams: [], vehicles: [], questions: [], isActive: false,
});
const emptyKeyboardTask = (classId = ''): KeyboardHeroTask => ({
  id: classId ? `keyboard_${classId}` : '', title: '', prompt: '', classId,
  category: 'Điểm HĐ học tập', deadline: '', submissions: [],
});
const emptyMemoryConfig = (classId = ''): MemoryCardGameConfig => ({
  id: classId ? `memory_${classId}` : '', title: 'Thách thức thẻ nhớ', classId,
  category: 'Điểm HĐ học tập', timeMinutes: 5, pairs: [], isActive: false,
});
const persistCollectionChanges = async <T extends { id: string }>(name: AppCollectionName, previous: T[], next: T[]) => {
  const nextIds = new Set(next.map(item => item.id));
  await Promise.all([
    ...next.map(item => saveAppDocument(name, item)),
    ...previous.filter(item => !nextIds.has(item.id)).map(item => deleteAppDocument(name, item.id)),
  ]);
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
const [authLoading, setAuthLoading] = useState(true);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesLoadError, setClassesLoadError] = useState('');
  const [classesReloadKey, setClassesReloadKey] = useState(0);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsLoadError, setStudentsLoadError] = useState('');
  const [studentsReloadKey, setStudentsReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState<MainTabType>('dashboard');
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const isStudent = currentUser?.role === 'student';
  const canManage = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
  const isCurrentTreasurer = currentUser?.role === 'student' &&
    ['thủ quỹ', 'thu quy'].includes((currentUser.position || '').trim().toLocaleLowerCase('vi'));
  const isAdmin = currentUser?.role === 'admin';
  const canManageClass = (classId?: string) => {
  if (isAdmin) return true;

  if (currentUser?.role !== 'teacher' || !classId) {
    return false;
  }

  const managedClass = classesList.find(c => c.id === classId);

  return currentUser.classId === classId || managedClass?.homeroomTeacher === currentUser.fullName;
};
  const learningRecordForCurrentTeacher = (record: LearningRecord): LearningRecord | null => {
    if (currentUser?.role === 'admin') return record;
    if (currentUser?.role !== 'teacher' || !currentUser.subject?.trim()) return null;
    return { ...record, categoryType: 'subject', subjectName: currentUser.subject.trim() };
  };
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      setCurrentUser(null);
      setAuthLoading(false);
      return;
    }

    setClassesLoading(true);
    setStudentsLoading(true);
    try {
      const user = await getUserById(firebaseUser.uid);
console.log('[AUTH USER CLASS]', {
  id: user?.id,
  role: user?.role,
  classId: user?.classId,
  className: user?.className,
});      if (user) {
         console.log('[SET CURRENT USER]', user);
  setCurrentUser(user);
      } else {
        await signOut(auth);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('[Auth Restore Error]', error);
      setCurrentUser(null);
    }

 finally {
      setAuthLoading(false);
    }
  });

  return unsubscribe;
}, []);
useEffect(() => {
  if (!currentUser) {
    setClassesList([]);
    setClassesLoadError('');
    setClassesLoading(false);
    return;
  }
  let cancelled = false;
  const loadClasses = async () => {
    setClassesList([]);
    setClassesLoadError('');
    setClassesLoading(true);
    try {
      if (currentUser.role === 'student' && !currentUser.classId) {
        throw new Error('Tài khoản học sinh chưa được gán lớp học.');
      }
      const firestoreClasses = currentUser.role === 'student'
        ? [await getClassById(currentUser.classId as string)].filter((item): item is ClassItem => item !== null)
        : await getClasses();
      if (!cancelled) setClassesList(firestoreClasses);
    } catch (error) {
      console.error('[Load Classes Error]', error);
      if (!cancelled) setClassesLoadError(error instanceof Error && error.message.includes('chưa được gán lớp')
        ? error.message
        : 'Không tải được lớp học từ Firestore.');
    } finally {
      if (!cancelled) setClassesLoading(false);
    }
  };

  loadClasses();
  return () => { cancelled = true; };
}, [currentUser?.id, classesReloadKey]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry>(() => emptyTimetable());
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherWorkSchedule[]>([]);
  const [teacherWeeklyTimetables, setTeacherWeeklyTimetables] = useState<TeacherWeeklyTimetable[]>([]);
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    let cancelled = false;
    setNotifications([]);
    getNotificationsForUser(currentUser)
      .then(items => { if (!cancelled) setNotifications(items); })
      .catch(error => {
        console.error('[Load Notifications Error]', error);
        if (!cancelled) setNotifications([]);
      });
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.role, currentUser?.classId]);
  const [cleaning, setCleaning] = useState<CleaningSchedule>(() => createEmptyCleaningSchedule(''));
  const [cleaningLoading, setCleaningLoading] = useState(false);
  const [cleaningLoadError, setCleaningLoadError] = useState('');

  useEffect(() => {
    const classId = currentUser?.classId || '';
    setCleaning(createEmptyCleaningSchedule(classId));
    setCleaningLoadError('');
    if (!classId) {
      setCleaningLoading(false);
      return;
    }

    let cancelled = false;
    setCleaningLoading(true);
    getCleaningSchedule(classId)
      .then(schedule => {
        if (!cancelled) setCleaning(schedule || createEmptyCleaningSchedule(classId));
      })
      .catch(error => {
        console.error('[Load Cleaning Schedule Error]', error);
        if (!cancelled) setCleaningLoadError('Không tải được lịch vệ sinh từ Firestore.');
      })
      .finally(() => {
        if (!cancelled) setCleaningLoading(false);
      });

    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.classId]);
  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRecord[]>([]);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>([]);

  const mergeActivityPoint = (point: ActivityPointRecord) => {
    if (point.pointType === 'academic_activity') {
      const record = activityPointToLearningRecord(point);
      setLearningRecords(prev => [record, ...prev.filter(item => item.id !== record.id)]);
    } else {
      const record = activityPointToDisciplineRecord(point);
      setDisciplineRecords(prev => [record, ...prev.filter(item => item.id !== record.id)]);
    }
  };

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const managedClassIds = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      return classesList.map(classItem => classItem.id);
    }

    if (currentUser.role === 'teacher') {
      const classIds = classesList
        .filter(classItem => classItem.homeroomTeacher === currentUser.fullName)
        .map(classItem => classItem.id);

      if (currentUser.classId) classIds.push(currentUser.classId);
      return [...new Set(classIds)];
    }

    if (currentUser.role === 'student' && currentUser.classId) {
      return [currentUser.classId];
    }

    return [];
  }, [classesList, currentUser]);

  const managedClassOptions = useMemo(
    () => classesList
      .filter(classItem => managedClassIds.includes(classItem.id))
      .map(classItem => ({ id: classItem.id, name: classItem.name })),
    [classesList, managedClassIds]
  );

  const managedStudents = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return students;

    if (currentUser.role === 'teacher') {
      const managedClassIdSet = new Set(managedClassIds);
      return students.filter(student =>
        Boolean(student.classId) && managedClassIdSet.has(student.classId as string)
      );
    }

    if (currentUser.role === 'student') {
      return students.filter(student =>
        Boolean(currentUser.classId) && student.classId === currentUser.classId
      );
    }

    return [];
  }, [currentUser, managedClassIds, students]);

  const [selectedLearningClassId, setSelectedLearningClassId] = useState('');
  useEffect(() => {
    if (!currentUser) {
      setSelectedLearningClassId('');
      return;
    }

    if (currentUser.role === 'student') {
      setSelectedLearningClassId(currentUser.classId || '');
      return;
    }

    if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
      setSelectedLearningClassId(previous =>
        previous && managedClassIds.includes(previous)
          ? previous
          : managedClassIds[0] || ''
      );
      return;
    }

    setSelectedLearningClassId('');
  }, [currentUser?.classId, currentUser?.id, currentUser?.role, managedClassIds]);

  const [selectedTrainingClassId, setSelectedTrainingClassId] = useState('');
  useEffect(() => {
    if (!currentUser) {
      setSelectedTrainingClassId('');
      return;
    }

    if (currentUser.role === 'student') {
      setSelectedTrainingClassId(currentUser.classId || '');
      return;
    }

    if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
      setSelectedTrainingClassId(previous =>
        previous && managedClassIds.includes(previous)
          ? previous
          : managedClassIds[0] || ''
      );
      return;
    }

    setSelectedTrainingClassId('');
  }, [currentUser?.classId, currentUser?.id, currentUser?.role, managedClassIds]);

  const [selectedSpyClassId, setSelectedSpyClassId] = useState('');
  useEffect(() => {
    if (!currentUser) {
      setSelectedSpyClassId('');
      return;
    }

    if (currentUser.role === 'student') {
      setSelectedSpyClassId(currentUser.classId || '');
      return;
    }

    if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
      setSelectedSpyClassId(currentClassId =>
        currentClassId && managedClassIds.includes(currentClassId)
          ? currentClassId
          : managedClassIds[0] || ''
      );
      return;
    }

    setSelectedSpyClassId('');
  }, [currentUser?.classId, currentUser?.id, currentUser?.role, managedClassIds]);

  const spyClassStudents = useMemo(
    () => selectedSpyClassId
      ? managedStudents.filter(student => student.classId === selectedSpyClassId)
      : [],
    [managedStudents, selectedSpyClassId]
  );

  useEffect(() => {
    if (!currentUser) {
      setLearningRecords([]);
      setDisciplineRecords([]);
      return;
    }

    let cancelled = false;
    setLearningRecords([]);
    setDisciplineRecords([]);

    const dedupeById = <T extends { id: string }>(groups: T[][]): T[] =>
      Array.from(new Map(groups.flat().map(record => [record.id, record])).values());

    const activityRequest: Promise<ActivityPointRecord[]> = currentUser.role === 'student'
      ? loadActivityPointsForUser(currentUser.id)
      : Promise.all(managedClassIds.map(classId => loadActivityPointsForClass(classId)))
          .then(results => dedupeById(results));

    const loadManual = <T extends { id: string }>(collectionName: 'learningRecords' | 'disciplineRecords') => {
      if (currentUser.role === 'admin') return loadAppCollection<T>(collectionName);
      if (currentUser.role === 'student') return loadAppCollection<T>(collectionName, 'studentId', currentUser.id);
      return Promise.all(
        managedClassIds.map(classId => loadAppCollection<T>(collectionName, 'classId', classId))
      ).then(results => dedupeById(results));
    };

    Promise.all([
      activityRequest,
      loadManual<LearningRecord>('learningRecords'),
      loadManual<DisciplineRecord>('disciplineRecords'),
    ])
      .then(([points, manualLearning, manualTraining]) => {
        if (cancelled) return;
        const academic = points.filter(point => point.pointType === 'academic_activity').map(activityPointToLearningRecord);
        const training = points.filter(point => point.pointType === 'training_activity').map(activityPointToDisciplineRecord);
        setLearningRecords([...academic, ...manualLearning.filter(item => !academic.some(saved => saved.id === item.id))]);
        setDisciplineRecords([...training, ...manualTraining.filter(item => !training.some(saved => saved.id === item.id))]);
      })
      .catch(error => console.error('[Load Point Records Error]', error));

    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.role, managedClassIds]);

  useEffect(() => {
    if (!currentUser) {
      setStudents([]);
      setStudentsLoadError('');
      setStudentsLoading(false);
      return;
    }
    let cancelled = false;
    setStudents([]);
    setStudentsLoadError('');
    setStudentsLoading(true);
    const request = currentUser.role === 'student'
      ? getStudentsByClass(currentUser.classId || '')
      : getStudents();
    request
      .then(items => { if (!cancelled) setStudents(items as User[]); })
      .catch(error => {
        console.error('[Students] Lỗi tải Firestore:', error);
        if (!cancelled) setStudentsLoadError('Không tải được danh sách học sinh từ Firestore.');
      })
      .finally(() => { if (!cancelled) setStudentsLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.classId, currentUser?.role, studentsReloadKey]);



  const [teachers, setTeachers] = useState<User[]>([]);
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      setTeachers([]);
      return;
    }

    let cancelled = false;
    setTeachers([]);
    getUsers()
      .then(users => {
        if (!cancelled) setTeachers(users.filter(user => user.role === 'teacher'));
      })
      .catch(error => {
        console.error('[Load Teachers Error]', error);
        if (!cancelled) setTeachers([]);
      });

    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.role]);
useEffect(() => {
  if (!currentUser || currentUser.role !== 'teacher' || classesLoading) return;

  const teacherClass = classesList.find(
    cls => cls.homeroomTeacher === currentUser.fullName
  );

  if (!teacherClass) return;

  if (
    currentUser.classId === teacherClass.id &&
    currentUser.className === teacherClass.name
  ) {
    return;
  }

  setCurrentUser(prev =>
    prev
      ? {
          ...prev,
          classId: teacherClass.id,
          className: teacherClass.name,
        }
      : prev
  );
}, [classesList, classesLoading, currentUser]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const attendanceStudentClassId = currentUser?.role === 'student' ? currentUser.classId : undefined;
  useEffect(() => {
    setAttendanceRecords([]);
    if (!currentUser) return;

    let cancelled = false;
    const request = currentUser.role === 'student'
      ? attendanceStudentClassId
        ? loadAttendanceRecords(attendanceStudentClassId)
        : Promise.resolve([])
      : Promise.all(managedClassIds.map(classId => loadAttendanceRecords(classId)))
          .then(results => Array.from(
            new Map(results.flat().map(record => [record.id, record])).values()
          ));

    request
      .then(records => { if (!cancelled) setAttendanceRecords(records); })
      .catch(error => console.error('[Load Attendance Error]', error));

    return () => { cancelled = true; };
  }, [attendanceStudentClassId, currentUser?.id, currentUser?.role, managedClassIds]);
  const [spyMission, setSpyMission] = useState<SpyGameMission>(() => emptySpyMission());
  const [spyMissionLoading, setSpyMissionLoading] = useState(false);
  const spyMissionReady = Boolean(selectedSpyClassId) &&
    !spyMissionLoading &&
    spyMission.classId === selectedSpyClassId;
  useEffect(() => {
    const classId = selectedSpyClassId;
    setSpyMission(emptySpyMission(classId));
    if (!classId) {
      setSpyMissionLoading(false);
      return;
    }
    let cancelled = false;
    setSpyMissionLoading(true);
    getSpyMission(classId).then(mission => { if (!cancelled && mission) setSpyMission(mission); })
      .catch(error => { if (!cancelled) console.error('[Load Spy Mission Error]', error); })
      .finally(() => { if (!cancelled) setSpyMissionLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.id, selectedSpyClassId]);
  const [flowerConfig, setFlowerConfig] = useState<FlowerGameConfig>(() => createEmptyFlowerGameConfig(''));
  const [flowerLoadState, setFlowerLoadState] = useState('Đang tải trò chơi...');

  useEffect(() => {
    const classId = currentUser?.classId;
    setFlowerConfig(createEmptyFlowerGameConfig(classId || ''));
    if (!classId) { setFlowerLoadState('Tài khoản chưa được gán lớp học.'); return; }
    setFlowerLoadState('Đang tải trò chơi...');

    let cancelled = false;
    getFlowerGameConfig(classId)
      .then(config => {
        if (!cancelled) { setFlowerConfig(config || createEmptyFlowerGameConfig(classId)); setFlowerLoadState(''); }
      })
      .catch(error => {
        console.error('[Load Flower Game Config Error]', error);
        if (!cancelled) setFlowerLoadState('Không tải được trò chơi. Hãy kiểm tra kết nối/quyền truy cập rồi tải lại trang.');
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.classId, currentUser?.id]);
  const [racingConfig, setRacingConfig] = useState<RacingGameConfig>(() => emptyRacingConfig());
  useEffect(() => {
    const classId = currentUser?.classId;
    setRacingConfig(emptyRacingConfig(classId || ''));
    if (!classId) return;
    let cancelled = false;
    getRacingGameConfig(classId)
      .then(config => { if (!cancelled && config) setRacingConfig(config); })
      .catch(error => console.error('[Load Racing Game Config Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.classId, currentUser?.id]);
  const [keyboardTask, setKeyboardTask] = useState<KeyboardHeroTask>(() => emptyKeyboardTask());
  useEffect(() => {
    const classId = currentUser?.classId;
    setKeyboardTask(emptyKeyboardTask(classId || ''));
    if (!classId) return;
    let cancelled = false;
    getKeyboardTask(classId)
      .then(task => { if (!cancelled && task) setKeyboardTask(task); })
      .catch(error => console.error('[Load Keyboard Task Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.classId, currentUser?.id]);
  const [memoryConfig, setMemoryConfig] = useState<MemoryCardGameConfig>(() => emptyMemoryConfig());
  useEffect(() => {
    const classId = currentUser?.classId;
    setMemoryConfig(emptyMemoryConfig(classId || ''));
    if (!classId) return;
    let cancelled = false;
    getMemoryGameConfig(classId)
      .then(config => { if (!cancelled && config) setMemoryConfig(config); })
      .catch(error => console.error('[Load Memory Game Config Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.classId, currentUser?.id]);
  const [storageItems, setStorageItems] = useState<PersonalStorageItem[]>([]);
  const [classFunds, setClassFunds] = useState<ClassFundItem[]>([]);
  const [classExpenses, setClassExpenses] = useState<ClassFundExpense[]>([]);
  const [logbooks, setLogbooks] = useState<ClassLogbookWeek[]>([]);
  const [pointUsageTransactions, setPointUsageTransactions] = useState<PointUsageTransaction[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setTimetable(emptyTimetable()); setTimetables([]); setTeacherSchedules([]); setTeacherWeeklyTimetables([]);
      setComplaints([]); setAccountRequests([]); setStorageItems([]); setClassFunds([]); setClassExpenses([]);
      setLogbooks([]); setPointUsageTransactions([]);
      return;
    }

    let cancelled = false;
    const isCurrentAdmin = currentUser.role === 'admin';
    const classId = currentUser.classId || '';
    const className = currentUser.className || '';
    const scoped = <T,>(name: AppCollectionName, field: string, value: string) =>
      isCurrentAdmin ? loadAppCollection<T>(name) : (value ? loadAppCollection<T>(name, field, value) : Promise.resolve([]));
    const pointUsagePromise = isCurrentAdmin
      ? loadAppCollection<PointUsageTransaction>('pointUsageTransactions')
      : currentUser.role === 'student'
        ? loadAppCollection<PointUsageTransaction>('pointUsageTransactions', 'studentId', currentUser.id)
        : managedClassIds.length === 0
          ? Promise.resolve<PointUsageTransaction[]>([])
          : Promise.all(
              managedClassIds.map(managedClassId =>
                loadAppCollection<PointUsageTransaction>(
                  'pointUsageTransactions',
                  'classId',
                  managedClassId,
                ),
              ),
            ).then(results =>
              Array.from(
                new Map(
                  results.flat().map(record => [record.id, record]),
                ).values(),
              ),
            );

    Promise.all([
      scoped<TimetableEntry>('timetables', 'classId', classId),
      isCurrentAdmin ? loadAppCollection<TeacherWorkSchedule>('teacherSchedules') : loadAppCollection<TeacherWorkSchedule>('teacherSchedules', 'teacherId', currentUser.id),
      isCurrentAdmin ? loadAppCollection<TeacherWeeklyTimetable>('teacherWeeklyTimetables') : loadAppCollection<TeacherWeeklyTimetable>('teacherWeeklyTimetables', 'teacherId', currentUser.id),
      currentUser.role === 'student'
        ? loadAppCollection<Complaint>('complaints', 'studentId', currentUser.id)
        : scoped<Complaint>('complaints', 'className', className),
      loadAppCollection<PersonalStorageItem>('personalStorageItems', 'userId', currentUser.id),
      scoped<ClassFundItem>('classFunds', 'classId', classId),
      scoped<ClassFundExpense>('classExpenses', 'classId', classId),
      scoped<ClassLogbookWeek>('classLogbooks', 'classId', classId),
      pointUsagePromise,
    ]).then(([loadedTimetables, schedules, weekly, loadedComplaints, storage, funds, expenses, books, usages]) => {
      if (cancelled) return;
      setTimetables(loadedTimetables);
      setTimetable(loadedTimetables[0] || emptyTimetable(classId));
      setTeacherSchedules(schedules); setTeacherWeeklyTimetables(weekly); setComplaints(loadedComplaints);
      setStorageItems(storage); setClassFunds(funds); setClassExpenses(expenses);
      setLogbooks(books); setPointUsageTransactions(usages);
    }).catch(error => {
      console.error('[Load Firestore App Data Error]', error);
      if (!cancelled) {
        setTimetable(emptyTimetable(classId)); setTimetables([]); setTeacherSchedules([]); setTeacherWeeklyTimetables([]);
        setComplaints([]); setStorageItems([]); setClassFunds([]); setClassExpenses([]);
        setLogbooks([]); setPointUsageTransactions([]);
      }
    });

    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.role, currentUser?.classId, currentUser?.className, managedClassIds]);

  useEffect(() => {
    if (!currentUser) {
      setAccountRequests([]);
      return;
    }

    const isStudent = currentUser.role === 'student';
    return subscribeAppCollection<AccountRequest>(
      'accountRequests',
      setAccountRequests,
      error => {
        console.error('[Subscribe Account Requests Error]', error);
        setAccountRequests([]);
      },
      isStudent ? 'userId' : undefined,
      isStudent ? currentUser.id : undefined,
    );
  }, [currentUser?.id, currentUser?.role]);

  const handleAddPointUsageTransaction = (tx: PointUsageTransaction) => {
  if (!canManage) return;

  const student = students.find(s => s.id === tx.studentId);
  if (!student?.classId) return;

  if (tx.classId && tx.classId !== student.classId) {
    console.warn('[Add Point Usage Blocked] Transaction classId does not match student classId.');
    return;
  }

  if (currentUser?.role === 'teacher' && !canManageClass(student.classId)) return;

  const transactionToSave: PointUsageTransaction = {
    ...tx,
    classId: student.classId,
  };

  void saveAppDocument('pointUsageTransactions', transactionToSave).catch(error => console.error('[Save Point Usage Error]', error));
  setPointUsageTransactions(prev => [transactionToSave, ...prev]);
};

const handleCancelPointUsageTransaction = (
  id: string,
  reason?: string
) => {
  if (!canManage) return;

  const target = pointUsageTransactions.find(t => t.id === id);
  if (!target) return;

  const student = students.find(s => s.id === target.studentId);
  if (!student?.classId) return;

  if (target.classId && target.classId !== student.classId) {
    console.warn('[Cancel Point Usage Blocked] Transaction classId does not match student classId.');
    return;
  }

  if (currentUser?.role === 'teacher' && !canManageClass(student.classId)) return;

  setPointUsageTransactions(prev => {
    const next = prev.map(t =>
      t.id === id
        ? {
            ...t,
            status: 'cancelled' as const,
            cancelledAt: new Date().toISOString(),
            cancelledBy: currentUser?.fullName || '',
            cancelledReason:
              reason || 'Giáo viên/Quản trị viên hủy',
          }
        : t
    );

    const updated = next.find(item => item.id === id);
    if (updated) void saveAppDocument('pointUsageTransactions', updated).catch(error => console.error('[Cancel Point Usage Error]', error));
    return next;
  });
};
  const handleUserLogin = (user: User) => {
    setClassesLoading(true);
    setStudentsLoading(true);
    setCurrentUser(user);
    if (user.role === 'student' && !user.avatarId) {
      setShowAvatarModal(true);
    }
  };

if (authLoading) {
  return null;
}
  if (!currentUser) {
    return <LoginModal onLogin={user => handleUserLogin(user)} />;
  }

  if (currentUser.mustChangePassword) {
    return (
      <FirstLoginPasswordModal
        user={currentUser}
        onComplete={() => setCurrentUser(user => user ? { ...user, mustChangePassword: false } : user)}
        onLogout={async () => {
          await signOut(auth);
          setCurrentUser(null);
        }}
      />
    );
  }

  if (classesLoading || studentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-sky-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-sky-100 shadow-xl px-8 py-7 text-center max-w-sm w-full">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin" />
          <p className="mt-4 font-black text-slate-800">Đang tải dữ liệu lớp từ hệ thống...</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">Dữ liệu mẫu sẽ không được hiển thị trong lúc chờ.</p>
        </div>
      </div>
    );
  }

  if (classesLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-rose-200 shadow-xl px-8 py-7 text-center max-w-md w-full">
          <p className="font-black text-rose-700">{classesLoadError}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Ứng dụng chưa hiển thị danh sách lớp để tránh dùng nhầm dữ liệu mẫu.</p>
          <button type="button" onClick={() => setClassesReloadKey(value => value + 1)} className="mt-5 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700">
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  if (studentsLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-rose-200 shadow-xl px-8 py-7 text-center max-w-md w-full">
          <p className="font-black text-rose-700">{studentsLoadError}</p>
          <p className="mt-2 text-xs font-semibold text-slate-500">Danh sách mẫu không được hiển thị. Hãy thử tải lại dữ liệu thật.</p>
          <button type="button" onClick={() => setStudentsReloadKey(value => value + 1)} className="mt-5 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700">Thử tải lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`iten-app iten-role-${currentUser.role} min-h-screen bg-[#f6f8fc] flex flex-col font-sans text-slate-900 selection:bg-blue-200`}>
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        notifications={notifications}
        onLogout={async () => {
  await signOut(auth);
  setCurrentUser(null);
}}
        onOpenAvatarSelection={() => setShowAvatarModal(true)}
        onReadNotification={id => {
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
          void markNotificationRead(currentUser.id, id).catch(error => console.error('[Mark Notification Read Error]', error));
        }}
      />

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Main navigation */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar
            activeTab={activeTab}
            onTabChange={tab => setActiveTab(tab)}
            currentUser={currentUser}
            onOpenAvatarSelection={() => setShowAvatarModal(true)}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-7 xl:p-8 pb-24 lg:pb-8">
          <div className="w-full max-w-7xl mx-auto min-w-0">
            {activeTab === 'dashboard' && (




              <DashboardTab
                currentUser={currentUser}
                onOpenAvatarSelection={() => setShowAvatarModal(true)}
                notifications={notifications}
                timetable={timetable}
                timetables={timetables}
                teacherSchedules={teacherSchedules}
                teacherWeeklyTimetables={teacherWeeklyTimetables}
                onUpdateTeacherWeeklyTimetables={tts => {
  if (isAdmin) {
    void persistCollectionChanges('teacherWeeklyTimetables', teacherWeeklyTimetables, tts).catch(console.error);
    setTeacherWeeklyTimetables(tts);
    return;
  }

  if (currentUser?.role !== 'teacher') return;

  const allowed = tts.every(item =>
    item.teacherId === currentUser.id
  );

  if (!allowed) return;

  void persistCollectionChanges('teacherWeeklyTimetables', teacherWeeklyTimetables, tts).catch(console.error);
  setTeacherWeeklyTimetables(tts);
}}
                classFunds={classFunds}
                classExpenses={classExpenses}
                onUpdateClassFunds={funds => {
  if (!canManage && !isCurrentTreasurer) return;

  const allowed = funds.every(fund =>
    canManageClass(fund.classId) || (isCurrentTreasurer && fund.classId === currentUser.classId)
  );

  if (!allowed) return;

  void persistCollectionChanges('classFunds', classFunds, funds).catch(console.error);
  setClassFunds(funds);
}}

onUpdateClassExpenses={exps => {
  if (!canManage && !isCurrentTreasurer) return;

  const allowed = exps.every(expense =>
    canManageClass(expense.classId) || (isCurrentTreasurer && expense.classId === currentUser.classId)
  );

  if (!allowed) return;

  void persistCollectionChanges('classExpenses', classExpenses, exps).catch(console.error);
  setClassExpenses(exps);
}}
                logbooks={logbooks}
                onUpdateLogbooks={lbs => {
  if (!canManage) return;

  const allowed = lbs.every(logbook =>
    canManageClass(logbook.classId)
  );

  if (!allowed) return;

  void persistCollectionChanges('classLogbooks', logbooks, lbs).catch(console.error);
  setLogbooks(lbs);
}}
                cleaning={cleaning}
                cleaningLoading={cleaningLoading}
                cleaningLoadError={cleaningLoadError}
                students={managedStudents}
                teachers={teachers}
               classesList={
  currentUser?.role === 'admin'
    ? classesList
    : classesList.filter(
        c => c.homeroomTeacher === currentUser?.fullName
      )
}

              onAddNotification={async n => {
  if (!canManage || !currentUser) {
    throw new Error('Bạn không có quyền đăng thông báo.');
  }

  if (currentUser.role === 'teacher') {
    if (!n.targetClassId || n.targetClassId !== currentUser.classId) {
      throw new Error('Bạn chỉ được đăng thông báo cho lớp mình phụ trách.');
    }
  }

  const notification: NotificationItem = {
    ...n,
    senderId: currentUser.id,
    senderName: currentUser.fullName,
    senderRole: currentUser.role,
  };

  await setNotification(notification);

  setNotifications(prev => [notification, ...prev]);
}}
                onUpdateTimetable={tt => {
  if (!canManageClass(tt.classId)) return;

  void saveAppDocument('timetables', tt).catch(error => console.error('[Save Timetable Error]', error));
  setTimetable(tt);

  setTimetables(prev =>
    prev.some(t => t.weekNumber === tt.weekNumber)
      ? prev.map(t =>
          t.weekNumber === tt.weekNumber ? tt : t
        )
      : [...prev, tt]
  );
}}

onUpdateTimetables={tts => {
  if (!canManage) return;

  const allowed = tts.every(tt =>
    canManageClass(tt.classId)
  );

  if (!allowed) return;

  void persistCollectionChanges('timetables', timetables, tts).catch(console.error);
  setTimetables(tts);
}}            onAddTeacherSchedule={ts => {
  if (isAdmin) {
    void saveAppDocument('teacherSchedules', ts).catch(console.error);
    setTeacherSchedules(prev => [ts, ...prev]);
    return;
  }

  if (currentUser?.role !== 'teacher') return;
  if (ts.teacherId !== currentUser.id) return;

  void saveAppDocument('teacherSchedules', ts).catch(console.error);
  setTeacherSchedules(prev => [ts, ...prev]);
}}

onUpdateTeacherSchedule={ts => {
  if (isAdmin) {
    void saveAppDocument('teacherSchedules', ts).catch(console.error);
    setTeacherSchedules(prev =>
      prev.map(t => t.id === ts.id ? ts : t)
    );
    return;
  }

  if (currentUser?.role !== 'teacher') return;
  if (ts.teacherId !== currentUser.id) return;

  void saveAppDocument('teacherSchedules', ts).catch(console.error);
  setTeacherSchedules(prev =>
    prev.map(t => t.id === ts.id ? ts : t)
  );
}}

onDeleteTeacherSchedule={id => {
  if (!canManage) return;

  const target = teacherSchedules.find(item => item.id === id);
  if (!target) return;

  if (!isAdmin && target.teacherId !== currentUser?.id) return;

  void deleteAppDocument('teacherSchedules', id).catch(console.error);
  setTeacherSchedules(prev =>
    prev.filter(item => item.id !== id)
  );
}}
                onUpdateCleaning={async cl => {
                  const isOfficerOfClass = currentUser?.role === 'student' &&
                    currentUser.position !== 'thành viên' && currentUser.classId === cl.classId;
                  if (!canManageClass(cl.classId) && !isOfficerOfClass) {
                    throw new Error('Bạn không có quyền cập nhật lịch vệ sinh của lớp này.');
                  }
                  await saveCleaningSchedule(cl);
                  setCleaning(cl);
                  setCleaningLoadError('');
                }}
                onAddStudent={async st => {
  if (!canManageClass(st.classId)) {
    throw { code: 'permission-denied', message: 'Bạn không có quyền thêm học sinh vào lớp này.' };
  }

  try {
    if (!auth.currentUser) {
      throw { code: 'unauthenticated', message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
    }

    const idToken = await auth.currentUser.getIdToken();

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/students/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(st),
      }
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw {
        code: result?.code || 'student-create-failed',
        field: result?.field,
        message: result?.error || 'Không thể tạo tài khoản học sinh.',
      };
    }

    const createdStudent = {
      ...st,
      id: result.uid,
    };

    setStudents(prev => [createdStudent, ...prev]);

    setClassesList(prev =>
      prev.map(c => {
        if (c.name === st.className || c.id === st.classId) {
          return {
            ...c,
            studentCount: (c.studentCount || 0) + 1,
            maleCount:
              st.gender === 'Nam'
                ? (c.maleCount || 0) + 1
                : (c.maleCount || 0),
            femaleCount:
              st.gender === 'Nữ'
                ? (c.femaleCount || 0) + 1
                : (c.femaleCount || 0),
            unionCount: st.isUnionMember
              ? (c.unionCount || 0) + 1
              : (c.unionCount || 0),
          };
        }

        return c;
      })
    );

  } catch (error) {
    console.error('[Add Student Error]', error);
    throw error;
  }
}}

onUpdateStudent={st => {
  if (!canManageClass(st.classId)) return;

  setStudents(prev =>
    prev.map(s => s.id === st.id ? st : s)
  );
}}

onDeleteStudent={async id => {
  if (!canManage) throw new Error('Bạn không có quyền xóa học sinh.');

  const target = students.find(s => s.id === id);
  if (!target) throw new Error('Không tìm thấy học sinh.');

  if (!canManageClass(target.classId)) throw new Error('Bạn chỉ được xóa học sinh thuộc lớp mình phụ trách.');

  if (!auth.currentUser) throw new Error('Phiên đăng nhập đã hết hạn.');
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/students/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error || 'Không thể xóa toàn bộ dữ liệu học sinh.');

  setStudents(prev =>
    prev.filter(s => s.id !== id)
  );
}}

onAddStudentsBulk={async newStudents => {
  if (!canManage) throw new Error('Bạn không có quyền nhập học sinh.');

  const allowed = newStudents.every(st =>
    canManageClass(st.classId)
  );

  if (!allowed) throw new Error('Danh sách có học sinh thuộc lớp bạn không quản lý.');

  if (!auth.currentUser) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  const idToken = await auth.currentUser.getIdToken();
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/students/create-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ students: newStudents }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error || 'Không thể nhập danh sách học sinh.');
  const synchronizedStudents = result.students as User[];

  setStudents(previous => {
    const next = [...previous];
    synchronizedStudents.forEach(student => {
      const existingIndex = next.findIndex(item =>
        item.id === student.id || item.email.toLowerCase() === student.email.toLowerCase()
      );
      if (existingIndex >= 0) next[existingIndex] = { ...next[existingIndex], ...student };
      else next.unshift(student);
    });
    return next;
  });
  return synchronizedStudents;
}}

             onAddClass={async cl => {
  try {
    await setClass(cl.id, cl);
    setClassesList(prev => [cl, ...prev]);
  } catch (error) {
    console.error('[Add Class Error]', error);
  }
}}

onUpdateClass={async cl => {
  const existing = classesList.find(c => c.id === cl.id);
  if (!existing) return;

  if (isAdmin) {
    await updateClass(cl.id, cl);

    setClassesList(prev =>
      prev.map(c => c.id === cl.id ? cl : c)
    );
    return;
  }

  if (!canManageClass(existing.id)) return;

  const updatedClass = {
    ...cl,
    id: existing.id,
    homeroomTeacher: existing.homeroomTeacher,
    teacherRole: existing.teacherRole,
    subject: existing.subject,
  };

  await updateClass(existing.id, updatedClass);

  setClassesList(prev =>
    prev.map(c =>
      c.id === cl.id ? updatedClass : c
    )
  );
}}
onDeleteClass={id => {
  if (!isAdmin) return;
  setClassesList(prev => prev.filter(c => c.id !== id));
}}
                onAddTeacher={async t => {
  if (!isAdmin) throw new Error('Chỉ quản trị viên được thêm giáo viên.');
  if (!auth.currentUser) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

  const idToken = await auth.currentUser.getIdToken();
  const teacherApiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/teachers/create`;
  let response: Response;
  try {
    response = await fetch(teacherApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(t),
    });
  } catch (error) {
    console.error('[Create Teacher Network Error]', { teacherApiUrl, error });
    throw new Error('Không kết nối được máy chủ tạo tài khoản giáo viên.');
  }
  const responseBody = await response.text();
  let result: { teacher?: User; error?: string; code?: string } = {};
  try {
    result = responseBody ? JSON.parse(responseBody) : {};
  } catch {
    console.error('[Create Teacher Invalid Response]', { teacherApiUrl, status: response.status, responseBody });
  }
  if (!response.ok) {
    throw new Error(result.error || `Máy chủ từ chối tạo giáo viên (HTTP ${response.status}).`);
  }
  if (!result.teacher) throw new Error('Máy chủ không trả về hồ sơ giáo viên vừa tạo.');
  setTeachers(prev => [result.teacher as User, ...prev]);
}}

onUpdateTeacher={t => {
  if (!isAdmin) return;
  setTeachers(prev =>
    prev.map(tc => tc.id === t.id ? t : tc)
  );
}}

onDeleteTeacher={id => {
  if (!isAdmin) return;
  setTeachers(prev =>
    prev.filter(tc => tc.id !== id)
  );
}}

onAddTeachersBulk={newTeachers => {
  if (!isAdmin) return;
  setTeachers(prev => [...newTeachers, ...prev]);
}}
                onUpdateCurrentUser={updatedUser => {
  if (!currentUser) return;

  if (updatedUser.id !== currentUser.id) return;

  setCurrentUser({
    ...currentUser,
    ...updatedUser,
    id: currentUser.id,
    role: currentUser.role,
    classId: currentUser.classId,
  });
}}
                learningRecords={learningRecords}
                disciplineRecords={disciplineRecords}
                pointUsageTransactions={pointUsageTransactions}
                onAddPointUsageTransaction={handleAddPointUsageTransaction}
                onCancelPointUsageTransaction={handleCancelPointUsageTransaction}
              />
            )}

            {activeTab === 'training_competition' && (
              <TrainingCompetitionTab
                currentUser={currentUser}
                disciplineRecords={disciplineRecords}
                complaints={complaints}
                students={managedStudents}
                selectedClassId={selectedTrainingClassId}
                onSelectedClassIdChange={setSelectedTrainingClassId}
                classOptions={managedClassOptions}
                pointUsageTransactions={pointUsageTransactions}
                onAddPointUsageTransaction={handleAddPointUsageTransaction}
                onCancelPointUsageTransaction={handleCancelPointUsageTransaction}
		onAddDisciplineRecord={rec => {
  if (!canManageClass(rec.classId)) return;

  void saveAppDocument('disciplineRecords', rec).catch(error => console.error('[Save Discipline Record Error]', error));
  setDisciplineRecords(prev => [rec, ...prev]);
}}

onUpdateDisciplineRecord={rec => {
  if (!canManageClass(rec.classId)) return;

  void saveAppDocument('disciplineRecords', rec).catch(error => console.error('[Update Discipline Record Error]', error));
  setDisciplineRecords(prev =>
    prev.map(r => r.id === rec.id ? rec : r)
  );
}}

onDeleteDisciplineRecord={id => {
  if (!canManage) return;

  const target = disciplineRecords.find(r => r.id === id);
  if (!target) return;

  if (!canManageClass(target.classId)) return;

  void deleteAppDocument('disciplineRecords', id).catch(error => console.error('[Delete Discipline Record Error]', error));
  setDisciplineRecords(prev =>
    prev.filter(r => r.id !== id)
  );
}}         
                onAddComplaint={cp => {
  void saveAppDocument('complaints', cp).catch(console.error);
  setComplaints(prev => [cp, ...prev]);
}}

onResolveComplaint={(id, response) => {
  if (!canManage) return;

  const target = complaints.find(cp => cp.id === id);
  if (!target) return;

  if (
    currentUser?.role === 'teacher' &&
    target.className !== currentUser.className
  ) {
    return;
  }

  const resolvedComplaint: Complaint = { ...target, status: 'Đã giải quyết', response };
  void saveAppDocument('complaints', resolvedComplaint).catch(console.error);
  setComplaints(prev =>
    prev.map(cp =>
      cp.id === id
        ? {
            ...cp,
            status: 'Đã giải quyết',
            response,
          }
        : cp
    )
  );
}}   />
            )}

            {activeTab === 'learning_competition' && (
              <LearningCompetitionTab
                currentUser={currentUser}
                learningRecords={learningRecords}
                students={managedStudents}
                selectedClassId={selectedLearningClassId}
                onSelectedClassIdChange={setSelectedLearningClassId}
                classOptions={managedClassOptions}
                pointUsageTransactions={pointUsageTransactions}
                onAddPointUsageTransaction={handleAddPointUsageTransaction}
                onCancelPointUsageTransaction={handleCancelPointUsageTransaction}
                onAddLearningRecord={rec => {
  if (!canManageClass(rec.classId)) return;
  const allowedRecord = learningRecordForCurrentTeacher(rec);
  if (!allowedRecord) return;
  void saveAppDocument('learningRecords', allowedRecord).catch(error => console.error('[Save Learning Record Error]', error));
  setLearningRecords(prev => [allowedRecord, ...prev]);
}}

onUpdateLearningRecord={rec => {
  if (!canManageClass(rec.classId)) return;
  const existing = learningRecords.find(item => item.id === rec.id);
  if (currentUser.role === 'teacher' && existing?.subjectName?.trim().toLocaleLowerCase('vi') !== currentUser.subject?.trim().toLocaleLowerCase('vi')) return;
  const allowedRecord = learningRecordForCurrentTeacher(rec);
  if (!allowedRecord) return;
  void saveAppDocument('learningRecords', allowedRecord).catch(error => console.error('[Update Learning Record Error]', error));
  setLearningRecords(prev => prev.map(r => r.id === rec.id ? allowedRecord : r));
}}

onDeleteLearningRecord={id => {
  if (!canManage) return;

  const target = learningRecords.find(r => r.id === id);
  if (!target) return;

  if (!canManageClass(target.classId)) return;

  void deleteAppDocument('learningRecords', id).catch(error => console.error('[Delete Learning Record Error]', error));
  setLearningRecords(prev =>
    prev.filter(r => r.id !== id)
  );
}}
              />
            )}

            {activeTab === 'activities' && (
              <ActivitiesTab
                flowerLoadState={flowerLoadState}
                currentUser={currentUser}
                students={managedStudents}
                classOptions={managedClassOptions}
                selectedSpyClassId={selectedSpyClassId}
                onSelectedSpyClassIdChange={setSelectedSpyClassId}
                spyClassStudents={spyClassStudents}
                spyMissionLoading={spyMissionLoading}
                spyMissionReady={spyMissionReady}
                attendanceRecords={attendanceRecords}
                onUpdateAttendance={recs =>{
  const isOfficer = currentUser?.role === 'student' && Boolean(currentUser.position) && currentUser.position !== 'thành viên';
  if (!currentUser || (!canManage && !isOfficer)) return;

  const allowed = recs.every(record =>
    canManageClass(record.classId) || (isOfficer && record.classId === currentUser.classId)
  );

  if (!allowed) return;

  setAttendanceRecords(recs);
}}                spyMission={spyMission}
                onUpdateSpyMission={m => {
  setSpyMission(m);
}}
                onSaveSpyMission={async mission => {
  if (!selectedSpyClassId || mission.classId !== selectedSpyClassId) {
    console.warn('[Save Spy Mission Blocked] Mission classId does not match selected classId.');
    throw new Error('Nhiệm vụ không thuộc lớp đang thao tác.');
  }
  const spyStudent = spyClassStudents.find(student => student.id === mission.spyStudentId);
  if (!spyStudent?.classId || spyStudent.classId !== mission.classId) {
    console.warn('[Save Spy Mission Blocked] Spy student does not belong to mission class.');
    throw new Error('Học sinh gián điệp không thuộc lớp đang thao tác.');
  }
  if (!canManageClass(mission.classId)) throw new Error('Bạn không có quyền sửa nhiệm vụ của lớp này.');
  await saveSpyMission(mission);
}}
                onCastSpyVote={async suspectId => {
  const missionClassId = spyMission.classId;
  if (!currentUser || !missionClassId || !selectedSpyClassId || missionClassId !== selectedSpyClassId) {
    throw new Error('Nhiệm vụ không thuộc lớp đang thao tác.');
  }

  const suspect = spyClassStudents.find(student => student.id === suspectId);
  if (!suspect?.classId || suspect.classId !== missionClassId) {
    throw new Error('Học sinh được bình chọn không thuộc lớp của nhiệm vụ.');
  }

  if (currentUser.role === 'student') {
    if (currentUser.classId !== missionClassId) throw new Error('Bạn không thuộc lớp của nhiệm vụ này.');
  } else if (currentUser.role === 'teacher') {
    if (!canManageClass(missionClassId)) throw new Error('Bạn không có quyền thao tác nhiệm vụ của lớp này.');
  } else if (currentUser.role !== 'admin') {
    throw new Error('Bạn không có quyền bình chọn.');
  }

  await castSpyVote(missionClassId, currentUser.id, suspect.id);
}}
                onResetSpyVotes={async () => {
  const missionClassId = spyMission.classId;
  if (!currentUser || !missionClassId || !selectedSpyClassId || missionClassId !== selectedSpyClassId) {
    throw new Error('Nhiệm vụ không thuộc lớp đang thao tác.');
  }

  if (currentUser.role === 'student') {
    if (currentUser.classId !== missionClassId) throw new Error('Bạn không thuộc lớp của nhiệm vụ này.');
  } else if (currentUser.role === 'teacher') {
    if (!canManageClass(missionClassId)) throw new Error('Bạn không có quyền thao tác nhiệm vụ của lớp này.');
  } else if (currentUser.role !== 'admin') {
    throw new Error('Bạn không có quyền thu hồi phiếu.');
  }

  await resetSpyVotes(missionClassId, currentUser.id);
}}
                onClearAllSpyVotes={async () => {
  const missionClassId = spyMission.classId;
  if (!currentUser || !missionClassId || !selectedSpyClassId || missionClassId !== selectedSpyClassId) {
    throw new Error('Nhiệm vụ không thuộc lớp đang thao tác.');
  }
  if (currentUser.role === 'teacher') {
    if (!canManageClass(missionClassId)) throw new Error('Bạn không có quyền xóa phiếu của lớp này.');
  } else if (currentUser.role !== 'admin') {
    throw new Error('Bạn không có quyền xóa toàn bộ phiếu.');
  }

  await clearAllSpyVotes(missionClassId);
}}
                onFinishSpyMission={async (mission, points) => {
  if (!selectedSpyClassId || !mission.classId || mission.classId !== selectedSpyClassId) {
    throw new Error('Nhiệm vụ không thuộc lớp đang thao tác.');
  }

  const spyStudent = spyClassStudents.find(student => student.id === mission.spyStudentId);
  if (!spyStudent?.classId || spyStudent.classId !== mission.classId) {
    throw new Error('Học sinh gián điệp không thuộc lớp của nhiệm vụ.');
  }

  const hasInvalidSuspect = (mission.votes || []).some(vote => {
    const suspect = spyClassStudents.find(student => student.id === vote.suspectId);
    return !suspect?.classId || suspect.classId !== mission.classId;
  });
  if (hasInvalidSuspect) throw new Error('Phiếu bầu chứa học sinh không thuộc lớp của nhiệm vụ.');

  const hasInvalidPoint = points.some(point => {
    const targetStudent = spyClassStudents.find(student => student.id === point.userId);
    return point.classId !== mission.classId ||
      point.activityId !== mission.id ||
      !targetStudent?.classId ||
      targetStudent.classId !== mission.classId;
  });
  if (hasInvalidPoint) throw new Error('Danh sách điểm tổng kết không hợp lệ cho lớp của nhiệm vụ.');

  if (!canManageClass(mission.classId)) throw new Error('Bạn không có quyền tổng kết vòng chơi.');
  await finishSpyMissionAndAward(mission, points);
}}
                onSaveAttendance={async records => {
  const isOfficer = currentUser?.role === 'student' && Boolean(currentUser.position) && currentUser.position !== 'thành viên';
  if (!currentUser || (!canManage && !isOfficer)) throw new Error('Bạn không có quyền điểm danh.');
  await saveAttendanceRecords(records);
}}
                onAwardAttendance={async points => {
  if (!canManage) throw new Error('Chỉ giáo viên hoặc quản trị viên được thưởng điểm chuyên cần.');
  await awardAttendancePoints(points);
}}
                flowerConfig={flowerConfig}
                onUpdateFlowerConfig={async cfg => {
  const classId = cfg.classId || currentUser?.classId;
  if (!classId) throw new Error('Chưa xác định lớp học.');
  if (!canManageClass(classId)) throw new Error('Bạn không có quyền chỉnh sửa trò chơi của lớp này.');

  const nextConfig = { ...cfg, classId };
  await saveFlowerGameConfig(nextConfig);
  setFlowerConfig(nextConfig);
}}                racingConfig={racingConfig}
                onUpdateRacingConfig={async cfg => {
  if (!canManageClass(cfg.classId)) throw new Error('Bạn không có quyền chỉnh sửa đường đua của lớp này.');
  await saveRacingGameConfig(cfg);
  setRacingConfig(cfg);
}}
                keyboardTask={keyboardTask}
                onUpdateKeyboardTask={t => {
  setKeyboardTask(t);
}}
                onSaveKeyboardTaskConfig={async task => {
  if (!canManageClass(task.classId)) throw new Error('Bạn không có quyền sửa đề bài của lớp này.');
  await saveKeyboardTaskConfig(task);
}}
                onSaveKeyboardSubmission={async submission => {
  if (!currentUser || submission.studentId !== currentUser.id || !currentUser.classId) throw new Error('Bài nộp không đúng tài khoản.');
  await saveKeyboardSubmission(currentUser.classId, submission);
}}
                onSetKeyboardLike={async (submissionId, liked) => {
  if (!currentUser?.classId) throw new Error('Chưa xác định lớp học.');
  await setKeyboardSubmissionLike(currentUser.classId, submissionId, currentUser.id, liked);
}}
                onAddKeyboardComment={async (submissionId, comment) => {
  if (!currentUser?.classId) throw new Error('Chưa xác định lớp học.');
  await appendKeyboardComment(currentUser.classId, submissionId, comment);
}}
                onGradeKeyboardSubmission={async (submission, point) => {
  if (!canManageClass(point.classId)) throw new Error('Bạn không có quyền chấm bài của lớp này.');
  await gradeKeyboardSubmissionAndAward(point.classId, submission, point);
}}
                memoryConfig={memoryConfig}
                onUpdateMemoryConfig={async cfg => {
  if (!canManageClass(cfg.classId)) throw new Error('Bạn không có quyền chỉnh sửa Thẻ nhớ của lớp này.');
  await saveMemoryGameConfig(cfg);
  setMemoryConfig(cfg);
}}
                disciplineRecords={disciplineRecords}
                learningRecords={learningRecords}
                onAddLearningRecord={rec => {
                  if (!canManage || !canManageClass(rec.classId)) return;
                  const allowedRecord = learningRecordForCurrentTeacher(rec);
                  if (!allowedRecord) return;
                  void saveAppDocument('learningRecords', allowedRecord).catch(error => console.error('[Save Learning Record Error]', error));
                  setLearningRecords(prev => [allowedRecord, ...prev]);
                }}
                onAddDisciplineRecord={rec => {
  if (!canManageClass(rec.classId)) return;

  void saveAppDocument('disciplineRecords', rec).catch(error => console.error('[Save Discipline Record Error]', error));
  setDisciplineRecords(prev => [rec, ...prev]);
}}
                onActivityPointSaved={mergeActivityPoint}
              />
            )}

            {activeTab === 'online_tests' && (
              <OnlineTestsTab
                currentUser={currentUser}
                classesList={classesList.filter(classItem =>
                  currentUser.role === 'admin'
                    ? true
                    : currentUser.role === 'teacher'
                      ? canManageClass(classItem.id)
                      : classItem.id === currentUser.classId
                )}
              />
            )}

            {activeTab === 'requests' && (
              <RequestsTab
                currentUser={currentUser}
                requests={accountRequests}
                onAdd={async request => {
                  if (request.userId !== currentUser.id || request.role !== currentUser.role) {
                    throw new Error('Thông tin người gửi không hợp lệ.');
                  }
                  await saveAppDocument('accountRequests', request);
                  setAccountRequests(previous => [request, ...previous.filter(item => item.id !== request.id)]);
                }}
                onSetHandled={async (id, handled) => {
                  if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
                    throw new Error('Bạn không có quyền xử lý yêu cầu.');
                  }
                  const target = accountRequests.find(item => item.id === id);
                  if (!target) throw new Error('Không tìm thấy yêu cầu.');
                  const updated: AccountRequest = {
                    ...target,
                    status: handled ? 'Đã xử lý' : 'Chưa xử lý',
                    ...(handled
                      ? { handledBy: currentUser.fullName, handledAt: new Date().toISOString() }
                      : { handledBy: '', handledAt: '' }),
                  };
                  await saveAppDocument('accountRequests', updated);
                  setAccountRequests(previous => previous.map(item => item.id === id ? updated : item));
                }}
                onDelete={async id => {
                  if (currentUser.role !== 'admin') throw new Error('Chỉ quản trị viên được xóa yêu cầu.');
                  await deleteAppDocument('accountRequests', id);
                  setAccountRequests(previous => previous.filter(item => item.id !== id));
                }}
              />
            )}

            {activeTab === 'utilities' && (
              <UtilitiesTab
                currentUser={currentUser}
                students={students}
                storageItems={storageItems.filter(s => s.userId === currentUser.id)}
                onAddStorageItem={item => {
  if (item.userId !== currentUser?.id) return;

  void saveAppDocument('personalStorageItems', item).catch(console.error);
  setStorageItems(prev => [item, ...prev]);
}}

onDeleteStorageItem={id => {
  const target = storageItems.find(s => s.id === id);
  if (!target) return;

  if (target.userId !== currentUser?.id) return;

  void deleteAppDocument('personalStorageItems', id).catch(console.error);
  setStorageItems(prev =>
    prev.filter(s => s.id !== id)
  );
}}
                onAwardPoints={(student, points, reason) => {
  if (!canManageClass(student.classId)) return;

  const newRec = {
    id: 'lr_' + Date.now(),
    studentId: student.id,
    studentName: student.fullName,
    classId: student.classId || 'class_1',
    categoryType: 'class' as const,
    type: 'reward' as const,
    activityName: 'Ao Cá May Mắn',
    category: 'Điểm HĐ học tập' as const,
    points: points,
    reason: reason || 'Phát biểu trả lời câu hỏi Ao Cá May Mắn',
    date: new Date().toISOString().split('T')[0],
    week: 1,
    month: new Date().getMonth() + 1,
    semester: 'Học kỳ 1',
    recordedBy: currentUser.fullName || 'Giáo viên'
  };

  const allowedRecord = learningRecordForCurrentTeacher(newRec);
  if (!allowedRecord) return;
  void saveAppDocument('learningRecords', allowedRecord).catch(error => console.error('[Save Learning Record Error]', error));
  setLearningRecords(prev => [allowedRecord, ...prev]);
}}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
      />

      {/* Avatar Selection Modal */}
      {showAvatarModal && currentUser && (
        <AvatarSelectionModal
          isOpen={showAvatarModal}
          currentAvatarId={currentUser.avatarId || 'avatar-01'}
          unavailableAvatarIds={Array.from(new Set(
            [...students, ...teachers]
              .filter(user => user.id !== currentUser.id)
              .map(user => user.avatarId)
              .filter((avatarId): avatarId is string => Boolean(avatarId))
          ))}
          isInitialSetup={currentUser.role === 'student' && !currentUser.avatarId}
          onConfirm={async (avatarId) => {
            const avatarObj = getAvatarById(avatarId);
            const updatedUser: User = {
              ...currentUser,
              avatarId: avatarId,
              avatar: avatarObj.svgUrl
            };

            // Persist the selection before updating the UI, so initial setup is
            // not considered complete if Firestore fails to save the avatar.
            await updateUser(updatedUser.id, {
              avatarId,
              avatar: avatarObj.svgUrl,
            });
            if (updatedUser.role === 'student') {
              await updateStudent(updatedUser.id, { avatarId, avatar: avatarObj.svgUrl });
            }
            setCurrentUser(updatedUser);
            setStudents(prev => prev.map(s => s.id === updatedUser.id ? { ...s, avatarId: avatarId, avatar: avatarObj.svgUrl } : s));
            setTeachers(prev => prev.map(t => t.id === updatedUser.id ? { ...t, avatarId: avatarId, avatar: avatarObj.svgUrl } : t));
            setShowAvatarModal(false);
          }}
          onClose={() => setShowAvatarModal(false)}
        />
      )}
    </div>
  );
}
