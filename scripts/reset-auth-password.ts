import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const app = getApps().length
  ? getApps()[0]
  : initializeApp();

const auth = getAuth(app);

const rl = readline.createInterface({ input, output });

const email = 'mai.le@iten.edu.vn';

const password = await rl.question(
  `Nhập mật khẩu mới cho ${email}: `
);

rl.close();

if (password.length < 6) {
  throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
}

const user = await auth.getUserByEmail(email);

await auth.updateUser(user.uid, {
  password,
});

console.log(`Đã đổi mật khẩu thành công cho ${email}.`);
console.log(`UID: ${user.uid}`);