import React, { useState, useMemo } from 'react';
import { AppState, AttendanceStatus, Student } from '../types';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  Download,
  Filter,
  UserCheck,
  Search,
} from 'lucide-react';
import { formatViDate, getTodayStr, STATUS_META } from '../utils/helpers';

interface AttendanceViewProps {
  state: AppState;
  onUpdateAttendanceStatus: (
    studentId: string,
    date: string,
    status: AttendanceStatus
  ) => void;
  onMarkAllPresent: (date: string) => void;
  onSaveNotice: () => void;
  onSelectStudent: (id: string) => void;
  isTeacher: boolean;
  currentStudentId: string | null;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  state,
  onUpdateAttendanceStatus,
  onMarkAllPresent,
  onSaveNotice,
  onSelectStudent,
  isTeacher,
  currentStudentId,
  onShowToast,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [statusFilter, setStatusFilter] = useState<'all' | 'absent' | 'unmarked'>('all');
  const [search, setSearch] = useState('');

  // Shift dates
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Student statuses for selected date
  const studentStatusMap = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    state.attendance.forEach((rec) => {
      if (rec.date === selectedDate) {
        map.set(rec.studentId, rec.status);
      }
    });
    return map;
  }, [state.attendance, selectedDate]);

  // Counts
  const total = state.students.length;
  let countPresent = 0;
  let countLate = 0;
  let countExcused = 0;
  let countUnexcused = 0;
  let countUnmarked = 0;

  state.students.forEach((s) => {
    const st = studentStatusMap.get(s.id);
    if (st === 'c') countPresent++;
    else if (st === 'm') countLate++;
    else if (st === 'v') countExcused++;
    else if (st === 'kp') countUnexcused++;
    else countUnmarked++;
  });

  const filteredStudents = useMemo(() => {
    return state.students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.includes(search);

      const st = studentStatusMap.get(s.id);

      if (statusFilter === 'absent') {
        return matchSearch && (st === 'v' || st === 'm' || st === 'kp');
      }
      if (statusFilter === 'unmarked') {
        return matchSearch && !st;
      }
      return matchSearch;
    });
  }, [state.students, studentStatusMap, search, statusFilter]);

  const handleExportAttendance = () => {
    const header = ['STT', 'Mã định danh', 'Họ và tên', 'Trạng thái điểm danh', 'Ngày'];
    const rows = state.students.map((s, idx) => {
      const st = studentStatusMap.get(s.id);
      const label = st ? STATUS_META[st].label : 'Chưa điểm danh';
      return [idx + 1, s.id, `"${s.name}"`, `"${label}"`, selectedDate];
    });

    const csvContent =
      '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Diem_danh_lop_${state.config.className}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Đã xuất báo cáo điểm danh ngày ' + formatViDate(selectedDate));
  };

  return (
    <div className="space-y-5">
      {/* Date Bar & Controls */}
      <div className="bg-white rounded-3xl p-4 lg:p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>Sổ Điểm Danh Lớp Học</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Lớp {state.config.className}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi nề nếp chuyên cần, đi muộn, nghỉ học có phép và không phép
          </p>
        </div>

        {/* Date navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl p-1">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 rounded-xl hover:bg-white text-gray-600 hover:shadow-xs transition-all"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-gray-800 bg-transparent border-none focus:outline-hidden cursor-pointer"
              />
            </div>
            <button
              onClick={() => handleShiftDate(1)}
              className="p-1.5 rounded-xl hover:bg-white text-gray-600 hover:shadow-xs transition-all"
              title="Ngày sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(getTodayStr())}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
          >
            Hôm nay
          </button>

          {isTeacher && (
            <button
              onClick={() => onMarkAllPresent(selectedDate)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Có mặt tất cả</span>
            </button>
          )}

          <button
            onClick={handleExportAttendance}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            title="Xuất bảng điểm danh"
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span className="hidden sm:inline">Xuất</span>
          </button>
        </div>
      </div>

      {/* Stats Cards for Selected Date */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {/* Present */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-emerald-800">{countPresent}</div>
            <div className="text-xs font-bold text-emerald-700 uppercase mt-0.5">
              Có mặt
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {total > 0 ? Math.round((countPresent / total) * 100) : 0}%
          </div>
        </div>

        {/* Excused Absent */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-amber-800">{countExcused}</div>
            <div className="text-xs font-bold text-amber-700 uppercase mt-0.5">
              Nghỉ có phép
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Late */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-blue-800">{countLate}</div>
            <div className="text-xs font-bold text-blue-700 uppercase mt-0.5">
              Đi học muộn
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            M
          </div>
        </div>

        {/* Unexcused Absent */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-rose-800">{countUnexcused}</div>
            <div className="text-xs font-bold text-rose-700 uppercase mt-0.5">
              Không phép
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học sinh..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả ({total})
          </button>
          <button
            onClick={() => setStatusFilter('absent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'absent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Vắng / Muộn ({countLate + countExcused + countUnexcused})
          </button>
          {countUnmarked > 0 && (
            <button
              onClick={() => setStatusFilter('unmarked')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'unmarked'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Chưa điểm danh ({countUnmarked})
            </button>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-12 text-center">STT</th>
                <th className="py-3.5 px-4">Họ và Tên Học Sinh</th>
                <th className="py-3.5 px-4">Chức vụ</th>
                <th className="py-3.5 px-4">Trạng thái hiện tại</th>
                <th className="py-3.5 px-4 text-center">
                  {isTeacher ? 'Điểm danh nhanh (Bấm để chọn)' : 'Chi tiết'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Không tìm thấy học sinh phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const currentStatus = studentStatusMap.get(s.id);
                  const isCurrentSelf = s.id === currentStudentId;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-indigo-50/30 transition-colors ${
                        isCurrentSelf ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-medium text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectStudent(s.id)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {s.name.charAt(s.name.lastIndexOf(' ') + 1) || s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                              {s.name}
                            </div>
                            <div className="text-[10px] text-gray-400">Mã: {s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-medium">
                        {s.position || 'Học sinh'}
                      </td>
                      <td className="py-3 px-4">
                        {currentStatus ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_META[currentStatus].badgeClass}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{STATUS_META[currentStatus].label}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                            Chưa điểm danh
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isTeacher ? (
                          <div className="inline-flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
                            {(['c', 'v', 'm', 'kp'] as AttendanceStatus[]).map((statusKey) => {
                              const meta = STATUS_META[statusKey];
                              const isSelected = currentStatus === statusKey;
                              return (
                                <button
                                  key={statusKey}
                                  onClick={() =>
                                    onUpdateAttendanceStatus(s.id, selectedDate, statusKey)
                                  }
                                  title={meta.label}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? `${meta.bgClass} shadow-xs scale-105 ring-2 ring-white`
                                      : 'bg-white hover:bg-gray-200 text-gray-600'
                                  }`}
                                >
                                  {meta.short}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelectStudent(s.id)}
                            className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-bold text-xs"
                          >
                            Xem hồ sơ
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
