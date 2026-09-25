// $env:ADMIN_NEW_PASSWORD="thanhtu911"
// npx.cmd  tsx scripts/reset-admin-password.ts

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const require = createRequire(import.meta.url);

const serviceAccountPath =
  'D:\\JOB\\final-1ef53-firebase-adminsdk-fbsvc-a3ad18a517.json';

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, 'utf8')
);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();

const email = 'admin@iten.edu.vn';
const newPassword = process.env.ADMIN_NEW_PASSWORD;

if (!newPassword) {
  throw new Error(
    'Thiếu ADMIN_NEW_PASSWORD. Hãy đặt biến môi trường này trước khi chạy script.'
  );
}

if (newPassword.length < 6) {
  throw new Error('Mật khẩu Firebase phải có ít nhất 6 ký tự.');
}

const user = await auth.getUserByEmail(email);

await auth.updateUser(user.uid, {
  password: newPassword,
});

console.log(`Đã đặt lại mật khẩu cho ${email}.`);
console.log(`UID: ${user.uid}`);