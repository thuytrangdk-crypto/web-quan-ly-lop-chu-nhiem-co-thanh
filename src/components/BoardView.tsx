import React, { useState } from 'react';
import { AppState, BoardNotice } from '../types';
import {
  Megaphone,
  Pin,
  PlusCircle,
  Trash2,
  Calendar,
  User,
  Grid3X3,
  Printer,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { generateId, getTodayStr } from '../utils/helpers';

interface BoardViewProps {
  state: AppState;
  onAddNotice: (notice: Omit<BoardNotice, 'id'>) => void;
  onDeleteNotice: (id: string) => void;
  onUpdateSeatingChart: (newChart: Record<string, string>) => void;
  onSelectStudent: (id: string) => void;
  isTeacher: boolean;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  state,
  onAddNotice,
  onDeleteNotice,
  onUpdateSeatingChart,
  onSelectStudent,
  isTeacher,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'seating'>('notices');

  // Notice creation modal
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState<{
    title: string;
    content: string;
    priority: 'high' | 'normal' | 'info';
    pinned: boolean;
    author: string;
  }>({
    title: '',
    content: '',
    priority: 'normal',
    pinned: false,
    author: `GVCN Cô ${state.config.teacherName}`,
  });

  // Seating assignment modal
  const [assigningDeskKey, setAssigningDeskKey] = useState<string | null>(null);

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title.trim()) {
      onShowToast('Vui lòng nhập tiêu đề thông báo', 'error');
      return;
    }
    onAddNotice({
      title: noticeForm.title,
      content: noticeForm.content,
      priority: noticeForm.priority,
      pinned: noticeForm.pinned,
      author: noticeForm.author,
      date: getTodayStr(),
    });
    setIsAddNoticeOpen(false);
    setNoticeForm({
      title: '',
      content: '',
      priority: 'normal',
      pinned: false,
      author: `GVCN Cô ${state.config.teacherName}`,
    });
  };

  const seatingChart = state.seatingChart || {};

  const handleAssignStudent = (deskKey: string, studentId: string | '') => {
    const updated = { ...seatingChart };
    if (!studentId) {
      delete updated[deskKey];
    } else {
      // If student was already seated elsewhere, remove from old slot
      Object.keys(updated).forEach((k) => {
        if (updated[k] === studentId) {
          delete updated[k];
        }
      });
      updated[deskKey] = studentId;
    }
    onUpdateSeatingChart(updated);
    setAssigningDeskKey(null);
  };

  const handleAutoAssign = () => {
    const updated = { ...seatingChart };
    const seatedIds = new Set(Object.values(updated));
    const unseated = state.students.filter((s) => !seatedIds.has(s.id));

    let unseatedIdx = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 4; c++) {
        const key = `desk_${r}_${c}`;
        if (!updated[key] && unseatedIdx < unseated.length) {
          updated[key] = unseated[unseatedIdx].id;
          unseatedIdx++;
        }
      }
    }
    onUpdateSeatingChart(updated);
    onShowToast('Đã tự động xếp chỗ cho các học sinh còn lại!');
  };

  const handleClearSeating = () => {
    if (window.confirm('Bạn có chắc muốn xóa trắng toàn bộ sơ đồ chỗ ngồi?')) {
      onUpdateSeatingChart({});
      onShowToast('Đã xóa sơ đồ chỗ ngồi');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Switcher */}
      <div className="bg-white rounded-3xl p-4 lg:p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>Bảng Tin & Không Gian Lớp Học</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Lớp {state.config.className}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Thông báo hoạt động lớp, kế hoạch học tập và sơ đồ chỗ ngồi
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-gray-100 rounded-2xl border border-gray-200">
            <button
              onClick={() => setActiveTab('notices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'notices'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Bảng Tin Lớp ({state.boardNotices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('seating')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'seating'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Sơ Đồ Chỗ Ngồi</span>
            </button>
          </div>

          {activeTab === 'notices' && isTeacher && (
            <button
              onClick={() => setIsAddNoticeOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đăng tin</span>
            </button>
          )}

          {activeTab === 'seating' && isTeacher && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAutoAssign}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Xếp tự động
              </button>
              <button
                onClick={handleClearSeating}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Xóa sơ đồ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: NOTICES BOARD */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {state.boardNotices.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-xs">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">Bảng tin chưa có thông báo</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Cô giáo có thể đăng các thông báo quan trọng, dặn dò nề nếp, lịch thi hoặc lịch trực nhật lên bảng tin.
              </p>
            </div>
          ) : (
            state.boardNotices.map((n) => {
              const isHigh = n.priority === 'high';
              const isInfo = n.priority === 'info';

              return (
                <div
                  key={n.id}
                  className={`bg-white rounded-3xl p-5 border shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                    n.pinned
                      ? 'border-indigo-300 ring-2 ring-indigo-500/10'
                      : 'border-gray-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {n.pinned && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5" />
                            <span>Ghim đầu trang</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isHigh
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isInfo
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isHigh ? 'Khẩn / Quan trọng' : isInfo ? 'Nhắc nhở' : 'Thông báo chung'}
                        </span>
                      </div>

                      {isTeacher && (
                        <button
                          onClick={() => onDeleteNotice(n.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Xóa thông báo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-gray-900 mb-2">
                      {n.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line mb-4">
                      {n.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{n.author || 'GVCN'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{n.date}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: SEATING CHART */}
      {activeTab === 'seating' && (
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200/80 shadow-xs space-y-6">
          {/* Teacher podium & Blackboard */}
          <div className="max-w-md mx-auto text-center space-y-2">
            <div className="py-2.5 bg-slate-800 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-md flex items-center justify-center gap-2">
              <span>BẢNG LỚP HỌC</span>
            </div>
            <div className="w-36 mx-auto py-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-[11px] font-bold shadow-xs">
              Bàn Giáo Viên
            </div>
          </div>

          {/* Desks Grid: 5 Rows x 4 Desks */}
          <div className="space-y-4 max-w-4xl mx-auto pt-2">
            {[0, 1, 2, 3, 4].map((rowIndex) => (
              <div key={rowIndex} className="space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                  Hàng {rowIndex + 1}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                  {[0, 1, 2, 3].map((colIndex) => {
                    const deskKey = `desk_${rowIndex}_${colIndex}`;
                    const assignedStudentId = seatingChart[deskKey];
                    const student = state.students.find(
                      (s) => s.id === assignedStudentId
                    );

                    return (
                      <div
                        key={colIndex}
                        onClick={() => {
                          if (isTeacher) {
                            setAssigningDeskKey(deskKey);
                          } else if (student) {
                            onSelectStudent(student.id);
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all text-center flex flex-col justify-center items-center min-h-[96px] cursor-pointer ${
                          student
                            ? 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400 hover:shadow-xs'
                            : 'bg-gray-50/60 border-dashed border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {student ? (
                          <>
                            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xs flex items-center justify-center mb-1 shadow-xs">
                              {student.name.charAt(student.name.lastIndexOf(' ') + 1) ||
                                student.name.charAt(0)}
                            </div>
                            <div className="text-xs font-bold text-gray-900 line-clamp-1">
                              {student.name}
                            </div>
                            <div className="text-[10px] text-indigo-600 font-semibold line-clamp-1">
                              {student.position || 'Học sinh'}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400 text-xs">
                            <span className="font-medium">Chỗ trống</span>
                            {isTeacher && (
                              <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                                + Xếp chỗ
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            {isTeacher
              ? 'Bấm vào từng bàn học để phân công học sinh hoặc đổi vị trí ngồi.'
              : 'Sơ đồ vị trí ngồi của lớp do cô chủ nhiệm sắp xếp.'}
          </div>
        </div>
      )}

      {/* MODAL: ADD NOTICE */}
      {isAddNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="font-bold text-base">Đăng Thông Báo Lớp Mới</h3>
              <button
                onClick={() => setIsAddNoticeOpen(false)}
                className="text-indigo-200 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tiêu Đề Thông Báo *
                </label>
                <input
                  type="text"
                  required
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="Ví dụ: Kế hoạch kiểm tra giữa kỳ..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nội Dung Chi Tiết *
                </label>
                <textarea
                  rows={4}
                  required
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  placeholder="Nhập nội dung dặn dò học sinh và phụ huynh..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Mức Độ Ưu Tiên
                  </label>
                  <select
                    value={noticeForm.priority}
                    onChange={(e) =>
                      setNoticeForm({ ...noticeForm, priority: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="normal">Thông báo thường</option>
                    <option value="high">Khẩn / Quan trọng</option>
                    <option value="info">Nhắc nhở</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Người Ký / Đăng
                  </label>
                  <input
                    type="text"
                    value={noticeForm.author}
                    onChange={(e) => setNoticeForm({ ...noticeForm, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={noticeForm.pinned}
                  onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="pinCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Ghim thông báo này lên đầu bảng tin
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddNoticeOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
                >
                  Đăng Thông Báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN SEAT */}
      {assigningDeskKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h3 className="font-bold text-sm">Xếp Học Sinh Vào Chỗ Ngồi</h3>
              <button
                onClick={() => setAssigningDeskKey(null)}
                className="text-indigo-200 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2">
              <button
                onClick={() => handleAssignStudent(assigningDeskKey, '')}
                className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                ✕ Để trống chỗ ngồi này
              </button>

              <div className="border-t border-gray-100 my-2" />

              <div className="space-y-1">
                {state.students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleAssignStudent(assigningDeskKey, s.id)}
                    className="w-full p-2.5 rounded-xl text-left text-xs font-medium text-gray-800 hover:bg-indigo-50 hover:text-indigo-900 transition-colors flex items-center justify-between"
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {s.position || 'Học sinh'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
