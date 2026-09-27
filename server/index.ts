import express from 'express';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  getFirestore,
  FieldValue,
} from 'firebase-admin/firestore';

dotenv.config();

const app = express();

const allowedOrigins = new Set([
  'http://localhost:3000',
  'https://final-1ef53.web.app',
  'https://final-1ef53.firebaseapp.com',
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Vary', 'Origin');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: '2mb' }));

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  '../final-1ef53-firebase-adminsdk-fbsvc-a3ad18a517.json';

if (!getApps().length) {
  if (existsSync(serviceAccountPath)) {
    // Local: dùng service account JSON trên máy
    initializeApp({
      credential: cert(serviceAccountPath),
    });
  } else {
    // Cloud Run: dùng Google Application Default Credentials
    initializeApp();
  }
}

const auth = getAuth();
const db = getFirestore();

function apiError(
  res: express.Response,
  status: number,
  code: string,
  message: string,
  field?: 'fullName' | 'email' | 'password'
) {
  return res.status(status).json({ error: message, code, field });
}

/**
 * Kiểm tra người gọi API có phải giáo viên hoặc admin hay không.
 */
async function requireStaff(
  req: express.Request,
  res: express.Response
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Chưa đăng nhập.',
    });

    return null;
  }

  try {
    const idToken = authHeader.substring(7);

    const decodedToken = await auth.verifyIdToken(idToken);

    const userDoc = await db
      .collection('users')
      .doc(decodedToken.uid)
      .get();

    const userData = userDoc.data();

    if (
      !userData ||
      !['admin', 'teacher'].includes(userData.role)
    ) {
      res.status(403).json({
        error: 'Bạn không có quyền tạo tài khoản học sinh.',
      });

      return null;
    }

    return {
      uid: decodedToken.uid,
      role: userData.role,
      fullName: userData.fullName,
    };
  } catch (error) {
    console.error('[Staff Auth Error]', error);

    res.status(401).json({
      error: 'Xác thực tài khoản thất bại.',
    });

    return null;
  }
}

async function requireAuthenticatedUser(
  req: express.Request,
  res: express.Response
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Chưa đăng nhập.', code: 'unauthenticated' });
    return null;
  }

  try {
    return await auth.verifyIdToken(authHeader.substring(7));
  } catch (error) {
    console.error('[User Auth Error]', error);
    res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ.', code: 'invalid-token' });
    return null;
  }
}

