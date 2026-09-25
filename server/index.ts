import express from 'express';
import dotenv from 'dotenv';

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  getFirestore,
  FieldValue,
} from 'firebase-admin/firestore';

dotenv.config();

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  '../final-1ef53-firebase-adminsdk-fbsvc-a3ad18a517.json';

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccountPath),
  });
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
  try {
    for (const student of normalized) {
      const userRecord = await auth.createUser({
        email: student.email,
        password: student.password,
        displayName: student.fullName,
      });
      createdUsers.push({ uid: userRecord.uid, student });
    }

    const batch = db.batch();
    createdUsers.forEach(({ uid, student }) => {
      const { password: _password, row: _row, id: _id, ...profile } = student;
      const studentProfile = {
        ...profile,
        id: uid,
        role: 'student',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      batch.set(db.collection('users').doc(uid), studentProfile);
      batch.set(db.collection('students').doc(uid), studentProfile);
    });
    await batch.commit();

    return res.status(201).json({
      success: true,
      students: createdUsers.map(({ uid, student }) => {
        const { password: _password, row: _row, ...safeStudent } = student;
        return { ...safeStudent, id: uid, role: 'student' };
      }),
    });
  } catch (error: any) {
    await Promise.allSettled(createdUsers.map(async ({ uid }) => {
      await auth.deleteUser(uid);
      await Promise.all([
        db.collection('users').doc(uid).delete(),
        db.collection('students').doc(uid).delete(),
      ]);
    }));
    const code = error?.code === 'auth/email-already-exists' ? 'email-already-exists' : 'bulk-create-failed';
    const row = createdUsers.length + 1;
    return res.status(error?.code === 'auth/email-already-exists' ? 409 : 500).json({
      code,
      row,
      error: error?.code === 'auth/email-already-exists'
        ? `Email ở dòng ${row} đã tồn tại. Không có học sinh nào được thêm.`
        : 'Không thể tạo danh sách học sinh. Không có học sinh nào được thêm.',
    });
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
