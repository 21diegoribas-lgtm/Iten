/**
 * SCRIPT PROVISIONING: FIREBASE AUTH & FIRESTORE PROFILES (SERVER-SIDE ONLY)
 *
 * Tạo Firebase Auth users với Custom UID trùng ID dữ liệu (s1, s2, t1, t2, a1...)
 * và đồng bộ profile vào Firestore /users/{uid}.
 *
 * BẢO MẬT:
 * - Chỉ chạy server-side / Admin CLI.
 * - Không import vào frontend hoặc bundle vào Vite client.
 * - Credentials lấy từ GOOGLE_APPLICATION_CREDENTIALS hoặc FIREBASE_SERVICE_ACCOUNT_JSON.
 * - Không ghi password vào Firestore, GitHub hoặc console.
 * - LIVE sẽ tạo password ngẫu nhiên riêng cho từng tài khoản, sau đó tạo
 *   password-reset link để người dùng tự đặt mật khẩu.
 *
 * LƯU Ý:
 * - Firebase Auth không cho lấy lại plaintext password sau khi tạo.
 * - File chứa reset links là dữ liệu nhạy cảm: không commit GitHub và không chia sẻ công khai.
 */

import {
  initializeApp,
  cert,
  applicationDefault,
  getApps,
  type App,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { DEMO_USERS } from '../src/mockData';
import type { User } from '../src/types';

interface ProvisionOptions {
  dryRun?: boolean;
}

function initializeFirebaseAdmin(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const googleCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'final-1ef53';

  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(parsed),
        projectId,
      });
    } catch (err) {
      console.error('Lỗi phân tích FIREBASE_SERVICE_ACCOUNT_JSON:', err);
      return null;
    }
  }

  if (googleCredentialsPath) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  return null;
}

function sanitizeUserForFirestore(user: User): Record<string, unknown> {
  const { password: _pwd, ...safeData } = user;
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(safeData)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  return payload;
}

function generateTemporaryPassword(): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=';
  const bytes = randomBytes(20);
  let password = '';

  for (const byte of bytes) {
    password += alphabet[byte % alphabet.length];
  }

  return password;
}

async function writeResetLinksFile(
  links: Array<{ uid: string; email: string; resetLink: string }>,
): Promise<void> {
  const outputPath = 'auth-reset-links.local.json';

  await writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        warning:
          'SENSITIVE: Do not commit, upload, or share this file publicly. Delete it after securely delivering the links.',
        links,
      },
      null,
      2,
    ),
    { encoding: 'utf8', mode: 0o600 },
  );

  console.log(`\n🔐 File reset link đã tạo cục bộ: ${outputPath}`);
  console.log('   KHÔNG commit file này lên GitHub.');
}

export async function provisionUsers(
  options: ProvisionOptions = {},
): Promise<void> {
  const isDryRun =
    options.dryRun || process.argv.includes('--dry-run');

  console.log('====================================================');
  console.log('  FIREBASE AUTH USER PROVISIONING TOOL');
  console.log(
    `  Chế độ: ${
      isDryRun ? 'DRY-RUN (MÔ PHỎNG, KHÔNG GHI)' : 'LIVE (THỰC THI)'
    }`,
  );
  console.log(`  Tổng số tài khoản nguồn: ${DEMO_USERS.length}`);
  console.log('====================================================\n');

  const app = initializeFirebaseAdmin();

  if (!app) {
    console.log(
      'Chưa tìm thấy Firebase Service Account credentials trong môi trường.',
    );
    console.log(
      'Dùng GOOGLE_APPLICATION_CREDENTIALS hoặc FIREBASE_SERVICE_ACCOUNT_JSON.',
    );
    return;
  }

  const auth = getAuth(app);
  const db = getFirestore(app);
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    'final-1ef53';

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const resetLinks: Array<{
    uid: string;
    email: string;
    resetLink: string;
  }> = [];

  for (const user of DEMO_USERS) {
    const targetUid = user.id;
    const email = user.email;

    try {
      let existingAuthUser = null;

      try {
        existingAuthUser = await auth.getUser(targetUid);
      } catch (err: any) {
        if (err.code !== 'auth/user-not-found') {
          throw err;
        }
      }

      if (existingAuthUser) {
        console.log(
          `[TỒN TẠI] Auth User UID "${targetUid}" (${email}) đã tồn tại. Bỏ qua tạo mới.`,
        );
        skippedCount++;
      } else if (isDryRun) {
        console.log(
          `[DRY-RUN] Sẽ tạo Auth User: UID "${targetUid}" | Email: ${email} | Password riêng: [SINH KHI LIVE]`,
        );
        createdCount++;
      } else {
        const temporaryPassword = generateTemporaryPassword();

        await auth.createUser({
          uid: targetUid,
          email,
          displayName: user.fullName,
          password: temporaryPassword,
          emailVerified: true,
          disabled: false,
        });

        // Không log temporaryPassword.
        const resetLink = await auth.generatePasswordResetLink(email, {
          url: `https://${projectId}.web.app`,
          handleCodeInApp: false,
        });

        resetLinks.push({
          uid: targetUid,
          email,
          resetLink,
        });

        console.log(
          `✅ [TẠO AUTH] Thành công: UID "${targetUid}" | Email: ${email}`,
        );
        createdCount++;
      }

      if (!isDryRun) {
        const userDocRef = db.collection('users').doc(targetUid);
        const safeData = sanitizeUserForFirestore(user);
        safeData.updatedAt = FieldValue.serverTimestamp();

        await userDocRef.set(safeData, { merge: true });

        console.log(
          `   └─ Đồng bộ Firestore: /users/${targetUid} (Không chứa password)`,
        );
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[LỖI] Xử lý UID "${targetUid}":`, msg);
      errorCount++;
    }
  }

  if (!isDryRun && resetLinks.length > 0) {
    await writeResetLinksFile(resetLinks);
  }

  console.log('\n====================================================');
  console.log('  KẾT QUẢ PROVISIONING:');
  console.log(`  - Đã tạo: ${createdCount}`);
  console.log(`  - Bỏ qua (đã có): ${skippedCount}`);
  console.log(`  - Lỗi: ${errorCount}`);
  if (!isDryRun) {
    console.log(`  - Reset links mới tạo: ${resetLinks.length}`);
  }
  console.log('====================================================\n');
}

if (
  process.argv[1]?.endsWith('provision-auth-users.ts') ||
  process.argv[1]?.endsWith('provision-auth-users.js')
) {
  provisionUsers().catch((err) => {
    console.error('Fatal provisioning error:', err);
    process.exit(1);
  });
}
