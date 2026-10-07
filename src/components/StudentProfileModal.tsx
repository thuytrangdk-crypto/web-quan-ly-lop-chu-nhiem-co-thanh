import React, { useState, useRef } from 'react';
import {
  AppState,
  DisciplineRecord,
  NoteRecord,
  Student,
} from '../types';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Award,
  GraduationCap,
  Clock,
  BookOpen,
  MessageSquare,
  KeyRound,
  Camera,
  X,
  PlusCircle,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Star,
  Edit2,
} from 'lucide-react';
import {
  calculateAverageGrade,
  calculateTotalPoints,
  formatViDate,
  getConductFromGrade,
  getTodayStr,
  STATUS_META,
  SUBJECT_LIST,
} from '../utils/helpers';

interface StudentProfileModalProps {
  studentId: string;
  state: AppState;
  isTeacher: boolean;
  onClose: () => void;
  onEditStudent: (s: Student) => void;
  onUpdateAvatar: (studentId: string, base64: string) => void;
  onSaveGrades: (studentId: string, grades: Record<string, number>) => void;
  onAddDiscipline: (record: Omit<DisciplineRecord, 'id'>) => void;
  onDeleteDiscipline: (id: string) => void;
  onAddNote: (record: Omit<NoteRecord, 'id'>) => void;
  onDeleteNote: (id: string) => void;
  onChangePassword: (studentId: string, newPass: string) => void;
  onLogout: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  state,
  isTeacher,
  onClose,
  onEditStudent,
  onUpdateAvatar,
  onSaveGrades,
  onAddDiscipline,
  onDeleteDiscipline,
  onAddNote,
  onDeleteNote,
  onChangePassword,
  onLogout,
  onShowToast,
}) => {
  const student = state.students.find((s) => s.id === studentId);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<
    'info' | 'grades' | 'discipline' | 'attendance' | 'notes' | 'password'
  >('info');

  // Grades state
  const [grades, setGrades] = useState<Record<string, number>>(
    student?.grades || {}
  );

  // Discipline record form state
  const [isAddingDiscipline, setIsAddingDiscipline] = useState(false);
  const [disciplineRule, setDisciplineRule] = useState('');
  const [disciplinePoints, setDisciplinePoints] = useState<number>(5);
  const [disciplineNote, setDisciplineNote] = useState('');
  const [disciplineType, setDisciplineType] = useState<'plus' | 'minus'>('plus');

  // Note form state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Password state
  const [newPassword, setNewPassword] = useState('');

  if (!student) return null;

  // Personal discipline records
  const personalDiscipline = state.discipline.filter(
    (d) => d.studentId === student.id
  );
  const totalPoints = calculateTotalPoints(state.discipline, student.id);

  // Personal attendance records
  const personalAttendance = state.attendance.filter(
    (a) => a.studentId === student.id
  );
  const countPresent = personalAttendance.filter((a) => a.status === 'c').length;
  const countLate = personalAttendance.filter((a) => a.status === 'm').length;
  const countExcused = personalAttendance.filter((a) => a.status === 'v').length;
  const countUnexcused = personalAttendance.filter((a) => a.status === 'kp').length;

  // Personal notes
  const personalNotes = state.notes.filter((n) => n.studentId === student.id);

  // Average grade
  const avgGrade = calculateAverageGrade(grades);
  const academicRank = getConductFromGrade(avgGrade);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateAvatar(student.id, reader.result);
          onShowToast('Đã cập nhật ảnh đại diện học sinh');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGradesSubmit = () => {
    onSaveGrades(student.id, grades);
    onShowToast('Đã lưu bảng điểm học tập');
  };

  const handleCreateDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplineRule.trim()) return;

    const finalPoints =
      disciplineType === 'plus'
        ? Math.abs(disciplinePoints)
        : -Math.abs(disciplinePoints);

    onAddDiscipline({
      studentId: student.id,
      date: getTodayStr(),
      ruleName: disciplineRule.trim(),
      points: finalPoints,
      note: disciplineNote.trim(),
      type: disciplineType,
    });

    setIsAddingDiscipline(false);
    setDisciplineRule('');
    setDisciplineNote('');
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    onAddNote({
      studentId: student.id,
      date: getTodayStr(),
      title: noteTitle.trim() || 'Nhắc nhở của cô',
      content: noteContent.trim(),
      author: isTeacher ? `Cô ${state.config.teacherName}` : 'Học sinh',
    });

    setIsAddingNote(false);
    setNoteTitle('');
    setNoteContent('');
    onShowToast('Đã thêm ghi chú');
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    onChangePassword(student.id, newPassword.trim());
    setNewPassword('');
    onShowToast('Đã đổi mật khẩu đăng nhập của học sinh');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Top Header with Student Info */}
        <div className="bg-linear-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white p-6 relative overflow-hidden shrink-0">
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-20 h-20 rounded-3xl object-cover ring-4 ring-white/30 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl text-white ring-4 ring-white/30 shadow-lg">
                  {student.name.charAt(student.name.lastIndexOf(' ') + 1) ||
                    student.name.charAt(0)}
                </div>
              )}
              {isTeacher && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  title="Tải ảnh học sinh"
                  className="absolute -bottom-1 -right-1 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl shadow-md transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Basic details */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-2xl font-black tracking-tight text-white">
                  {student.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
                  {student.position || 'Học sinh'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                  Lớp {state.config.className}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-indigo-100">
                <span>Mã định danh: <strong>{student.id}</strong></span>
                <span>•</span>
                <span>Ngày sinh: <strong>{formatViDate(student.dob)}</strong></span>
                <span>•</span>
                <span>Giới tính: <strong>{student.gender}</strong></span>
              </div>
            </div>

            {/* Quick stats badge */}
            <div className="hidden lg:flex flex-col items-end gap-1.5 shrink-0">
              <div className="px-3.5 py-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-right">
                <div className="text-[10px] text-indigo-200 uppercase font-bold">
                  Điểm Nề Nếp
                </div>
                <div className="text-lg font-black text-emerald-300">
                  +{totalPoints} đ
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar mt-6 -mb-2 border-b border-white/20 pb-0">
            {[
              { id: 'info', label: 'Lý lịch & Gia đình', icon: User },
              { id: 'grades', label: 'Bảng Điểm', icon: BookOpen },
              { id: 'discipline', label: `Thi Đua (${personalDiscipline.length})`, icon: Award },
              { id: 'attendance', label: 'Chuyên Cần', icon: Clock },
              { id: 'notes', label: `Dặn Dò (${personalNotes.length})`, icon: MessageSquare },
              { id: 'password', label: 'Mật Khẩu', icon: KeyRound },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-indigo-900 shadow-md'
                      : 'text-indigo-100 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: INFO */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal & Parent details */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Thông Tin Liên Lạc Phụ Huynh</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Họ tên Phụ huynh:</span>
                      <strong className="text-gray-800">
                        {student.parentName || 'Chưa cập nhật'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Số điện thoại PH:</span>
                      <strong className="text-indigo-600">
                        {student.parentPhone || 'Chưa cập nhật'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Số điện thoại HS:</span>
                      <strong className="text-gray-800">
                        {student.phone || 'Chưa có'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Địa chỉ thường trú:</span>
                      <span className="text-gray-800 font-medium text-right max-w-[220px]">
                        {student.address || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Conduct */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>Học Lực & Hạnh Kiểm</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Điểm trung bình các môn:</span>
                      <span className="font-black text-indigo-600 text-sm">
                        {avgGrade !== null ? avgGrade : 'Chưa có'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Xếp loại học lực:</span>
                      <span className="font-bold text-emerald-700">
                        {academicRank}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500">Đánh giá rèn luyện:</span>
                      <span className="font-bold text-emerald-700">
                        {student.conduct || 'Tốt'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-500">Điểm tích lũy thi đua:</span>
                      <span className="font-black text-emerald-600 text-sm">
                        +{totalPoints} điểm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special notes */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Nhận xét chung của Giáo viên chủ nhiệm</span>
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed italic">
                  "{student.notes || 'Học sinh có ý thức tự giác, chấp hành tốt nội quy nhà trường và của lớp.'}"
                </p>
              </div>

              {isTeacher && (
                <div className="flex justify-end">
                  <button
                    onClick={() => onEditStudent(student)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa thông tin học sinh</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GRADES */}
          {activeTab === 'grades' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Bảng Điểm Học Tập Các Môn
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hệ số 10. Điểm TB hiện tại:{' '}
                    <strong className="text-indigo-600 font-black">
                      {avgGrade !== null ? avgGrade : 'Chưa có'}
                    </strong>{' '}
                    ({academicRank})
                  </p>
                </div>
                {isTeacher && (
                  <button
                    onClick={handleSaveGradesSubmit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu Bảng Điểm</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SUBJECT_LIST.map((subject) => {
                  const currentScore = grades[subject];
                  return (
                    <div
                      key={subject}
                      className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-gray-700 truncate mr-2">
                        {subject}
                      </span>
                      {isTeacher ? (
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={currentScore !== undefined ? currentScore : ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            setGrades((prev) => {
                              const next = { ...prev };
                              if (val === undefined || isNaN(val)) {
                                delete next[subject];
                              } else {
                                next[subject] = Math.min(10, Math.max(0, val));
                              }
                              return next;
                            });
                          }}
                          placeholder="--"
                          className="w-16 px-2 py-1 bg-white border border-gray-300 rounded-lg text-center font-bold text-xs text-gray-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <span
                          className={`font-black text-xs ${
                            currentScore !== undefined
                              ? currentScore >= 8.0
                                ? 'text-emerald-600'
                                : currentScore >= 6.5
                                ? 'text-blue-600'
                                : 'text-gray-800'
                              : 'text-gray-400'
                          }`}
                        >
                          {currentScore !== undefined ? currentScore : '--'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DISCIPLINE */}
          {activeTab === 'discipline' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">
                    Nhật Ký Thi Đua & Điểm Cộng / Điểm Trừ
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Tổng điểm thi đua hiện tại:{' '}
                    <strong className="text-emerald-600 font-black">
                      +{totalPoints} điểm
                    </strong>
                  </p>
                </div>
                {isTeacher && (
                  <button
                    onClick={() => setIsAddingDiscipline(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Ghi nhận thi đua</span>
                  </button>
                )}
              </div>

              {/* Add form */}
              {isAddingDiscipline && (
                <form
                  onSubmit={handleCreateDiscipline}
                  className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3"
                >
                  <h5 className="font-bold text-xs text-indigo-900">
                    Thêm Ghi Nhận Thi Đua Nề Nếp
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Hành vi / Tuyên dương / Vi phạm *
                      </label>
                      <input
                        type="text"
                        required
                        value={disciplineRule}
                        onChange={(e) => setDisciplineRule(e.target.value)}
                        placeholder="VD: Phát biểu tốt môn Toán, hoặc Đi học muộn..."
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Loại điểm
                      </label>
                      <select
                        value={disciplineType}
                        onChange={(e) => setDisciplineType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      >
                        <option value="plus">Điểm cộng (+)</option>
                        <option value="minus">Điểm trừ (-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Số điểm
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={disciplinePoints}
                        onChange={(e) => setDisciplinePoints(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                        Ghi chú thêm
                      </label>
                      <input
                        type="text"
                        value={disciplineNote}
                        onChange={(e) => setDisciplineNote(e.target.value)}
                        placeholder="Chi tiết hoàn cảnh..."
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingDiscipline(false)}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs text-gray-600 font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                    >
                      Lưu ghi nhận
                    </button>
                  </div>
                </form>
              )}

              {/* Records List */}
              <div className="space-y-2">
                {personalDiscipline.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">
                    Chưa có lượt ghi nhận nề nếp thi đua nào.
                  </p>
                ) : (
                  personalDiscipline.map((d) => (
                    <div
                      key={d.id}
                      className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            d.points >= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {d.points >= 0 ? `+${d.points}` : d.points}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-gray-800">
                            {d.ruleName}
                          </div>
                          {d.note && (
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {d.note}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-gray-400">{d.date}</span>
                        {isTeacher && (
                          <button
                            onClick={() => onDeleteDiscipline(d.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">
              <h4 className="font-bold text-sm text-gray-900 pb-3 border-b border-gray-200">
                Thống Kê Chuyên Cần Cá Nhân
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xl font-black text-emerald-800">{countPresent}</div>
                  <div className="text-xs font-bold text-emerald-700">Có mặt</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="text-xl font-black text-amber-800">{countExcused}</div>
                  <div className="text-xs font-bold text-amber-700">Vắng có phép</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <div className="text-xl font-black text-blue-800">{countLate}</div>
                  <div className="text-xs font-bold text-blue-700">Đi học muộn</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="text-xl font-black text-rose-800">{countUnexcused}</div>
                  <div className="text-xs font-bold text-rose-700">Không phép</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold text-gray-600 uppercase">
                  Lịch Sử Điểm Danh Các Ngày Gần Đây:
                </h5>
                {personalAttendance.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">
                    Chưa có dữ liệu điểm danh.
                  </p>
                ) : (
                  personalAttendance.map((a) => {
                    const meta = STATUS_META[a.status];
                    return (
                      <div
                        key={a.id}
                        className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-gray-700">
                          {formatViDate(a.date)}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h4 className="font-bold text-sm text-gray-900">
                  Lời Nhắc Nhở & Dặn Dò Riêng Của Giáo Viên
                </h4>
                {isTeacher && (
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Thêm lời dặn</span>
                  </button>
                )}
              </div>

              {isAddingNote && (
                <form
                  onSubmit={handleCreateNote}
                  className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Tiêu đề dặn dò
                    </label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="VD: Nhắc nhở bài tập môn Toán..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Nội dung chi tiết *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Nhập nội dung dặn dò riêng cho học sinh này..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="px-3 py-1.5 rounded-xl border border-gray-300 text-xs text-gray-600 font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                    >
                      Lưu lời dặn
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {personalNotes.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">
                    Chưa có lời dặn dò riêng nào cho em.
                  </p>
                ) : (
                  personalNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-950">
                          {n.title}
                        </span>
                        {isTeacher && (
                          <button
                            onClick={() => onDeleteNote(n.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {n.content}
                      </p>
                      <div className="pt-1 text-[10px] text-gray-400 flex justify-between">
                        <span>{n.author}</span>
                        <span>{n.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: PASSWORD */}
          {activeTab === 'password' && (
            <div className="max-w-md mx-auto space-y-4 pt-2">
              <h4 className="font-bold text-sm text-gray-900 pb-2 border-b border-gray-200">
                Đổi Mật Khẩu Đăng Nhập Của Học Sinh
              </h4>
              <p className="text-xs text-gray-500">
                Mật khẩu này dùng khi học sinh chọn tên mình trên màn hình đăng nhập để xem hồ sơ và bảng điểm.
              </p>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Mật Khẩu Mới
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Cập Nhật Mật Khẩu
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
