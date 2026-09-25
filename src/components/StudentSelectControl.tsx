import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { Search, UserCheck, X, Filter } from 'lucide-react';

interface StudentSelectControlProps {
  students: User[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  label?: string;
  themeColor?: 'amber' | 'emerald' | 'blue' | 'indigo';
  required?: boolean;
}

export const StudentSelectControl: React.FC<StudentSelectControlProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  label = 'Chọn học sinh',
  themeColor = 'amber',
  required = true,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique teams
  const teamsList = useMemo(() => {
    const teamsSet = new Set<string>();
    students.forEach((st) => {
      if (st.team) teamsSet.add(st.team.trim());
    });
    const sorted = Array.from(teamsSet).sort((a, b) =>
      a.localeCompare(b, 'vi', { numeric: true })
    );
    return sorted;
  }, [students]);

  // Filter students by team and search query
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Filter by team
      if (selectedTeam !== 'ALL' && (st.team || '').trim() !== selectedTeam) {
        return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = st.fullName.toLowerCase().includes(query);
        const matchTeam = (st.team || '').toLowerCase().includes(query);
        const matchPos = (st.position || '').toLowerCase().includes(query);
        return matchName || matchTeam || matchPos;
      }
      return true;
    });
  }, [students, selectedTeam, searchQuery]);

  // Selected student object
  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Theme styling helpers
  const themeClasses = {
    amber: {
      activeTab: 'bg-amber-500 text-white border-amber-500 shadow-xs',
      focusRing: 'focus:ring-amber-500',
      cardBg: 'bg-amber-50/80 border-amber-200 text-amber-950',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    emerald: {
      activeTab: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
      focusRing: 'focus:ring-emerald-500',
      cardBg: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    blue: {
      activeTab: 'bg-blue-600 text-white border-blue-600 shadow-xs',
      focusRing: 'focus:ring-blue-500',
      cardBg: 'bg-blue-50/80 border-blue-200 text-blue-950',
      badge: 'bg-blue-100 text-blue-900 border-blue-300',
    },
    indigo: {
      activeTab: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
      focusRing: 'focus:ring-indigo-500',
      cardBg: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
      badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    },
  }[themeColor];

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {currentStudent && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${themeClasses.badge}`}
          >
            🎯 Đã chọn: {currentStudent.fullName} ({currentStudent.team || 'Tổ 1'})
          </span>
        )}
      </div>

      {/* Team Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3 text-slate-400" />
          <span>Lọc Tổ:</span>
        </span>

        <button
          type="button"
          onClick={() => setSelectedTeam('ALL')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shrink-0 ${
            selectedTeam === 'ALL'
              ? themeClasses.activeTab
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Tất cả ({students.length})
        </button>

        {teamsList.map((teamName) => {
          const count = students.filter(
            (s) => (s.team || '').trim() === teamName
          ).length;
          return (
            <button
              type="button"
              key={teamName}
              onClick={() => setSelectedTeam(teamName)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shrink-0 ${
                selectedTeam === teamName
                  ? themeClasses.activeTab
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {teamName} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Tìm nhanh theo tên học sinh, số thứ tự, hoặc chức vụ..."
          className={`w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 ${themeClasses.focusRing}`}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[10px] font-bold cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Filtered Students Dropdown Select */}
      <div>
        <select
          value={selectedStudentId}
          onChange={(e) => onSelectStudent(e.target.value)}
          className={`w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 ${themeClasses.focusRing}`}
          required={required}
        >
          {filteredStudents.length === 0 ? (
            <option value="" disabled>
              ❌ Không tìm thấy học sinh phù hợp với "{searchQuery}"
            </option>
          ) : (
            filteredStudents.map((st) => (
              <option key={st.id} value={st.id}>
                {st.fullName} — ({st.team || 'Tổ 1'}) — {st.position || 'Thành viên'}
              </option>
            ))
          )}
        </select>
        {filteredStudents.length > 0 && (
          <p className="text-[10px] text-slate-500 mt-1 font-medium flex items-center justify-between">
            <span>Hiển thị {filteredStudents.length} / {students.length} học sinh</span>
            {selectedTeam !== 'ALL' && <span>(Đang lọc: {selectedTeam})</span>}
          </p>
        )}
      </div>

      {/* Selected Student Card Preview */}
      {currentStudent && (
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between ${themeClasses.cardBg}`}
        >
          <div className="flex items-center gap-2.5">
            <img
              src={
                currentStudent.avatar ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${currentStudent.id}`
              }
              alt={currentStudent.fullName}
              className="w-8 h-8 rounded-full border border-white/80 shadow-xs object-cover"
            />
            <div>
              <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                <span>{currentStudent.fullName}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-white/80 border border-slate-200 rounded font-bold text-slate-700">
                  {currentStudent.team || 'Tổ 1'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Chức vụ:{' '}
                <span className="font-bold text-slate-800">
                  {currentStudent.position || 'Thành viên'}
                </span>{' '}
                • Lớp: {currentStudent.className || '8A1'}
              </div>
            </div>
          </div>
          <UserCheck className="w-5 h-5 text-slate-500 opacity-60" />
        </div>
      )}
    </div>
  );
};
