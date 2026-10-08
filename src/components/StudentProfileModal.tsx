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
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Star,
  Edit2,
  History,
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

const PRESET_RULES = [
  { label: 'Nói chuyện riêng trong giờ (-3đ)', name: 'Nói chuyện riêng trong giờ', points: -3, type: 'minus' as const },
  { label: 'Đi học muộn (-2đ)', name: 'Đi học muộn', points: -2, type: 'minus' as const },
  { label: 'Không làm bài tập (-5đ)', name: 'Không làm bài tập', points: -5, type: 'minus' as const },
  { label: 'Vi phạm đồng phục / tác phong (-2đ)', name: 'Vi phạm đồng phục / tác phong', points: -2, type: 'minus' as const },
  { label: 'Không chú ý nghe giảng (-2đ)', name: 'Không chú ý nghe giảng', points: -2, type: 'minus' as const },
  { label: 'Không học bài cũ (-4đ)', name: 'Không học bài cũ', points: -4, type: 'minus' as const },
  { label: 'Mất trật tự trong giờ học (-3đ)', name: 'Mất trật tự trong giờ học', points: -3, type: 'minus' as const },
  { label: 'Sử dụng điện thoại trong giờ (-5đ)', name: 'Sử dụng điện thoại trong giờ', points: -5, type: 'minus' as const },
  { label: 'Gây gổ / đánh nhau (-10đ)', name: 'Gây gổ / đánh nhau', points: -10, type: 'minus' as const },
  { label: 'Bỏ tiết / trốn học (-10đ)', name: 'Bỏ tiết / trốn học', points: -10, type: 'minus' as const },
  { label: 'Phát biểu xây dựng bài sôi nổi (+5đ)', name: 'Phát biểu xây dựng bài sôi nổi', points: 5, type: 'plus' as const },
  { label: 'Đạt điểm tốt (9, 10) (+5đ)', name: 'Đạt điểm tốt (9, 10)', points: 5, type: 'plus' as const },
  { label: 'Giúp đỡ bạn bè / việc tốt (+3đ)', name: 'Giúp đỡ bạn bè / việc tốt', points: 3, type: 'plus' as const },
  { label: 'Trực nhật sạch sẽ, gương mẫu (+5đ)', name: 'Trực nhật sạch sẽ, gương mẫu', points: 5, type: 'plus' as const },
  { label: 'Đạt giải phong trào / thi đấu (+10đ)', name: 'Đạt giải phong trào / thi đấu', points: 10, type: 'plus' as const },
  { label: 'Khác (Tự nhập nội dung & điểm)', name: 'Khác', points: 0, type: 'minus' as const },
];

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
  const [disciplineDate, setDisciplineDate] = useState<string>(getTodayStr());
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number>(0);
  const [customRuleName, setCustomRuleName] = useState<string>('');
  const [customPoints, setCustomPoints] = useState<number>(-2);
  const [disciplineNote, setDisciplineNote] = useState<string>('');

  // Selected evaluation month (e.g. '2026-10')
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

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

  // Available evaluation months
  const availableMonths = React.useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthStr);
    personalDiscipline.forEach((d) => {
      if (d.date && d.date.length >= 7) {
        set.add(d.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [personalDiscipline, currentMonthStr]);

  // Displayed discipline records based on selected month
  const displayedDiscipline = React.useMemo(() => {
    if (selectedMonth === 'all') return personalDiscipline;
    return personalDiscipline.filter((d) => d.date && d.date.startsWith(selectedMonth));
  }, [personalDiscipline, selectedMonth]);

  // Net points in selected evaluation period
  const periodNetPoints = React.useMemo(() => {
    return displayedDiscipline.reduce((sum, d) => sum + (d.points || 0), 0);
  }, [displayedDiscipline]);

  // Evaluation conduct rank based on period net points
  const periodConduct = React.useMemo(() => {
    if (periodNetPoints <= -15) return { label: 'Yếu', color: 'text-red-600' };
    if (periodNetPoints < 0) return { label: 'Chưa đạt', color: 'text-rose-600' };
    if (periodNetPoints < 15) return { label: 'Đạt', color: 'text-amber-600' };
    if (periodNetPoints < 30) return { label: 'Khá', color: 'text-blue-600' };
    return { label: 'Tốt', color: 'text-emerald-600' };
  }, [periodNetPoints]);

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
    const ruleObj = PRESET_RULES[selectedRuleIndex] || PRESET_RULES[0];
    let finalRuleName = ruleObj.name;
    let finalPoints = ruleObj.points;
    let finalType = ruleObj.type;

    if (ruleObj.name === 'Khác') {
      finalRuleName = customRuleName.trim() || 'Sự việc khác';
      finalPoints = customPoints;
      finalType = customPoints >= 0 ? 'plus' : 'minus';
    }

    onAddDiscipline({
      studentId: student.id,
      date: disciplineDate || getTodayStr(),
      ruleName: finalRuleName,
      points: finalPoints,
      note: disciplineNote.trim(),
      type: finalType,
    });

    setDisciplineNote('');
    setCustomRuleName('');
    onShowToast('Đã lưu ghi nhận sự việc thi đua');
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

  // Lắng nghe phím ESC để đóng modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const studentAge = React.useMemo(() => {
    if (!student?.dob) return null;
    const parts = student.dob.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
      if (age > 0 && age < 100) return age;
    }
    return null;
  }, [student?.dob]);

  if (!student) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl xl:max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col h-[90vh] max-h-[92vh] cursor-default relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng duy nhất ở góc trên bên phải */}
        <button
          onClick={onClose}
          aria-label="Đóng"
          title="Đóng (Phím ESC)"
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-gray-100/90 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Top Header with Student Info (Màu hồng phấn nhạt thanh lịch như mẫu, thu gọn tối đa) */}
        <div className="bg-linear-to-r from-[#fff2f5] via-[#fdf4f7] to-[#fff6f8] px-4 sm:px-6 pt-3 sm:pt-3 pb-0 shrink-0 border-b border-pink-200/60">
          <div className="flex items-center gap-3 sm:gap-4 pr-10">
            {/* Avatar nhỏ gọn */}
            <div className="relative group shrink-0">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover ring-2 ring-pink-200/60 shadow-2xs"
                />
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-rose-300 via-pink-400 to-rose-400 flex items-center justify-center font-black text-base sm:text-lg text-white shadow-2xs ring-2 ring-pink-200/60">
                  {student.name.charAt(student.name.lastIndexOf(' ') + 1) ||
                    student.name.charAt(0)}
                </div>
              )}
              {isTeacher && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  title="Tải ảnh đại diện học sinh"
                  className="absolute -bottom-1 -right-1 p-1 bg-gray-900 hover:bg-gray-800 text-white rounded-md shadow-xs transition-all cursor-pointer"
                >
                  <Camera className="w-2.5 h-2.5" />
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

            {/* Basic details gọn gàng */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-gray-900 truncate">
                  {student.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-pink-100/80 text-pink-700 border border-pink-200/60">
                  {student.position || 'Học sinh'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/80 text-gray-700 border border-gray-200/70">
                  Lớp {state.config.className}
                </span>
              </div>

              {/* Dòng metadata thông tin cá nhân trên 1 hàng */}
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-gray-500">
                <span>Mã số: <strong className="text-gray-800">{student.id}</strong></span>
                <span className="text-gray-300">•</span>
                <span>
                  Ngày sinh: <strong className="text-gray-800">{formatViDate(student.dob)}</strong>
                  {studentAge ? <span className="text-gray-500 ml-1">({studentAge}t)</span> : null}
                </span>
                <span className="text-gray-300">•</span>
                <span>Giới tính: <strong className="text-gray-800">{student.gender}</strong></span>
                {student.parentPhone && (
                  <>
                    <span className="text-gray-300 hidden md:inline">•</span>
                    <span className="hidden md:inline">PH: <strong className="text-indigo-600 font-semibold">{student.parentPhone}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 4 Thẻ tóm tắt chỉ số nổi bật siêu gọn (Thanh dải mỏng tiết kiệm không gian tối đa) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2 mb-2">
            {/* Card 1: Điểm Nề Nếp */}
            <div className="py-1.5 px-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate leading-tight">
                  Điểm Nề Nếp
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs sm:text-sm font-black text-emerald-700 leading-none">
                    +{totalPoints} đ
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium truncate">
                    ({periodConduct.label})
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Điểm Trung Bình */}
            <div className="py-1.5 px-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate leading-tight">
                  Điểm TB
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs sm:text-sm font-black text-blue-700 leading-none">
                    {avgGrade !== null ? avgGrade : '--'}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium truncate">
                    ({academicRank})
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Hạnh Kiểm */}
            <div className="py-1.5 px-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Star className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate leading-tight">
                  Hạnh Kiểm
                </div>
                <div className="text-xs sm:text-sm font-black text-amber-700 leading-none">
                  {student.conduct || 'Tốt'}
                </div>
              </div>
            </div>

            {/* Card 4: Chuyên Cần */}
            <div className="py-1.5 px-2.5 rounded-xl bg-white/80 border border-pink-200/70 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-pink-100/80 text-pink-600 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate leading-tight">
                  Chuyên Cần
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs sm:text-sm font-black text-pink-700 leading-none">
                    {countPresent} buổi
                  </span>
                  <span className="text-[10px] text-pink-600 font-medium truncate">
                    ({countLate > 0 ? `${countLate}m` : '0m'} • {countExcused + countUnexcused}v)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Thiết kế thanh tab gọn gàng) */}
          <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto custom-scrollbar border-t border-pink-200/60">
            {[
              { id: 'info', label: 'Thông tin cá nhân', icon: User },
              { id: 'attendance', label: `Điểm danh (${personalAttendance.length})`, icon: Clock },
              { id: 'grades', label: 'Học tập & Điểm số', icon: BookOpen },
              { id: 'discipline', label: 'Thi đua & Kỷ luật', icon: Award },
              { id: 'notes', label: `Sổ tay & Dặn dò (${personalNotes.length})`, icon: MessageSquare },
              { id: 'password', label: 'Mật khẩu', icon: KeyRound },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 py-2 px-1 text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer relative ${
                    isActive
                      ? 'text-pink-600 font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-pink-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body / Tab Contents */}
        <div className={`flex-1 min-h-0 ${activeTab === 'discipline' ? 'p-3.5 sm:p-4 overflow-hidden flex flex-col' : 'p-5 sm:p-6 overflow-y-auto custom-scrollbar'}`}>
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
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 items-stretch overflow-hidden">
              {/* CỘT BÊN TRÁI: Ghi nhận sự việc - Cố định, luôn hiển thị đầy đủ ngày tháng - nội dung - ghi chú - ghi nhận */}
              <div className="lg:w-[350px] xl:w-[380px] shrink-0 bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-gray-900 text-xs sm:text-sm pb-2.5 border-b border-gray-100">
                    <Plus className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.5]" />
                    <span>Ghi nhận sự việc</span>
                  </div>

                  <form id="discipline-form" onSubmit={handleCreateDiscipline} className="mt-3 space-y-3">
                    {/* 1. Ngày tháng */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Ngày tháng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={disciplineDate}
                        onChange={(e) => setDisciplineDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                      />
                    </div>

                    {/* 2. Nội dung ghi nhận (Quy tắc thi đua) */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Nội dung ghi nhận <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedRuleIndex}
                        onChange={(e) => setSelectedRuleIndex(parseInt(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                      >
                        {PRESET_RULES.map((rule, idx) => (
                          <option key={idx} value={idx}>
                            {rule.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nếu chọn Khác */}
                    {PRESET_RULES[selectedRuleIndex]?.name === 'Khác' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            required
                            value={customRuleName}
                            onChange={(e) => setCustomRuleName(e.target.value)}
                            placeholder="Tên sự việc..."
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={customPoints}
                            onChange={(e) => setCustomPoints(parseInt(e.target.value) || 0)}
                            placeholder="Điểm..."
                            className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Ghi chú */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Ghi chú
                      </label>
                      <textarea
                        rows={2}
                        value={disciplineNote}
                        onChange={(e) => setDisciplineNote(e.target.value)}
                        placeholder="Ghi chú thêm chi tiết hoàn cảnh (tùy chọn)..."
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs resize-none"
                      />
                    </div>
                  </form>
                </div>

                {/* 4. Ghi nhận (Nút lưu cố định ở đáy cột bên trái) */}
                <div className="pt-3 border-t border-gray-100">
                  <button
                    type="submit"
                    form="discipline-form"
                    disabled={!isTeacher}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isTeacher
                        ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-600/20'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>{isTeacher ? 'Lưu ghi nhận sự việc' : 'Chỉ Giáo Viên có quyền ghi nhận'}</span>
                  </button>
                </div>
              </div>

              {/* CỘT BÊN PHẢI: Kỳ đánh giá tổng điểm & Lịch sử sự việc */}
              <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
                {/* 1. Thẻ Kỳ đánh giá (Tháng) & Điểm hạnh kiểm cố định trên cùng */}
                <div className="bg-gray-50/90 rounded-2xl border border-gray-200/90 p-3 lg:p-3.5 flex items-center justify-between gap-3 shrink-0">
                  {/* KỲ ĐÁNH GIÁ (THÁNG) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      KỲ ĐÁNH GIÁ (THÁNG)
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {availableMonths.map((m) => {
                        const [year, month] = m.split('-');
                        return (
                          <option key={m} value={m}>
                            Tháng {month}/{year}
                          </option>
                        );
                      })}
                      <option value="all">Tất cả các tháng</option>
                    </select>
                  </div>

                  {/* TỔNG ĐIỂM */}
                  <div className="text-right sm:text-center space-y-0.5">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      TỔNG ĐIỂM
                    </div>
                    <div
                      className={`text-xl lg:text-2xl font-black ${
                        periodNetPoints < 0
                          ? 'text-red-600'
                          : periodNetPoints > 0
                          ? 'text-emerald-600'
                          : 'text-gray-700'
                      }`}
                    >
                      {periodNetPoints > 0 ? `+${periodNetPoints}` : periodNetPoints}
                    </div>
                  </div>

                  {/* HẠNH KIỂM */}
                  <div className="text-right space-y-0.5">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      HẠNH KIỂM
                    </div>
                    <div className={`text-base lg:text-lg font-black ${periodConduct.color}`}>
                      {periodConduct.label}
                    </div>
                  </div>
                </div>

                {/* 2. Bảng Lịch sử sự việc - THANH CUỘN CHỈ Ở ĐÂY */}
                <div className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-2xs flex flex-col">
                  <div className="py-2 px-3.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-gray-700">Lịch sử sự việc ({displayedDiscipline.length})</span>
                    <span className="text-[11px] text-gray-400">Cuộn danh sách tại đây</span>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar scroll-smooth">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-white z-10 border-b border-gray-200 text-gray-600 font-bold">
                        <tr>
                          <th className="py-2.5 px-3.5 w-24">Ngày</th>
                          <th className="py-2.5 px-3.5">Sự việc</th>
                          <th className="py-2.5 px-3.5 w-20 text-center">Điểm</th>
                          <th className="py-2.5 px-3.5 w-12 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {displayedDiscipline.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-10 text-center text-gray-400">
                              Chưa có sự việc nào được ghi nhận trong kỳ đánh giá này.
                            </td>
                          </tr>
                        ) : (
                          displayedDiscipline.map((d) => (
                            <tr
                              key={d.id}
                              className="hover:bg-gray-50/70 transition-colors"
                            >
                              <td className="py-2.5 px-3.5 font-medium text-gray-600 whitespace-nowrap">
                                {formatViDate(d.date)}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <div className="font-bold text-gray-900 text-xs">
                                  {d.ruleName}
                                </div>
                                {d.note && (
                                  <div className="text-[11px] text-gray-500 mt-0.5 font-normal">
                                    {d.note}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                <span
                                  className={`font-black text-xs ${
                                    d.points < 0 ? 'text-red-600' : 'text-emerald-600'
                                  }`}
                                >
                                  {d.points > 0 ? `+${d.points}` : d.points}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                {isTeacher ? (
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Xóa sự việc "${d.ruleName}"?`)) {
                                        onDeleteDiscipline(d.id);
                                      }
                                    }}
                                    className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Xóa sự việc"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="text-gray-300">--</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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

        {/* Modal Footer (Gọn gàng, tinh tế, không có nút thoát dư thừa) */}
        <div className="px-6 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="truncate text-gray-500">
            Học sinh: <strong className="text-gray-800 font-bold">{student.name}</strong> • Lớp <strong className="text-pink-600 font-bold">{state.config.className}</strong>
            <span className="hidden sm:inline ml-2 text-gray-400">({state.config.schoolName || 'THCS Chu Văn An'})</span>
          </div>
          <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
            Nhấn ESC hoặc nút ✕ góc trên để đóng
          </span>
        </div>
      </div>
    </div>
  );
};
