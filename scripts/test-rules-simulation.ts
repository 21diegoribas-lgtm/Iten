/**
 * Simulator test for Firestore Security Rules logic.
 * Validates all 11 security scenarios defined in BƯỚC 3H.
 */

interface AuthContext {
  uid?: string;
  role?: 'admin' | 'teacher' | 'student';
  classId?: string;
}

interface RequestContext {
  auth: { uid: string } | null;
  resourceData?: Record<string, any>;
  incomingData?: Record<string, any>;
}

// Logic mirror of firestore.rules
class RulesEvaluator {
  private userStore: Record<string, { role: string; classId?: string }> = {
    admin1: { role: 'admin' },
    teacher1: { role: 'teacher', classId: '10A1' },
    teacher2: { role: 'teacher', classId: '10A2' },
    student1: { role: 'student', classId: '10A1' },
    student2: { role: 'student', classId: '10A2' },
  };

  private isAuthenticated(req: RequestContext): boolean {
    return req.auth !== null && typeof req.auth.uid === 'string';
  }

  private isOwner(req: RequestContext, targetId: string): boolean {
    return this.isAuthenticated(req) && req.auth!.uid === targetId;
  }

  private getUserRole(req: RequestContext): string | null {
    if (!this.isAuthenticated(req)) return null;
    return this.userStore[req.auth!.uid]?.role || null;
  }

  private getUserClassId(req: RequestContext): string | null {
    if (!this.isAuthenticated(req)) return null;
    return this.userStore[req.auth!.uid]?.classId || null;
  }

  private isAdmin(req: RequestContext): boolean {
    return this.isAuthenticated(req) && this.getUserRole(req) === 'admin';
  }

  private isTeacher(req: RequestContext): boolean {
    return this.isAuthenticated(req) && this.getUserRole(req) === 'teacher';
  }

  private isStaff(req: RequestContext): boolean {
    return this.isAdmin(req) || this.isTeacher(req);
  }

  private isStudent(req: RequestContext): boolean {
    return this.isAuthenticated(req) && this.getUserRole(req) === 'student';
  }

  private hasNoPasswordField(data?: Record<string, any>): boolean {
    return !data || !('password' in data);
  }

  // Users rules
  evalUsersGet(req: RequestContext, userId: string): boolean {
    return this.isAuthenticated(req) && (this.isAdmin(req) || this.isOwner(req, userId) || this.isTeacher(req));
  }

  evalUsersUpdate(req: RequestContext, userId: string): boolean {
    if (!this.hasNoPasswordField(req.incomingData)) return false;
    if (this.isAdmin(req)) return true;
    if (this.isOwner(req, userId)) {
      return req.incomingData?.role === req.resourceData?.role;
    }
    return false;
  }

  // Students rules
  evalStudentsGet(req: RequestContext, studentId: string): boolean {
    return this.isAuthenticated(req) && (this.isStaff(req) || this.isOwner(req, studentId));
  }

  evalStudentsUpdate(req: RequestContext, studentId: string): boolean {
    if (!this.hasNoPasswordField(req.incomingData)) return false;
    if (this.isStaff(req)) return true;
    if (this.isOwner(req, studentId)) {
      const allowed = ['phone', 'address', 'avatar', 'avatarId', 'updatedAt'];
      const affected = Object.keys(req.incomingData || {}).filter(
        (k) => req.incomingData![k] !== req.resourceData?.[k]
      );
      return affected.every((k) => allowed.includes(k));
    }
    return false;
  }

  // Teachers rules
  evalTeachersUpdate(req: RequestContext, teacherId: string): boolean {
    if (!this.hasNoPasswordField(req.incomingData)) return false;
    if (this.isAdmin(req)) return true;
    if (this.isTeacher(req) && this.isOwner(req, teacherId)) {
      const allowed = ['phone', 'address', 'avatar', 'avatarId', 'updatedAt', 'notes'];
      const affected = Object.keys(req.incomingData || {}).filter(
        (k) => req.incomingData![k] !== req.resourceData?.[k]
      );
      return affected.every((k) => allowed.includes(k));
    }
    return false;
  }

  // Classes rules
  evalClassesCreate(req: RequestContext): boolean {
    return this.hasNoPasswordField(req.incomingData) && this.isStaff(req);
  }

