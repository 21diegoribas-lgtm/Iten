import React, { useState, useMemo } from 'react';
import { 
  User, 
  ClassFundItem, 
  ClassFundExpense, 
  ClassFundContribution, 
  ClassItem 
} from '../../types';
import { soundFx } from '../../utils/sound';
import { 
  Wallet, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  PieChart, 
  Search, 
  Filter, 
  Users, 
  Sparkles, 
  Check, 
  Edit3, 
  Trash2, 
  Printer, 
  Receipt, 
  AlertCircle, 
  ShieldCheck, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Award,
  Bookmark
} from 'lucide-react';

interface ClassFundManagerProps {
  currentUser: User;
  students: User[];
  classesList?: ClassItem[];
  funds: ClassFundItem[];
  expenses: ClassFundExpense[];
  onUpdateFunds: (funds: ClassFundItem[]) => void;
  onUpdateExpenses: (expenses: ClassFundExpense[]) => void;
}

export const ClassFundManager: React.FC<ClassFundManagerProps> = ({
  currentUser,
  students,
  classesList = [],
  funds,
  expenses,
  onUpdateFunds,
  onUpdateExpenses
}) => {
  // State for active tabs and view modes
  const [activeTab, setActiveTab] = useState<'fund_list' | 'matrix_overview' | 'expenses' | 'teams_summary'>('fund_list');
  const [selectedFundId, setSelectedFundId] = useState<string>(funds[0]?.id || '');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2025 - 2026');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // Modals state
  const [showAddFundModal, setShowAddFundModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ClassFundExpense | null>(null);
  const [showEditContributionModal, setShowEditContributionModal] = useState<ClassFundContribution | null>(null);

  // New Fund Form State
  const [newFundTitle, setNewFundTitle] = useState('');
  const [newFundPeriodType, setNewFundPeriodType] = useState<'week' | 'semester' | 'year' | 'custom'>('week');
  const [newFundWeekNumber, setNewFundWeekNumber] = useState<number>(4);
  const [newFundSemester, setNewFundSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');
  const [newFundAmount, setNewFundAmount] = useState<number>(10000);
  const [newFundDueDate, setNewFundDueDate] = useState<string>(new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10));
  const [newFundNotes, setNewFundNotes] = useState('');

  // New Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(50000);
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [expenseSpentBy, setExpenseSpentBy] = useState<string>(currentUser.fullName);
  const [expenseCategory, setExpenseCategory] = useState<ClassFundExpense['category']>('Vật phẩm học tập');
  const [expenseReceiptNote, setExpenseReceiptNote] = useState('');
  const [expenseSemester, setExpenseSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');
  const [expenseWeekNumber, setExpenseWeekNumber] = useState<number>(4);

  // Quick edit contribution note / method
  const [contribPaidAmount, setContribPaidAmount] = useState<number>(0);
  const [contribMethod, setContribMethod] = useState<'Tiền mặt' | 'Chuyển khoản'>('Tiền mặt');
  const [contribNotes, setContribNotes] = useState<string>('');

  // Determine user permissions
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const posLower = (currentUser.position || '').toLowerCase();
  const isTreasurer = posLower.includes('thủ quỹ') || posLower.includes('thu quy');
  const isClassLeader = posLower.includes('lớp trưởng') || posLower.includes('lớp phó');
  const isTeamLeader = posLower.includes('tổ trưởng') || posLower.includes('to truong');
  const isOfficer = isTreasurer || isClassLeader;

  // Can manage all class payments & create fund rounds
  const canManageAll = isTeacherOrAdmin || isOfficer;
  // Can create new fund round
  const canCreateFund = isTeacherOrAdmin || isTreasurer || isClassLeader || isTeamLeader;
  // Can mark payment for students (Team leaders can mark their team or all)
  const canMarkPayment = isTeacherOrAdmin || isOfficer || isTeamLeader;
  // Can add expense records
  const canManageExpenses = isTeacherOrAdmin || isTreasurer || isClassLeader;

  // Current user's team if student
  const userTeam = currentUser.team || '';

  // Class list filter (for class 8A1 or user's class)
  const currentClassName = currentUser.className || 'Lớp 8A1';
  const classStudents = useMemo(() => {
    return students.filter(s => !s.className || s.className === currentClassName || currentUser.role === 'admin');
  }, [students, currentClassName, currentUser.role]);

  // Filtered funds list
  const filteredFunds = useMemo(() => {
    return funds.filter(f => {
      if (selectedAcademicYear !== 'all' && f.academicYear !== selectedAcademicYear) return false;
      if (selectedSemester !== 'all' && f.semester !== selectedSemester) return false;
      return true;
    }).sort((a, b) => {
      // Sort week numbers descending, then created date
      if (a.weekNumber && b.weekNumber) return b.weekNumber - a.weekNumber;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [funds, selectedAcademicYear, selectedSemester]);

  // Active selected fund
  const activeFund = useMemo(() => {
    return funds.find(f => f.id === selectedFundId) || filteredFunds[0] || funds[0];
  }, [funds, selectedFundId, filteredFunds]);

  // Overall Financial Calculations
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalExpected = 0;
    let totalStudentsInContributions = 0;
    let totalPaidContributions = 0;

    filteredFunds.forEach(fund => {
      const contrs = Object.values(fund.contributions || {}) as ClassFundContribution[];
      contrs.forEach(c => {
        totalStudentsInContributions++;
        if (c.isPaid) {
          totalCollected += c.paidAmount || fund.amountPerStudent;
          totalPaidContributions++;
        }
        totalExpected += fund.amountPerStudent;
      });
    });

    const filteredExpenses = expenses.filter(e => {
      if (selectedAcademicYear !== 'all' && e.academicYear !== selectedAcademicYear) return false;
      if (selectedSemester !== 'all' && e.semester !== selectedSemester) return false;
      return true;
    });

    const totalSpent = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const balance = totalCollected - totalSpent;
    const paymentRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    return {
      totalCollected,
      totalExpected,
      totalSpent,
      balance,
      paymentRate,
      filteredExpenses
    };
  }, [filteredFunds, expenses, selectedAcademicYear, selectedSemester]);

  // Current user's individual contribution status across all funds
  const mySummary = useMemo(() => {
    if (currentUser.role !== 'student') return null;
    let myTotalPaid = 0;
    let myTotalOwed = 0;
    let myPaidRounds = 0;
    let myTotalRounds = filteredFunds.length;

    filteredFunds.forEach(fund => {
      const myContrib = fund.contributions?.[currentUser.id];
      if (myContrib && myContrib.isPaid) {
        myTotalPaid += myContrib.paidAmount || fund.amountPerStudent;
        myPaidRounds++;
      } else {
        myTotalOwed += fund.amountPerStudent;
      }
    });

    return {
      myTotalPaid,
      myTotalOwed,
      myPaidRounds,
      myTotalRounds,
      isFullyPaid: myTotalOwed === 0 && myTotalRounds > 0
    };
  }, [currentUser, filteredFunds]);

  // Team summary calculations
  const teamStats = useMemo(() => {
    const teams = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];
    return teams.map(teamName => {
      const teamStudents = classStudents.filter(s => s.team === teamName);
      let teamCollected = 0;
      let teamExpected = 0;
      let teamPaidCount = 0;
      let teamTotalCount = 0;

      filteredFunds.forEach(fund => {
        teamStudents.forEach(st => {
          teamTotalCount++;
          teamExpected += fund.amountPerStudent;
          const contrib = fund.contributions?.[st.id];
          if (contrib && contrib.isPaid) {
            teamCollected += contrib.paidAmount || fund.amountPerStudent;
            teamPaidCount++;
          }
        });
      });

      const rate = teamExpected > 0 ? Math.round((teamCollected / teamExpected) * 100) : 0;
      return {
        teamName,
        studentCount: teamStudents.length,
        teamCollected,
        teamExpected,
        teamPaidCount,
        teamTotalCount,
        rate
      };
    });
  }, [classStudents, filteredFunds]);

  // Toggle single student contribution status
  const handleTogglePayment = (fundId: string, studentId: string, studentName: string, team?: string) => {
    soundFx.playClick();
    const targetFund = funds.find(f => f.id === fundId);
    if (!targetFund) return;

    const currentContrib = targetFund.contributions?.[studentId];
    const newIsPaid = !currentContrib?.isPaid;

    const updatedContributions = {
      ...(targetFund.contributions || {}),
      [studentId]: {
        studentId,
        studentName,
        team: team || currentContrib?.team || 'Tổ 1',
        isPaid: newIsPaid,
        paidAmount: newIsPaid ? targetFund.amountPerStudent : 0,
        paidAt: newIsPaid ? new Date().toISOString().substring(0, 10) : undefined,
        paymentMethod: currentContrib?.paymentMethod || 'Tiền mặt',
        notes: currentContrib?.notes || ''
      }
    };

    const updatedFunds = funds.map(f => {
      if (f.id === fundId) {
        return {
          ...f,
          contributions: updatedContributions
        };
      }
      return f;
    });

    onUpdateFunds(updatedFunds);
    if (newIsPaid) {
      soundFx.playSuccess();
    }
  };

  // Mark all students in a team as paid for the active fund
  const handleMarkTeamAsPaid = (teamName: string, isPaid: boolean) => {
    if (!activeFund) return;
    soundFx.playClick();

    const updatedContributions = { ...(activeFund.contributions || {}) };
    classStudents.forEach(st => {
      if (st.team === teamName || teamName === 'all') {
        const existing = updatedContributions[st.id];
        updatedContributions[st.id] = {
          studentId: st.id,
          studentName: st.fullName,
          team: st.team || 'Tổ 1',
          isPaid: isPaid,
          paidAmount: isPaid ? activeFund.amountPerStudent : 0,
          paidAt: isPaid ? (existing?.paidAt || new Date().toISOString().substring(0, 10)) : undefined,
          paymentMethod: existing?.paymentMethod || 'Tiền mặt',
          notes: existing?.notes || ''
        };
      }
    });

    const updatedFunds = funds.map(f => f.id === activeFund.id ? { ...f, contributions: updatedContributions } : f);
    onUpdateFunds(updatedFunds);
    soundFx.playSuccess();
  };

  // Create a new Fund Round
  const handleCreateFund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFundTitle.trim()) {
      alert('Vui lòng nhập tên đợt thu quỹ!');
      return;
    }
    if (newFundAmount <= 0) {
      alert('Số tiền thu phải lớn hơn 0!');
      return;
    }

    soundFx.playClick();
    const newId = 'fund_' + Date.now();
    const initialContributions: Record<string, ClassFundContribution> = {};

    classStudents.forEach(st => {
      initialContributions[st.id] = {
        studentId: st.id,
        studentName: st.fullName,
        className: currentClassName,
        team: st.team || 'Tổ 1',
        isPaid: false,
        paidAmount: 0,
        notes: ''
      };
    });

    const newFund: ClassFundItem = {
      id: newId,
      classId: currentUser.classId || 'c1',
      className: currentClassName,
      academicYear: selectedAcademicYear === 'all' ? '2025 - 2026' : selectedAcademicYear,
      semester: newFundSemester,
      periodType: newFundPeriodType,
      weekNumber: newFundPeriodType === 'week' ? newFundWeekNumber : undefined,
      title: newFundTitle.trim(),
      amountPerStudent: newFundAmount,
      dueDate: newFundDueDate,
      createdAt: new Date().toISOString().substring(0, 10),
      createdBy: `${currentUser.fullName} (${isTreasurer ? 'Thủ quỹ' : isTeacherOrAdmin ? 'GV' : isTeamLeader ? 'Tổ trưởng' : 'Ban cán sự'})`,
      createdById: currentUser.id,
      notes: newFundNotes.trim(),
      status: 'active',
      contributions: initialContributions
    };

    onUpdateFunds([newFund, ...funds]);
    setSelectedFundId(newId);
    setShowAddFundModal(false);
    setNewFundTitle('');
    setNewFundNotes('');
    soundFx.playSuccess();
  };

  // Delete a fund round
  const handleDeleteFund = (fundId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đợt thu quỹ này? Mọi dữ liệu đóng tiền của đợt sẽ bị xóa.')) {
      soundFx.playClick();
      const updated = funds.filter(f => f.id !== fundId);
      onUpdateFunds(updated);
      if (selectedFundId === fundId) {
        setSelectedFundId(updated[0]?.id || '');
      }
      soundFx.playSuccess();
    }
  };

  // Save / Update Expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim()) {
      alert('Vui lòng nhập nội dung chi tiêu!');
      return;
    }
    if (expenseAmount <= 0) {
      alert('Số tiền chi phải lớn hơn 0!');
      return;
    }

    soundFx.playClick();

    if (editingExpense) {
      const updated = expenses.map(exp => {
        if (exp.id === editingExpense.id) {
          return {
            ...exp,
            title: expenseTitle.trim(),
            amount: expenseAmount,
            date: expenseDate,
            spentBy: expenseSpentBy.trim(),
            category: expenseCategory,
            receiptNote: expenseReceiptNote.trim(),
            semester: expenseSemester,
            weekNumber: expenseWeekNumber
          };
        }
        return exp;
      });
      onUpdateExpenses(updated);
    } else {
      const newExp: ClassFundExpense = {
        id: 'exp_' + Date.now(),
        classId: currentUser.classId || 'c1',
        className: currentClassName,
        academicYear: selectedAcademicYear === 'all' ? '2025 - 2026' : selectedAcademicYear,
        semester: expenseSemester,
        weekNumber: expenseWeekNumber,
        title: expenseTitle.trim(),
        amount: expenseAmount,
        date: expenseDate,
        spentBy: expenseSpentBy.trim(),
        spentById: currentUser.id,
        category: expenseCategory,
        receiptNote: expenseReceiptNote.trim()
      };
      onUpdateExpenses([newExp, ...expenses]);
    }

    setShowAddExpenseModal(false);
    setEditingExpense(null);
    setExpenseTitle('');
    setExpenseReceiptNote('');
    soundFx.playSuccess();
  };

  // Delete an expense
  const handleDeleteExpense = (expId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) {
      soundFx.playClick();
      onUpdateExpenses(expenses.filter(e => e.id !== expId));
      soundFx.playSuccess();
    }
  };

  // Save detailed contribution edit
  const handleSaveContributionDetail = () => {
    if (!showEditContributionModal || !activeFund) return;
    soundFx.playClick();

    const studentId = showEditContributionModal.studentId;
    const isPaid = contribPaidAmount > 0;

    const updatedContributions = {
      ...(activeFund.contributions || {}),
      [studentId]: {
        ...showEditContributionModal,
        isPaid,
        paidAmount: contribPaidAmount,
        paidAt: isPaid ? (showEditContributionModal.paidAt || new Date().toISOString().substring(0, 10)) : undefined,
        paymentMethod: contribMethod,
        notes: contribNotes
      }
    };

    const updatedFunds = funds.map(f => f.id === activeFund.id ? { ...f, contributions: updatedContributions } : f);
    onUpdateFunds(updatedFunds);
    setShowEditContributionModal(null);
    soundFx.playSuccess();
  };

  // Filtered student contributions for the active fund
  const activeFundStudentsList = useMemo(() => {
    if (!activeFund) return [];
    return classStudents.filter(st => {
      // Team filter
      if (selectedTeamFilter !== 'all' && st.team !== selectedTeamFilter) return false;
      // Search query
      if (searchStudentQuery) {
        const q = searchStudentQuery.toLowerCase();
        if (!st.fullName.toLowerCase().includes(q) && !(st.position || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      // Status filter
      const contrib = activeFund.contributions?.[st.id];
      const isPaid = contrib?.isPaid ?? false;
      if (paymentStatusFilter === 'paid' && !isPaid) return false;
      if (paymentStatusFilter === 'unpaid' && isPaid) return false;

      return true;
    });
  }, [activeFund, classStudents, selectedTeamFilter, searchStudentQuery, paymentStatusFilter]);

  // Format currency VND
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER & ROLE BADGE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wide">
              <Wallet className="w-3.5 h-3.5 text-amber-200" />
              <span>SỔ TAY QUỸ LỚP • {currentClassName}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Quản lý Quỹ lớp & Thu chi Minh bạch
            </h2>
            <p className="text-xs md:text-sm text-amber-100 max-w-2xl">
              Thống kê chi tiết các đợt thu quỹ theo tuần, học kỳ và năm học. Đảm bảo 100% công khai, minh bạch tài chính trong tập thể lớp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role indicator pill */}
            <div className="px-3.5 py-2 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>
                Quyền hạn: {isTeacherOrAdmin ? 'Giáo viên / Quản trị' : isTreasurer ? 'Thủ quỹ lớp' : isClassLeader ? 'Ban cán sự lớp' : isTeamLeader ? `Tổ trưởng (${userTeam})` : 'Học sinh'}
              </span>
            </div>

            {canCreateFund && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowAddFundModal(true);
                }}
                className="px-4 py-2.5 bg-white text-amber-900 font-extrabold rounded-2xl text-xs hover:bg-amber-50 active:scale-95 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-600" /> Tạo đợt thu quỹ mới
              </button>
            )}

            {canManageExpenses && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setEditingExpense(null);
                  setExpenseTitle('');
                  setExpenseAmount(50000);
                  setShowAddExpenseModal(true);
                }}
                className="px-4 py-2.5 bg-amber-950/40 border border-white/30 text-white font-extrabold rounded-2xl text-xs hover:bg-amber-950/60 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-amber-300" /> Ghi nhận chi tiêu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* INDIVIDUAL STUDENT STATUS HIGHLIGHT (Shown to students) */}
      {currentUser.role === 'student' && mySummary && (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              {mySummary.isFullyPaid ? '✨' : '💳'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-base">Tình trạng đóng quỹ của: {currentUser.fullName}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                  {currentUser.team || 'Tổ 1'}
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5">
                {mySummary.isFullyPaid 
                  ? '🎉 Tuyệt vời! Bạn đã hoàn thành đóng đầy đủ 100% tất cả các đợt quỹ của lớp.'
                  : `⚠️ Bạn đã hoàn thành ${mySummary.myPaidRounds}/${mySummary.myTotalRounds} đợt thu. Còn thiếu ${formatMoney(mySummary.myTotalOwed)}.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="text-right">
              <span className="text-[11px] text-teal-100 block">Tổng tiền bạn đã đóng</span>
              <span className="text-lg font-black">{formatMoney(mySummary.myTotalPaid)}</span>
            </div>
            {mySummary.myTotalOwed > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-rose-500/80 border border-rose-300 text-white text-xs font-bold text-center">
                <span className="block text-[10px] text-rose-100">Cần nộp thêm</span>
                {formatMoney(mySummary.myTotalOwed)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP 4 FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownRight className="w-4 h-4 text-emerald-500" /> Tổng tiền đã thu
            </span>
            <div className="text-xl md:text-2xl font-black text-emerald-600">
              {formatMoney(stats.totalCollected)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              Dự thu: {formatMoney(stats.totalExpected)} ({stats.paymentRate}%)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-inner">
            💵
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-rose-500" /> Tổng tiền đã chi
            </span>
            <div className="text-xl md:text-2xl font-black text-rose-600">
              {formatMoney(stats.totalSpent)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              {stats.filteredExpenses.length} khoản chi hợp lệ
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shadow-inner">
            🛒
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-amber-500" /> Số dư quỹ hiện tại
            </span>
            <div className={`text-xl md:text-2xl font-black ${stats.balance >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
              {formatMoney(stats.balance)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium block">
              Khả dụng cho các hoạt động tới
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-inner">
            🏦
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-500" /> Tiến độ đóng quỹ
            </span>
            <div className="text-xl md:text-2xl font-black text-sky-600">
              {stats.paymentRate}%
            </div>
            <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
              <div 
                className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, stats.paymentRate)}%` }} 
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-xl shadow-inner">
            📊
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white rounded-3xl p-4 border border-amber-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500">Năm học:</span>
            <select
              value={selectedAcademicYear}
              onChange={e => setSelectedAcademicYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-400"
            >
              <option value="2025 - 2026">2025 - 2026</option>
              <option value="2026 - 2027">2026 - 2027</option>
              <option value="all">Tất cả năm học</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-500">Học kỳ:</span>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-400"
            >
              <option value="all">Cả năm học</option>
              <option value="Học kỳ 1">Học kỳ 1</option>
              <option value="Học kỳ 2">Học kỳ 2</option>
            </select>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('fund_list'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fund_list'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Chi tiết đợt thu
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('matrix_overview'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'matrix_overview'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Bảng tổng hợp theo tuần
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('expenses'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Sổ chi tiêu ({stats.filteredExpenses.length})
          </button>
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('teams_summary'); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'teams_summary'
                ? 'bg-white text-amber-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Thi đua theo Tổ
          </button>
        </div>
      </div>

      {/* TAB 1: FUND LIST & ACTIVE FUND MANAGEMENT */}
      {activeTab === 'fund_list' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Fund Rounds */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                <span>📁</span> Danh sách các đợt thu quỹ ({filteredFunds.length})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredFunds.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-100">
                  <span className="text-3xl block mb-2">📭</span>
                  <p className="text-xs text-slate-400">Chưa có đợt thu quỹ nào trong kỳ lọc này.</p>
                </div>
              ) : (
                filteredFunds.map(fund => {
                  const isSelected = (activeFund?.id === fund.id);
                  const contrs = Object.values(fund.contributions || {}) as ClassFundContribution[];
                  const paidCount = contrs.filter(c => c.isPaid).length;
                  const totalCount = contrs.length || classStudents.length;
                  const percent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

                  return (
                    <div
                      key={fund.id}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedFundId(fund.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                        isSelected
                          ? 'bg-amber-50/80 border-amber-300 shadow-md ring-2 ring-amber-400/20'
                          : 'bg-white border-slate-100 hover:border-amber-200 hover:bg-slate-50/60 shadow-xs'
                      }`}
                    >
                      {/* Left accent indicator */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                      )}

                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {fund.weekNumber ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                              Tuần {fund.weekNumber}
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              {fund.semester}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400">
                            {fund.createdAt}
                          </span>
                        </div>

                        <span className="text-xs font-black text-amber-600">
                          {formatMoney(fund.amountPerStudent)}/HS
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-xs line-clamp-2 mb-2">
                        {fund.title}
                      </h4>

                      {/* Progress Bar & Stats */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>Tiến độ thu: {paidCount}/{totalCount} HS</span>
                          <span className="font-bold text-emerald-600">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Fund Details & Student Checklist */}
          <div className="lg:col-span-8 space-y-4">
            {activeFund ? (
              <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-5">
                {/* Active Fund Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {activeFund.periodType === 'week' ? `Đợt thu Tuần ${activeFund.weekNumber}` : activeFund.semester}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Tạo bởi: {activeFund.createdBy}
                      </span>
                      {activeFund.dueDate && (
                        <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Hạn nộp: {activeFund.dueDate}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-800">
                      {activeFund.title}
                    </h3>
                    {activeFund.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        📝 Ghi chú: {activeFund.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageAll && (
                      <button
                        type="button"
                        onClick={() => handleDeleteFund(activeFund.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Xóa đợt thu quỹ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Batch Actions & Filter Bar for this fund */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/40 p-3 rounded-2xl border border-amber-100">
                  {/* Search and Team Filter */}
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0 sm:min-w-[240px] w-full sm:w-auto">
                    <div className="relative flex-1 min-w-0 sm:min-w-[140px] w-full sm:w-auto">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchStudentQuery}
                        onChange={e => setSearchStudentQuery(e.target.value)}
                        placeholder="Tìm tên học sinh..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:border-amber-400"
                      />
                    </div>

                    <select
                      value={selectedTeamFilter}
                      onChange={e => setSelectedTeamFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-400"
                    >
                      <option value="all">Tất cả các Tổ</option>
                      <option value="Tổ 1">Tổ 1</option>
                      <option value="Tổ 2">Tổ 2</option>
                      <option value="Tổ 3">Tổ 3</option>
                      <option value="Tổ 4">Tổ 4</option>
                    </select>

                    <select
                      value={paymentStatusFilter}
                      onChange={e => setPaymentStatusFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-amber-400"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="paid">Đã đóng</option>
                      <option value="unpaid">Chưa đóng</option>
                    </select>
                  </div>

                  {/* Batch Action Buttons for Officers & Teachers */}
                  {canMarkPayment && (
                    <div className="flex items-center gap-1.5">
                      {isTeamLeader && userTeam && !canManageAll ? (
                        <button
                          type="button"
                          onClick={() => handleMarkTeamAsPaid(userTeam, true)}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Đánh dấu {userTeam} đã đóng
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMarkTeamAsPaid('all', true)}
                            className="px-2.5 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-[11px] hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Đánh dấu tất cả đã đóng
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkTeamAsPaid('all', false)}
                            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] hover:bg-slate-300 transition-all cursor-pointer"
                          >
                            Bỏ chọn tất cả
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Student Checklist Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-100 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3 text-center w-10">STT</th>
                        <th className="py-3 px-3">Học sinh</th>
                        <th className="py-3 px-3 text-center">Tổ</th>
                        <th className="py-3 px-3 text-center">Số tiền</th>
                        <th className="py-3 px-3 text-center">Trạng thái</th>
                        <th className="py-3 px-3">Ngày nộp & Hình thức</th>
                        <th className="py-3 px-3">Ghi chú</th>
                        {canMarkPayment && <th className="py-3 px-3 text-center">Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeFundStudentsList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Không tìm thấy học sinh nào phù hợp bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        activeFundStudentsList.map((student, idx) => {
                          const contrib = activeFund.contributions?.[student.id];
                          const isPaid = contrib?.isPaid ?? false;
                          const paidAmount = contrib?.paidAmount ?? (isPaid ? activeFund.amountPerStudent : 0);
                          const isMe = student.id === currentUser.id;

                          // Can this user toggle this student?
                          const canEditThisStudent = canManageAll || (isTeamLeader && student.team === userTeam);

                          return (
                            <tr 
                              key={student.id} 
                              className={`transition-colors ${
                                isMe 
                                  ? 'bg-amber-50/50 font-semibold' 
                                  : isPaid 
                                  ? 'hover:bg-emerald-50/30' 
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-3 px-3 text-center font-bold text-slate-400">
                                {idx + 1}
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {student.fullName.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 block">
                                      {student.fullName} {isMe && <span className="text-[10px] text-amber-600 font-extrabold">(Bạn)</span>}
                                    </span>
                                    {student.position && student.position !== 'thành viên' && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 uppercase">
                                        {student.position}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {student.team || 'Tổ 1'}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center font-bold text-slate-700">
                                {formatMoney(activeFund.amountPerStudent)}
                              </td>

                              <td className="py-3 px-3 text-center">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã đóng
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" /> Chưa đóng
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                {isPaid ? (
                                  <div className="text-[11px]">
                                    <span className="font-bold text-slate-700">{contrib?.paidAt || 'Đã nộp'}</span>
                                    {contrib?.paymentMethod && (
                                      <span className="text-slate-400 block text-[10px]">
                                        ({contrib.paymentMethod})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-[11px]">-</span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <span className="text-slate-500 text-[11px] italic">
                                  {contrib?.notes || '-'}
                                </span>
                              </td>

                              {canMarkPayment && (
                                <td className="py-3 px-3 text-center">
                                  {canEditThisStudent ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleTogglePayment(activeFund.id, student.id, student.fullName, student.team)}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                          isPaid
                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                        }`}
                                      >
                                        {isPaid ? 'Hủy đánh dấu' : 'Đã thu tiền'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowEditContributionModal(contrib || {
                                            studentId: student.id,
                                            studentName: student.fullName,
                                            team: student.team,
                                            isPaid,
                                            paidAmount,
                                            notes: ''
                                          });
                                          setContribPaidAmount(isPaid ? (contrib?.paidAmount || activeFund.amountPerStudent) : activeFund.amountPerStudent);
                                          setContribMethod(contrib?.paymentMethod || 'Tiền mặt');
                                          setContribNotes(contrib?.notes || '');
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                                        title="Chi tiết & Ghi chú"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Không thuộc quyền</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
                <span className="text-4xl block mb-2">📂</span>
                <h4 className="font-bold text-slate-700">Chưa chọn đợt thu quỹ nào</h4>
                <p className="text-xs text-slate-400 mt-1">Vui lòng chọn một đợt thu ở danh sách bên trái hoặc tạo đợt thu mới.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MATRIX OVERVIEW ACROSS ALL WEEKS */}
      {activeTab === 'matrix_overview' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>📑</span> Bảng Ma trận Thu Quỹ Tổng hợp qua các Tuần / Học kỳ
              </h3>
              <p className="text-xs text-slate-500">
                Bảng theo dõi trực quan giúp Ban cán sự, Thủ quỹ và Giáo viên chủ nhiệm bao quát tình trạng đóng quỹ của từng học sinh.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer self-start"
            >
              <Printer className="w-4 h-4" /> In bảng tổng hợp
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-10 sticky left-0 bg-slate-50 z-10">STT</th>
                  <th className="py-3 px-3 min-w-[150px] sticky left-10 bg-slate-50 z-10">Họ và tên</th>
                  <th className="py-3 px-2 text-center w-14">Tổ</th>
                  {filteredFunds.map(f => (
                    <th key={f.id} className="py-3 px-2 text-center min-w-[90px] border-l border-slate-200/60">
                      <span className="block font-black text-slate-800">
                        {f.weekNumber ? `Tuần ${f.weekNumber}` : 'Học kỳ'}
                      </span>
                      <span className="text-[9px] text-amber-600 font-bold">
                        {formatMoney(f.amountPerStudent)}
                      </span>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[100px] bg-amber-50/50 text-amber-900 font-black border-l border-amber-200">
                    Tổng đã nộp
                  </th>
                  <th className="py-3 px-3 text-center min-w-[90px] bg-amber-50/50 text-amber-900 font-black">
                    Tỷ lệ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st, idx) => {
                  let studentPaidTotal = 0;
                  let studentExpectedTotal = 0;
                  let studentPaidRounds = 0;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400 sticky left-0 bg-white z-10">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-800 sticky left-10 bg-white z-10">
                        <div className="flex items-center gap-1.5">
                          <span>{st.fullName}</span>
                          {st.id === currentUser.id && (
                            <span className="text-[9px] text-amber-600 font-extrabold">(Tôi)</span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {st.team || 'T1'}
                        </span>
                      </td>

                      {filteredFunds.map(fund => {
                        const contrib = fund.contributions?.[st.id];
                        const isPaid = contrib?.isPaid ?? false;
                        studentExpectedTotal += fund.amountPerStudent;
                        if (isPaid) {
                          studentPaidTotal += contrib?.paidAmount || fund.amountPerStudent;
                          studentPaidRounds++;
                        }

                        const canEditThisStudent = canManageAll || (isTeamLeader && st.team === userTeam);

                        return (
                          <td 
                            key={fund.id} 
                            className={`py-2 px-2 text-center border-l border-slate-100 ${
                              isPaid ? 'bg-emerald-50/30' : 'bg-rose-50/10'
                            }`}
                          >
                            {canEditThisStudent ? (
                              <button
                                type="button"
                                onClick={() => handleTogglePayment(fund.id, st.id, st.fullName, st.team)}
                                className={`w-7 h-7 rounded-xl inline-flex items-center justify-center font-black text-xs transition-all cursor-pointer active:scale-90 ${
                                  isPaid
                                    ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600'
                                    : 'bg-slate-100 text-slate-300 hover:bg-rose-100 hover:text-rose-600'
                                }`}
                                title={isPaid ? `Đã đóng: ${formatMoney(contrib?.paidAmount || fund.amountPerStudent)}` : 'Chưa đóng (Bấm để đánh dấu)'}
                              >
                                {isPaid ? '✓' : '—'}
                              </button>
                            ) : (
                              <span className={`inline-block font-bold ${isPaid ? 'text-emerald-600' : 'text-slate-300'}`}>
                                {isPaid ? '✓' : '—'}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-center font-black text-emerald-700 bg-amber-50/30 border-l border-amber-100">
                        {formatMoney(studentPaidTotal)}
                      </td>

                      <td className="py-2.5 px-3 text-center bg-amber-50/30">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          studentPaidRounds === filteredFunds.length && filteredFunds.length > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {studentPaidRounds}/{filteredFunds.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE LOG & RECEIPTS */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>🧾</span> Sổ Nhật ký Chi tiêu Quỹ lớp
              </h3>
              <p className="text-xs text-slate-500">
                Ghi chép chi tiết tất cả các khoản chi tiêu từ quỹ: mua văn phòng phẩm, khen thưởng, vệ sinh và hoạt động ngoại khóa.
              </p>
            </div>

            {canManageExpenses && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setEditingExpense(null);
                  setExpenseTitle('');
                  setExpenseAmount(50000);
                  setShowAddExpenseModal(true);
                }}
                className="px-4 py-2 bg-amber-500 text-white font-extrabold rounded-2xl text-xs hover:bg-amber-600 active:scale-95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer self-start"
              >
                <Plus className="w-4 h-4" /> Thêm khoản chi mới
              </button>
            )}
          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 text-center w-10">STT</th>
                  <th className="py-3 px-3">Ngày chi</th>
                  <th className="py-3 px-3">Nội dung chi tiêu</th>
                  <th className="py-3 px-3">Danh mục</th>
                  <th className="py-3 px-3 text-right">Số tiền chi</th>
                  <th className="py-3 px-3">Người phụ trách chi</th>
                  <th className="py-3 px-3">Hóa đơn / Ghi chú</th>
                  {canManageExpenses && <th className="py-3 px-3 text-center">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Chưa có khoản chi tiêu nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  stats.filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {exp.date}
                        {exp.weekNumber && (
                          <span className="block text-[10px] text-sky-600 font-bold">
                            Tuần {exp.weekNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-800">
                        {exp.title}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-black text-rose-600">
                        -{formatMoney(exp.amount)}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {exp.spentBy}
                      </td>

                      <td className="py-3 px-3 text-slate-500 italic text-[11px]">
                        {exp.receiptNote || '-'}
                      </td>

                      {canManageExpenses && (
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExpense(exp);
                                setExpenseTitle(exp.title);
                                setExpenseAmount(exp.amount);
                                setExpenseDate(exp.date);
                                setExpenseSpentBy(exp.spentBy);
                                setExpenseCategory(exp.category);
                                setExpenseReceiptNote(exp.receiptNote || '');
                                setExpenseSemester(exp.semester);
                                setExpenseWeekNumber(exp.weekNumber || 4);
                                setShowAddExpenseModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              {stats.filteredExpenses.length > 0 && (
                <tfoot>
                  <tr className="bg-rose-50/50 font-black text-slate-800 border-t-2 border-slate-200">
                    <td colSpan={4} className="py-3 px-3 text-right uppercase text-[11px]">
                      Tổng cộng các khoản chi:
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 text-sm">
                      -{formatMoney(stats.totalSpent)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TEAMS SUMMARY & RANKING */}
      {activeTab === 'teams_summary' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <span>🏆</span> Thống kê Tiến độ & Thi đua Đóng Quỹ theo từng Tổ
            </h3>
            <p className="text-xs text-slate-500">
              Tổ trưởng đôn đốc các thành viên trong tổ nộp quỹ đúng hạn để nâng cao điểm thi đua rèn luyện của tổ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamStats.map((team, idx) => (
              <div
                key={team.teamName}
                className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60 space-y-4 hover:border-amber-200 hover:bg-white transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">
                      T{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">{team.teamName}</h4>
                      <span className="text-[10px] text-slate-400 font-bold">{team.studentCount} thành viên</span>
                    </div>
                  </div>

                  <span className={`text-sm font-black ${team.rate === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {team.rate}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        team.rate === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${team.rate}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Đã thu: {formatMoney(team.teamCollected)}</span>
                    <span>Dự thu: {formatMoney(team.teamExpected)}</span>
                  </div>
                </div>

                {/* Team member quick list */}
                <div className="pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Thành viên trong tổ:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {classStudents.filter(s => s.team === team.teamName).map(st => (
                      <div key={st.id} className="flex items-center justify-between text-[11px] py-0.5">
                        <span className="font-medium text-slate-700">{st.fullName}</span>
                        {st.position && st.position !== 'thành viên' && (
                          <span className="text-[9px] font-bold text-purple-600">({st.position})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW FUND ROUND */}
      {showAddFundModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>➕</span> Tạo đợt thu quỹ mới
              </h3>
              <button
                onClick={() => setShowAddFundModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tên đợt thu quỹ *
                </label>
                <input
                  type="text"
                  required
                  value={newFundTitle}
                  onChange={e => setNewFundTitle(e.target.value)}
                  placeholder="VD: Quỹ hoạt động tuần 5 (Photo đề & khăn lau)"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Loại chu kỳ
                  </label>
                  <select
                    value={newFundPeriodType}
                    onChange={e => setNewFundPeriodType(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                  >
                    <option value="week">Theo tuần</option>
                    <option value="semester">Theo học kỳ</option>
                    <option value="year">Theo năm học</option>
                    <option value="custom">Đợt đặc biệt / Phong trào</option>
                  </select>
                </div>

                {newFundPeriodType === 'week' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Số tuần
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={35}
                      value={newFundWeekNumber}
                      onChange={e => setNewFundWeekNumber(Number(e.target.value))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Học kỳ
                    </label>
                    <select
                      value={newFundSemester}
                      onChange={e => setNewFundSemester(e.target.value as any)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                    >
                      <option value="Học kỳ 1">Học kỳ 1</option>
                      <option value="Học kỳ 2">Học kỳ 2</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số tiền cần đóng mỗi HS (VNĐ) *
                  </label>
                  <input
                    type="number"
                    step={1000}
                    min={1000}
                    required
                    value={newFundAmount}
                    onChange={e => setNewFundAmount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-amber-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Hạn chót nộp tiền
                  </label>
                  <input
                    type="date"
                    value={newFundDueDate}
                    onChange={e => setNewFundDueDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mục đích thu & Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={newFundNotes}
                  onChange={e => setNewFundNotes(e.target.value)}
                  placeholder="Ghi chú mục đích sử dụng quỹ..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFundModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Tạo đợt thu quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>🛒</span> {editingExpense ? 'Chỉnh sửa khoản chi tiêu' : 'Ghi nhận khoản chi tiêu mới'}
              </h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nội dung chi tiêu *
                </label>
                <input
                  type="text"
                  required
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  placeholder="VD: Mua 2 chổi quét + 1 xô lau sàn trực nhật"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số tiền chi (VNĐ) *
                  </label>
                  <input
                    type="number"
                    step={1000}
                    min={1000}
                    required
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-rose-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Danh mục chi
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                  >
                    <option value="Vật phẩm học tập">Vật phẩm học tập</option>
                    <option value="Vệ sinh lớp">Vệ sinh lớp</option>
                    <option value="Văn nghệ & Phong trào">Văn nghệ & Phong trào</option>
                    <option value="Khen thưởng & Quà tặng">Khen thưởng & Quà tặng</option>
                    <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ngày chi
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Người phụ trách chi
                  </label>
                  <input
                    type="text"
                    value={expenseSpentBy}
                    onChange={e => setExpenseSpentBy(e.target.value)}
                    placeholder="Họ tên người chi..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hóa đơn / Chứng từ / Nơi mua
                </label>
                <input
                  type="text"
                  value={expenseReceiptNote}
                  onChange={e => setExpenseReceiptNote(e.target.value)}
                  placeholder="VD: Hóa đơn nhà sách Tiến Thọ số HD-0982"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingExpense ? 'Lưu cập nhật' : 'Ghi nhận chi tiêu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CONTRIBUTION DETAIL */}
      {showEditContributionModal && activeFund && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Cập nhật nộp quỹ: {showEditContributionModal.studentName}
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {activeFund.title} ({formatMoney(activeFund.amountPerStudent)})
                </span>
              </div>
              <button
                onClick={() => setShowEditContributionModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Số tiền thực đóng (VNĐ)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={1000}
                    min={0}
                    value={contribPaidAmount}
                    onChange={e => setContribPaidAmount(Number(e.target.value))}
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-emerald-600 outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setContribPaidAmount(activeFund.amountPerStudent)}
                    className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl cursor-pointer"
                  >
                    Đủ mức
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hình thức đóng
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContribMethod('Tiền mặt')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      contribMethod === 'Tiền mặt'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    💵 Tiền mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setContribMethod('Chuyển khoản')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      contribMethod === 'Chuyển khoản'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    📱 Chuyển khoản
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ghi chú riêng
                </label>
                <input
                  type="text"
                  value={contribNotes}
                  onChange={e => setContribNotes(e.target.value)}
                  placeholder="VD: Phụ huynh gửi vào tài khoản thủ quỹ..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowEditContributionModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveContributionDetail}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Lưu xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