app.post('/api/users/complete-password-change', async (req, res) => {
  const decodedToken = await requireAuthenticatedUser(req, res);
  if (!decodedToken) return;

  try {
    const userRef = db.collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return apiError(res, 404, 'user-profile-not-found', 'Không tìm thấy hồ sơ người dùng.');
    }

    await userRef.update({
      mustChangePassword: false,
      passwordChangedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return res.json({ success: true });
  } catch (error) {
    console.error('[Complete Password Change Error]', error);
    return apiError(res, 500, 'password-change-state-failed', 'Đã đổi mật khẩu nhưng chưa thể cập nhật trạng thái tài khoản.');
  }
});

async function canManageClass(
  staff: { uid: string; role: string; fullName?: string },
  classId: string
): Promise<boolean> {
  if (staff.role === 'admin') return true;
  if (!classId) return false;
  const [staffDoc, classDoc] = await Promise.all([
    db.collection('users').doc(staff.uid).get(),
    db.collection('classes').doc(classId).get(),
  ]);
  const normalize = (value: unknown) => String(value || '').trim().toLocaleLowerCase('vi');
  return staffDoc.data()?.classId === classId || (
    classDoc.exists && normalize(classDoc.data()?.homeroomTeacher) === normalize(staff.fullName)
  );
}

app.delete('/api/students/:studentId', async (req, res) => {
  const staff = await requireStaff(req, res);
  if (!staff) return;
  try {
    const studentId = String(req.params.studentId || '').trim();
    const [studentDoc, userDoc] = await Promise.all([
      db.collection('students').doc(studentId).get(),
      db.collection('users').doc(studentId).get(),
    ]);
    const student = studentDoc.data() || userDoc.data();
    if (!student || student.role !== 'student') {
      return apiError(res, 404, 'student-not-found', 'Không tìm thấy hồ sơ học sinh.');
    }
    if (!await canManageClass(staff, String(student.classId || ''))) {
      return apiError(res, 403, 'class-permission-denied', 'Bạn chỉ được xóa học sinh thuộc lớp mình phụ trách.');
    }

    const linkedQueries: Array<[string, string]> = [
      ['activityPoints', 'userId'],
      ['attendanceRecords', 'studentId'],
      ['onlineTestSubmissions', 'studentId'],
      ['pointUsageTransactions', 'studentId'],
      ['complaints', 'studentId'],
      ['accountRequests', 'userId'],
      ['personalStorageItems', 'userId'],
      ['gardenSpins', 'studentId'],
      ['gardenSpinUsage', 'studentId'],
      ['notifications', 'targetStudentId'],
    ];
    const snapshots = await Promise.all(linkedQueries.map(([collectionName, field]) =>
      db.collection(collectionName).where(field, '==', studentId).get()
    ));
    const writer = db.bulkWriter();
    let deletedDocuments = 0;
    snapshots.forEach(snapshot => snapshot.docs.forEach(doc => {
      writer.delete(doc.ref);
      deletedDocuments += 1;
    }));
    writer.delete(db.collection('students').doc(studentId));
    writer.delete(db.collection('users').doc(studentId));
    deletedDocuments += 2;

    if (student.classId) {
      const classId = String(student.classId);
      for (const game of ['flowerGames', 'racingGames', 'memoryGames']) {
        await db.recursiveDelete(db.collection(game).doc(classId).collection('players').doc(studentId));
      }
      const keyboardSubmissions = await db.collection('keyboardTasks').doc(classId).collection('submissions').get();
      keyboardSubmissions.docs.forEach(doc => {
        const data = doc.data();
        if (data.studentId === studentId) {
          writer.delete(doc.ref);
          deletedDocuments += 1;
        } else if (Array.isArray(data.likes) && data.likes.includes(studentId)) {
          writer.update(doc.ref, { likes: data.likes.filter((id: string) => id !== studentId) });
        }
      });
      const spyRef = db.collection('spyGames').doc(classId);
      const [spyDoc, spyVotes] = await Promise.all([spyRef.get(), spyRef.collection('votes').get()]);
      spyVotes.docs.forEach(doc => {
        if (doc.id === studentId) {
          writer.delete(doc.ref);
          deletedDocuments += 1;
          return;
        }
        const suspectIds = doc.data().suspectIds;
        if (Array.isArray(suspectIds) && suspectIds.includes(studentId)) {
          writer.update(doc.ref, { suspectIds: suspectIds.filter((id: string) => id !== studentId) });
        }
      });
      if (spyDoc.exists && spyDoc.data()?.spyStudentId === studentId) {
        writer.update(spyRef, {
          spyStudentId: '',
          status: 'Chưa kích hoạt',
          summaryResult: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      const cleaningRef = db.collection('cleaningSchedules').doc(classId);
      const cleaningDoc = await cleaningRef.get();
      if (cleaningDoc.exists && Array.isArray(cleaningDoc.data()?.tasks)) {
        const tasks = cleaningDoc.data()!.tasks.map((task: any) => ({
          ...task,
          studentNames: Array.isArray(task.studentNames)
            ? task.studentNames.filter((name: string) => name !== student.fullName)
            : [],
        }));
        writer.update(cleaningRef, { tasks, updatedAt: FieldValue.serverTimestamp() });
      }
      const fundSnapshot = await db.collection('classFunds').where('classId', '==', classId).get();
      fundSnapshot.docs.forEach(doc => {
        const contributions = { ...(doc.data().contributions || {}) };
        if (Object.prototype.hasOwnProperty.call(contributions, studentId)) {
          delete contributions[studentId];
          writer.update(doc.ref, { contributions, updatedAt: FieldValue.serverTimestamp() });
        }
      });
    }
    await writer.close();
    try {
      await auth.deleteUser(studentId);
    } catch (error: any) {
      if (error?.code !== 'auth/user-not-found') throw error;
    }
    return res.json({ success: true, deletedDocuments });
  } catch (error) {
    console.error('[Delete Student Error]', error);
    return apiError(res, 500, 'student-delete-failed', 'Không thể xóa toàn bộ dữ liệu học sinh.');
  }
});

function serializeFirestoreDocument(id: string, data: FirebaseFirestore.DocumentData) {
  const serialized = Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (value && typeof value.toDate === 'function') return [key, value.toDate().toISOString()];
    return [key, value];
  }));
  return { ...serialized, id };
}

async function getUserProfile(uid: string) {
  const snapshot = await db.collection('users').doc(uid).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function canAccessOnlineTest(
  profile: FirebaseFirestore.DocumentData,
  uid: string,
  test: FirebaseFirestore.DocumentData
) {
  if (profile.role === 'admin') return true;
  if (profile.role === 'student') return Boolean(profile.classId && test.classIds?.includes(profile.classId));
  if (profile.role !== 'teacher') return false;
  if (test.createdBy === uid) return true;
  const permissions = await Promise.all((test.classIds || []).map((classId: string) =>
    canManageClass({ uid, role: profile.role, fullName: profile.fullName }, classId)
  ));
  return permissions.some(Boolean);
}

app.get('/api/online-tests', async (req, res) => {
  const decodedToken = await requireAuthenticatedUser(req, res);
  if (!decodedToken) return;
  try {
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile) return apiError(res, 404, 'user-profile-not-found', 'Không tìm thấy hồ sơ người dùng.');

    let snapshot: FirebaseFirestore.QuerySnapshot;
    if (profile.role === 'student') {
      if (!profile.classId) return res.json({ tests: [] });
      snapshot = await db.collection('onlineTests').where('classIds', 'array-contains', profile.classId).get();
    } else if (profile.role === 'teacher') {
      snapshot = await db.collection('onlineTests').where('createdBy', '==', decodedToken.uid).get();
    } else if (profile.role === 'admin') {
      snapshot = await db.collection('onlineTests').get();
    } else {
      return apiError(res, 403, 'role-not-allowed', 'Tài khoản không có quyền truy cập bài kiểm tra.');
    }

    const studentSubmissions = profile.role === 'student'
      ? await db.collection('onlineTestSubmissions').where('studentId', '==', decodedToken.uid).get()
      : null;
    const submissionsByTest = new Map(
      (studentSubmissions?.docs || []).map(doc => [doc.data().testId, serializeFirestoreDocument(doc.id, doc.data())])
    );
    const tests = snapshot.docs
      .map(doc => {
        const serialized: any = serializeFirestoreDocument(doc.id, doc.data());
        if (profile.role !== 'student') return serialized;
        return {
          ...serialized,
          questions: (serialized.questions || []).map((question: any) => ({
            ...question,
            correctAnswer: undefined,
            matchingPairs: (question.matchingPairs || []).map((pair: any) => ({ left: pair.left, right: pair.right })),
          })),
          mySubmission: submissionsByTest.get(doc.id),
        };
      })
      .filter((test: any) => profile.role !== 'student' || test.status !== 'draft')
      .sort((a: any, b: any) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
    return res.json({ tests });
  } catch (error) {
    console.error('[List Online Tests Error]', error);
    return apiError(res, 500, 'online-tests-load-failed', 'Không tải được danh sách bài kiểm tra.');
  }
});

app.put('/api/online-tests/:testId', async (req, res) => {
  const staff = await requireStaff(req, res);
  if (!staff) return;
  try {
    const testId = String(req.params.testId || '').trim();
    const payload = req.body || {};
    const classIds: string[] = Array.isArray(payload.classIds)
      ? [...new Set<string>(payload.classIds.map((value: unknown) => String(value).trim()).filter(Boolean))]
      : [];
    const questions = Array.isArray(payload.questions) ? payload.questions : [];
    if (!testId || !String(payload.title || '').trim() || !classIds.length || !questions.length) {
      return apiError(res, 400, 'invalid-online-test', 'Cần nhập tên bài, chọn lớp và có ít nhất một câu hỏi.');
    }
    if (!['live', 'homework'].includes(payload.mode) || !['draft', 'active', 'closed'].includes(payload.status)) {
      return apiError(res, 400, 'invalid-online-test-state', 'Hình thức hoặc trạng thái bài kiểm tra không hợp lệ.');
    }
    const permissions = await Promise.all(classIds.map(classId => canManageClass(staff, classId)));
    if (permissions.some(allowed => !allowed)) {
      return apiError(res, 403, 'class-permission-denied', 'Bạn chỉ được giao bài cho lớp mình phụ trách.');
    }

    const ref = db.collection('onlineTests').doc(testId);
    const existing = await ref.get();
    if (existing.exists && staff.role !== 'admin' && existing.data()?.createdBy !== staff.uid) {
      return apiError(res, 403, 'test-owner-required', 'Chỉ người tạo bài kiểm tra mới được chỉnh sửa.');
    }
    const cleanQuestions = questions.map((question: any, index: number) => {
      const matchingPairs = Array.isArray(question.matchingPairs)
        ? question.matchingPairs.map((pair: any) => ({
          left: String(pair?.left || '').trim(),
          right: String(pair?.right || '').trim(),
          answer: String(pair?.answer || '').trim(),
        }))
        : [];
      return {
        id: String(question.id || `q_${index + 1}`),
        type: String(question.type || ''),
        prompt: String(question.prompt || '').trim(),
        promptAfter: String(question.promptAfter || '').trim(),
        points: Math.max(0, Number(question.points) || 0),
        options: Array.isArray(question.options) ? question.options.map((value: unknown) => String(value).trim()) : [],
        correctAnswer: question.type === 'matching'
          ? matchingPairs.map((pair: any, pairIndex: number) => `${String.fromCharCode(97 + pairIndex)}-${pair.answer}`).join(',')
          : String(question.correctAnswer || '').trim(),
        matchingPairs,
        ...(typeof question.audioDataUrl === 'string' && question.audioDataUrl ? {
          audioDataUrl: question.audioDataUrl,
          audioName: String(question.audioName || 'audio'),
        } : {}),
      };
    });
    const invalidQuestion = cleanQuestions.some(question => {
      if (!['multiple_choice', 'fill_blank', 'matching', 'essay', 'true_false'].includes(question.type)) return true;
      if (question.type === 'fill_blank') return !question.correctAnswer;
      if (question.type === 'matching') return question.matchingPairs.length < 1 || question.matchingPairs.some((pair: any) => !pair.left || !pair.right || !pair.answer);
      if (!question.prompt) return true;
      if (question.type === 'essay') return false;
      if (question.type === 'multiple_choice') return question.options.length !== 4 || question.options.some((option: string) => !option) || !['A', 'B', 'C', 'D'].includes(question.correctAnswer);
      return !['Yes', 'No'].includes(question.correctAnswer);
    });
    if (invalidQuestion) {
      return apiError(res, 400, 'invalid-question', 'Có câu hỏi chưa đủ nội dung hoặc sai dạng câu hỏi.');
    }
    const totalPoints = cleanQuestions.reduce((sum, question) => sum + question.points, 0);
    if (cleanQuestions.some(question => question.points <= 0)) {
      return apiError(res, 400, 'invalid-question-points', 'Mỗi câu hỏi phải có số điểm lớn hơn 0.');
    }
    if (totalPoints > 10) {
      return apiError(res, 400, 'test-points-exceeded', 'Tổng điểm của bài kiểm tra không được vượt quá 10.');
    }
    const durationMinutes = payload.mode === 'live' ? Math.max(0, Number(payload.durationMinutes) || 0) : 0;
    if (!Number.isInteger(durationMinutes) || durationMinutes > 300) {
      return apiError(res, 400, 'invalid-test-duration', 'Thời gian đếm ngược phải là số phút từ 1 đến 300, hoặc để trống để không giới hạn.');
    }

    const test = {
      title: String(payload.title).trim(),
      description: String(payload.description || '').trim(),
      classIds,
      createdBy: existing.data()?.createdBy || staff.uid,
      createdByName: existing.data()?.createdByName || staff.fullName || '',
      mode: payload.mode,
      status: payload.status,
      startAt: '',
      endAt: String(payload.endAt || ''),
      durationMinutes,
      questions: cleanQuestions,
      updatedAt: FieldValue.serverTimestamp(),
      ...(!existing.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
    };
    await ref.set(test, { merge: true });
    return res.json({ success: true, test: { ...test, id: testId } });
  } catch (error) {
    console.error('[Save Online Test Error]', error);
    return apiError(res, 500, 'online-test-save-failed', 'Không lưu được bài kiểm tra.');
  }
});

app.delete('/api/online-tests/:testId', async (req, res) => {
  const staff = await requireStaff(req, res);
  if (!staff) return;
  try {
    const testId = String(req.params.testId || '').trim();
    const testRef = db.collection('onlineTests').doc(testId);
    const testDoc = await testRef.get();
    if (!testDoc.exists) return apiError(res, 404, 'test-not-found', 'Không tìm thấy bài kiểm tra.');
    if (staff.role !== 'admin' && testDoc.data()?.createdBy !== staff.uid) {
      return apiError(res, 403, 'test-owner-required', 'Chỉ người tạo bài kiểm tra mới được xóa bài.');
    }
    const submissions = await db.collection('onlineTestSubmissions').where('testId', '==', testId).get();
    const writer = db.bulkWriter();
    submissions.docs.forEach(doc => writer.delete(doc.ref));
    writer.delete(testRef);
    await writer.close();
    return res.json({ success: true, deletedSubmissions: submissions.size });
  } catch (error) {
    console.error('[Delete Online Test Error]', error);
    return apiError(res, 500, 'online-test-delete-failed', 'Không thể xóa bài kiểm tra và dữ liệu bài làm.');
  }
});

app.get('/api/online-tests/:testId/submissions', async (req, res) => {
  const decodedToken = await requireAuthenticatedUser(req, res);
  if (!decodedToken) return;
  try {
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return apiError(res, 403, 'staff-required', 'Chỉ giáo viên và quản trị viên được xem tiến độ.');
    }
    const testDoc = await db.collection('onlineTests').doc(req.params.testId).get();
    if (!testDoc.exists) return apiError(res, 404, 'test-not-found', 'Không tìm thấy bài kiểm tra.');
    if (!await canAccessOnlineTest(profile, decodedToken.uid, testDoc.data()!)) {
      return apiError(res, 403, 'test-access-denied', 'Bạn không có quyền xem bài kiểm tra này.');
    }
    const snapshot = await db.collection('onlineTestSubmissions').where('testId', '==', req.params.testId).get();
    return res.json({ submissions: snapshot.docs.map(doc => serializeFirestoreDocument(doc.id, doc.data())) });
  } catch (error) {
    console.error('[Online Test Submissions Error]', error);
    return apiError(res, 500, 'submissions-load-failed', 'Không tải được tiến độ làm bài.');
  }
});

app.post('/api/online-tests/:testId/start', async (req, res) => {
  const decodedToken = await requireAuthenticatedUser(req, res);
  if (!decodedToken) return;
  try {
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile || profile.role !== 'student') {
      return apiError(res, 403, 'student-required', 'Chỉ học sinh được bắt đầu làm bài.');
    }
    const testDoc = await db.collection('onlineTests').doc(req.params.testId).get();
    if (!testDoc.exists) return apiError(res, 404, 'test-not-found', 'Không tìm thấy bài kiểm tra.');
    const test = testDoc.data()!;
    if (!profile.classId || !test.classIds?.includes(profile.classId)) {
      return apiError(res, 403, 'test-class-denied', 'Bài kiểm tra không được giao cho lớp của bạn.');
    }
    if (test.status !== 'active') return apiError(res, 409, 'test-not-active', 'Bài kiểm tra chưa được mở.');
    const now = Date.now();
    if (test.startAt && now < new Date(test.startAt).getTime()) return apiError(res, 409, 'test-not-started', 'Chưa đến giờ bắt đầu làm bài.');
    if (test.endAt && now > new Date(test.endAt).getTime()) return apiError(res, 409, 'test-ended', 'Bài kiểm tra đã hết hạn.');

    const submissionId = `${req.params.testId}_${decodedToken.uid}`;
    const ref = db.collection('onlineTestSubmissions').doc(submissionId);
    const existing = await ref.get();
    if (existing.exists && existing.data()?.status === 'submitted') {
      return apiError(res, 409, 'already-submitted', 'Bài kiểm tra đã được nộp và không thể làm lại.');
    }
    if (existing.exists && test.mode === 'live' && Number(test.durationMinutes) > 0) {
      const expiresAt = new Date(existing.data()?.startedAt || 0).getTime() + Number(test.durationMinutes) * 60_000;
      if (Date.now() >= expiresAt) return apiError(res, 409, 'test-duration-ended', 'Bài kiểm tra đã hết thời gian làm bài.');
    }
    if (!existing.exists) {
      await ref.set({
        testId: req.params.testId,
        studentId: decodedToken.uid,
        studentName: profile.fullName || '',
        classId: profile.classId,
        status: 'in_progress',
        answers: {},
        integrityEvents: [],
        startedAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    const current = await ref.get();
    return res.json({ submission: serializeFirestoreDocument(current.id, current.data()!) });
  } catch (error) {
    console.error('[Start Online Test Error]', error);
    return apiError(res, 500, 'online-test-start-failed', 'Không thể bắt đầu bài kiểm tra.');
  }
});

app.post('/api/online-tests/:testId/submit', async (req, res) => {
  const decodedToken = await requireAuthenticatedUser(req, res);
  if (!decodedToken) return;
  try {
    const profile = await getUserProfile(decodedToken.uid);
    if (!profile || profile.role !== 'student') return apiError(res, 403, 'student-required', 'Chỉ học sinh được lưu bài làm.');
    const testDoc = await db.collection('onlineTests').doc(req.params.testId).get();
    if (!testDoc.exists) return apiError(res, 404, 'test-not-found', 'Không tìm thấy bài kiểm tra.');
    const test = testDoc.data()!;
    if (!profile.classId || !test.classIds?.includes(profile.classId)) return apiError(res, 403, 'test-class-denied', 'Bài kiểm tra không thuộc lớp của bạn.');
    if (test.status !== 'active') return apiError(res, 409, 'test-not-active', 'Bài kiểm tra đã kết thúc.');
    if (test.endAt && Date.now() > new Date(test.endAt).getTime()) {
      return apiError(res, 409, 'test-ended', 'Bài kiểm tra đã hết thời gian làm bài.');
    }
    const submissionId = `${req.params.testId}_${decodedToken.uid}`;
    const ref = db.collection('onlineTestSubmissions').doc(submissionId);
    const existing = await ref.get();
    if (!existing.exists) return apiError(res, 409, 'submission-not-started', 'Bạn chưa bắt đầu bài kiểm tra.');
    if (existing.data()?.status === 'submitted') return apiError(res, 409, 'already-submitted', 'Bài kiểm tra đã được nộp.');

    const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
    const integrityEvents = Array.isArray(req.body?.integrityEvents) ? req.body.integrityEvents.slice(-200) : [];
    const submitted = Boolean(req.body?.submitted);
    const durationMinutes = test.mode === 'live' ? Number(test.durationMinutes) || 0 : 0;
    if (durationMinutes > 0) {
      const startedAt = new Date(existing.data()?.startedAt || 0).getTime();
      const elapsed = Date.now() - startedAt;
      if (elapsed > durationMinutes * 60_000 + 15_000) {
        return apiError(res, 409, 'test-duration-ended', 'Đã hết thời gian làm bài. Bài không thể cập nhật thêm.');
      }
    }
    const normalize = (value: unknown) => String(value || '').trim().toLocaleLowerCase('vi');
    const questions = Array.isArray(test.questions) ? test.questions : [];
    const maxScore = questions.reduce((sum: number, question: any) => sum + (Number(question.points) || 0), 0);
    const score = questions.reduce((sum: number, question: any) => {
      if (question.type === 'essay') return sum;
      if (question.type === 'matching') {
        const expected = new Map(normalize(question.correctAnswer).split(',').map((part: string) => {
          const [key, value] = part.trim().split('-');
          return [key, value] as const;
        }));
        const submittedAnswers = new Map(normalize(answers[question.id]).split(',').map((part: string) => {
          const [key, value] = part.trim().split('-');
          return [key, value] as const;
        }));
        const pairCount = Array.isArray(question.matchingPairs) ? question.matchingPairs.length : 0;
        if (!pairCount) return sum;
        let correctPairs = 0;
        expected.forEach((value, key) => { if (submittedAnswers.get(key) === value) correctPairs += 1; });
        return sum + ((Number(question.points) || 0) * correctPairs / pairCount);
      }
      return normalize(answers[question.id]) === normalize(question.correctAnswer)
        ? sum + (Number(question.points) || 0)
        : sum;
    }, 0);
    const update = {
      answers,
      integrityEvents,
      status: submitted ? 'submitted' : 'in_progress',
      score: Math.round(score * 100) / 100,
      maxScore,
      updatedAt: FieldValue.serverTimestamp(),
      ...(submitted ? { submittedAt: new Date().toISOString() } : {}),
    };
    await ref.update(update);
    return res.json({ success: true, submission: { ...existing.data(), ...update, id: submissionId } });
  } catch (error) {
    console.error('[Submit Online Test Error]', error);
    return apiError(res, 500, 'online-test-submit-failed', 'Không lưu được bài làm.');
  }
});

/**
 * Tạo tài khoản Firebase Auth và hồ sơ giáo viên. Chỉ admin được phép gọi.
 */
app.post('/api/teachers/create', async (req, res) => {
  const staff = await requireStaff(req, res);
  if (!staff) return;
  if (staff.role !== 'admin') {
    return apiError(res, 403, 'admin-required', 'Chỉ quản trị viên được thêm giáo viên.');
  }

  const { email, password, fullName, ...profile } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedName = typeof fullName === 'string' ? fullName.trim() : '';

  if (!normalizedName) {
    return apiError(res, 400, 'invalid-name', 'Vui lòng nhập họ và tên giáo viên.', 'fullName');
  }
  if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return apiError(res, 400, 'invalid-email', 'Email giáo viên không hợp lệ.', 'email');
  }
  if (typeof password !== 'string' || password.length < 6) {
    return apiError(res, 400, 'weak-password', 'Mật khẩu phải có ít nhất 6 ký tự.', 'password');
  }

  let userRecord: Awaited<ReturnType<typeof auth.createUser>> | null = null;
  try {
    userRecord = await auth.createUser({
      email: normalizedEmail,
      password,
      displayName: normalizedName,
    });

    const cleanProfile = Object.fromEntries(
      Object.entries(profile).filter(([, value]) => value !== undefined)
    );
    const teacherProfile = {
      ...cleanProfile,
      id: userRecord.uid,
      username: typeof profile.username === 'string' && profile.username.trim()
        ? profile.username.trim()
        : normalizedEmail.split('@')[0],
      email: normalizedEmail,
      fullName: normalizedName,
      role: 'teacher',
      mustChangePassword: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    batch.set(db.collection('users').doc(userRecord.uid), teacherProfile);
    batch.set(db.collection('teachers').doc(userRecord.uid), teacherProfile);
    await batch.commit();

    return res.status(201).json({
      success: true,
      teacher: {
        ...cleanProfile,
        id: userRecord.uid,
        username: teacherProfile.username,
        email: normalizedEmail,
        fullName: normalizedName,
        role: 'teacher',
        mustChangePassword: true,
      },
    });
  } catch (error: any) {
    if (userRecord) {
      await Promise.allSettled([
        auth.deleteUser(userRecord.uid),
        db.collection('users').doc(userRecord.uid).delete(),
        db.collection('teachers').doc(userRecord.uid).delete(),
      ]);
    }

    if (error?.code === 'auth/email-already-exists') {
      return apiError(res, 409, 'email-already-exists', 'Email giáo viên đã tồn tại.', 'email');
    }
    if (error?.code === 'auth/invalid-email') {
      return apiError(res, 400, 'invalid-email', 'Email giáo viên không hợp lệ.', 'email');
    }
    if (error?.code === 'auth/invalid-password' || error?.code === 'auth/password-does-not-meet-requirements') {
      return apiError(res, 400, 'weak-password', 'Mật khẩu không đáp ứng yêu cầu.', 'password');
    }

    console.error('[Create Teacher Error]', error);
    return apiError(res, 500, 'teacher-create-failed', 'Không thể tạo tài khoản giáo viên. Vui lòng thử lại.');
  }
});

/**
 * Tạo tài khoản Firebase Auth + hồ sơ học sinh trong Firestore.
 */
app.post('/api/students/create', async (req, res) => {
  const staff = await requireStaff(req, res);

  if (!staff) {
    return;
  }

  try {
    const {
      email,
      password,
      fullName,
      ...profile
    } = req.body;

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const normalizedName = String(fullName).trim();

    if (typeof fullName !== 'string' || !normalizedName) {
      return apiError(res, 400, 'invalid-name', 'Vui lòng nhập họ và tên học sinh.', 'fullName');
    }

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return apiError(res, 400, 'invalid-email', 'Email không hợp lệ.', 'email');
    }

    if (typeof password !== 'string' || password.length < 6) {
      return apiError(res, 400, 'weak-password', 'Mật khẩu phải có ít nhất 6 ký tự.', 'password');
    }

    if (!await canManageClass(staff, String(profile.classId || ''))) {
      return apiError(res, 403, 'class-permission-denied', 'Bạn chỉ được thêm học sinh vào lớp mình phụ trách.');
    }

    let userRecord: Awaited<ReturnType<typeof auth.createUser>> | null = null;

    try {
      userRecord = await auth.createUser({
        email: normalizedEmail,
        password,
        displayName: normalizedName,
      });

      const {
        password: _password,
        ...safeProfile
      } = profile;

      const studentProfile = {
        ...safeProfile,
        id: userRecord.uid,
        email: normalizedEmail,
        fullName: normalizedName,
        role: 'student',
        mustChangePassword: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // The two Firestore documents succeed or fail together.
      const batch = db.batch();
      batch.set(db.collection('users').doc(userRecord.uid), studentProfile, { merge: true });
      batch.set(db.collection('students').doc(userRecord.uid), studentProfile, { merge: true });
      await batch.commit();
    } catch (error: any) {
      // Do not leave an Auth account behind when the Firestore profile cannot be saved.
      if (userRecord) {
        try {
          await auth.deleteUser(userRecord.uid);
        } catch (cleanupError) {
          console.error('[Create Student Cleanup Error]', cleanupError);
        }
      }

      const firebaseCode = error?.code;
      if (firebaseCode === 'auth/email-already-exists') {
        return apiError(res, 409, 'email-already-exists', 'Email đã tồn tại.', 'email');
      }
      if (firebaseCode === 'auth/invalid-email') {
        return apiError(res, 400, 'invalid-email', 'Email không hợp lệ.', 'email');
      }
      if (firebaseCode === 'auth/invalid-password' || firebaseCode === 'auth/password-does-not-meet-requirements') {
        return apiError(res, 400, 'weak-password', 'Mật khẩu không đáp ứng yêu cầu.', 'password');
      }

      console.error('[Create Student Error]', error);
      return apiError(
        res,
        500,
        userRecord ? 'firestore-write-failed' : 'auth-create-failed',
        userRecord
          ? 'Không thể lưu hồ sơ học sinh vào Firestore. Tài khoản chưa được tạo.'
          : 'Không thể tạo tài khoản học sinh. Vui lòng thử lại.'
      );
    }

    console.log(
      `[Create Student] ${normalizedName} - ${normalizedEmail} - by ${staff.fullName}`
    );

    return res.status(201).json({
      success: true,
      uid: userRecord.uid,
    });
  } catch (error) {
    console.error('[Create Student Request Error]', error);
    return apiError(res, 500, 'unexpected-error', 'Không thể tạo tài khoản học sinh. Vui lòng thử lại.');
  }
});

app.post('/api/students/create-bulk', async (req, res) => {
  const staff = await requireStaff(req, res);
  if (!staff) return;

  const students = Array.isArray(req.body?.students) ? req.body.students : [];
  if (students.length < 1 || students.length > 100) {
    return apiError(res, 400, 'invalid-batch-size', 'Mỗi lần chỉ được nhập từ 1 đến 100 học sinh.');
  }

  const normalized = students.map((student: any, index: number) => ({
    ...student,
    row: index + 1,
    fullName: typeof student.fullName === 'string' ? student.fullName.trim() : '',
    email: typeof student.email === 'string' ? student.email.trim().toLowerCase() : '',
    password: typeof student.password === 'string' ? student.password : '',
  }));
  const invalid = normalized.find((student: any) =>
    !student.fullName || !/^\S+@\S+\.\S+$/.test(student.email) || student.password.length < 6 || !student.classId
  );
  if (invalid) {
    return res.status(400).json({
      code: 'invalid-student-row',
      row: invalid.row,
      error: `Dòng ${invalid.row} chưa đủ họ tên, email hợp lệ, mật khẩu (ít nhất 6 ký tự) hoặc lớp.`,
    });
  }
  const emails = normalized.map((student: any) => student.email);
  if (new Set(emails).size !== emails.length) {
    return apiError(res, 400, 'duplicate-email-in-batch', 'Danh sách có email bị trùng.');
  }
  if (staff.role === 'teacher') {
    const classIds: string[] = [...new Set<string>(normalized.map((student: any) => String(student.classId)))];
    const permissions = await Promise.all(classIds.map(classId => canManageClass(staff, classId)));
    if (permissions.some(allowed => !allowed)) {
      return apiError(res, 403, 'class-permission-denied', 'Giáo viên chỉ được thêm học sinh vào lớp mình phụ trách.');
    }
  }

  const createdUsers: Array<{ uid: string; student: any }> = [];
  const synchronizedUsers: Array<{ uid: string; student: any; operation: 'created' | 'updated' | 'unchanged' }> = [];
  try {
    for (const student of normalized) {
      try {
        const existingAuthUser = await auth.getUserByEmail(student.email);
        const [userDoc, studentDoc] = await Promise.all([
          db.collection('users').doc(existingAuthUser.uid).get(),
          db.collection('students').doc(existingAuthUser.uid).get(),
        ]);
        const existingProfile = studentDoc.data() || userDoc.data();
        if (!existingProfile || existingProfile.role !== 'student') {
          throw Object.assign(new Error(`Email ${student.email} đã thuộc một tài khoản không phải học sinh.`), {
            code: 'email-belongs-to-other-role',
          });
        }

        const { password: _password, row: _row, id: _id, ...incomingProfile } = student;
        if (incomingProfile.address === '') delete incomingProfile.address;
        const changed = Object.entries(incomingProfile).some(([key, value]) => existingProfile[key] !== value);
        synchronizedUsers.push({
          uid: existingAuthUser.uid,
          student,
          operation: changed ? 'updated' : 'unchanged',
        });
      } catch (lookupError: any) {
        if (lookupError?.code !== 'auth/user-not-found') throw lookupError;
        const userRecord = await auth.createUser({
          email: student.email,
          password: student.password,
          displayName: student.fullName,
        });
        const created = { uid: userRecord.uid, student };
        createdUsers.push(created);
        synchronizedUsers.push({ ...created, operation: 'created' });
      }
    }

    const batch = db.batch();
    synchronizedUsers.forEach(({ uid, student, operation }) => {
      if (operation === 'unchanged') return;
      const { password: _password, row: _row, id: _id, ...profile } = student;
      if (operation !== 'created' && profile.address === '') delete profile.address;
      const studentProfile = {
        ...profile,
        id: uid,
        role: 'student',
        updatedAt: FieldValue.serverTimestamp(),
        ...(operation === 'created' ? {
          mustChangePassword: true,
          createdAt: FieldValue.serverTimestamp(),
        } : {}),
      };
      batch.set(db.collection('users').doc(uid), studentProfile, { merge: true });
      batch.set(db.collection('students').doc(uid), studentProfile, { merge: true });
    });
    await batch.commit();

    const counts = synchronizedUsers.reduce((total, item) => {
      total[item.operation] += 1;
      return total;
    }, { created: 0, updated: 0, unchanged: 0 });

    return res.status(200).json({
      success: true,
      counts,
      students: synchronizedUsers.map(({ uid, student, operation }) => {
        const { password: _password, row: _row, ...safeStudent } = student;
        return { ...safeStudent, id: uid, role: 'student', syncOperation: operation };
      }),
    });
  } catch (error: any) {
    await Promise.allSettled(createdUsers.map(({ uid }) => auth.deleteUser(uid)));
    console.error('[Bulk Student Sync Error]', error);
    if (error?.code === 'email-belongs-to-other-role') {
      return apiError(res, 409, error.code, error.message);
    }
    return apiError(res, 500, 'bulk-sync-failed', 'Không thể đồng bộ danh sách học sinh. Không có thay đổi nào được lưu.');
  }
});

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(value => value)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(value => value)) rows.push(row);
  return rows;
}

app.post('/api/students/read-google-sheet', async (req, res) => {
  const staff = await requireStaff(req, res);
  if (!staff) return;

  try {
    const sourceUrl = new URL(String(req.body?.url || ''));
    if (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== 'docs.google.com') {
      return apiError(res, 400, 'invalid-sheet-url', 'Vui lòng dùng link Google Sheet hợp lệ từ docs.google.com.');
    }
    const sheetId = sourceUrl.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (!sheetId) return apiError(res, 400, 'invalid-sheet-url', 'Không tìm thấy mã Google Sheet trong đường dẫn.');
    const gid = sourceUrl.searchParams.get('gid') || sourceUrl.hash.match(/gid=(\d+)/)?.[1] || '0';
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${encodeURIComponent(gid)}`;
    const sheetResponse = await fetch(exportUrl, { redirect: 'follow' });
    if (!sheetResponse.ok) {
      return apiError(res, 400, 'sheet-not-public', 'Không thể đọc Sheet. Hãy đặt quyền chia sẻ “Bất kỳ ai có đường liên kết đều có thể xem”.');
    }
    const csv = await sheetResponse.text();
    if (csv.length > 2_000_000) return apiError(res, 413, 'sheet-too-large', 'Google Sheet vượt quá dung lượng cho phép.');
    const rows = parseCsv(csv);
    if (rows.length < 2) return apiError(res, 400, 'empty-sheet', 'Sheet chưa có dữ liệu học sinh.');
    return res.json({ success: true, rows: rows.slice(0, 101) });
  } catch (error) {
    console.error('[Read Google Sheet Error]', error);
    return apiError(res, 400, 'invalid-sheet-url', 'Không thể đọc link Google Sheet này.');
  }
});

const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, () => {
  console.log(
    `Student Auth API running on port ${PORT}`
  );
});
