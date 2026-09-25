import assert from 'node:assert/strict';
import { build } from 'esbuild';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';

// Exercise the real component handlers with deterministic hooks and a mocked
// Firestore boundary. This does not replace browser or emulator integration tests.
async function bundle(entry, mocks, globals = {}) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs',
    plugins: [{ name: 'test-boundaries', setup(b) {
      b.onResolve({ filter: /.*/ }, args => Object.hasOwn(mocks, args.path) ? { path: args.path, external: true } : undefined);
    } }],
  });
  const context = { module: { exports: {} }, require: name => mocks[name], console, crypto: { randomUUID },
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    alert() {}, confirm: () => true, ...globals };
  vm.runInNewContext(result.outputFiles[0].text, context);
  return context.module.exports;
}

let cursor = 0, hooks = [], effects = [];
const react = {
  useState(initial) {
    const i = cursor++;
    if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial;
    return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }];
  },
  useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial }; },
  useEffect(fn, deps) {
    const i = cursor++;
    if (!hooks[i] || deps.some((dep, n) => dep !== hooks[i][n])) effects.push(fn);
    hooks[i] = deps;
  },
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
};
const jsx = (type, props) => ({ type, props });
let saved = [], savedPoints = [], failAnswer = false, failConfig = false, configWrites = [], ledgerWrites = 0;
const history = {
  loadFlowerHistory: async () => [],
  saveFlowerAnswer: async (_class, _user, entry) => { saved.push(entry); if (failAnswer) throw Error('offline'); },
  deleteFlowerHistoryEntries: async () => {},
};
const { LearningGardenScene } = await bundle('src/components/game-ui/LearningGardenScene.tsx', {
  react, 'react/jsx-runtime': { jsx, jsxs: jsx },
  'lucide-react': new Proxy({}, { get: (_, name) => String(name) }),
  '../../utils/sound': { soundFx: new Proxy({}, { get: () => () => {} }) },
  '../../services/flowerHistoryService': history,
  '../../services/activityPointService': {
    saveFlowerAnswerAndPoint: async (_class, _user, entry, point) => {
      saved.push(entry); savedPoints.push(point); if (failAnswer) throw Error('offline');
    },
  },
});
let props, tree;
function render() { cursor = 0; tree = LearningGardenScene(props); }
async function flush() {
  render();
  for (const fn of effects.splice(0)) fn();
  await new Promise(resolve => setImmediate(resolve));
  render();
}
function nodes(node = tree) {
  if (Array.isArray(node)) return node.flatMap(n => nodes(n));
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children ?? null)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  return node && typeof node === 'object' ? text(node.props?.children) : String(node ?? '');
}
function find(predicate) { const node = nodes().find(predicate); assert.ok(node, 'Expected UI control'); return node; }
function button(label) { return find(n => n.type === 'button' && text(n).includes(label)); }
async function click(node) { await node.props.onClick(); await flush(); }
async function change(node, value) { node.props.onChange({ target: { value } }); await flush(); }
const question = { id: 'q1', question: 'True?', type: 'bool', correctAnswer: 'True', isLuckyFlower: true, multiplier: 3 };
async function setup() {
  hooks = []; effects = []; saved = []; savedPoints = []; configWrites = []; failAnswer = failConfig = false;
  props = { currentUser: { id: 'u1', classId: 'c1', fullName: 'Student', role: 'student' }, isTeacherOrAdmin: true,
    flowerConfig: { id: 'flower_c1', classId: 'c1', title: 'Garden', category: 'Điểm HĐ học tập',
      language: 'en', timeMinutes: 10, isActive: true, playMode: 'turn_based', participantType: 'team',
      participantsCount: 2, questions: [{ ...question }], participants: [
        { id: 'p1', name: 'One', color: 'red', score: 0, harvestedCount: 0 },
        { id: 'p2', name: 'Two', color: 'blue', score: 0, harvestedCount: 0 },
      ] },
    onUpdateFlowerConfig: async config => { if (failConfig) throw Error('offline'); configWrites.push(config); props.flowerConfig = config; },
    onActivityPointSaved: () => ledgerWrites++,
  };
  await flush();
}
await setup();
await click(find(n => n.props?.id === 'flower-teacher-settings-btn'));
await click(button('Sửa'));
await find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); await flush();
assert.equal(configWrites.length, 1);
assert.equal(props.flowerConfig.questions[0].correctAnswer, 'Đúng', 'English boolean edits must save a valid answer');
await click(button('Sửa'));
failConfig = true;
await click(find(n => n.props?.title === 'Xóa'));
assert.equal(props.flowerConfig.questions.length, 1, 'Failed delete preserves question');
failConfig = false;
await click(find(n => n.props?.title === 'Xóa'));
assert.equal(props.flowerConfig.questions.length, 0);
assert.equal(props.flowerConfig.isActive, false, 'Deleting final question deactivates game');
assert.ok(!nodes().some(n => n.type === 'button' && text(n) === 'Hủy sửa'), 'Deleted question exits edit mode');
await change(find(n => n.props?.placeholder === 'VD: Thủ đô của Việt Nam là gì?'), 'New boolean');
await find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); await flush();
assert.equal(props.flowerConfig.questions.length, 1, 'New question after delete is added');
await click(find(n => n.props?.id === 'flower-save-settings-btn'));
assert.equal(configWrites.at(-1).participants[0].score, 0);
console.log('PASS question edit/delete/add, failed persistence, settings');

