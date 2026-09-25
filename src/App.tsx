






import { auth } from './lib/firebase';
import { getClasses } from './services/classService';
import { updateClass, setClass, deleteClass } from './services/classService';
import { setNotification } from './services/notificationService';
import React, { useEffect, useState } from 'react';
import { getStudents, getStudentById } from './services/studentService';
import { User, MainTabType, NotificationItem, TimetableEntry, CleaningSchedule, DisciplineRecord, LearningRecord, Complaint, AccountRequest, AttendanceRecord, SpyGameMission, FlowerGameConfig, RacingGameConfig, KeyboardHeroTask, MemoryCardGameConfig, PersonalStorageItem, TeacherWorkSchedule, TeacherWeeklyTimetable, ClassFundItem, ClassFundExpense, ClassLogbookWeek, PointUsageTransaction, ActivityPointRecord } from './types';
import {
  DEMO_USERS,
  DEMO_NOTIFICATIONS,
  DEMO_TIMETABLE,
  DEMO_TIMETABLES,
  DEMO_TEACHER_SCHEDULES,
  DEMO_TEACHER_WEEKLY_TIMETABLES,
  DEMO_CLEANING,
  DEMO_DISCIPLINE_RECORDS,
  DEMO_LEARNING_RECORDS,
  DEMO_COMPLAINTS,
  DEMO_ACCOUNT_REQUESTS,
  DEMO_ATTENDANCE,
  DEMO_SPY_MISSION,
  DEMO_RACING_CONFIG,
  DEMO_KEYBOARD_TASK,
  DEMO_MEMORY_CONFIG,
  DEMO_STORAGE_ITEMS,
  DEMO_CLASSES,
  DEMO_CLASS_FUNDS,
  DEMO_CLASS_EXPENSES,
  DEMO_CLASS_LOGBOOKS,
  DEMO_POINT_USAGE_TRANSACTIONS
} from './mockData';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { DashboardTab } from './components/tabs/DashboardTab';
import { TrainingCompetitionTab } from './components/tabs/TrainingCompetitionTab';
import { LearningCompetitionTab } from './components/tabs/LearningCompetitionTab';
import { ActivitiesTab } from './components/tabs/ActivitiesTab';
import { UtilitiesTab } from './components/tabs/UtilitiesTab';
import { AvatarSelectionModal } from './components/game-ui/AvatarSelectionModal';
import { getAvatarById } from './utils/avatarHelper';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserById, updateUser } from './services/userService';
import { createEmptyFlowerGameConfig, getFlowerGameConfig, saveFlowerGameConfig } from './services/flowerGameService';
import { getRacingGameConfig, saveRacingGameConfig } from './services/racingGameService';
import { getMemoryGameConfig, saveMemoryGameConfig } from './services/memoryGameService';
import { appendKeyboardComment, getKeyboardTask, gradeKeyboardSubmissionAndAward, saveKeyboardSubmission, saveKeyboardTaskConfig, setKeyboardSubmissionLike } from './services/keyboardTaskService';
import { castSpyVote, clearAllSpyVotes, finishSpyMissionAndAward, getSpyMission, resetSpyVotes, saveSpyMission } from './services/spyGameService';
import { awardAttendancePoints, loadAttendanceRecords, saveAttendanceRecords } from './services/attendanceService';
import { activityPointToDisciplineRecord, activityPointToLearningRecord, loadActivityPointsForUser } from './services/activityPointService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTabType>('dashboard');
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const isStudent = currentUser?.role === 'student';
  const canManage = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';
  const canManageClass = (classId?: string) => {
  if (isAdmin) return true;

  if (currentUser?.role !== 'teacher' || !classId) {
    return false;
  }

  const managedClass = classesList.find(c => c.id === classId);

  return managedClass?.homeroomTeacher === currentUser.fullName;
};
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      setCurrentUser(null);
      setAuthLoading(false);
      return;
    }

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
  const loadClasses = async () => {
    try {
      const firestoreClasses = await getClasses();
console.log(
  '[CLASS 9A3]',
  firestoreClasses.find(c => c.name === 'Lớp 9a3')
);

      if (firestoreClasses.length > 0) {
        setClassesList(firestoreClasses);
      }
    } catch (error) {
      console.error('[Load Classes Error]', error);
    }
  };

  loadClasses();
}, []);

  // Application states initialized with demo data
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEMO_NOTIFICATIONS);
  const [timetable, setTimetable] = useState<TimetableEntry>(DEMO_TIMETABLE);
  const [timetables, setTimetables] = useState<TimetableEntry[]>(DEMO_TIMETABLES);
  const [teacherSchedules, setTeacherSchedules] = useState<TeacherWorkSchedule[]>(DEMO_TEACHER_SCHEDULES);
  const [teacherWeeklyTimetables, setTeacherWeeklyTimetables] = useState<TeacherWeeklyTimetable[]>(DEMO_TEACHER_WEEKLY_TIMETABLES);
  const [cleaning, setCleaning] = useState<CleaningSchedule>(DEMO_CLEANING);
  const [disciplineRecords, setDisciplineRecords] = useState<DisciplineRecord[]>(DEMO_DISCIPLINE_RECORDS);
  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>(DEMO_LEARNING_RECORDS);

  const mergeActivityPoint = (point: ActivityPointRecord) => {
    if (point.pointType === 'academic_activity') {
      const record = activityPointToLearningRecord(point);
      setLearningRecords(prev => [record, ...prev.filter(item => item.id !== record.id)]);
    } else {
      const record = activityPointToDisciplineRecord(point);
      setDisciplineRecords(prev => [record, ...prev.filter(item => item.id !== record.id)]);
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') return;
    let cancelled = false;
    loadActivityPointsForUser(currentUser.id)
      .then(points => {
        if (cancelled) return;
        const academic = points.filter(point => point.pointType === 'academic_activity').map(activityPointToLearningRecord);
        const training = points.filter(point => point.pointType === 'training_activity').map(activityPointToDisciplineRecord);
        setLearningRecords(prev => [...academic, ...prev.filter(item => !academic.some(saved => saved.id === item.id))]);
        setDisciplineRecords(prev => [...training, ...prev.filter(item => !training.some(saved => saved.id === item.id))]);
      })
      .catch(error => console.error('[Load Activity Points Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.role]);
  const [complaints, setComplaints] = useState<Complaint[]>(DEMO_COMPLAINTS);
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>(DEMO_ACCOUNT_REQUESTS);
  const [students, setStudents] = useState<User[]>(DEMO_USERS.filter(u => u.role === 'student'));
	useEffect(() => {
  const loadStudents = async () => {
    try {
      const firestoreStudents = await getStudents();

      console.log('[Students] Firestore result:', firestoreStudents);
      console.log('[Students] Firestore count:', firestoreStudents.length);

      setStudents(firestoreStudents as User[]);
    } catch (error) {
      console.error('[Students] Lỗi tải Firestore:', error);
    }

    try {
      const testStudent = await getStudentById(
        '9e5Sp3kRuURU1q4RQyP9DCMiOnt2'
      );

      console.log('[Auth] current UID:', auth.currentUser?.uid);
      console.log('[Auth] current email:', auth.currentUser?.email);

console.log('[CURRENT USER]', currentUser);

      console.log('[Students] Direct test:', testStudent);
    } catch (error) {
      console.error('[Students] Direct test ERROR:', error);
    }
  };

  loadStudents();
}, []);



useEffect(() => {
  console.log('[STUDENTS STATE]', {
    count: students.length,
    students,
    currentUserClassId: currentUser?.classId,
    currentUserClassName: currentUser?.className,
  });
}, [students, currentUser]);



  const [teachers, setTeachers] = useState<User[]>(DEMO_USERS.filter(u => u.role === 'teacher'));
  const [classesList, setClassesList] = useState<any[]>(DEMO_CLASSES);
useEffect(() => {
  if (!currentUser || currentUser.role !== 'teacher') return;

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
}, [classesList, currentUser]);

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(DEMO_ATTENDANCE);
  useEffect(() => {
    const classId = currentUser?.classId;
    if (!classId) return;
    let cancelled = false;
    loadAttendanceRecords(classId).then(records => { if (!cancelled) setAttendanceRecords(records); })
      .catch(error => console.error('[Load Attendance Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.classId, currentUser?.id]);
  const [spyMission, setSpyMission] = useState<SpyGameMission>(DEMO_SPY_MISSION);
  useEffect(() => {
    const classId = currentUser?.classId;
    if (!classId) return;
    setSpyMission({ ...DEMO_SPY_MISSION, id: `spy_${classId}`, classId, status: 'Chưa kích hoạt', votes: [], summaryResult: undefined });
    let cancelled = false;
    getSpyMission(classId).then(mission => { if (!cancelled && mission) setSpyMission(mission); })
      .catch(error => console.error('[Load Spy Mission Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.classId, currentUser?.id]);
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
  const [racingConfig, setRacingConfig] = useState<RacingGameConfig>(DEMO_RACING_CONFIG);
  useEffect(() => {
    const classId = currentUser?.classId;
    if (!classId) return;
    setRacingConfig({
      ...DEMO_RACING_CONFIG,
      id: `racing_${classId}`,
      classId,
      isActive: false,
      teams: DEMO_RACING_CONFIG.teams.map(team => ({ ...team, currentDistance: 0 })),
    });
    let cancelled = false;
    getRacingGameConfig(classId)
      .then(config => { if (!cancelled && config) setRacingConfig(config); })
      .catch(error => console.error('[Load Racing Game Config Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.classId, currentUser?.id]);
  const [keyboardTask, setKeyboardTask] = useState<KeyboardHeroTask>(DEMO_KEYBOARD_TASK);
  useEffect(() => {
    const classId = currentUser?.classId;
    if (!classId) return;
    setKeyboardTask({ ...DEMO_KEYBOARD_TASK, id: `keyboard_${classId}`, classId, submissions: [] });
    let cancelled = false;
    getKeyboardTask(classId)
      .then(task => { if (!cancelled && task) setKeyboardTask(task); })
      .catch(error => console.error('[Load Keyboard Task Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.classId, currentUser?.id]);
  const [memoryConfig, setMemoryConfig] = useState<MemoryCardGameConfig>(DEMO_MEMORY_CONFIG);
  useEffect(() => {
    const classId = currentUser?.classId;
    if (!classId) return;
    setMemoryConfig({ ...DEMO_MEMORY_CONFIG, id: `memory_${classId}`, classId, isActive: false });
    let cancelled = false;
    getMemoryGameConfig(classId)
      .then(config => { if (!cancelled && config) setMemoryConfig(config); })
      .catch(error => console.error('[Load Memory Game Config Error]', error));
    return () => { cancelled = true; };
  }, [currentUser?.classId, currentUser?.id]);
  const [storageItems, setStorageItems] = useState<PersonalStorageItem[]>(DEMO_STORAGE_ITEMS);
  const [classFunds, setClassFunds] = useState<ClassFundItem[]>(DEMO_CLASS_FUNDS);
  const [classExpenses, setClassExpenses] = useState<ClassFundExpense[]>(DEMO_CLASS_EXPENSES);
  const [logbooks, setLogbooks] = useState<ClassLogbookWeek[]>(DEMO_CLASS_LOGBOOKS);
  const [pointUsageTransactions, setPointUsageTransactions] = useState<PointUsageTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('iten_point_usage_transactions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEMO_POINT_USAGE_TRANSACTIONS;
  });

  const handleAddPointUsageTransaction = (tx: PointUsageTransaction) => {
  if (!canManage) return;

  if (currentUser?.role === 'teacher') {
    const student = students.find(s => s.id === tx.studentId);

    if (!student || student.classId !== currentUser.classId) {
      return;
    }
  }

  setPointUsageTransactions(prev => {
    const next = [tx, ...prev];

    try {
      localStorage.setItem(
        'iten_point_usage_transactions',
        JSON.stringify(next)
      );
    } catch (e) {
      console.error(e);
    }

    return next;
  });
};

const handleCancelPointUsageTransaction = (
  id: string,
  reason?: string
) => {
  if (!canManage) return;

  const target = pointUsageTransactions.find(t => t.id === id);
  if (!target) return;

  if (currentUser?.role === 'teacher') {
    const student = students.find(s => s.id === target.studentId);

    if (!student || student.classId !== currentUser.classId) {
      return;
    }
  }

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

    try {
      localStorage.setItem(
        'iten_point_usage_transactions',
        JSON.stringify(next)
      );
    } catch (e) {
      console.error(e);
    }

    return next;
  });
};
  const handleUserLogin = (user: User) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-sky-50/30 to-emerald-50/40 flex flex-col font-sans text-slate-900 selection:bg-amber-200">
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
          setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        }}
      />

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        {/* Sidebar with exactly 5 main tabs */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar
            activeTab={activeTab}
            onTabChange={tab => setActiveTab(tab)}
            currentUser={currentUser}
            onOpenAvatarSelection={() => setShowAvatarModal(true)}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-8 pb-24 lg:pb-8">
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
    setTeacherWeeklyTimetables(tts);
    return;
  }

  if (currentUser?.role !== 'teacher') return;

  const allowed = tts.every(item =>
    item.teacherId === currentUser.id
  );

  if (!allowed) return;

  setTeacherWeeklyTimetables(tts);
}}
                classFunds={classFunds}
                classExpenses={classExpenses}
                onUpdateClassFunds={funds => {
  if (!canManage) return;

  const allowed = funds.every(fund =>
    canManageClass(fund.classId)
  );

  if (!allowed) return;

  setClassFunds(funds);
}}

onUpdateClassExpenses={exps => {
  if (!canManage) return;

  const allowed = exps.every(expense =>
    canManageClass(expense.classId)
  );

  if (!allowed) return;

  setClassExpenses(exps);
}}
                logbooks={logbooks}
                onUpdateLogbooks={lbs => {
  if (!canManage) return;

  const allowed = lbs.every(logbook =>
    canManageClass(logbook.classId)
  );

  if (!allowed) return;

  setLogbooks(lbs);
}}
                cleaning={cleaning}
                students={
  currentUser?.role === 'admin'
    ? students
    : students.filter(
        s =>
          s.classId === currentUser?.classId ||
          s.className === currentUser?.className
      )
}
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

  setTimetables(tts);
}}            onAddTeacherSchedule={ts => {
  if (isAdmin) {
    setTeacherSchedules(prev => [ts, ...prev]);
    return;
  }

  if (currentUser?.role !== 'teacher') return;
  if (ts.teacherId !== currentUser.id) return;

  setTeacherSchedules(prev => [ts, ...prev]);
}}

onUpdateTeacherSchedule={ts => {
  if (isAdmin) {
    setTeacherSchedules(prev =>
      prev.map(t => t.id === ts.id ? ts : t)
    );
    return;
  }

  if (currentUser?.role !== 'teacher') return;
  if (ts.teacherId !== currentUser.id) return;

  setTeacherSchedules(prev =>
    prev.map(t => t.id === ts.id ? ts : t)
  );
}}

onDeleteTeacherSchedule={id => {
  if (!canManage) return;

  const target = teacherSchedules.find(item => item.id === id);
  if (!target) return;

  if (!isAdmin && target.teacherId !== currentUser?.id) return;

  setTeacherSchedules(prev =>
    prev.filter(item => item.id !== id)
  );
}}
                onUpdateCleaning={cl =>{ if (!canManageClass(cl.classId)) return; setCleaning(cl)}}
                onAddAccountRequest={req => {
  setAccountRequests(prev => [req, ...prev]);
}}

onResolveRequest={(id, status) => {
  if (!canManage) return;

  const target = accountRequests.find(r => r.id === id);
  if (!target) return;

  if (currentUser?.role === 'teacher') {
    const targetUser = students.find(s => s.id === target.userId);

    if (!targetUser || targetUser.classId !== currentUser.classId) {
      return;
    }
  }

  setAccountRequests(prev =>
    prev.map(r =>
      r.id === id ? { ...r, status } : r
    )
  );
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

onDeleteStudent={id => {
  if (!canManage) return;

  const target = students.find(s => s.id === id);
  if (!target) return;

  if (!canManageClass(target.classId)) return;

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
  const createdStudents = result.students as User[];

  setStudents(prev => [...createdStudents, ...prev]);
  setClassesList(prev => prev.map(c => {
    const added = createdStudents.filter(st => st.classId === c.id || st.className === c.name);
    if (!added.length) return c;
    return {
      ...c,
      studentCount: (c.studentCount || 0) + added.length,
      maleCount: (c.maleCount || 0) + added.filter(st => st.gender === 'Nam').length,
      femaleCount: (c.femaleCount || 0) + added.filter(st => st.gender === 'Nữ').length,
      unionCount: (c.unionCount || 0) + added.filter(st => st.isUnionMember).length,
    };
  }));
  return createdStudents;
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
                onAddTeacher={t => {
  if (!isAdmin) return;
  setTeachers(prev => [t, ...prev]);
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
                students={students}
                pointUsageTransactions={pointUsageTransactions}
                onAddPointUsageTransaction={handleAddPointUsageTransaction}
                onCancelPointUsageTransaction={handleCancelPointUsageTransaction}
   		onAddDisciplineRecord={rec => {
  if (!canManageClass(rec.classId)) return;

  setDisciplineRecords(prev => [rec, ...prev]);
}}

onUpdateDisciplineRecord={rec => {
  if (!canManageClass(rec.classId)) return;

  setDisciplineRecords(prev =>
    prev.map(r => r.id === rec.id ? rec : r)
  );
}}

onDeleteDisciplineRecord={id => {
  if (!canManage) return;

  const target = disciplineRecords.find(r => r.id === id);
  if (!target) return;

  if (!canManageClass(target.classId)) return;

  setDisciplineRecords(prev =>
    prev.filter(r => r.id !== id)
  );
}}         
                onAddComplaint={cp => {
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
                students={students}
                pointUsageTransactions={pointUsageTransactions}
                onAddPointUsageTransaction={handleAddPointUsageTransaction}
                onCancelPointUsageTransaction={handleCancelPointUsageTransaction}
                onAddLearningRecord={rec => {
  if (!canManageClass(rec.classId)) return;

  setLearningRecords(prev => [rec, ...prev]);
}}

onUpdateLearningRecord={rec => {
  if (!canManageClass(rec.classId)) return;

  setLearningRecords(prev =>
    prev.map(r => r.id === rec.id ? rec : r)
  );
}}

onDeleteLearningRecord={id => {
  if (!canManage) return;

  const target = learningRecords.find(r => r.id === id);
  if (!target) return;

  if (!canManageClass(target.classId)) return;

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
                students={students}
                attendanceRecords={attendanceRecords}
                onUpdateAttendance={recs =>{
  if (!canManage) return;

  const allowed = recs.every(record =>
    canManageClass(record.classId)
  );

  if (!allowed) return;

  setAttendanceRecords(recs);
}}                spyMission={spyMission}
                onUpdateSpyMission={m => {
  setSpyMission(m);
}}
                onSaveSpyMission={async mission => {
  if (!canManageClass(mission.classId)) throw new Error('Bạn không có quyền sửa nhiệm vụ của lớp này.');
  await saveSpyMission(mission);
}}
                onCastSpyVote={async suspectId => {
  if (!currentUser?.classId) throw new Error('Chưa xác định lớp học.');
  await castSpyVote(currentUser.classId, currentUser.id, suspectId);
}}
                onResetSpyVotes={async () => {
  if (!currentUser?.classId) throw new Error('Chưa xác định lớp học.');
  await resetSpyVotes(currentUser.classId, currentUser.id);
}}
                onClearAllSpyVotes={async () => {
  if (!currentUser?.classId || !canManageClass(currentUser.classId)) throw new Error('Bạn không có quyền xóa phiếu.');
  await clearAllSpyVotes(currentUser.classId);
}}
                onFinishSpyMission={async (mission, points) => {
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
                onAddLearningRecord={rec => {if (!canManage) return;setLearningRecords([rec, ...learningRecords])}}
                onAddDisciplineRecord={rec => {
  if (!canManageClass(rec.classId)) return;

  setDisciplineRecords(prev => [rec, ...prev]);
}}
                onActivityPointSaved={mergeActivityPoint}
              />
            )}

            {activeTab === 'utilities' && (
              <UtilitiesTab
                currentUser={currentUser}
                students={students}
                storageItems={storageItems.filter(s => s.userId === currentUser.id)}
                onAddStorageItem={item => {
  if (item.userId !== currentUser?.id) return;

  setStorageItems(prev => [item, ...prev]);
}}

onDeleteStorageItem={id => {
  const target = storageItems.find(s => s.id === id);
  if (!target) return;

  if (target.userId !== currentUser?.id) return;

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
    type: 'star' as const,
    points: points,
    reason: reason || 'Phát biểu trả lời câu hỏi Ao Cá May Mắn',
    date: new Date().toISOString().split('T')[0],
    week: 1,
    month: new Date().getMonth() + 1,
    semester: 'Học kỳ 1',
    recordedBy: currentUser.fullName || 'Giáo viên'
  };

  setLearningRecords(prev => [newRec, ...prev]);
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