  evalClassesDelete(req: RequestContext): boolean {
    return this.isAdmin(req);
  }
}

async function runTests() {
  const sim = new RulesEvaluator();
  const results: Array<{ id: number; name: string; pass: boolean; details: string }> = [];

  // 1. unauthenticated → users → denied
  const t1 = !sim.evalUsersGet({ auth: null }, 'student1');
  results.push({ id: 1, name: 'unauthenticated → users → denied', pass: t1, details: 'Blocked correctly' });

  // 2. unauthenticated → students → denied
  const t2 = !sim.evalStudentsGet({ auth: null }, 'student1');
  results.push({ id: 2, name: 'unauthenticated → students → denied', pass: t2, details: 'Blocked correctly' });

  // 3. student → own student profile → allowed read
  const t3 = sim.evalStudentsGet({ auth: { uid: 'student1' } }, 'student1');
  results.push({ id: 3, name: 'student → own student profile → allowed read', pass: t3, details: 'Allowed read' });

  // 4. student → another student profile → denied
  const t4 = !sim.evalStudentsGet({ auth: { uid: 'student1' } }, 'student2');
  results.push({ id: 4, name: 'student → another student profile → denied', pass: t4, details: 'Blocked cross-read' });

  // 5. student → change own role → denied
  const t5 = !sim.evalUsersUpdate(
    { auth: { uid: 'student1' }, resourceData: { role: 'student' }, incomingData: { role: 'admin' } },
    'student1'
  );
  results.push({ id: 5, name: 'student → change own role → denied', pass: t5, details: 'Prevented privilege escalation' });

  // 6. student → change own classId → denied
  const t6 = !sim.evalStudentsUpdate(
    {
      auth: { uid: 'student1' },
      resourceData: { classId: '10A1', phone: '123' },
      incomingData: { classId: '12A1', phone: '123' },
    },
    'student1'
  );
  results.push({ id: 6, name: 'student → change own classId → denied', pass: t6, details: 'Restricted fields protected' });

  // 7. teacher → teacher profile của mình → allowed theo field policy
  const t7 = sim.evalTeachersUpdate(
    {
      auth: { uid: 'teacher1' },
      resourceData: { phone: '123', address: 'HN' },
      incomingData: { phone: '456', address: 'HN' },
    },
    'teacher1'
  );
  results.push({ id: 7, name: 'teacher → own profile → allowed under field policy', pass: t7, details: 'Field policy honored' });

  // 8. teacher → change own role → denied
  const t8 = !sim.evalUsersUpdate(
    { auth: { uid: 'teacher1' }, resourceData: { role: 'teacher' }, incomingData: { role: 'admin' } },
    'teacher1'
  );
  results.push({ id: 8, name: 'teacher → change own role → denied', pass: t8, details: 'Teacher role immutable' });

  // 9. student → create class → denied
  const t9 = !sim.evalClassesCreate({ auth: { uid: 'student1' }, incomingData: { name: '10A3' } });
  results.push({ id: 9, name: 'student → create class → denied', pass: t9, details: 'Class creation restricted' });

  // 10. teacher → delete class → denied
  const t10 = !sim.evalClassesDelete({ auth: { uid: 'teacher1' } });
  results.push({ id: 10, name: 'teacher → delete class → denied', pass: t10, details: 'Only admin can delete' });

  // 11. admin → users/classes/students/teachers → allowed
  const adminReq = { auth: { uid: 'admin1' } };
  const t11 =
    sim.evalUsersGet(adminReq, 'student1') &&
    sim.evalStudentsGet(adminReq, 'student1') &&
    sim.evalClassesCreate({ ...adminReq, incomingData: { name: '10A4' } }) &&
    sim.evalClassesDelete(adminReq);
  results.push({ id: 11, name: 'admin → users/classes/students/teachers → allowed', pass: t11, details: 'Full admin access' });

  console.log('--- FIRESTORE RULES SIMULATION RESULTS ---');
  let allPass = true;
  for (const r of results) {
    console.log(`[${r.pass ? 'PASS' : 'FAIL'}] Scenario ${r.id}: ${r.name}`);
    if (!r.pass) allPass = false;
  }
  console.log('OVERALL SIMULATION:', allPass ? 'ALL 11 PASS' : 'SOME FAILED');
}

runTests();