await setup();
await click(find(n => n.props?.id === 'flower-start-game-btn'));
// Tree item buttons call the real picker; their numeric labels identify the item.
await click(find(n => n.type === 'button' && n.props?.onClick && n.props?.title === 'Learning Flower #1'));
await click(button('True'));
failAnswer = true;
await click(button('SUBMIT ANSWER'));
assert.equal(saved.length, 1);
assert.equal(saved[0].pointsChange, 3);
const firstId = saved[0].id;
failAnswer = false;
await click(button('SUBMIT ANSWER'));
assert.equal(saved[1].id, firstId, 'Retry reuses the same Firestore document');
assert.equal(saved[1].participantName, 'One');
await click(find(n => n.type === 'button' && n.props?.onClick && n.props?.title === 'Knowledge Fruit #2'));
await click(button('False'));
await click(button('SUBMIT ANSWER'));
assert.equal(saved[2].participantName, 'Two', 'Successful submission advances turn');
assert.equal(saved[2].pointsChange, -6, 'Wrong fruit answer applies base 2 times multiplier 3');
assert.equal(savedPoints.length, 3, 'Each submission writes an official point entry');
assert.equal(ledgerWrites, 2, 'Only successful commits update the visible ledger');
console.log('PASS scoring, retry identity, turn advancement, official ledger callback');

let writes = [], data = null, deletes = [], batchSets = [];
const firestore = {
  doc: (...parts) => parts, collection: (...parts) => parts,
  getDoc: async () => ({ exists: () => data !== null, data: () => data }),
  setDoc: async (...args) => writes.push(args), serverTimestamp: () => 'SERVER_TIME',
  query: (...parts) => parts, orderBy: (...parts) => parts, limit: n => n,
  getDocs: async () => ({ docs: [] }),
  updateDoc: async (...args) => writes.push(args),
  deleteDoc: async ref => deletes.push(ref),
  runTransaction: async (_db, callback) => callback({ get: async () => ({ exists: () => false }), set() {} }),
  arrayUnion: value => ({ union: value }), arrayRemove: value => ({ remove: value }),
  writeBatch: () => ({
    delete: ref => deletes.push(ref),
    set: (ref, value) => batchSets.push([ref, value]),
    commit: async () => {},
  }),
};
const mocks = { 'firebase/firestore': firestore, '../lib/firebase': { db: 'DB' } };
const configService = await bundle('src/services/flowerGameService.ts', mocks);
const historyService = await bundle('src/services/flowerHistoryService.ts', mocks);
const pointService = await bundle('src/services/activityPointService.ts', mocks);
const raceHistoryService = await bundle('src/services/raceHistoryService.ts', mocks);
const keyboardService = await bundle('src/services/keyboardTaskService.ts', mocks);
const spyService = await bundle('src/services/spyGameService.ts', mocks);
const attendanceService = await bundle('src/services/attendanceService.ts', mocks);
const config = { ...props.flowerConfig };
await configService.saveFlowerGameConfig(config);
assert.equal(writes[0][0].join('/'), 'DB/flowerGames/c1');
await assert.rejects(() => configService.saveFlowerGameConfig({ ...config, timeMinutes: NaN }));
await assert.rejects(() => configService.saveFlowerGameConfig({ ...config, questions: [], isActive: true }));
data = { ...config, timeMinutes: -1, participantsCount: Infinity, participants: [], questions: [{ ...question, multiplier: -5 }] };
const loaded = await configService.getFlowerGameConfig('c1');
assert.equal(loaded.timeMinutes, 10);
assert.equal(loaded.participantsCount, 4);
assert.equal(loaded.questions[0].multiplier, 2);
await historyService.saveFlowerAnswer('c1', 'u1', { ...saved[0], options: undefined });
assert.equal(writes.at(-1)[0][0].join('/'), 'DB/flowerGames/c1/players/u1/answers');
assert.ok(!Object.hasOwn(writes.at(-1)[1], 'options'));
assert.equal(writes.at(-1)[1].createdAt, 'SERVER_TIME');
await historyService.deleteFlowerHistoryEntries('c1', 'u1', saved.slice(0, 1));
assert.equal(deletes[0][1], firstId);
await pointService.saveFlowerAnswerAndPoint('c1', 'u1', saved[0], savedPoints[0]);
assert.equal(batchSets.length, 2, 'Answer and point use one batch');
assert.equal(batchSets[0][0].join('/'), 'DB/flowerGames/c1/players/u1/answers/' + firstId);
assert.equal(batchSets[1][0].join('/'), 'DB/activityPoints/' + firstId);
await assert.rejects(() => pointService.saveFlowerAnswerAndPoint('c1', 'u1', saved[0], { ...savedPoints[0], points: 99 }));
const raceAnswer = {
  id: 'race-attempt-1', obstacleNumber: 1, obstacleName: 'Chướng ngại vật #1', questionId: 'rq1',
  questionNumber: 1, questionText: '2 + 2?', questionType: 'fill', teamName: 'One', teamColor: 'red',
  submittedAnswer: '4', correctAnswer: '4', isCorrect: true, pointsChange: 1, timestamp: '08:00',
};
const racePoint = {
  id: raceAnswer.id, attemptId: raceAnswer.id, userId: 'u1', studentName: 'Student', classId: 'c1',
  activityId: 'race_c1', activityName: 'Đường đua', source: 'racing', category: 'Thi đua học tập',
  pointType: 'academic_activity', points: 1, isCorrect: true, participantName: 'One', questionId: 'rq1',
  date: '2026-09-25', timestamp: '08:00',
};
batchSets = [];
await pointService.saveRaceAnswerAndPoint('c1', 'u1', raceAnswer, racePoint);
assert.equal(batchSets.length, 2);
assert.equal(batchSets[0][0].join('/'), 'DB/racingGames/c1/players/u1/answers/race-attempt-1');
assert.equal(batchSets[1][0].join('/'), 'DB/activityPoints/race-attempt-1');
batchSets = [];
await raceHistoryService.saveRaceAnswers('c1', 'u1', [raceAnswer]);
assert.equal(batchSets[0][0][0].join('/'), 'DB/racingGames/c1/players/u1/answers');
const memoryResult = { id: 'memory-attempt-1', score: 6, matchedPairs: 3, totalPairs: 4, completed: false, timeSpentSeconds: 300, timestamp: '08:05' };
const memoryPoint = {
  id: memoryResult.id, attemptId: memoryResult.id, userId: 'u1', studentName: 'Student', classId: 'c1',
  activityId: 'memory_c1', activityName: 'Thẻ nhớ', source: 'memory', category: 'Thi đua học tập',
  pointType: 'academic_activity', points: 6, isCorrect: false, participantName: '3/4 cặp thẻ', questionId: 'memory_result',
  date: '2026-09-25', timestamp: '08:05',
};
batchSets = [];
await pointService.saveMemoryResultAndPoint('c1', 'u1', memoryResult, memoryPoint);
assert.equal(batchSets.length, 2);
assert.equal(batchSets[0][0].join('/'), 'DB/memoryGames/c1/players/u1/results/memory-attempt-1');
assert.equal(batchSets[1][0].join('/'), 'DB/activityPoints/memory-attempt-1');
await assert.rejects(() => pointService.saveMemoryResultAndPoint('c1', 'u1', memoryResult, { ...memoryPoint, points: 8 }));
const gradedSubmission = {
  id: 'submission_u1', studentId: 'u1', studentName: 'Student', content: 'Essay', wordCount: 1,
  submittedAt: '2026-09-25 08:00', likes: [], comments: [], score: 9, feedback: 'Good',
  rewardPointsAwarded: 5, isGraded: true,
};
const keyboardPoint = {
  id: 'keyboard_submission_u1', attemptId: 'keyboard_submission_u1', userId: 'u1', studentName: 'Student',
  classId: 'c1', activityId: 'keyboard_c1', activityName: 'Keyboard', source: 'keyboard', category: 'Thi đua học tập',
  pointType: 'academic_activity', points: 5, isCorrect: true, participantName: 'Student', questionId: 'submission_u1',
  date: '2026-09-25', timestamp: '08:10',
};
batchSets = [];
await keyboardService.gradeKeyboardSubmissionAndAward('c1', gradedSubmission, keyboardPoint);
assert.equal(batchSets.length, 2);
assert.equal(batchSets[0][0].join('/'), 'DB/keyboardTasks/c1/submissions/submission_u1');
assert.equal(batchSets[1][0].join('/'), 'DB/activityPoints/keyboard_submission_u1');
await assert.rejects(() => keyboardService.gradeKeyboardSubmissionAndAward('c1', gradedSubmission, { ...keyboardPoint, points: 10 }));
const finishedMission = {
  id: 'spy_round_1', classId: 'c1', weekNumber: 4, category: 'Thi đua rèn luyện', spyStudentId: 'u1',
  missionDescription: 'Secret', status: 'Hoàn thành (+5đ)', votes: [], rewardSpy: 5, penaltySpy: 5,
  rewardCitizenPerVote: 2, endedAt: '2026-09-25',
};
const spyPoint = {
  id: 'spy_spy_round_1_u1', attemptId: 'spy_spy_round_1_u1', userId: 'u1', studentName: 'Student', classId: 'c1',
  activityId: 'spy_round_1', activityName: 'Spy', source: 'spy', category: 'Thi đua rèn luyện',
  pointType: 'training_activity', points: 5, isCorrect: true, participantName: 'Gián điệp', questionId: 'spy_round_1',
  date: '2026-09-25', timestamp: '08:20',
};
batchSets = [];
await spyService.finishSpyMissionAndAward(finishedMission, [spyPoint]);
assert.equal(batchSets.length, 2);
assert.equal(batchSets[0][0].join('/'), 'DB/spyGames/c1');
assert.equal(batchSets[1][0].join('/'), 'DB/activityPoints/spy_spy_round_1_u1');
await assert.rejects(() => spyService.finishSpyMissionAndAward(finishedMission, [spyPoint, spyPoint]));
const attendance = {
  id: 'temporary', classId: 'c1', date: '2026-09-25', studentId: 'u1', studentName: 'Student',
  status: 'Có mặt', weekNumber: 4, monthNumber: 9, semester: 'Học kỳ 1', dayOfWeek: 'Thứ 6', recordedBy: 'Teacher',
};
batchSets = [];
await attendanceService.saveAttendanceRecords([attendance]);
assert.equal(batchSets[0][0].join('/'), 'DB/attendanceRecords/c1_u1_2026-09-25');
const attendancePoint = { ...spyPoint, id: 'attendance_c1_HK1_9_u1', attemptId: 'attendance_c1_HK1_9_u1', source: 'attendance', points: 5, activityId: 'attendance_HK1_9' };
batchSets = [];
await attendanceService.awardAttendancePoints([attendancePoint]);
assert.equal(batchSets[0][0].join('/'), 'DB/activityPoints/attendance_c1_HK1_9_u1');
console.log('PASS Firestore paths, atomic point batch, validation/normalization, serialization, deletion');


